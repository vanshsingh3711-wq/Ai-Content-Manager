import pytest
from fastapi.testclient import TestClient
from main import app
from services.blueprint_resolver import (
    coordinate_whole_video_plan,
    enforce_density_budgeting,
    normalize_mg_type,
)
from services.ai_director import EditDecision

client = TestClient(app)


def test_coordinate_whole_video_plan_direct():
    """Verify coordinate_whole_video_plan produces 6-12 non-conflicting edits with density caps."""
    plan = coordinate_whole_video_plan(
        total_duration=60.0,
        prompt="Make the whole video engaging with graphics and B-roll",
    )
    edits = plan.edits

    # Acceptance criteria: 6 to 12 edits
    assert 6 <= len(edits) <= 12, f"Expected 6-12 edits, got {len(edits)}"

    # Check bounds
    for e in edits:
        assert 0.0 <= e.start <= 60.0
        assert 0.0 <= e.end <= 60.0
        assert e.end >= e.start

    # Verify B-roll spacing >= 8.0s and non-overlapping
    brolls = [e for e in edits if e.action == "b_roll"]
    assert len(brolls) >= 2
    for i in range(1, len(brolls)):
        prev = brolls[i - 1]
        curr = brolls[i]
        assert curr.start - prev.start >= 8.0, f"B-roll spacing too tight: {prev.start} -> {curr.start}"
        assert curr.start >= prev.end, f"B-rolls overlap: {prev.end} > {curr.start}"

    # Verify Motion Graphics variety: consecutive cards must NEVER have identical composition IDs
    mgs = [e for e in edits if e.action == "motion_graphics"]
    assert len(mgs) >= 2
    for i in range(1, len(mgs)):
        prev = mgs[i - 1]
        curr = mgs[i]
        assert normalize_mg_type(prev.motion_graphics_type) != normalize_mg_type(curr.motion_graphics_type), (
            f"Consecutive duplicate MG composition: {prev.motion_graphics_type} == {curr.motion_graphics_type}"
        )
        assert curr.start - prev.start >= 10.0, f"MG spacing too tight: {prev.start} -> {curr.start}"

    # Verify SFX spacing >= 2.0s
    sfxs = [e for e in edits if e.action == "sfx"]
    assert len(sfxs) >= 2
    for i in range(1, len(sfxs)):
        prev = sfxs[i - 1]
        curr = sfxs[i]
        assert curr.start - prev.start >= 2.0, f"SFX spacing violation: {prev.start} -> {curr.start}"


def test_enforce_density_budgeting_variety():
    """Verify variety enforcement automatically swaps consecutive identical templates."""
    raw_edits = [
        EditDecision(
            action="motion_graphics",
            start=5.0,
            end=8.5,
            motion_graphics_type="metric_reveal",
            trigger_id="t1",
        ),
        EditDecision(
            action="motion_graphics",
            start=18.0,
            end=21.5,
            motion_graphics_type="metric_reveal",  # Duplicate consecutive template
            trigger_id="t2",
        ),
    ]

    budgeted = enforce_density_budgeting(raw_edits, total_duration=40.0)
    assert len(budgeted) == 2
    assert normalize_mg_type(budgeted[0].motion_graphics_type) == "metric_reveal"
    # Second should have been swapped to an alternate template
    assert normalize_mg_type(budgeted[1].motion_graphics_type) != "metric_reveal"


def test_enforce_density_budgeting_filters_overlapping_broll():
    """Verify overlapping or too-close B-roll clips are filtered out."""
    raw_edits = [
        EditDecision(action="b_roll", start=5.0, end=9.0, search_query="coding"),
        EditDecision(action="b_roll", start=7.0, end=11.0, search_query="clashing"),  # Overlaps & < 8s spacing
        EditDecision(action="b_roll", start=16.0, end=19.5, search_query="office"),  # Valid (> 8s from 5.0)
    ]

    budgeted = enforce_density_budgeting(raw_edits, total_duration=30.0)
    brolls = [e for e in budgeted if e.action == "b_roll"]
    assert len(brolls) == 2
    assert brolls[0].start == 5.0
    assert brolls[1].start == 16.0


def test_copilot_whole_video_proposal_endpoint():
    """Verify POST /api/v1/editor/copilot generates a full 6-12 edit coordinated plan."""
    payload = {
        "prompt": "Make the whole video engaging with graphics and B-roll",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
        "options": {
            "max_edits": 12,
            "allow_stock_sourcing": True,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scope"] == "whole_video"
    assert "coordinated" in data["summary"].lower() or "edits" in data["summary"].lower()

    edits = data["edits"]
    assert 6 <= len(edits) <= 12, f"Expected 6-12 edits for whole-video, got {len(edits)}"

    # Check tracks and action types
    action_types = {e["action_type"] for e in edits}
    assert "broll" in action_types
    assert "graphic" in action_types
    assert "sfx" in action_types

    # Verify no overlaps on the broll track
    broll_edits = [e for e in edits if e["action_type"] == "broll"]
    for i in range(1, len(broll_edits)):
        prev = broll_edits[i - 1]
        curr = broll_edits[i]
        assert curr["start"] >= prev["end"]
        assert curr["start"] - prev["start"] >= 8.0

    # Verify operation schemas
    for e in edits:
        op = e["operation"]
        assert "type" in op
        if op["type"] == "add_element":
            elem = op["element"]
            assert "id" in elem
            assert "start" in elem
            assert "end" in elem
            assert elem["start"] >= 0.0
            assert elem["end"] <= 60.0
        elif op["type"] == "add_transition":
            assert "preset" in op
            assert "fromClipId" in op

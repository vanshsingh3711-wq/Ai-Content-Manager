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


def test_density_budgeting_broll_30_percent_cap():
    """Verify B-roll runtime is strictly capped to <= 30% of total video duration."""
    total_dur = 60.0  # 30% is 18.0 seconds
    raw_edits = [
        # Clip 1: 0.0 - 8.0 (8.0s)
        EditDecision(action="b_roll", start=0.0, end=8.0, search_query="clip1"),
        # Clip 2: 10.0 - 18.0 (8.0s) -> cumulative 16.0s
        EditDecision(action="b_roll", start=10.0, end=18.0, search_query="clip2"),
        # Clip 3: 20.0 - 28.0 (8.0s) -> would exceed 18.0s (16 + 8 = 24s > 18s). Should clamp to 2.0s or drop
        EditDecision(action="b_roll", start=20.0, end=28.0, search_query="clip3"),
        # Clip 4: 32.0 - 40.0 (8.0s) -> budget completely exhausted. Must be dropped
        EditDecision(action="b_roll", start=32.0, end=40.0, search_query="clip4"),
    ]

    budgeted = enforce_density_budgeting(raw_edits, total_duration=total_dur, min_broll_spacing=8.0)
    brolls = [e for e in budgeted if e.action == "b_roll"]

    total_broll_time = sum(b.end - b.start for b in brolls)
    assert total_broll_time <= (total_dur * 0.30) + 0.5, (
        f"Total B-roll runtime {total_broll_time}s exceeded 30% cap ({total_dur * 0.30}s)"
    )
    # Clip 4 must have been skipped
    assert len(brolls) <= 3


def test_density_budgeting_min_graphic_gap():
    """Verify consecutive motion graphics have >= 4.0s gap and >= 10.0s start spacing."""
    raw_edits = [
        EditDecision(action="motion_graphics", start=5.0, end=9.0, motion_graphics_type="hero_reveal"),
        # Graphic starting too soon after previous ended (gap = 1.0s < 4.0s)
        EditDecision(action="motion_graphics", start=10.0, end=13.5, motion_graphics_type="metric_reveal"),
        # Graphic with valid gap (start 16.0 - end 9.0 = 7.0s >= 4.0s, start 16 - 5 = 11 >= 10)
        EditDecision(action="motion_graphics", start=16.0, end=19.5, motion_graphics_type="stat_card_highlight"),
    ]

    budgeted = enforce_density_budgeting(raw_edits, total_duration=50.0)
    mgs = [e for e in budgeted if e.action == "motion_graphics"]

    assert len(mgs) == 2
    assert mgs[0].start == 5.0
    assert mgs[1].start == 16.0


def test_transcript_beats_driven_whole_video_plan():
    """Verify whole-video planner aligns visual elements to transcript storytelling beats."""
    beats = [
        {
            "id": 1,
            "start": 1.0,
            "end": 5.0,
            "role": "hook",
            "text": "The fastest way to automate YouTube editing with AI",
            "energy": "high",
            "importance": 5,
        },
        {
            "id": 2,
            "start": 12.0,
            "end": 18.0,
            "role": "story",
            "text": "Most creators waste twelve hours per week manually cutting footage",
            "energy": "medium",
            "importance": 4,
        },
        {
            "id": 3,
            "start": 26.0,
            "end": 31.0,
            "role": "metric",
            "text": "Our timeline copilot delivers three hundred percent faster turnaround",
            "energy": "high",
            "importance": 5,
        },
        {
            "id": 4,
            "start": 42.0,
            "end": 48.0,
            "role": "cta",
            "text": "Subscribe to the channel for weekly workflow blueprints",
            "energy": "high",
            "importance": 5,
        },
    ]

    plan = coordinate_whole_video_plan(
        total_duration=60.0,
        prompt="Make the whole video engaging with graphics and B-roll",
        transcript_beats=beats,
        max_edits=12,
    )

    edits = plan.edits
    assert 6 <= len(edits) <= 12

    # Check that hook at 1.0s produced a motion graphic
    hook_mgs = [e for e in edits if e.action == "motion_graphics" and abs(e.start - 1.0) < 0.5]
    assert len(hook_mgs) == 1
    assert "fastest way" in hook_mgs[0].motion_graphics_targets.get("headline", "").lower()

    # Check that metric at 26.0s produced a metric_reveal or similar stat card
    metric_mgs = [e for e in edits if e.action == "motion_graphics" and abs(e.start - 26.0) < 0.5]
    assert len(metric_mgs) == 1

    # Verify zero destructive cuts to main narration
    cuts = [e for e in edits if e.action == "cut"]
    assert len(cuts) == 0, "Whole-video macro plan should not create destructive cuts unless explicitly requested"


def test_copilot_whole_video_endpoint_with_transcript_context():
    """Verify FastAPI /api/v1/editor/copilot forwards transcript_beats and respects Acceptance Test E."""
    payload = {
        "prompt": "Add relevant B-roll and subtle graphics to the important sections throughout this video",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
            "transcript_beats": [
                {"id": 1, "start": 2.0, "end": 6.0, "role": "hook", "text": "Master video editing"},
                {"id": 2, "start": 14.0, "end": 20.0, "role": "story", "text": "Writing code in python"},
                {"id": 3, "start": 30.0, "end": 35.0, "role": "metric", "text": "Over 10x faster output"},
                {"id": 4, "start": 45.0, "end": 50.0, "role": "cta", "text": "Get the template now"},
            ],
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
    edits = data["edits"]
    assert 6 <= len(edits) <= 12

    # Check Acceptance Test E criteria:
    # 1. No two graphics overlap
    graphic_edits = [e for e in edits if e["action_type"] == "graphic"]
    for i in range(1, len(graphic_edits)):
        prev = graphic_edits[i - 1]
        curr = graphic_edits[i]
        assert curr["start"] >= prev["end"], f"Graphics overlap: {prev['end']} > {curr['start']}"
        assert curr["start"] - prev["start"] >= 10.0, f"Graphic start spacing too tight: {prev['start']} -> {curr['start']}"

    # 2. All B-roll clips have minimum 8.0s spacing and no overlap
    broll_edits = [e for e in edits if e["action_type"] == "broll"]
    for i in range(1, len(broll_edits)):
        prev = broll_edits[i - 1]
        curr = broll_edits[i]
        assert curr["start"] >= prev["end"], f"B-roll overlap: {prev['end']} > {curr['start']}"
        assert curr["start"] - prev["start"] >= 8.0, f"B-roll start spacing too tight: {prev['start']} -> {curr['start']}"

    # 3. Total B-roll coverage <= 30% of total duration (18.0s on 60.0s timeline)
    total_broll_duration = sum(e["end"] - e["start"] for e in broll_edits)
    assert total_broll_duration <= 18.5, f"B-roll coverage {total_broll_duration} exceeded 30% cap"

    # 4. Zero destructive cuts
    destructive_edits = [e for e in edits if e.get("is_destructive") is True]
    assert len(destructive_edits) == 0

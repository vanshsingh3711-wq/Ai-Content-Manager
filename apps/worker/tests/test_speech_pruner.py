"""
tests/test_speech_pruner.py — Unit tests for Deterministic Speech Spine & Silence Trimmer
"""

import pytest
from services.speech_pruner import (
    merge_intervals,
    merge_cuts,
    invert_cuts_to_kept_ranges,
    generate_deterministic_silence_cuts,
)
from services.ai_director import EditList, EditDecision
from services.blueprint_resolver import resolve_master_blueprint


def test_merge_intervals():
    assert merge_intervals([]) == []
    assert merge_intervals([(1.0, 2.0), (3.0, 4.0)]) == [(1.0, 2.0), (3.0, 4.0)]
    # Overlapping
    assert merge_intervals([(1.0, 3.0), (2.0, 4.0)]) == [(1.0, 4.0)]
    # Within 80ms gap tolerance
    assert merge_intervals([(1.0, 2.0), (2.05, 3.0)], gap_tolerance=0.08) == [(1.0, 3.0)]


def test_merge_cuts():
    assert merge_cuts([]) == []
    cuts = [
        {"action": "cut", "start": 10.0, "end": 15.0, "reason": "Reason 1"},
        {"action": "cut", "start": 14.5, "end": 20.0, "reason": "Reason 2"},
        {"action": "cut", "start": 30.0, "end": 35.0, "reason": "Reason 3"},
        {"action": "b_roll", "start": 5.0, "end": 7.0},  # non-cut ignored
    ]
    merged = merge_cuts(cuts)
    assert len(merged) == 2
    assert merged[0]["start"] == 10.0
    assert merged[0]["end"] == 20.0
    assert "Reason 1" in merged[0]["reason"]
    assert "Reason 2" in merged[0]["reason"]
    assert merged[1]["start"] == 30.0
    assert merged[1]["end"] == 35.0


def test_invert_cuts_to_kept_ranges():
    total_dur = 100.0
    cuts = [
        {"action": "cut", "start": 0.0, "end": 20.0},
        {"action": "cut", "start": 40.0, "end": 60.0},
        {"action": "cut", "start": 90.0, "end": 100.0},
    ]
    kept = invert_cuts_to_kept_ranges(cuts, total_dur)
    assert len(kept) == 2
    assert kept[0] == (20.0, 40.0)
    assert kept[1] == (60.0, 90.0)


def test_generate_deterministic_silence_cuts_leading_and_trailing():
    total_dur = 112.0
    # Speech only between 30.0s and 60.0s
    speech = [(30.0, 60.0)]
    cuts = generate_deterministic_silence_cuts(
        total_duration=total_dur,
        speech_intervals=speech,
        head_margin_s=0.15,
        tail_margin_s=0.25,
    )
    assert len(cuts) == 2
    # Leading cut from 0.0 to 29.85
    assert cuts[0]["start"] == 0.0
    assert cuts[0]["end"] == 29.85
    assert "leading" in cuts[0]["reason"].lower()

    # Trailing cut from 60.25 to 112.0
    assert cuts[1]["start"] == 60.25
    assert cuts[1]["end"] == 112.0
    assert "trailing" in cuts[1]["reason"].lower()

    kept = invert_cuts_to_kept_ranges(cuts, total_dur)
    assert len(kept) == 1
    assert kept[0] == (29.85, 60.25)


def test_generate_deterministic_silence_cuts_internal_gap():
    total_dur = 50.0
    # Leading speech 5.0 to 10.0, then 4s pause, then speech 14.0 to 20.0
    speech = [(5.0, 10.0), (14.0, 20.0)]
    cuts = generate_deterministic_silence_cuts(
        total_duration=total_dur,
        speech_intervals=speech,
        head_margin_s=0.15,
        tail_margin_s=0.25,
        min_gap_duration=0.60,
        breath_cushion_s=0.10,
    )
    # 3 cuts: leading (0 to 4.85), internal (10.10 to 13.90), trailing (20.25 to 50.0)
    assert len(cuts) == 3
    assert cuts[0]["start"] == 0.0
    assert cuts[0]["end"] == 4.85

    assert cuts[1]["start"] == 10.10
    assert cuts[1]["end"] == 13.90
    assert "internal" in cuts[1]["reason"].lower()

    assert cuts[2]["start"] == 20.25
    assert cuts[2]["end"] == 50.0


def test_short_pauses_preserved():
    total_dur = 20.0
    # Natural 0.3s speech pauses (under 0.60s threshold) should NOT be cut
    speech = [(2.0, 5.0), (5.3, 8.0), (8.25, 11.0)]
    cuts = generate_deterministic_silence_cuts(
        total_duration=total_dur,
        speech_intervals=speech,
        head_margin_s=0.15,
        tail_margin_s=0.25,
        min_gap_duration=0.60,
    )
    # Only leading and trailing cuts, no internal cuts!
    assert len(cuts) == 2
    assert cuts[0]["start"] == 0.0
    assert cuts[0]["end"] == 1.85
    assert cuts[1]["start"] == 11.25
    assert cuts[1]["end"] == 20.0


def test_no_speech_safety():
    total_dur = 60.0
    cuts = generate_deterministic_silence_cuts(
        total_duration=total_dur,
        speech_intervals=[],
    )
    assert cuts == []


def test_blueprint_resolver_integration_with_deterministic_cuts():
    # Simulate B-roll plan and MG plan
    broll_plan = EditList(edits=[
        EditDecision(action="b_roll", trigger_id="beat_1", start=10.0, end=14.0, search_query="stock video"),
    ])
    mg_plan = EditList(edits=[
        EditDecision(action="motion_graphics", trigger_id="beat_2", start=25.0, end=28.0),
    ])
    char_plan = EditList(edits=[])

    deterministic_cuts = [
        {"action": "cut", "start": 0.0, "end": 9.85, "reason": "Leading silence"},
        {"action": "cut", "start": 40.0, "end": 60.0, "reason": "Trailing silence"},
    ]

    master = resolve_master_blueprint(
        unified_analysis_json="{}",
        broll_plan=broll_plan,
        mg_plan=mg_plan,
        char_plan=char_plan,
        deterministic_cuts=deterministic_cuts,
    )

    cuts_in_master = [e for e in master.edits if e.action == "cut"]
    assert len(cuts_in_master) == 2
    assert cuts_in_master[0].start == 0.0
    assert cuts_in_master[0].end == 9.85
    assert cuts_in_master[1].start == 40.0
    assert cuts_in_master[1].end == 60.0

    # Non-cut edits preserved
    assert any(e.action == "b_roll" for e in master.edits)
    assert any(e.action == "motion_graphics" for e in master.edits)

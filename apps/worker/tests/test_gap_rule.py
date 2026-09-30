import pytest
from services.beat_analyzer import enforce_beat_sheet_constraints
from services.ai_director import EditDecision

def test_gap_promotion():
    beats = [
        {"id": 1, "start": 0.0, "end": 2.0, "importance": 5, "text": "beat 1"},
        {"id": 2, "start": 2.0, "end": 6.0, "importance": 4, "text": "beat 2"}, # untreated
        {"id": 3, "start": 6.0, "end": 10.0, "importance": 4, "text": "beat 3"}, # untreated
        {"id": 4, "start": 10.0, "end": 14.0, "importance": 3, "text": "beat 4"}, # untreated, inside gap
        {"id": 5, "start": 14.0, "end": 16.0, "importance": 5, "text": "beat 5"},
    ]
    
    beat_sheet = {"beats": beats, "total_duration": 16.0}
    
    # LLM proposes edit 1 and edit 5
    result_edits = [
        EditDecision(action="motion_graphics", trigger_id="beat_1", start=0.0, end=2.0),
        EditDecision(action="motion_graphics", trigger_id="beat_5", start=14.0, end=16.0)
    ]
    
    # The gap between beat 1 (end 2.0) and beat 5 (start 14.0) is 12.0s.
    # > 9.0s, so it should promote a beat in the gap.
    # beat 2, 3, 4 are in the gap. beat 2 starts at 2.0. beat 3 starts at 6.0. beat 4 starts at 10.0.
    # beat 2 and 3 have importance 4. beat 2 starts earlier, so it should be picked.
    # Then the gap from 2's end (8.0, assuming max 6s duration) to 14.0 is 6.0s (<= 9.0s).
    
    final_edits = enforce_beat_sheet_constraints(result_edits, beat_sheet, "MOTION GRAPHICS PLANNER")
    
    # Should have 3 edits now
    assert len(final_edits) == 3
    assert getattr(final_edits[1], "_beat_id") == 2
    assert final_edits[1].motion_graphics_type == "hero_reveal"

def test_max_consecutive_conflict(capsys):
    beats = [
        {"id": 1, "start": 0.0, "end": 2.0, "importance": 5, "text": "beat 1"},
        {"id": 2, "start": 2.0, "end": 4.0, "importance": 5, "text": "beat 2"},
        {"id": 3, "start": 4.0, "end": 6.0, "importance": 5, "text": "beat 3"}
    ]
    
    beat_sheet = {"beats": beats, "total_duration": 6.0}
    
    result_edits = [
        EditDecision(action="motion_graphics", trigger_id="beat_1", start=0.0, end=2.0),
        EditDecision(action="motion_graphics", trigger_id="beat_2", start=2.0, end=4.0),
        EditDecision(action="motion_graphics", trigger_id="beat_3", start=4.0, end=6.0)
    ]
    
    enforce_beat_sheet_constraints(result_edits, beat_sheet, "MOTION GRAPHICS PLANNER")
    captured = capsys.readouterr()
    assert "CONFLICT: gap rule and max-2-consecutive rule conflict at beat 3" in captured.out

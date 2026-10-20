import pytest
from services.compositor import _build_segment_timeline

def test_overlay_overlap_cases():
    timestamp_map = {
        "ID_01": {"start": 0.0, "end": 10.0, "text": "Segment 1"},
        "ID_02": {"start": 10.0, "end": 20.0, "text": "Segment 2"}
    }
    # Cut from 9.0 to 11.0
    edits = [
        {"action": "cut", "start": 9.0, "end": 11.0},
        # 1. Before segment (0 to 9) -> inside seg 1
        {"action": "b_roll", "start": 2.0, "end": 4.0, "trigger_id": "none"},
        # 2. After segment -> inside seg 2
        {"action": "b_roll", "start": 15.0, "end": 18.0, "trigger_id": "none"},
        # 3. Inside segment -> inside seg 1
        {"action": "b_roll", "start": 5.0, "end": 7.0, "trigger_id": "none"},
        # 4. Containing segment -> covers 0 to 9 completely
        {"action": "b_roll", "start": 0.0, "end": 20.0, "trigger_id": "none"},
        # 5. Straddling segment (crosses the cut)
        {"action": "b_roll", "start": 8.0, "end": 12.0, "trigger_id": "none"}
    ]
    
    # Run pipeline with granular overlays enabled
    settings = {"USE_GRANULAR_OVERLAYS": True, "MIN_FRAGMENT_DURATION": 0.5}
    timeline = _build_segment_timeline(edits, timestamp_map, 20.0, settings)
    
    # We should have two kept segments: 0.0 -> 9.0, and 11.0 -> 20.0
    kept = [s for s in timeline if not s.get("is_cut")]
    assert len(kept) == 2
    
    seg1 = kept[0]
    assert seg1["start"] == 0.0 and seg1["end"] == 9.0
    
    seg2 = kept[1]
    assert seg2["start"] == 11.0 and seg2["end"] == 20.0
    
    # Overlay 1 (2.0 - 4.0) -> inside seg 1
    actions_seg1 = seg1["actions"]
    assert any(a["original_start"] == 2.0 for a in actions_seg1)
    
    # Overlay 2 (15.0 - 18.0) -> inside seg 2
    actions_seg2 = seg2["actions"]
    assert any(a["original_start"] == 15.0 for a in actions_seg2)
    
    # Overlay 4 (containing both) -> should appear in both seg 1 and seg 2
    assert any(a["original_start"] == 0.0 and a["original_end"] == 20.0 for a in actions_seg1)
    assert any(a["original_start"] == 0.0 and a["original_end"] == 20.0 for a in actions_seg2)
    
    # Overlay 5 (straddling cut, 8.0 to 12.0)
    # Seg 1 overlaps: max(0,8)=8, min(9,12)=9. Duration 1.0s. Allowed.
    # Seg 2 overlaps: max(11,8)=11, min(20,12)=12. Duration 1.0s. Allowed.
    assert any(a["original_start"] == 8.0 and a["original_end"] == 12.0 for a in actions_seg1)
    assert any(a["original_start"] == 8.0 and a["original_end"] == 12.0 for a in actions_seg2)

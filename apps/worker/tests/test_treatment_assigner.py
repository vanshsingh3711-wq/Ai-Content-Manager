import pytest
from services.treatment_assigner import assign_visual_treatments

def test_max_consecutive_treatments():
    beats = [
        {"id": 1, "role": "claim", "importance": 3, "concreteness": "abstract", "start": 0.0, "end": 2.0},
        {"id": 2, "role": "claim", "importance": 3, "concreteness": "concrete", "start": 2.0, "end": 4.0},
        {"id": 3, "role": "claim", "importance": 4, "concreteness": "abstract", "start": 4.0, "end": 6.0},
        {"id": 4, "role": "claim", "importance": 3, "concreteness": "concrete", "start": 6.0, "end": 8.0},
        {"id": 5, "role": "claim", "importance": 3, "concreteness": "abstract", "start": 8.0, "end": 10.0},
    ]
    
    beat_sheet = {"beats": beats}
    settings = {"MAX_OVERLAYS_PER_MIN": 10} # high enough to not hit max duration cap
    
    updated, log_table = assign_visual_treatments(beat_sheet, 10.0, settings)
    
    treatments = [b["treatment"] for b in updated["beats"]]
    # Should not have more than 2 consecutive non-'none'
    consecutive = 0
    for t in treatments:
        if t != "none":
            consecutive += 1
            assert consecutive <= 2, f"Found more than 2 consecutive treatments: {treatments}"
        else:
            consecutive = 0

def test_hook_cta_never_demoted():
    beats = [
        {"id": 1, "role": "hook", "importance": 3, "start": 0.0, "end": 2.0},
        {"id": 2, "role": "cta", "importance": 3, "start": 2.0, "end": 4.0},
        {"id": 3, "role": "hook", "importance": 3, "start": 4.0, "end": 6.0},
    ]
    
    beat_sheet = {"beats": beats}
    settings = {}
    updated, _ = assign_visual_treatments(beat_sheet, 6.0, settings)
    treatments = [b["treatment"] for b in updated["beats"]]
    
    assert "none" not in treatments, "Hook or CTA was demoted!"

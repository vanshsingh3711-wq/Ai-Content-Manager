import json
import logging
from pprint import pprint

from services.compositor import _build_segment_timeline

def test_cut_cases():
    timestamp_map = {
        "ID_01": {"start": 0.0, "end": 10.0, "text": "dummy"}
    }
    
    edits = [
        {"action": "cut", "start": 2.0, "end": 4.0},
        
        # Beat crossing cut: 1.0 to 3.0
        {"action": "motion_graphics", "start": 1.0, "end": 3.0, "trigger_id": "ID_01", "motion_graphics_type": "metric_reveal"},
        
        # Beat entirely cut: 2.5 to 3.5
        {"action": "motion_graphics", "start": 2.5, "end": 3.5, "trigger_id": "ID_01", "motion_graphics_type": "hero_reveal"},
    ]
    
    timeline = _build_segment_timeline(edits, timestamp_map, 10.0)
    print("TIMELINE RESULT:")
    for i, t in enumerate(timeline):
        print(f"[{i}] {t['start']} to {t['end']} | is_cut: {t.get('is_cut', False)} | chunk_id: {t['chunk_id']}")
        for a in t.get("actions", []):
            print(f"  -> Action: {a['action']} (start={a.get('start')}, end={a.get('end')}) type={a.get('motion_graphics_type')}")
            
if __name__ == "__main__":
    test_cut_cases()

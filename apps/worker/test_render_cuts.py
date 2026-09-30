import os
import json
from services.compositor import render_video_pipeline

def main():
    dummy_video = "dummy_1min.mp4"
    if not os.path.exists(dummy_video):
        print(f"Missing {dummy_video}")
        return
        
    timestamp_map = {
        "ID_01": {"start": 0.0, "end": 10.0, "text": "dummy chunk"}
    }
    
    edits = [
        {"action": "cut", "start": 2.0, "end": 4.0},
        # Beat crossing cut: 1.0 to 3.0
        {"action": "motion_graphics", "start": 1.0, "end": 3.0, "trigger_id": "ID_01", "motion_graphics_type": "metric_reveal"},
        # Beat entirely cut: 2.5 to 3.5
        {"action": "motion_graphics", "start": 2.5, "end": 3.5, "trigger_id": "ID_01", "motion_graphics_type": "hero_reveal"},
    ]
    
    output_path = "media_temp/test_cut_cases/output.mp4"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        render_video_pipeline(
            raw_video_path=dummy_video,
            output_mp4_path=output_path,
            edits=edits,
            timestamp_map=timestamp_map
        )
        print("Render successful.")
    except Exception as e:
        print(f"Render failed: {e}")

if __name__ == "__main__":
    main()

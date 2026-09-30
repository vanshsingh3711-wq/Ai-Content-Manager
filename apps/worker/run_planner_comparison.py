import json
import os
import argparse
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan

from unittest.mock import patch
import services.beat_analyzer
from services.treatment_assigner import assign_visual_treatments

def main(n_runs: int = 1):
    try:
        with open("real_timestamp_map.json", "r") as f:
            timestamp_map = json.load(f)
        with open("real_beat_sheet.json", "r") as f:
            beat_sheet = json.load(f)
    except FileNotFoundError:
        print("Required fixtures not found.")
        return

    # Build real transcript
    transcript = ""
    for chunk in sorted(timestamp_map.values(), key=lambda x: x.get("start", 0)):
        transcript += chunk.get("text", "") + " "
    
    timeline = UnifiedVisualTimeline(video_id="dummy")
    
    total_duration = beat_sheet.get("total_duration", 60.0)
    treatment_settings = {
        "MAX_OVERLAYS_PER_MIN": 8,
        "MIN_OVERLAY_DURATION": 2.0,
        "MAX_OVERLAY_DURATION": 6.0
    }
    updated_beat_sheet, _ = assign_visual_treatments(beat_sheet, total_duration, treatment_settings)

    ua_on = UnifiedAnalysis(transcript=transcript.strip(), visual_analysis=timeline, beat_sheet=updated_beat_sheet)
    ua_off = UnifiedAnalysis(transcript=transcript.strip(), visual_analysis=timeline, beat_sheet={})
    
    json_on = ua_on.model_dump_json()
    json_off = ua_off.model_dump_json()
    
    total_duration = beat_sheet.get("total_duration", 60.0)
    
    for flag_state, unified_json in [("OFF", json_off), ("ON", json_on)]:
        print(f"\n{'='*50}\nRUNNING WITH USE_BEAT_SHEET = {flag_state}\n{'='*50}")
        for i in range(n_runs):
            print(f"--- Run {i+1}/{n_runs} ---")
            
            broll_plan = generate_broll_plan(unified_json)
            mg_plan = generate_motion_graphics_plan(unified_json)
            
            all_edits = broll_plan.edits + mg_plan.edits
            overlays = [e for e in all_edits if getattr(e, 'action', '') in ("b_roll", "motion_graphics")]
            
            overlay_count = len(overlays)
            overlays_per_min = (overlay_count / total_duration) * 60 if total_duration > 0 else 0
            
            print(f"[POST-ENFORCEMENT] Final overlay count: {overlay_count} ({overlays_per_min:.2f} per min)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", "--runs", type=int, default=1, help="Number of runs per config")
    args = parser.parse_args()
    main(args.runs)

import os
import json
import uuid
import shutil
from unittest.mock import patch
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.treatment_assigner import assign_visual_treatments
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline
from services.compositor import render_video_pipeline

def run_render(use_beat_sheet: bool, use_granular: bool, out_name: str):
    print(f"=== Rendering {out_name} ===")
    
    with open("real_timestamp_map.json", "r") as f:
        timestamp_map = json.load(f)
    with open("real_beat_sheet.json", "r") as f:
        beat_sheet = json.load(f)

    # Build real transcript
    transcript = ""
    for chunk in sorted(timestamp_map.values(), key=lambda x: x.get("start", 0)):
        transcript += chunk.get("text", "") + " "
    
    timeline = UnifiedVisualTimeline(video_id="dummy")
    
    total_duration = beat_sheet.get("total_duration", 60.0)
    
    if use_beat_sheet:
        treatment_settings = {
            "MAX_OVERLAYS_PER_MIN": 8,
            "MIN_OVERLAY_DURATION": 2.0,
            "MAX_OVERLAY_DURATION": 6.0
        }
        updated_beat_sheet, log_table = assign_visual_treatments(beat_sheet, total_duration, treatment_settings)
        print("\nTreatment Table:")
        for row in log_table:
            print(f"Beat {row['beat_id']} | Dur: {row['duration']:.2f}s | Role: {row['role']} -> {row['treatment']}")
    else:
        updated_beat_sheet = {}
        
    ua = UnifiedAnalysis(transcript=transcript.strip(), visual_analysis=timeline, beat_sheet=updated_beat_sheet)
    unified_json = ua.model_dump_json()

    broll_plan = generate_broll_plan(unified_json)
    mg_plan = generate_motion_graphics_plan(unified_json)
    
    all_edits = broll_plan.edits + mg_plan.edits
    
    # We will just print the plan for the user requirement
    print(f"\nOverlay Count: {len(all_edits)}")
    for e in all_edits:
        print(f"- {e.action} | Trigger: {e.trigger_id} | {e.start}s - {e.end}s")
        if out_name == "new.mp4":
            if e.action == "b_roll":
                print(f"  B-roll Query: {getattr(e, 'search_query', 'none')}")
            if e.action == "motion_graphics":
                print(f"  Template: {getattr(e, 'motion_graphics_type', 'none')}")
                print(f"  Targets: {getattr(e, 'motion_graphics_targets', {})}")

if __name__ == "__main__":
    run_render(False, False, "old.mp4")
    run_render(True, True, "new.mp4")

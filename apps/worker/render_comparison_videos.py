import os
import json
import uuid
import shutil
import subprocess
from unittest.mock import patch
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.treatment_assigner import assign_visual_treatments
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline
from services.compositor import render_video_pipeline

def create_mock_broll(path, color, duration):
    if not os.path.exists(path):
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:s=1080x1920:d={duration}", "-c:v", "libx264", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

create_mock_broll("broll_red.mp4", "red", 30)

def extract(vid_path, time, name):
    subprocess.run(["ffmpeg", "-y", "-ss", str(time), "-i", vid_path, "-vframes", "1", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def run_render(use_beat_sheet: bool, use_granular: bool, out_name: str):
    print(f"=== Rendering {out_name} (BEAT_SHEET={use_beat_sheet}, GRANULAR={use_granular}) ===")
    
    with open("real_timestamp_map.json", "r") as f:
        timestamp_map = json.load(f)
    with open("real_beat_sheet_v2.json", "r") as f:
        beat_sheet = json.load(f)

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
    else:
        updated_beat_sheet = {}
        
    ua = UnifiedAnalysis(transcript=transcript.strip(), visual_analysis=timeline, beat_sheet=updated_beat_sheet)
    unified_json = ua.model_dump_json()

    broll_plan = generate_broll_plan(unified_json)
    mg_plan = generate_motion_graphics_plan(unified_json)
    
    # In 'old' mode, it used the legacy plan without treatment assigner
    all_edits = broll_plan.edits + mg_plan.edits
    overlays = [e for e in all_edits if getattr(e, 'action', '') in ("b_roll", "motion_graphics")]
    
    print(f"\nOverlay Count for {out_name}: {len(overlays)}")
    
    edits_dict = []
    broll_map = {}
    
    for i, e in enumerate(overlays):
        d = {
            "action": getattr(e, "action"),
            "start": e.start,
            "end": e.end,
            "trigger_id": getattr(e, "trigger_id", f"ID_{i}"),
            "transition": getattr(e, "transition", "fade")
        }
        
        if d["action"] == "b_roll":
            query = getattr(e, "search_query", "none")
            broll_map[d["trigger_id"]] = "broll_red.mp4"
            print(f"- b_roll | {e.start}s - {e.end}s | Query: {query}")
            
        elif d["action"] == "motion_graphics":
            d["motion_graphics_type"] = getattr(e, "motion_graphics_type", "quote_reveal")
            d["motion_graphics_targets"] = getattr(e, "motion_graphics_targets", {})
            d["motion_graphics_personality"] = getattr(e, "motion_graphics_personality", "premium")
            print(f"- motion_graphics | {e.start}s - {e.end}s | Type: {d['motion_graphics_type']} | Targets: {d['motion_graphics_targets']}")
            
        edits_dict.append(d)

    out_vid_path = out_name
    print(f"Starting render for {out_name}...")
    render_video_pipeline(
        raw_video_path="dummy_1min.mp4",
        output_mp4_path=out_vid_path,
        edits=edits_dict,
        timestamp_map=timestamp_map,
        broll_map=broll_map,
        settings={"USE_GRANULAR_OVERLAYS": use_granular}
    )
    print(f"Completed render for {out_name}\n")
    
    if out_name == "new.mp4":
        out_dir = "media_temp/new_frames"
        os.makedirs(out_dir, exist_ok=True)
        print(f"Extracting middle frames for {len(edits_dict)} overlays...")
        for i, e in enumerate(edits_dict):
            m = (e["start"] + e["end"]) / 2
            extract(out_vid_path, m, f"{out_dir}/frame_{i}.jpg")
            print(f"Extracted {out_dir}/frame_{i}.jpg at {m:.2f}s")
            
if __name__ == "__main__":
    run_render(False, False, "old.mp4")
    run_render(True, True, "new.mp4")

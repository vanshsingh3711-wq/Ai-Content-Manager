import json
import os
from dotenv import load_dotenv
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.treatment_assigner import assign_visual_treatments
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline
from services.asset_manager import fetch_broll_assets
from services.compositor import render_video_pipeline
import shutil

def run_pipeline():
    load_dotenv("../../.env")
    # Allow environment to dictate these values
    if "USE_BEAT_SHEET" not in os.environ:
        os.environ["USE_BEAT_SHEET"] = "true"
    if "USE_GRANULAR_OVERLAYS" not in os.environ:
        os.environ["USE_GRANULAR_OVERLAYS"] = "true"
    
    with open("real_timestamp_map.json", "r") as f:
        ts_map = json.load(f)
    with open("real_beat_sheet_final.json", "r") as f:
        beat_sheet = json.load(f)
        
    transcript = " ".join([chunk.get("text", "") for chunk in sorted(ts_map.values(), key=lambda x: x.get("start", 0))])
    total_dur = beat_sheet.get("total_duration", 60.0)
    
    treatment_settings = {"MAX_OVERLAYS_PER_MIN": 8, "MIN_OVERLAY_DURATION": 2.0, "MAX_OVERLAY_DURATION": 6.0}
    updated_bs, log_table = assign_visual_treatments(beat_sheet, total_dur, treatment_settings)
    
    ua = UnifiedAnalysis(transcript=transcript.strip(), audio_analysis={"regions": []}, visual_analysis=UnifiedVisualTimeline(video_id="dummy", scenes=[], subjects=[], safe_regions=[]), beat_sheet=updated_bs)
    unified_json = ua.model_dump_json()
    
    print("Generating Plans...")
    broll_plan = generate_broll_plan(unified_json)
    mg_plan = generate_motion_graphics_plan(unified_json)
    
    edits = broll_plan.edits + mg_plan.edits
    
    print("Fetching B-roll...")
    os.makedirs("assets_real", exist_ok=True)
    broll_map = fetch_broll_assets([e.model_dump() for e in edits], "assets_real")
    
    print("\n[B-ROLL REPORT]")
    for e in broll_plan.edits:
        print(f"Trigger {e.trigger_id}:")
        print(f"  Query: {e.search_query}")
        print(f"  Chosen Clip: {broll_map.get(e.trigger_id, 'None')}")
        
    print("\nRendering...")
    ts_dict = {}
    for i, (k, v) in enumerate(ts_map.items()):
        ts_dict[str(i)] = v
        
    render_edits = [e.model_dump() for e in edits]
    print(f"Edits to render: {render_edits}")
    output_name = "new.mp4" if os.environ["USE_BEAT_SHEET"].lower() == "true" else "old.mp4"
    render_video_pipeline(
        raw_video_path="real_base_1min.mp4",
        output_mp4_path=output_name,
        subtitle_ass_path=None,
        broll_map=broll_map,
        edits=render_edits,
        timestamp_map=ts_dict,
        settings={"USE_GRANULAR_OVERLAYS": True}
    )
    
    print("\nExtracting frames...")
    os.makedirs("overlay_frames", exist_ok=True)
    import subprocess
    for i, e in enumerate(render_edits):
        if e.get("action") in ["b_roll", "motion_graphics"]:
            mid_time = e["start"] + (e["end"] - e["start"]) / 2.0
            out_file = f"overlay_frames/frame_{i}.jpg"
            subprocess.run(["ffmpeg", "-y", "-ss", str(mid_time), "-i", output_name, "-vframes", "1", "-q:v", "2", out_file], capture_output=True)
            print(f"Extracted {out_file} at {mid_time:.2f}s")

if __name__ == "__main__":
    run_pipeline()

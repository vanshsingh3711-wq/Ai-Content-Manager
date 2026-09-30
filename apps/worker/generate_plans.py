import json, os
from run_real_pipeline import generate_broll_plan, generate_motion_graphics_plan
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline
from services.treatment_assigner import assign_visual_treatments
from dotenv import load_dotenv

load_dotenv("../../.env")
with open("real_timestamp_map.json", "r") as f:
    ts_map = json.load(f)
with open("real_beat_sheet_final.json", "r") as f:
    beat_sheet = json.load(f)

transcript = " ".join([chunk.get("text", "") for chunk in sorted(ts_map.values(), key=lambda x: x.get("start", 0))])
total_dur = beat_sheet.get("total_duration", 60.0)

for mode in ["true", "false"]:
    os.environ["USE_BEAT_SHEET"] = mode
    b_plan = generate_broll_plan(UnifiedAnalysis(transcript=transcript, audio_analysis={"regions": []}, visual_analysis=UnifiedVisualTimeline(video_id="d", scenes=[], subjects=[], safe_regions=[]), beat_sheet=assign_visual_treatments(beat_sheet, total_dur, {"MAX_OVERLAYS_PER_MIN": 8, "MIN_OVERLAY_DURATION": 2.0, "MAX_OVERLAY_DURATION": 6.0})[0] if mode == "true" else {}).model_dump_json())
    mg_plan = generate_motion_graphics_plan(UnifiedAnalysis(transcript=transcript, audio_analysis={"regions": []}, visual_analysis=UnifiedVisualTimeline(video_id="d", scenes=[], subjects=[], safe_regions=[]), beat_sheet=assign_visual_treatments(beat_sheet, total_dur, {"MAX_OVERLAYS_PER_MIN": 8, "MIN_OVERLAY_DURATION": 2.0, "MAX_OVERLAY_DURATION": 6.0})[0] if mode == "true" else {}).model_dump_json())
    edits = b_plan.edits + mg_plan.edits
    with open(f"{'new' if mode == 'true' else 'old'}_plan.json", "w") as f:
        json.dump({"edits": [e.model_dump() for e in edits]}, f)

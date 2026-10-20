import json
import os
import subprocess
from services.treatment_assigner import assign_visual_treatments
from services.compositor import render_video_pipeline

def create_broll(path, color, duration):
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:s=1080x1920:d={duration}", "-c:v", "libx264", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

create_broll("broll_red.mp4", "red", 30)

with open("real_beat_sheet_v2.json") as f:
    beats_data = json.load(f)
with open("real_timestamp_map.json") as f:
    timestamp_map = json.load(f)

total_dur = beats_data.get("total_duration", 60.0)
updated_sheet, log_table = assign_visual_treatments(beats_data, total_dur, {})
assigned_beats = updated_sheet.get("beats", [])

edits = []
for beat in assigned_beats:
    if beat.get("treatment") == "b_roll":
        edits.append({
            "action": "b_roll",
            "start": beat.get("emphasis_start"),
            "end": beat.get("emphasis_end"),
            "trigger_id": f"ID_{beat.get('id')}",
            "transition": "fade"
        })

print(f"Generated {len(edits)} b-roll edits.")

broll_map = {e["trigger_id"]: "broll_red.mp4" for e in edits}

out_dir = "media_temp/frames"
os.makedirs(out_dir, exist_ok=True)
vid_path = f"{out_dir}/out.mp4"

render_video_pipeline(
    raw_video_path="dummy_1min.mp4",
    output_mp4_path=vid_path,
    edits=edits,
    timestamp_map=timestamp_map,
    broll_map=broll_map,
    settings={"USE_GRANULAR_OVERLAYS": True}
)

def extract(time, name):
    subprocess.run(["ffmpeg", "-y", "-ss", str(time), "-i", vid_path, "-vframes", "1", f"{out_dir}/{name}.jpg"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for i, e in enumerate(edits[:3]):
    s = e["start"]
    m = (e["start"] + e["end"]) / 2
    e_end = e["end"]
    extract(s - 0.2, f"overlay_{i}_pre")
    extract(m, f"overlay_{i}_mid")
    extract(e_end + 0.2, f"overlay_{i}_post")
    print(f"Overlay {i}: start={s:.2f}, mid={m:.2f}, end={e_end:.2f}")

print("Frames extracted to media_temp/frames/")

import os
import subprocess
from compositor_main import render_video_pipeline

def extract_frame(video_path, time, output_path):
    cmd = [
        "ffmpeg", "-y", "-ss", str(time), "-i", video_path, 
        "-vframes", "1", output_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    dummy_video = "dummy_1min.mp4"
    
    timestamp_map = {
        "ID_01": {"start": 0.0, "end": 20.0, "text": "This is a single chunk that contains multiple overlays."}
    }
    
    edits = [
        {"action": "b_roll", "start": 2.0, "end": 5.0, "trigger_id": "ID_01", "transition": "fade"},
        {"action": "b_roll", "start": 7.0, "end": 10.0, "trigger_id": "ID_01", "transition": "fade"},
        {"action": "b_roll", "start": 12.0, "end": 15.0, "trigger_id": "ID_01", "transition": "fade"},
    ]
    
    broll_map = {"ID_01": dummy_video}
    
    out_dir = "media_temp/test_granular"
    os.makedirs(out_dir, exist_ok=True)
    
    vid_off = f"{out_dir}/off.mp4"
    vid_on = f"{out_dir}/on.mp4"
    
    print("Rendering with USE_GRANULAR_OVERLAYS = False...")
    render_video_pipeline(
        raw_video_path=dummy_video, output_mp4_path=vid_off,
        edits=edits, timestamp_map=timestamp_map, broll_map=broll_map,
        settings={"USE_GRANULAR_OVERLAYS": False}
    )
    import shutil
    if os.path.exists(f"{out_dir}/filter_0.txt"):
        shutil.copy(f"{out_dir}/filter_0.txt", f"{out_dir}/filter_off.txt")
    
    print("Rendering with USE_GRANULAR_OVERLAYS = True...")
    render_video_pipeline(
        raw_video_path=dummy_video, output_mp4_path=vid_on,
        edits=edits, timestamp_map=timestamp_map, broll_map=broll_map,
        settings={"USE_GRANULAR_OVERLAYS": True}
    )
    if os.path.exists(f"{out_dir}/filter_0.txt"):
        shutil.copy(f"{out_dir}/filter_0.txt", f"{out_dir}/filter_on.txt")
    
    times_to_check = [2.0, 3.5, 5.0, 8.5, 13.5]
    for t in times_to_check:
        extract_frame(vid_off, t, f"{out_dir}/off_t{t}.jpg")
        extract_frame(vid_on, t, f"{out_dir}/on_t{t}.jpg")
        print(f"Extracted frames for t={t}s")
        
if __name__ == "__main__":
    main()

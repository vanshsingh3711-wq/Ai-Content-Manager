import os
import subprocess
from services.compositor import render_video_pipeline

def create_color_video(path, color, duration=20):
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:s=1080x1920:r=30:d={duration}",
        "-f", "lavfi", "-i", f"aevalsrc=0:d={duration}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    print("Generating distinct background and broll videos...")
    bg_video = "bg_blue.mp4"
    broll_video = "broll_red.mp4"
    
    create_color_video(bg_video, "blue")
    create_color_video(broll_video, "red")
    
    timestamp_map = {
        "ID_01": {"start": 0.0, "end": 20.0, "text": "This is a single chunk that contains multiple overlays."}
    }
    
    # 3 fade brolls at different times
    edits = [
        {"action": "b_roll", "start": 2.0, "end": 5.0, "trigger_id": "ID_01", "transition": "fade"},
        {"action": "b_roll", "start": 7.0, "end": 10.0, "trigger_id": "ID_01", "transition": "fade"},
        {"action": "b_roll", "start": 12.0, "end": 15.0, "trigger_id": "ID_01", "transition": "fade"},
    ]
    
    broll_map = {"ID_01": broll_video}
    
    out_dir = "media_temp/test_granular"
    os.makedirs(out_dir, exist_ok=True)
    
    vid_on = f"testing_video_granular_on.mp4"
    
    print("Rendering final testing video with USE_GRANULAR_OVERLAYS = True...")
    render_video_pipeline(
        raw_video_path=bg_video, output_mp4_path=vid_on,
        edits=edits, timestamp_map=timestamp_map, broll_map=broll_map,
        settings={"USE_GRANULAR_OVERLAYS": True}
    )
    print(f"Done! Video saved to: {vid_on}")
        
if __name__ == "__main__":
    main()

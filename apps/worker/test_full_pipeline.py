import os
import sys
import time
import subprocess

sys.path.append(os.getcwd())
from services.compositor import render_video_pipeline

def generate_dummy_video(path, duration=60):
    print(f"Generating {duration}s dummy video...")
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", f"-i", f"testsrc=duration={duration}:size=1080x1920:rate=30",
        "-f", "lavfi", "-i", f"sine=frequency=440:duration={duration}",
        "-c:v", "libx264", "-c:a", "aac", path
    ], capture_output=True)

def main():
    raw_video = "dummy_1min.mp4"
    out_video = "output_1min.mp4"
    
    if not os.path.exists(raw_video):
        generate_dummy_video(raw_video, 60)
        
    print("Dummy video ready. Building edit plan...")
    
    timestamp_map = {
        "chunk1": {"start": 0.0, "end": 20.0, "text": "Welcome to the video!"},
        "chunk2": {"start": 20.0, "end": 40.0, "text": "Here is our character"},
        "chunk3": {"start": 40.0, "end": 60.0, "text": "Thanks for watching"}
    }
    
    edits = [
        {"trigger_id": "chunk1", "action": "motion_graphics", "motion_graphics_text": "Welcome to the video!", "template": "MotionGraphicsPreview"},
        {"trigger_id": "chunk2", "action": "character", "character_action": "emphasize"},
        {"trigger_id": "chunk2", "action": "motion_graphics", "motion_graphics_text": "Look at this character!", "template": "MotionGraphicsPreview"},
        {"trigger_id": "chunk3", "action": "character", "character_action": "wave"}
    ]
    
    print("Running compositor pipeline (timing this step)...")
    start_time = time.time()
    
    try:
        final_out = render_video_pipeline(
            raw_video_path=raw_video,
            output_mp4_path=out_video,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "9:16"}
        )
        elapsed = time.time() - start_time
        print(f"\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
        print(f"Output size: {os.path.getsize(final_out) / 1024 / 1024:.2f} MB")
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    main()

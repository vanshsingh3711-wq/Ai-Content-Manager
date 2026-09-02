import os
import sys
import json
import subprocess

sys.path.append(os.getcwd())
from services.compositor import render_video_pipeline, get_ffmpeg_binary_path, _get_ffprobe_bin

def get_stream_durations(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data = json.loads(result.stdout)
        v_dur = 0.0
        a_dur = 0.0
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                v_dur = float(stream.get("duration", 0) or 0)
            elif stream.get("codec_type") == "audio":
                a_dur = float(stream.get("duration", 0) or 0)
                
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data2 = json.loads(result2.stdout)
        c_dur = float(data2.get("format", {}).get("duration", 0) or 0)
                
        return c_dur, v_dur, a_dur
    except:
        return 0.0, 0.0, 0.0

def main():
    vid_id = "05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    
    # Fake empty timestamp map so that it uses FULL video
    timestamp_map = {}
    
    # We only apply 1 cut
    edits = [{"action": "cut", "start": 0.0, "end": 1.10}]
    
    final_out = render_video_pipeline(vid_id, edits, timestamp_map)
    print("Rendered:", final_out)
    
    if os.path.exists(final_out):
        c_dur, v_dur, a_dur = get_stream_durations(final_out)
        print("Expected Final Duration: 40.091s")
        print(f"Container: {c_dur:.3f}")
        print(f"Video: {v_dur:.3f}")
        print(f"Audio: {a_dur:.3f}")
        
if __name__ == "__main__":
    main()

import os
import sys
import subprocess
import json
from unittest.mock import patch

sys.path.append(os.getcwd())
from services.compositor import _probe_duration, render_video_pipeline, get_ffmpeg_binary_path, _get_ffprobe_bin

def get_stream_durations(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        data = json.loads(result.stdout)
        video_dur = 0.0
        audio_dur = 0.0
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_dur = float(stream.get("duration", 0) or 0)
            elif stream.get("codec_type") == "audio":
                audio_dur = float(stream.get("duration", 0) or 0)
        return video_dur, audio_dur
    except Exception as e:
        return 0.0, 0.0

def main():
    ffmpeg_bin = get_ffmpeg_binary_path()
    
    # 1. Find the 41.17s video
    video_dir = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user"
    target_video = None
    for file in os.listdir(video_dir):
        if file.endswith(".mp4"):
            path = os.path.join(video_dir, file)
            duration = _probe_duration(ffmpeg_bin, path)
            if abs(duration - 41.17) < 0.5:
                target_video = path
                print(f"Found test video: {file} ({duration}s)")
                break

    if not target_video:
        print("Test video not found!")
        return

    # 2. Setup a cut 0.0-1.10s
    edits = [{"action": "cut", "start": 0.0, "end": 1.10}]
    output_mp4_path = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports\drift_test.mp4"
    
    original_remove = os.remove

    segments_info = []

    def mock_remove(path):
        if "seg_" in path and path.endswith(".mp4") and "fixed" not in path:
            video_dur, audio_dur = get_stream_durations(path)
            segments_info.append({
                "path": os.path.basename(path),
                "video_dur": video_dur,
                "audio_dur": audio_dur
            })
        original_remove(path)

    try:
        with patch("os.remove", side_effect=mock_remove):
            render_video_pipeline(
                raw_video_path=target_video,
                output_mp4_path=output_mp4_path,
                edits=edits
            )
    except Exception as e:
        print("Error during render:", e)

    print("\n--- SEGMENT INSPECTION ---")
    for info in segments_info:
        print(f"Segment: {info['path']}")
        print(f"  Video duration: {info['video_dur']}")
        print(f"  Audio duration: {info['audio_dur']}")
        print(f"  Difference (Video - Audio): {info['video_dur'] - info['audio_dur']}")

    final_video, final_audio = get_stream_durations(output_mp4_path)
    print("\n--- FINAL OUTPUT ---")
    print(f"Final Video duration: {final_video}")
    print(f"Final Audio duration: {final_audio}")
    print(f"Total Drift (Video - Audio): {final_video - final_audio}")


if __name__ == "__main__":
    main()

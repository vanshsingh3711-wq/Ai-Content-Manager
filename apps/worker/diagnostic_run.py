import os
import sys
import subprocess
import json
import glob
from unittest.mock import patch

sys.path.append(os.getcwd())
from services.compositor import _probe_duration, render_video_pipeline, get_ffmpeg_binary_path, _get_ffprobe_bin, _build_segment_timeline

def get_stream_durations(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration,r_frame_rate,sample_rate,channels,time_base",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        data = json.loads(result.stdout)
        video_dur = 0.0
        audio_dur = 0.0
        fps = ""
        audio_info = {}
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_dur = float(stream.get("duration", 0) or 0)
                fps = stream.get("r_frame_rate", "")
            elif stream.get("codec_type") == "audio":
                audio_dur = float(stream.get("duration", 0) or 0)
                audio_info = {
                    "sample_rate": stream.get("sample_rate"),
                    "channels": stream.get("channels"),
                    "time_base": stream.get("time_base")
                }
        
        # Get container duration
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        data2 = json.loads(result2.stdout)
        container_dur = float(data2.get("format", {}).get("duration", 0) or 0)
        
        return container_dur, video_dur, audio_dur, fps, audio_info
    except Exception as e:
        print("ERROR probing:", e)
        return 0.0, 0.0, 0.0, "", {}

def main():
    ffmpeg_bin = get_ffmpeg_binary_path()
    
    video_dir = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user"
    target_video = None
    for file in os.listdir(video_dir):
        if file.endswith(".mp4"):
            path = os.path.join(video_dir, file)
            try:
                duration = _probe_duration(ffmpeg_bin, path)
                if abs(duration - 41.17) < 0.5:
                    target_video = path
                    print(f"Found test video: {file} ({duration}s)")
                    break
            except Exception:
                pass

    if not target_video:
        print("Test video not found!")
        return

    try:
        with open("final_vad_results.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            timestamp_map = data[1]
    except Exception as e:
        print("Could not load real timestamp map, using dummy", e)
        timestamp_map = {
            "ID_01": {"start": 1.10, "end": 4.00, "text": "dummy"},
        }

    edits = [{"action": "cut", "start": 0.0, "end": 1.10}]
    duration_full = _probe_duration(ffmpeg_bin, target_video)
    timeline = _build_segment_timeline(edits, timestamp_map, duration_full)
    
    kept_segments = [s for s in timeline if not s["is_cut"]]
    
    expected_durations = {}
    for i, seg in enumerate(kept_segments):
        seg_id = seg.get("chunk_id", f"seg_{i}")
        expected_durations[f"seg_{i:03d}.mp4"] = {
            "id": seg_id,
            "start": seg["start"],
            "end": seg["end"],
            "expected_dur": seg["end"] - seg["start"]
        }

    output_mp4_path = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports\drift_test.mp4"
    temp_dir = os.path.dirname(output_mp4_path)

    for f in glob.glob(os.path.join(temp_dir, "seg_*.mp4")):
        try: os.remove(f)
        except: pass

    try:
        original_remove = os.remove
        def mock_remove(path):
            pass
        
        with patch("os.remove", side_effect=mock_remove):
            render_video_pipeline(
                raw_video_path=target_video,
                output_mp4_path=output_mp4_path,
                edits=edits,
                timestamp_map=timestamp_map
            )
    except Exception as e:
        print("Error during render:", e)

    print("\n==================================================")
    print("2. INSPECT EVERY INTERMEDIATE SEGMENT")
    print("==================================================")
    
    total_expected = 0.0
    total_actual_container = 0.0
    total_actual_video = 0.0
    total_actual_audio = 0.0

    seg_files = sorted(glob.glob(os.path.join(temp_dir, "seg_*.mp4")))
    seg_files = [f for f in seg_files if "fixed" not in f]

    for f in seg_files:
        basename = os.path.basename(f)
        c_dur, v_dur, a_dur, fps, a_info = get_stream_durations(f)
        exp = expected_durations.get(basename, {})
        if not exp:
            continue
            
        v_drift = v_dur - exp['expected_dur']
        a_drift = a_dur - exp['expected_dur']
        c_drift = c_dur - exp['expected_dur']
        
        total_expected += exp['expected_dur']
        total_actual_container += c_dur
        total_actual_video += v_dur
        total_actual_audio += a_dur

        print(f"\nSEGMENT {exp['id']}")
        print(f"Expected = {exp['expected_dur']:.3f}")
        print(f"Container = {c_dur:.3f}")
        print(f"Video = {v_dur:.3f}")
        print(f"Audio = {a_dur:.3f}")
        print(f"Drift = {c_drift:+.3f}")
        print(f"Video Drift = {v_drift:+.3f}")
        print(f"Audio Drift = {a_drift:+.3f}")
        print(f"FPS = {fps}")
        print(f"Audio Info = {a_info}")

    c_final, v_final, a_final, _, _ = get_stream_durations(output_mp4_path)
    print("\n==================================================")
    print("7. CHECK CONCAT STEP SEPARATELY")
    print("==================================================")
    print(f"SUM(actual intermediate segment container durations) = {total_actual_container:.3f}")
    print(f"SUM(actual intermediate segment video durations) = {total_actual_video:.3f}")
    print(f"SUM(actual intermediate segment audio durations) = {total_actual_audio:.3f}")
    print(f"FINAL concatenated container duration = {c_final:.3f}")
    print(f"FINAL video duration = {v_final:.3f}")
    print(f"FINAL audio duration = {a_final:.3f}")
    print(f"Concat Container Difference: {c_final - total_actual_container:+.3f}")
    print(f"Concat Video Difference: {v_final - total_actual_video:+.3f}")
    
    print("\nDone.")

if __name__ == "__main__":
    main()

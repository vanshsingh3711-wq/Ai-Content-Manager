import os
import sys
import subprocess
import json
import glob

sys.path.append(os.getcwd())
from services.compositor import _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin, _build_segment_timeline, _run_ffmpeg, _fix_missing_audio

def render_video_pipeline_test(
    raw_video_path,
    output_mp4_path,
    edits,
    timestamp_map,
    source_fps,
    broll_map=None
):
    temp_dir = os.path.dirname(os.path.abspath(output_mp4_path))
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    
    timeline = _build_segment_timeline(edits, timestamp_map, total_duration)
    kept_segments = [s for s in timeline if not s["is_cut"]]
    
    segment_files = []
    
    for seg_idx, seg in enumerate(kept_segments):
        seg_output = os.path.join(temp_dir, f"seg_{seg_idx:03d}.mp4")
        start_t = max(0, seg["start"])
        end_t = min(total_duration, seg["end"])
        duration = end_t - start_t
        
        vf_chain = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
        
        cmd = [
            ffmpeg_bin, "-y",
            "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
            "-vf", vf_chain,
            "-r", str(source_fps),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            seg_output,
        ]
        
        _run_ffmpeg(cmd, f"segment_{seg['chunk_id']}")
        segment_files.append(seg_output)
        
    concat_list_path = os.path.join(temp_dir, "concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for sf in segment_files:
            safe_path = os.path.abspath(sf).replace("\\", "/")
            f.write(f"file '{safe_path}'\n")

    concat_output = os.path.join(temp_dir, "concatenated.mp4")
    concat_cmd = [
        ffmpeg_bin, "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        "-movflags", "+faststart",
        concat_output,
    ]
    _run_ffmpeg(concat_cmd, "concatenate_segments")
    return concat_output, segment_files

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
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_dur = float(stream.get("duration", 0) or 0)
                fps = stream.get("r_frame_rate", "")
            elif stream.get("codec_type") == "audio":
                audio_dur = float(stream.get("duration", 0) or 0)
        
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        data2 = json.loads(result2.stdout)
        container_dur = float(data2.get("format", {}).get("duration", 0) or 0)
        
        return container_dur, video_dur, audio_dur, fps, {}
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

    try:
        with open("final_vad_results.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            timestamp_map = data[1]
    except Exception as e:
        timestamp_map = {"ID_01": {"start": 1.10, "end": 4.00, "text": "dummy"}}

    edits = [{"action": "cut", "start": 0.0, "end": 1.10}]
    output_mp4_path = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports\drift_test_out.mp4"
    temp_dir = os.path.dirname(output_mp4_path)

    for f in glob.glob(os.path.join(temp_dir, "seg_*.mp4")):
        try: os.remove(f)
        except: pass

    concat_output, segment_files = render_video_pipeline_test(
        raw_video_path=target_video,
        output_mp4_path=output_mp4_path,
        edits=edits,
        timestamp_map=timestamp_map,
        source_fps=12.0
    )

    print("\n==================================================")
    print("INSPECT EVERY INTERMEDIATE SEGMENT (ORIGINAL)")
    print("==================================================")
    
    total_expected = 0.0
    total_actual_container = 0.0
    total_actual_video = 0.0
    total_actual_audio = 0.0

    duration_full = _probe_duration(ffmpeg_bin, target_video)
    timeline = _build_segment_timeline(edits, timestamp_map, duration_full)
    kept_segments = [s for s in timeline if not s["is_cut"]]
    expected_durations = {}
    for i, seg in enumerate(kept_segments):
        expected_durations[f"seg_{i:03d}.mp4"] = seg["end"] - seg["start"]

    for f in segment_files:
        basename = os.path.basename(f)
        c_dur, v_dur, a_dur, fps, _ = get_stream_durations(f)
        exp_dur = expected_durations.get(basename, 0)
        
        v_drift = v_dur - exp_dur
        a_drift = a_dur - exp_dur
        
        total_expected += exp_dur
        total_actual_container += c_dur
        total_actual_video += v_dur
        total_actual_audio += a_dur

        print(f"\nSEGMENT {basename} | Expected = {exp_dur:.3f}")
        print(f"Video = {v_dur:.3f} (drift {v_drift:+.3f})")
        print(f"Audio = {a_dur:.3f} (drift {a_drift:+.3f})")

    c_final, v_final, a_final, _, _ = get_stream_durations(concat_output)
    print("\n==================================================")
    print(f"FINAL video duration = {v_final:.3f}")
    print(f"FINAL audio duration = {a_final:.3f}")
    print(f"Expected final = {total_expected:.3f}")
    print("Done.")

if __name__ == "__main__":
    main()

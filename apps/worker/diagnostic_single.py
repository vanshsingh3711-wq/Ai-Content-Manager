import os
import sys
import subprocess
import json

sys.path.append(os.getcwd())
from services.compositor import _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin, _run_ffmpeg

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
        
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        data2 = json.loads(result2.stdout)
        container_dur = float(data2.get("format", {}).get("duration", 0) or 0)
        
        return container_dur, video_dur, audio_dur
    except Exception as e:
        print("ERROR probing:", e)
        return 0.0, 0.0, 0.0

def main():
    ffmpeg_bin = get_ffmpeg_binary_path()
    target_video = None
    video_dir = r"c:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user"
    for file in os.listdir(video_dir):
        if file.endswith(".mp4"):
            path = os.path.join(video_dir, file)
            try:
                duration = _probe_duration(ffmpeg_bin, path)
                if abs(duration - 41.17) < 0.5:
                    target_video = path
                    break
            except: pass

    output_original = r"media_temp\rendered-exports\single_seg_original.mp4"
    output_hybrid = r"media_temp\rendered-exports\single_seg_hybrid.mp4"
    output_trim = r"media_temp\rendered-exports\single_seg_trim.mp4"

    start_t = 1.10
    total_duration = _probe_duration(ffmpeg_bin, target_video)
    duration = total_duration - start_t
    print(f"Total: {total_duration:.3f}, cut start: {start_t}, expected dur: {duration:.3f}")

    vf_chain = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"

    print("\n1. Original (Input -ss, Input -t)")
    cmd1 = [
        ffmpeg_bin, "-y",
        "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", target_video,
        "-vf", vf_chain,
        "-r", "12", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        output_original
    ]
    subprocess.run(cmd1, capture_output=True)
    c_dur, v_dur, a_dur = get_stream_durations(output_original)
    print(f"Container: {c_dur:.3f}, Video: {v_dur:.3f}, Audio: {a_dur:.3f}")

    print("\n2. Hybrid (Input -ss, Output -t)")
    cmd2 = [
        ffmpeg_bin, "-y",
        "-ss", f"{start_t:.3f}", "-i", target_video,
        "-t", f"{duration:.3f}",
        "-vf", vf_chain,
        "-r", "12", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        output_hybrid
    ]
    subprocess.run(cmd2, capture_output=True)
    c_dur, v_dur, a_dur = get_stream_durations(output_hybrid)
    print(f"Container: {c_dur:.3f}, Video: {v_dur:.3f}, Audio: {a_dur:.3f}")

    print("\n3. Trim Filters (Accurate)")
    cmd3 = [
        ffmpeg_bin, "-y",
        "-i", target_video,
        "-filter_complex",
        f"[0:v]trim=start={start_t:.3f}:duration={duration:.3f},setpts=PTS-STARTPTS,{vf_chain}[vout];"
        f"[0:a]atrim=start={start_t:.3f}:duration={duration:.3f},asetpts=PTS-STARTPTS[aout]",
        "-map", "[vout]", "-map", "[aout]",
        "-r", "12", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        output_trim
    ]
    subprocess.run(cmd3, capture_output=True)
    c_dur, v_dur, a_dur = get_stream_durations(output_trim)
    print(f"Container: {c_dur:.3f}, Video: {v_dur:.3f}, Audio: {a_dur:.3f}")

if __name__ == "__main__":
    main()

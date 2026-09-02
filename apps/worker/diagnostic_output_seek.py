import os
import sys
import subprocess
import json

sys.path.append(os.getcwd())
from services.compositor import _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin

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
        return v_dur, a_dur
    except:
        return 0.0, 0.0

def main():
    ffmpeg_bin = get_ffmpeg_binary_path()
    target_video = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    
    segments = [
        ("seg_000.mp4", 1.100, 0.230),
        ("seg_001.mp4", 1.330, 0.340),
        ("seg_002.mp4", 1.670, 1.080),
        ("seg_003.mp4", 2.750, 0.760),
        ("seg_004.mp4", 3.510, 3.500),
        ("seg_005.mp4", 7.010, 0.380),
        ("seg_006.mp4", 7.390, 3.720),
        ("seg_007.mp4", 11.110, 0.740),
        ("seg_008.mp4", 11.850, 5.260),
        ("seg_009.mp4", 17.110, 6.180),
        ("seg_010.mp4", 23.290, 1.780),
        ("seg_011.mp4", 25.070, 5.960),
        ("seg_012.mp4", 31.030, 5.340),
        ("seg_013.mp4", 36.370, 1.060),
        ("seg_014.mp4", 37.430, 3.500),
        ("seg_015.mp4", 40.930, 0.261)
    ]

    total_expected = 0.0
    total_video = 0.0
    total_audio = 0.0

    print("==================================================")
    print("INSPECT EVERY INTERMEDIATE SEGMENT (OUTPUT SEEKING)")
    print("==================================================")

    concat_lines = []
    
    for name, start, dur in segments:
        out_path = os.path.join(r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports", "test_" + name)
        
        # Output seeking: -ss and -t are AFTER the input
        cmd = [
            ffmpeg_bin, "-y",
            "-i", target_video,
            "-ss", f"{start:.3f}", "-t", f"{dur:.3f}",
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-r", "12", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            out_path
        ]
        subprocess.run(cmd, capture_output=True)
        
        v_dur, a_dur = get_stream_durations(out_path)
        
        drift = v_dur - dur
        print(f"SEGMENT {name} | Expected = {dur:.3f}")
        print(f"Video = {v_dur:.3f} (drift {drift:+.3f})")
        print(f"Audio = {a_dur:.3f}")
        print()
        
        total_expected += dur
        total_video += v_dur
        total_audio += a_dur
        
        concat_lines.append(f"file 'test_{name}'\n")

    print("==================================================")
    print(f"SUM video duration = {total_video:.3f}")
    print(f"SUM audio duration = {total_audio:.3f}")
    print(f"Expected final = {total_expected:.3f}")
    print("==================================================")

    # Now concat
    concat_file = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports\test_concat_list.txt"
    with open(concat_file, "w") as f:
        f.writelines(concat_lines)
        
    final_out = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\rendered-exports\test_concat_final.mp4"
    cmd_concat = [
        ffmpeg_bin, "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
        "-c", "copy", final_out
    ]
    subprocess.run(cmd_concat, capture_output=True)
    
    v_dur, a_dur = get_stream_durations(final_out)
    print(f"FINAL CONCAT Video = {v_dur:.3f}, Audio = {a_dur:.3f}")

if __name__ == "__main__":
    main()

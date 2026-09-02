import os
import subprocess
import json

from services.compositor import get_ffmpeg_binary_path

def create_segment(ffmpeg_bin, i, start, dur, in_file, out_file):
    vf = f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    
    cmd = [
        ffmpeg_bin, "-y",
        "-i", in_file,
        "-filter_complex",
        f"[0:v]trim=start={start}:duration={dur},setpts=PTS-STARTPTS,{vf}[vout];"
        f"[0:a]atrim=start={start}:duration={dur},asetpts=PTS-STARTPTS[aout]",
        "-map", "[vout]", "-map", "[aout]",
        "-r", "12", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out_file
    ]
    subprocess.run(cmd, capture_output=True)

def main():
    ffmpeg_bin = get_ffmpeg_binary_path()
    vid = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    
    # 3 short segments
    create_segment(ffmpeg_bin, 1, 1.10, 1.0, vid, "seg1.mp4")
    create_segment(ffmpeg_bin, 2, 3.50, 2.0, vid, "seg2.mp4")
    create_segment(ffmpeg_bin, 3, 10.0, 1.5, vid, "seg3.mp4")
    
    # concat
    with open("concat.txt", "w") as f:
        f.write("file 'seg1.mp4'\nfile 'seg2.mp4'\nfile 'seg3.mp4'\n")
        
    cmd = [
        ffmpeg_bin, "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt",
        "-c", "copy", "concat_out.mp4"
    ]
    subprocess.run(cmd, capture_output=True)
    
    # probe
    ffprobe_bin = ffmpeg_bin.replace("ffmpeg", "ffprobe")
    p = subprocess.run([ffprobe_bin, "-show_entries", "format=duration", "-of", "json", "concat_out.mp4"], capture_output=True, text=True)
    print("Concat duration:", json.loads(p.stdout)["format"]["duration"])

if __name__ == "__main__":
    main()

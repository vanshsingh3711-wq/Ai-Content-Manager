import os
import subprocess
import json

def download_video(url: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    video_path = os.path.join(output_dir, "source.mp4")
    audio_path = os.path.join(output_dir, "source.wav")
    
    if os.path.exists(video_path) and os.path.exists(audio_path):
        print("Using cached video and audio.")
        title = "Unknown Title (Cached)"
        # Try to read info json if exists
        info_path = os.path.join(output_dir, "info.json")
        if os.path.exists(info_path):
            with open(info_path, "r") as f:
                title = json.load(f).get("title", title)
        return video_path, audio_path, title

    print(f"Downloading video from {url}...")
    try:
        subprocess.run([
            "yt-dlp", "-f", "bestvideo[height<=480][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]", 
            "--merge-output-format", "mp4",
            "--write-info-json",
            "-o", video_path, url
        ], check=True)
    except subprocess.CalledProcessError:
        print("yt-dlp failed with preferred format. Falling back to any format...")
        temp_path = video_path + ".temp"
        subprocess.run([
            "yt-dlp", "-f", "bestvideo[height<=480]+bestaudio/best", 
            "--write-info-json",
            "-o", temp_path, url
        ], check=True)
        os.rename(temp_path, video_path)
    
    title = "Unknown Title"
    info_path = os.path.join(output_dir, "source.info.json")
    if os.path.exists(info_path):
        with open(info_path, "r") as f:
            title = json.load(f).get("title", title)
        os.rename(info_path, os.path.join(output_dir, "info.json"))
        
    import cv2
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        print("OpenCV cannot decode the video. Re-encoding to H.264...")
        temp_path = video_path + ".reencode.mp4"
        os.rename(video_path, temp_path)
        subprocess.run(["ffmpeg", "-y", "-i", temp_path, "-vcodec", "libx264", "-acodec", "aac", video_path], check=True)
        os.remove(temp_path)
    
    print("Extracting audio to wav...")
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path, "-ac", "1", "-ar", "16000", audio_path
    ], check=True)

    return video_path, audio_path, title

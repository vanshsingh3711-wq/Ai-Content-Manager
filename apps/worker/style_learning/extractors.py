import cv2
import librosa
import numpy as np
import subprocess
import json
from scenedetect import detect, ContentDetector
from sklearn.cluster import MiniBatchKMeans

def extract_timing(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frame_count / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    scene_list = detect(video_path, ContentDetector())
    
    # scene_list is a list of tuples (start_time, end_time)
    cut_times = [scene[0].get_seconds() for scene in scene_list]
    
    shot_lengths = []
    for i in range(len(scene_list)):
        shot_lengths.append(scene_list[i][1].get_seconds() - scene_list[i][0].get_seconds())
        
    cuts_per_minute = len(cut_times) / (duration / 60) if duration > 0 else 0
    
    return {
        "duration": duration,
        "fps": fps,
        "resolution": f"{width}x{height}",
        "cut_times": cut_times,
        "shot_lengths": {
            "mean": float(np.mean(shot_lengths)) if shot_lengths else duration,
            "median": float(np.median(shot_lengths)) if shot_lengths else duration,
            "min": float(np.min(shot_lengths)) if shot_lengths else duration,
            "max": float(np.max(shot_lengths)) if shot_lengths else duration,
        },
        "cuts_per_minute": cuts_per_minute,
        "longest_stretch": float(np.max(shot_lengths)) if shot_lengths else duration,
        "first_visual_change_time": cut_times[1] if len(cut_times) > 1 else duration
    }

def extract_color(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0: fps = 30
    
    pixels = []
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % int(fps * 2) == 0:
            frame = cv2.resize(frame, (64, 64))
            pixels.append(frame.reshape(-1, 3))
        frame_idx += 1
    cap.release()
    
    if not pixels:
        return {"dominant_palette": [], "brightness": "unknown"}
        
    pixels = np.vstack(pixels)
    kmeans = MiniBatchKMeans(n_clusters=5, n_init=3)
    kmeans.fit(pixels)
    
    colors = kmeans.cluster_centers_
    labels = kmeans.labels_
    
    counts = np.bincount(labels)
    total = len(labels)
    
    palette = []
    for i in range(5):
        b, g, r = colors[i]
        hex_color = f"#{int(r):02x}{int(g):02x}{int(b):02x}"
        palette.append({"hex": hex_color, "share": float(counts[i] / total)})
        
    palette.sort(key=lambda x: x["share"], reverse=True)
    
    brightness = np.mean([max(c) for c in colors])
    theme = "light" if brightness > 127 else "dark"
    
    return {
        "dominant_palette": palette,
        "brightness_summary": theme
    }

def extract_sound(audio_path, cut_times):
    y, sr = librosa.load(audio_path, sr=16000)
    
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    duration = len(y) / sr
    sfx_per_minute = len(onset_times) / (duration / 60) if duration > 0 else 0
    
    aligned_with_cuts = 0
    for onset in onset_times:
        if any(abs(onset - cut) <= 0.15 for cut in cut_times):
            aligned_with_cuts += 1
            
    fraction_aligned = aligned_with_cuts / len(onset_times) if len(onset_times) > 0 else 0
    
    return {
        "sfx_per_minute": sfx_per_minute,
        "fraction_aligned_with_cuts": fraction_aligned,
        "music_present": True
    }

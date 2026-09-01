import os
import cv2
from typing import List, Tuple

def extract_frames(video_path: str, temp_dir: str, interval_sec: float = 1.0) -> List[Tuple[float, str]]:
    """
    Extracts frames from the video at the specified interval.
    Returns a list of tuples: (timestamp_sec, path_to_frame_image)
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")
        
    os.makedirs(temp_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video with OpenCV: {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or not fps:
        fps = 30.0
        
    frame_interval = int(fps * interval_sec)
    extracted = []
    
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % frame_interval == 0:
            timestamp = frame_idx / fps
            frame_filename = f"frame_{timestamp:.3f}.jpg"
            frame_path = os.path.join(temp_dir, frame_filename)
            
            # Save frame
            cv2.imwrite(frame_path, frame)
            extracted.append((timestamp, frame_path))
            
        frame_idx += 1
        
    cap.release()
    return extracted

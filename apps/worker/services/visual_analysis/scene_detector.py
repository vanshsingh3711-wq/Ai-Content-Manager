import cv2
from typing import List, Tuple
from .schemas import SceneEvent

def detect_scenes(extracted_frames: List[Tuple[float, str]], threshold: float = 0.65) -> List[SceneEvent]:
    """
    Detects scene changes by comparing histograms of consecutive frames.
    """
    scenes = []
    if len(extracted_frames) < 2:
        return scenes
        
    prev_hist = None
    
    for i, (timestamp, frame_path) in enumerate(extracted_frames):
        frame = cv2.imread(frame_path)
        if frame is None:
            continue
            
        # Convert to HSV and calculate histogram
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
        cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
        
        if prev_hist is not None:
            # Compare histograms using correlation
            similarity = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CORREL)
            
            # If similarity drops below threshold, we found a scene cut
            if similarity < threshold:
                scenes.append(
                    SceneEvent(
                        timestamp=timestamp,
                        confidence=round(1.0 - max(similarity, 0.0), 2)
                    )
                )
                
        prev_hist = hist
        
    return scenes

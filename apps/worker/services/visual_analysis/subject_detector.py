import os
import urllib.request
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from typing import List, Tuple
from .schemas import SubjectEvent, BoundingBox

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "pose_landmarker_lite.task")

def detect_subjects(extracted_frames: List[Tuple[float, str]]) -> List[SubjectEvent]:
    """
    Detects the primary subject (person) in frames using Mediapipe Pose Tasks API.
    """
    if not os.path.exists(MODEL_PATH):
        print("[*] Downloading Mediapipe Pose model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

    subjects = []
    
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False,
        min_pose_detection_confidence=0.5
    )
    detector = vision.PoseLandmarker.create_from_options(options)
    
    for timestamp, frame_path in extracted_frames:
        frame = cv2.imread(frame_path)
        if frame is None:
            continue
            
        # Convert BGR to RGB for Mediapipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        results = detector.detect(mp_image)
        
        if results.pose_landmarks and len(results.pose_landmarks) > 0:
            # We just take the first detected person
            landmarks = results.pose_landmarks[0]
            
            # Find bounding box of the person
            # In the tasks API, visibility might be None, so we handle it safely
            x_coords = [lm.x for lm in landmarks if getattr(lm, 'visibility', 1.0) is None or getattr(lm, 'visibility', 1.0) > 0.5]
            y_coords = [lm.y for lm in landmarks if getattr(lm, 'visibility', 1.0) is None or getattr(lm, 'visibility', 1.0) > 0.5]
            
            if x_coords and y_coords:
                x_min = max(0.0, min(x_coords))
                x_max = min(1.0, max(x_coords))
                y_min = max(0.0, min(y_coords))
                y_max = min(1.0, max(y_coords))
                
                subjects.append(
                    SubjectEvent(
                        timestamp=timestamp,
                        bounding_box=BoundingBox(
                            x=x_min,
                            y=y_min,
                            width=x_max - x_min,
                            height=y_max - y_min
                        )
                    )
                )
                
    return subjects

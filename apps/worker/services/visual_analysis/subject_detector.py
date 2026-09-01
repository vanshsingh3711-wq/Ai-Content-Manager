import cv2
import mediapipe as mp
from typing import List, Tuple
from .schemas import SubjectEvent, BoundingBox

def detect_subjects(extracted_frames: List[Tuple[float, str]]) -> List[SubjectEvent]:
    """
    Detects the primary subject (person) in frames using Mediapipe Pose.
    """
    subjects = []
    
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=True, 
        model_complexity=0, 
        enable_segmentation=False, 
        min_detection_confidence=0.5
    )
    
    for timestamp, frame_path in extracted_frames:
        frame = cv2.imread(frame_path)
        if frame is None:
            continue
            
        h, w, _ = frame.shape
        # Convert BGR to RGB for Mediapipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        results = pose.process(frame_rgb)
        
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            
            # Find bounding box of the person
            x_coords = [lm.x for lm in landmarks if lm.visibility > 0.5]
            y_coords = [lm.y for lm in landmarks if lm.visibility > 0.5]
            
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
                
    pose.close()
    return subjects

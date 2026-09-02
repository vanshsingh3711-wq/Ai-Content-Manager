import os
import shutil
import uuid
import traceback
from typing import Dict, Any

from .schemas import UnifiedVisualTimeline, ObservationEvent
from .frame_sampler import extract_frames
from .scene_detector import detect_scenes
from .subject_detector import detect_subjects
from .composition_analyzer import analyze_composition

from worker_logger import log_info, log_error, log_warning

def analyze_visual_context(video_path: str, video_id: str, video_duration: float, temp_dir: str) -> UnifiedVisualTimeline:
    """
    Main entrypoint for the Visual Intelligence Layer.
    Extracts frames and runs independent visual detectors.
    Returns a unified timeline of visual facts.
    """
    timeline = UnifiedVisualTimeline(video_id=video_id)
    
    # 1. Frame Sampling
    log_info(f"VisualAnalysis: Extracting frames for {video_path}")
    frames_dir = os.path.join(temp_dir, "visual_frames")
    
    # Sample 1 frame per second
    extracted_frames = extract_frames(video_path, frames_dir, interval_sec=1.0)
    log_info(f"VisualAnalysis: Extracted {len(extracted_frames)} frames")
    # 2. Scene Detection (Optional)
    log_info("VisualAnalysis: Running Scene Detection")
    scenes = detect_scenes(extracted_frames)
    timeline.scenes = scenes
    log_info(f"VisualAnalysis: Detected {len(scenes)} scenes")
    # 3. Subject Detection (Optional)
    log_info("VisualAnalysis: Running Subject Detection")
    subjects = detect_subjects(extracted_frames)
    timeline.subjects = subjects
    log_info(f"VisualAnalysis: Detected {len(subjects)} subject events")
    # 4. Composition Analysis (Depends on subjects)
    log_info("VisualAnalysis: Running Composition Analysis")
    composition_segments = analyze_composition(subjects, video_duration)
    timeline.composition_segments = composition_segments
    log_info(f"VisualAnalysis: Generated {len(composition_segments)} composition segments")
    # Cleanup frames since we don't need them anymore
    try:
        shutil.rmtree(frames_dir, ignore_errors=True)
    except:
        pass
        
    return timeline

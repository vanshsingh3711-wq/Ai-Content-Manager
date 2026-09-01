import pytest
import sys
from unittest.mock import patch, MagicMock

sys.modules["cv2"] = MagicMock()
sys.modules["mediapipe"] = MagicMock()

from services.visual_analysis.schemas import UnifiedVisualTimeline, SubjectEvent, BoundingBox
from services.visual_analysis.composition_analyzer import analyze_composition
from services.visual_analysis.service import analyze_visual_context

def test_composition_analyzer_safe_spaces():
    subjects = [
        SubjectEvent(
            timestamp=1.0,
            bounding_box=BoundingBox(x=0.1, y=0.1, width=0.2, height=0.5) # Left side
        ),
        SubjectEvent(
            timestamp=2.0,
            bounding_box=BoundingBox(x=0.7, y=0.1, width=0.2, height=0.5) # Right side
        )
    ]
    
    segments = analyze_composition(subjects, video_duration=3.0)
    
    assert len(segments) == 2
    
    # First segment: Subject on left, right should be safe
    assert segments[0].primary_subject_position == "left"
    assert "right" in segments[0].safe_regions
    
    # Second segment: Subject on right, left should be safe
    assert segments[1].primary_subject_position == "right"
    assert "left" in segments[1].safe_regions


@patch("services.visual_analysis.service.extract_frames")
@patch("services.visual_analysis.service.detect_scenes")
@patch("services.visual_analysis.service.detect_subjects")
def test_visual_service_orchestration(mock_detect_subjects, mock_detect_scenes, mock_extract_frames):
    mock_extract_frames.return_value = [(0.0, "frame1.jpg"), (1.0, "frame2.jpg")]
    mock_detect_scenes.return_value = []
    
    # Subject detector failure should NOT crash the service
    mock_detect_subjects.side_effect = Exception("Mediapipe missing")
    
    timeline = analyze_visual_context("test.mp4", "job_123", 2.0, "/tmp/dir")
    
    assert isinstance(timeline, UnifiedVisualTimeline)
    assert timeline.video_id == "job_123"
    assert len(timeline.scenes) == 0
    assert len(timeline.subjects) == 0
    
    # It should fallback gracefully to a default composition segment
    assert len(timeline.composition_segments) == 1
    assert timeline.composition_segments[0].primary_subject_position == "unknown"

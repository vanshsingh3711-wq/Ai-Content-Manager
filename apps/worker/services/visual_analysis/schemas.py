from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class VisualEvent(BaseModel):
    timestamp: Optional[float] = None
    start: Optional[float] = None
    end: Optional[float] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

class SceneEvent(VisualEvent):
    type: Literal["scene_change"] = "scene_change"

class BoundingBox(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    width: float = Field(..., ge=0.0, le=1.0)
    height: float = Field(..., ge=0.0, le=1.0)

class SubjectEvent(VisualEvent):
    type: Literal["person"] = "person"
    role: str = "primary"
    bounding_box: BoundingBox

class CompositionSegment(VisualEvent):
    primary_subject_position: Literal["left", "center", "right", "unknown"]
    safe_regions: List[str]
    bottom_region_occupied: bool

class ObservationEvent(VisualEvent):
    type: str
    label: str

class UnifiedVisualTimeline(BaseModel):
    video_id: str
    scenes: List[SceneEvent] = []
    subjects: List[SubjectEvent] = []
    composition_segments: List[CompositionSegment] = []
    observations: List[ObservationEvent] = []
    gesture_events: List[dict] = []  # For future use

class UnifiedAnalysis(BaseModel):
    transcript: str
    audio_analysis: dict = {}
    visual_analysis: UnifiedVisualTimeline

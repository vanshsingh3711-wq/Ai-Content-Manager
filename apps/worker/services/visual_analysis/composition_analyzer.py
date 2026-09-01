from typing import List
from .schemas import SubjectEvent, CompositionSegment

def analyze_composition(subjects: List[SubjectEvent], video_duration: float) -> List[CompositionSegment]:
    """
    Analyzes subject positions to determine safe spaces for overlays.
    Groups consecutive similar compositions into time segments.
    """
    if not subjects:
        # Default safe regions if no subjects found
        return [
            CompositionSegment(
                start=0.0,
                end=video_duration,
                primary_subject_position="unknown",
                safe_regions=["top", "bottom", "left", "right"],
                bottom_region_occupied=False
            )
        ]
        
    segments = []
    
    # We will just map the entire video to the average of the subjects, 
    # or create segments if they move significantly.
    # For a v1, we can create segments for each 2-second interval, or just 1 segment for the whole video if it's static.
    # Let's create segments for each continuous chunk of time.
    
    # Simple approach: evaluate each subject event and build segments
    for i in range(len(subjects)):
        curr_subj = subjects[i]
        start_time = curr_subj.timestamp
        end_time = subjects[i+1].timestamp if i + 1 < len(subjects) else video_duration
        
        bb = curr_subj.bounding_box
        
        # Determine horizontal position
        center_x = bb.x + (bb.width / 2.0)
        if center_x < 0.4:
            pos = "left"
        elif center_x > 0.6:
            pos = "right"
        else:
            pos = "center"
            
        safe_regions = []
        
        # If subject is on the left, right is safe
        if pos == "left":
            safe_regions.append("right")
        elif pos == "right":
            safe_regions.append("left")
        else:
            # Subject is center. Check width.
            if bb.width < 0.5:
                safe_regions.extend(["left", "right"])
                
        # Check vertical safe regions
        if bb.y > 0.3:
            safe_regions.append("top")
            
        bottom_occupied = (bb.y + bb.height) > 0.7
        if not bottom_occupied:
            safe_regions.append("bottom")
            
        segments.append(
            CompositionSegment(
                start=round(start_time, 2),
                end=round(end_time, 2),
                primary_subject_position=pos,
                safe_regions=safe_regions,
                bottom_region_occupied=bottom_occupied
            )
        )
        
    # Optional: Merge adjacent segments if they have the same composition to compress timeline
    merged = []
    for seg in segments:
        if not merged:
            merged.append(seg)
        else:
            last = merged[-1]
            if (last.primary_subject_position == seg.primary_subject_position and 
                last.safe_regions == seg.safe_regions and 
                last.bottom_region_occupied == seg.bottom_region_occupied):
                last.end = seg.end
            else:
                merged.append(seg)
                
    return merged

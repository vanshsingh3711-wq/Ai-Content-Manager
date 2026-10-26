"""
Presenter Safe-Zone Collision Gatekeeper.

Dynamically arbitrates vertical screen real-estate between:
1. Presenter face/body bounding boxes.
2. Motion graphics explainer cards.
3. Kinetic karaoke captions.

Enforces critical visual rules:
- Captions NEVER occlude the presenter's face or mouth.
- When motion graphics overlays are active, captions anchor directly under the card,
  not at the bottom of the canvas and not obscuring the graphics card.
- When the presenter occupies lower screen areas, captions seamlessly lift to upper safe zones.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from services.visual_analysis.schemas import CompositionSegment, SubjectEvent


@dataclass
class CaptionPlacement:
    position_tag: str  # "bottom" | "top" | "under_graphics" | "center"
    pos_x: int
    pos_y: int
    alignment: int  # ASS alignment: 2 (bottom-center), 5 (mid-center), 8 (top-center)
    ass_prefix: str


class SafeZoneGatekeeper:
    def __init__(
        self,
        canvas_width: int = 1080,
        canvas_height: int = 1920,
        margin_bottom_px: int = 240,
        margin_top_px: int = 360,
        mg_card_bottom_px: int = 1440,
    ):
        self.canvas_w = canvas_width
        self.canvas_h = canvas_height
        self.margin_bottom = margin_bottom_px
        self.margin_top = margin_top_px
        self.mg_bottom_y = mg_card_bottom_px
        self.center_x = canvas_width // 2

    def resolve_caption_placement(
        self,
        start_time: float,
        end_time: float,
        active_mg_ranges: Optional[List[Tuple[float, float]]] = None,
        composition_segments: Optional[List[CompositionSegment]] = None,
        subjects: Optional[List[SubjectEvent]] = None,
    ) -> CaptionPlacement:
        """
        Determines the optimal conflict-free ASS position for a caption dialogue chunk.
        """
        # Rule 1: When a motion graphics overlay is active during this timestamp,
        # anchor directly beneath the motion graphics card
        if active_mg_ranges:
            for mg_start, mg_end in active_mg_ranges:
                if max(start_time, mg_start) < min(end_time, mg_end):
                    # Overlap detected with motion graphics
                    return CaptionPlacement(
                        position_tag="under_graphics",
                        pos_x=self.center_x,
                        pos_y=self.mg_bottom_y,
                        alignment=5,
                        ass_prefix=rf"{{\an5\pos({self.center_x},{self.mg_bottom_y})}}",
                    )

        # Rule 2: Check presenter occupancy in the lower third
        bottom_blocked = False

        if composition_segments:
            for seg in composition_segments:
                seg_start = seg.start if seg.start is not None else 0.0
                seg_end = seg.end if seg.end is not None else 9999.0
                if max(start_time, seg_start) < min(end_time, seg_end):
                    if seg.bottom_region_occupied:
                        bottom_blocked = True
                        break

        # Check raw subject bounding boxes as secondary verification
        if not bottom_blocked and subjects:
            for subj in subjects:
                t = subj.timestamp if subj.timestamp is not None else 0.0
                if start_time - 0.2 <= t <= end_time + 0.2:
                    bb = subj.bounding_box
                    # If subject bounding box extends past 65% of screen height
                    if (bb.y + bb.height) > 0.65:
                        bottom_blocked = True
                        break

        # Rule 3: If bottom is occupied by presenter, elevate to top safe-zone
        if bottom_blocked:
            top_y = self.margin_top
            return CaptionPlacement(
                position_tag="top",
                pos_x=self.center_x,
                pos_y=top_y,
                alignment=8,
                ass_prefix=rf"{{\an8\pos({self.center_x},{top_y})}}",
            )

        # Rule 4: Default clean bottom placement
        bottom_y = self.canvas_h - self.margin_bottom
        return CaptionPlacement(
            position_tag="bottom",
            pos_x=self.center_x,
            pos_y=bottom_y,
            alignment=2,
            ass_prefix=rf"{{\an2\pos({self.center_x},{bottom_y})}}",
        )

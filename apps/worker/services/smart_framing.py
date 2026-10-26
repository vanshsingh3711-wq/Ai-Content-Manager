"""
Smart 9:16 Auto-Reframing Service (Pan-and-Scan Camera Engine).

Converts widescreen footage (16:9, 4:3, etc.) into vertical 9:16 format (1080x1920)
by dynamically tracking the presenter's centroid using MediaPipe face/subject detections
and applying cinematic Exponential Moving Average (EMA) camera stabilization.
"""

import math
from typing import Any, Dict, List, Optional, Tuple

from services.visual_analysis.schemas import SceneEvent, SubjectEvent


class SmartFramingEngine:
    def __init__(
        self,
        source_width: int,
        source_height: int,
        target_width: int = 1080,
        target_height: int = 1920,
        ema_alpha: float = 0.12,
        deadband_ratio: float = 0.04,
    ):
        """
        Initializes the auto-reframing geometry and camera smoothing parameters.

        :param source_width: Width of raw input video (e.g. 1920).
        :param source_height: Height of raw input video (e.g. 1080).
        :param target_width: Target canvas width (default 1080).
        :param target_height: Target canvas height (default 1920).
        :param ema_alpha: Camera smoothing rate [0.01..1.0]. Lower is smoother, higher is more responsive.
        :param deadband_ratio: Minimum subject movement threshold before camera adjusts (prevents jitter).
        """
        self.src_w = int(source_width)
        self.src_h = int(source_height)
        self.tgt_w = int(target_width)
        self.tgt_h = int(target_height)
        self.ema_alpha = max(0.01, min(1.0, float(ema_alpha)))
        self.deadband_ratio = float(deadband_ratio)

        target_aspect = self.tgt_w / self.tgt_h
        src_aspect = self.src_w / self.src_h

        if src_aspect >= target_aspect:
            # Widescreen (e.g. 16:9): Height matches source, width is cropped to 9:16
            self.crop_h = self.src_h
            self.crop_w = int(round(self.crop_h * target_aspect))
            if self.crop_w % 2 != 0:
                self.crop_w -= 1
            self.max_x_offset = max(0, self.src_w - self.crop_w)
            self.max_y_offset = 0
            self.reframing_needed = self.crop_w < self.src_w
        else:
            # Taller than 9:16: Width matches source, height is cropped
            self.crop_w = self.src_w
            self.crop_h = int(round(self.crop_w / target_aspect))
            if self.crop_h % 2 != 0:
                self.crop_h -= 1
            self.max_x_offset = 0
            self.max_y_offset = max(0, self.src_h - self.crop_h)
            self.reframing_needed = self.crop_h < self.src_h

    def is_reframing_needed(self) -> bool:
        """Returns True if the source footage differs from 9:16 aspect ratio."""
        return self.reframing_needed

    def get_default_center_crop(self) -> Tuple[int, int, int, int]:
        """Returns centered static crop box: (x, y, crop_w, crop_h)."""
        x = (self.src_w - self.crop_w) // 2
        y = (self.src_h - self.crop_h) // 2
        return (max(0, x), max(0, y), self.crop_w, self.crop_h)

    def calculate_raw_x_offset(self, norm_center_x: float) -> int:
        """
        Calculates the horizontal crop offset in pixels to center the presenter at norm_center_x [0..1].
        Clamps strictly within [0, max_x_offset].
        """
        if self.max_x_offset == 0:
            return 0

        # Pixel position of the subject's center
        subject_px = norm_center_x * self.src_w
        # We want subject_px to align with crop_w / 2
        ideal_x = subject_px - (self.crop_w / 2.0)
        clamped_x = max(0, min(self.max_x_offset, int(round(ideal_x))))
        # Ensure even pixel alignment for YUV420p
        return clamped_x - (clamped_x % 2)

    def compute_smoothed_trajectory(
        self,
        subjects: List[SubjectEvent],
        video_duration: float,
        scenes: Optional[List[SceneEvent]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Computes time-indexed smoothed crop coordinates with scene-cut hard resets.
        Returns a list of dicts: {"timestamp": float, "x": int, "y": int, "w": int, "h": int}.
        """
        if not self.reframing_needed:
            # Source is already 9:16
            return [{
                "timestamp": 0.0,
                "x": 0,
                "y": 0,
                "w": self.src_w,
                "h": self.src_h,
            }]

        default_x, default_y, w, h = self.get_default_center_crop()
        if not subjects:
            return [{
                "timestamp": 0.0,
                "x": default_x,
                "y": default_y,
                "w": w,
                "h": h,
            }]

        # Map scene cut timestamps for hard camera resets
        scene_cut_times = set()
        if scenes:
            for sc in scenes:
                t = sc.timestamp if sc.timestamp is not None else sc.start
                if t is not None and t > 0.1:
                    scene_cut_times.add(round(t, 2))

        # Sort subjects by timestamp
        sorted_subjects = sorted(subjects, key=lambda s: s.timestamp if s.timestamp is not None else 0.0)

        trajectory: List[Dict[str, Any]] = []
        current_smoothed_x: float = float(default_x)
        last_t = 0.0

        for subj in sorted_subjects:
            t = subj.timestamp if subj.timestamp is not None else last_t
            last_t = t

            # Extract subject center
            bb = subj.bounding_box
            subj_center_x = bb.x + (bb.width / 2.0)
            target_x = float(self.calculate_raw_x_offset(subj_center_x))

            # Check if this frame is right after a scene change
            is_scene_cut = any(abs(t - cut_t) < 0.3 for cut_t in scene_cut_times)

            if is_scene_cut:
                # Instant cut without sliding
                current_smoothed_x = target_x
            else:
                # Deadband filter to suppress micro-movements
                diff_px = abs(target_x - current_smoothed_x)
                deadband_px = self.src_w * self.deadband_ratio
                if diff_px > deadband_px:
                    current_smoothed_x = (self.ema_alpha * target_x) + ((1.0 - self.ema_alpha) * current_smoothed_x)

            int_x = int(round(current_smoothed_x))
            int_x = max(0, min(self.max_x_offset, int_x))
            int_x -= (int_x % 2)  # Even pixel alignment

            trajectory.append({
                "timestamp": round(t, 3),
                "x": int_x,
                "y": default_y,
                "w": self.crop_w,
                "h": self.crop_h,
            })

        # Append final boundary coordinate
        if trajectory and trajectory[-1]["timestamp"] < video_duration:
            trajectory.append({
                "timestamp": round(video_duration, 3),
                "x": trajectory[-1]["x"],
                "y": trajectory[-1]["y"],
                "w": self.crop_w,
                "h": self.crop_h,
            })

        return trajectory

    def build_ffmpeg_crop_filter(
        self,
        trajectory: List[Dict[str, Any]],
        video_duration: float,
    ) -> str:
        """
        Builds an FFmpeg filtergraph string:
        Either static crop (if camera doesn't move) or timeline-stepped crop expression.
        """
        if not self.reframing_needed:
            return f"scale={self.tgt_w}:{self.tgt_h}:flags=lanczos"

        if not trajectory or len(trajectory) == 1:
            x, y, w, h = self.get_default_center_crop() if not trajectory else (
                trajectory[0]["x"], trajectory[0]["y"], trajectory[0]["w"], trajectory[0]["h"]
            )
            return f"crop={w}:{h}:{x}:{y},scale={self.tgt_w}:{self.tgt_h}:flags=lanczos"

        # Check if camera movement is essentially static (variance < 20px)
        x_values = [p["x"] for p in trajectory]
        if max(x_values) - min(x_values) <= 24:
            median_x = sorted(x_values)[len(x_values) // 2]
            median_x -= (median_x % 2)
            y = trajectory[0]["y"]
            return f"crop={self.crop_w}:{self.crop_h}:{median_x}:{y},scale={self.tgt_w}:{self.tgt_h}:flags=lanczos"

        # Multi-segment camera framing expression
        # Constructs: x='if(between(t,0,2),X1,if(between(t,2,4),X2,...))'
        # Group adjacent points with identical x to compress filter length
        compressed_segments: List[Tuple[float, float, int]] = []
        for i, pt in enumerate(trajectory):
            start_t = pt["timestamp"]
            end_t = trajectory[i + 1]["timestamp"] if i + 1 < len(trajectory) else video_duration
            x_val = pt["x"]
            if compressed_segments and compressed_segments[-1][2] == x_val:
                compressed_segments[-1] = (compressed_segments[-1][0], end_t, x_val)
            else:
                compressed_segments.append((start_t, end_t, x_val))

        # Build nested IF expression for FFmpeg
        expr = str(compressed_segments[-1][2])
        for st, et, x_val in reversed(compressed_segments[:-1]):
            expr = f"if(between(t\\,{st:.2f}\\,{et:.2f})\\,{x_val}\\,{expr})"

        y = trajectory[0]["y"]
        return f"crop={self.crop_w}:{self.crop_h}:{expr}:{y},scale={self.tgt_w}:{self.tgt_h}:flags=lanczos"

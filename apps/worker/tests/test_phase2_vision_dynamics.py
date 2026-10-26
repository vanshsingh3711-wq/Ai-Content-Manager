"""
Phase 2 Vision & Frame Dynamics Verification Suite.

Validates:
1. Smart 9:16 pan-and-scan camera reframing, aspect ratio detection, and EMA trajectory smoothing.
2. Scene-cut camera reset logic preventing camera slides across shot cuts.
3. Safe-zone collision gatekeeper prioritizing motion graphics docking and presenter avoidance.
4. ASS subtitle generator integration with dynamic gatekeeper collision resolution.
"""

import os
import tempfile
from typing import List

import pytest

from services.safe_zone_gatekeeper import CaptionPlacement, SafeZoneGatekeeper
from services.smart_framing import SmartFramingEngine
from services.subtitle_generator import generate_ass_subtitles
from services.visual_analysis.schemas import (
    BoundingBox,
    CompositionSegment,
    SceneEvent,
    SubjectEvent,
)


class TestSmartFramingEngine:
    def test_aspect_ratio_detection(self):
        # 16:9 widescreen input (1920x1080)
        engine_16_9 = SmartFramingEngine(source_width=1920, source_height=1080)
        assert engine_16_9.is_reframing_needed() is True
        assert engine_16_9.crop_h == 1080
        # 1080 * (9/16) = 607.5 -> rounded to even number 606 or 608
        assert engine_16_9.crop_w in (606, 608)
        assert engine_16_9.max_x_offset == 1920 - engine_16_9.crop_w

        # Native vertical 9:16 input (1080x1920)
        engine_9_16 = SmartFramingEngine(source_width=1080, source_height=1920)
        assert engine_9_16.is_reframing_needed() is False

        # 1:1 square input (1080x1080)
        engine_1_1 = SmartFramingEngine(source_width=1080, source_height=1080)
        assert engine_1_1.is_reframing_needed() is True

    def test_trajectory_smoothing_and_clamping(self):
        engine = SmartFramingEngine(source_width=1920, source_height=1080, ema_alpha=0.15)
        # Presenter walks from far left (x=0.1) to far right (x=0.9)
        subjects = [
            SubjectEvent(timestamp=0.0, bounding_box=BoundingBox(x=0.10, y=0.2, width=0.15, height=0.5)),
            SubjectEvent(timestamp=1.0, bounding_box=BoundingBox(x=0.30, y=0.2, width=0.15, height=0.5)),
            SubjectEvent(timestamp=2.0, bounding_box=BoundingBox(x=0.50, y=0.2, width=0.15, height=0.5)),
            SubjectEvent(timestamp=3.0, bounding_box=BoundingBox(x=0.70, y=0.2, width=0.15, height=0.5)),
            SubjectEvent(timestamp=4.0, bounding_box=BoundingBox(x=0.90, y=0.2, width=0.15, height=0.5)),
        ]

        trajectory = engine.compute_smoothed_trajectory(subjects, video_duration=5.0)
        assert len(trajectory) >= len(subjects)

        for pt in trajectory:
            # All coordinates must be clamped within source boundaries
            assert 0 <= pt["x"] <= engine.max_x_offset
            # Even coordinates for YUV video codecs
            assert pt["x"] % 2 == 0
            assert pt["w"] == engine.crop_w
            assert pt["h"] == engine.crop_h

        # EMA smoothing ensures initial coordinate starts gradually and increases smoothly
        assert trajectory[0]["x"] < trajectory[-1]["x"]

    def test_scene_cut_hard_reset(self):
        engine = SmartFramingEngine(source_width=1920, source_height=1080, ema_alpha=0.10)
        # Shot 1: speaker on left (x=0.2)
        # Shot 2: cut at t=2.0, speaker instantly on right (x=0.8)
        subjects = [
            SubjectEvent(timestamp=0.0, bounding_box=BoundingBox(x=0.2, y=0.2, width=0.2, height=0.5)),
            SubjectEvent(timestamp=1.0, bounding_box=BoundingBox(x=0.2, y=0.2, width=0.2, height=0.5)),
            SubjectEvent(timestamp=2.0, bounding_box=BoundingBox(x=0.8, y=0.2, width=0.2, height=0.5)),
        ]
        scenes = [SceneEvent(timestamp=2.0)]

        trajectory = engine.compute_smoothed_trajectory(subjects, video_duration=3.0, scenes=scenes)
        pt_pre_cut = [p for p in trajectory if p["timestamp"] == 1.0][0]
        pt_post_cut = [p for p in trajectory if p["timestamp"] == 2.0][0]

        # The camera should jump directly to the right without gradual sliding delay
        expected_raw_right = engine.calculate_raw_x_offset(0.8 + 0.1)
        assert abs(pt_post_cut["x"] - expected_raw_right) < 10

    def test_ffmpeg_crop_filter_generation(self):
        engine = SmartFramingEngine(source_width=1920, source_height=1080)
        trajectory = [
            {"timestamp": 0.0, "x": 200, "y": 0, "w": 606, "h": 1080},
            {"timestamp": 2.0, "x": 400, "y": 0, "w": 606, "h": 1080},
        ]
        filter_str = engine.build_ffmpeg_crop_filter(trajectory, video_duration=4.0)
        assert "crop=" in filter_str
        assert "scale=1080:1920" in filter_str


class TestSafeZoneGatekeeper:
    def test_motion_graphics_under_card_docking(self):
        gatekeeper = SafeZoneGatekeeper(canvas_width=1080, canvas_height=1920, mg_card_bottom_px=1440)
        # Motion graphic active from t=2.0 to t=5.0
        placement = gatekeeper.resolve_caption_placement(
            start_time=2.5,
            end_time=3.5,
            active_mg_ranges=[(2.0, 5.0)],
        )
        assert placement.position_tag == "under_graphics"
        assert placement.pos_y == 1440
        assert r"\pos(540,1440)" in placement.ass_prefix

    def test_presenter_bottom_occupied_avoidance(self):
        gatekeeper = SafeZoneGatekeeper(canvas_width=1080, canvas_height=1920, margin_top_px=360)
        comp_segments = [
            CompositionSegment(
                start=0.0,
                end=5.0,
                primary_subject_position="center",
                safe_regions=["top"],
                bottom_region_occupied=True,
            )
        ]
        placement = gatekeeper.resolve_caption_placement(
            start_time=1.0,
            end_time=2.0,
            composition_segments=comp_segments,
        )
        assert placement.position_tag == "top"
        assert placement.pos_y == 360
        assert r"\an8\pos(540,360)" in placement.ass_prefix

    def test_default_clean_bottom_placement(self):
        gatekeeper = SafeZoneGatekeeper(canvas_width=1080, canvas_height=1920, margin_bottom_px=240)
        placement = gatekeeper.resolve_caption_placement(
            start_time=0.0,
            end_time=1.0,
            composition_segments=[
                CompositionSegment(
                    start=0.0,
                    end=3.0,
                    primary_subject_position="center",
                    safe_regions=["bottom", "top"],
                    bottom_region_occupied=False,
                )
            ],
        )
        assert placement.position_tag == "bottom"
        assert placement.pos_y == 1920 - 240
        assert r"\an2\pos(540,1680)" in placement.ass_prefix


class TestSubtitleGeneratorGatekeeperIntegration:
    def test_ass_generator_resolves_gatekeeper_positions(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_ass = os.path.join(temp_dir, "test_kinetic.ass")
            timestamp_map = {
                "chunk_1": {
                    "start": 1.0,
                    "end": 3.0,
                    "text": "Motion graphics active here",
                    "words": [
                        {"word": "Motion", "start": 1.0, "end": 1.5},
                        {"word": "graphics", "start": 1.5, "end": 2.2},
                        {"word": "active", "start": 2.2, "end": 3.0},
                    ],
                },
                "chunk_2": {
                    "start": 4.0,
                    "end": 6.0,
                    "text": "Speaker occupying bottom region",
                    "words": [
                        {"word": "Speaker", "start": 4.0, "end": 4.8},
                        {"word": "occupying", "start": 4.8, "end": 5.4},
                        {"word": "bottom", "start": 5.4, "end": 6.0},
                    ],
                },
            }

            edits = [
                {"action": "motion_graphic", "start": 1.0, "end": 3.0, "layout": {"variant": "card"}},
            ]

            comp_segments = [
                CompositionSegment(
                    start=3.5,
                    end=7.0,
                    primary_subject_position="center",
                    safe_regions=["top"],
                    bottom_region_occupied=True,
                )
            ]

            ok = generate_ass_subtitles(
                timestamp_map=timestamp_map,
                output_ass_path=out_ass,
                edits=edits,
                composition_segments=comp_segments,
                enable_safe_zone_gatekeeper=True,
                play_res_x=1080,
                play_res_y=1920,
            )
            assert ok == out_ass
            assert os.path.exists(out_ass)

            with open(out_ass, "r", encoding="utf-8") as f:
                content = f.read()

            # Chunk 1 overlaps with motion graphics -> anchors beneath card (1440)
            assert r"\pos(540,1440)" in content
            # Chunk 2 overlaps with bottom-occupied segment -> anchors to upper third (\an8)
            assert r"\an8\pos(540,360)" in content

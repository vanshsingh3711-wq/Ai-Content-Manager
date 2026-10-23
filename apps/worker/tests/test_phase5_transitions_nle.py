"""
Unit tests for Phase 5: First-Class Transitions & Boundary Handling in NLE Export & Compositor.
Tests Premiere Pro XML (xmeml 4), Apple FCPXML 1.10, CMX3600 EDL, and FFmpeg xfade filtergraphs.
"""

import os
import tempfile
import xml.etree.ElementTree as ET
import pytest

from services.nle_exporter import (
    generate_premiere_xmeml,
    generate_fcpxml_1_10,
    generate_cmx3600_edl,
    export_nle_project,
    TRANSITION_PRESET_MAP,
)
from services.compositor import (
    FFMPEG_XFADE_MAP,
    build_segment_xfade_filter,
    _build_segment_timeline,
)


@pytest.fixture
def sample_segments():
    return [
        {
            "seg_idx": 0,
            "source_start_f": 0,
            "source_end_f": 150,
            "timeline_start_f": 0,
            "timeline_end_f": 150,
            "timeline_start_s": 0.0,
            "timeline_end_s": 5.0,
            "len_f": 150,
        },
        {
            "seg_idx": 1,
            "source_start_f": 90,
            "source_end_f": 300,
            "timeline_start_f": 150,
            "timeline_end_f": 360,
            "timeline_start_s": 5.0,
            "timeline_end_s": 12.0,
            "len_f": 210,
        },
    ]


@pytest.fixture
def sample_transitions():
    return [
        {
            "from_clip_id": "vid-a",
            "to_clip_id": "vid-b",
            "preset": "crossfade",
            "duration": 0.5,
            "start_f": 142,
            "len_f": 15,
            "alignment": "center",
        },
        {
            "from_clip_id": "vid-b",
            "to_clip_id": "vid-c",
            "preset": "wipe_left",
            "duration": 0.6,
            "start_f": 351,
            "len_f": 18,
            "alignment": "center",
        },
    ]


@pytest.fixture
def sample_meta():
    return {
        "width": 1080,
        "height": 1920,
        "duration": 20.0,
        "fps": 30.0,
        "channels": 2,
        "sample_rate": 48000,
    }


class TestPremiereProXMLTransitions:
    """Verifies Adobe Premiere Pro FCP7 XML (xmeml v4) transition export."""

    def test_premiere_xml_contains_valid_transitionitem(self, sample_segments, sample_transitions, sample_meta):
        xml_str = generate_premiere_xmeml(
            project_name="Phase5_Test",
            width=1080,
            height=1920,
            fps=30.0,
            source_path="/tmp/mock_source.mp4",
            source_meta=sample_meta,
            kept_segments=sample_segments,
            mg_overlays=[],
            broll_clips=[],
            sfx_cues=[],
            markers=[],
            transitions=sample_transitions,
        )

        root = ET.fromstring(xml_str)
        v1_track = root.find(".//video/track")
        assert v1_track is not None

        # Verify transitionitem elements
        trans_items = v1_track.findall("transitionitem")
        assert len(trans_items) == 2

        # Verify first transitionitem (crossfade)
        tr0 = trans_items[0]
        assert tr0.find("rate/timebase") is not None
        assert tr0.find("rate/timebase").text == "30"
        assert tr0.find("start").text == "142"
        assert tr0.find("end").text == str(142 + 15)
        assert tr0.find("alignment").text == "center"

        effect0 = tr0.find("effect")
        assert effect0 is not None
        assert effect0.find("name").text == "Cross Dissolve"
        assert effect0.find("effectid").text == "crossfade"
        assert effect0.find("effectcategory").text == "Dissolve"
        assert effect0.find("effecttype").text == "transition"

        # Verify second transitionitem (wipe_left)
        tr1 = trans_items[1]
        effect1 = tr1.find("effect")
        assert effect1.find("name").text == "Wipe Left"
        assert effect1.find("effectid").text == "wipe_left"
        assert effect1.find("effectcategory").text == "Wipe"


class TestFCPXML110Transitions:
    """Verifies Apple FCPXML 1.10 transition export."""

    def test_fcpxml_registers_effect_resources(self, sample_segments, sample_transitions, sample_meta):
        fcpxml_str = generate_fcpxml_1_10(
            project_name="Phase5_FCPXML_Test",
            width=1080,
            height=1920,
            fps=30.0,
            source_path="/tmp/mock_source.mp4",
            source_meta=sample_meta,
            kept_segments=sample_segments,
            mg_overlays=[],
            broll_clips=[],
            sfx_cues=[],
            markers=[],
            transitions=sample_transitions,
        )

        root = ET.fromstring(fcpxml_str)
        resources = root.find("resources")
        assert resources is not None

        # Verify effect definitions
        effects = resources.findall("effect")
        effect_ids = [e.attrib.get("id") for e in effects]
        assert "r_crossfade" in effect_ids
        assert "r_wipe_left" in effect_ids

    def test_fcpxml_spine_contains_transitions_between_clips(self, sample_segments, sample_transitions, sample_meta):
        fcpxml_str = generate_fcpxml_1_10(
            project_name="Phase5_FCPXML_Test",
            width=1080,
            height=1920,
            fps=30.0,
            source_path="/tmp/mock_source.mp4",
            source_meta=sample_meta,
            kept_segments=sample_segments,
            mg_overlays=[],
            broll_clips=[],
            sfx_cues=[],
            markers=[],
            transitions=sample_transitions,
        )

        root = ET.fromstring(fcpxml_str)
        spine = root.find(".//spine")
        assert spine is not None

        # Transitions should be present on the spine
        transitions_in_spine = spine.findall("transition")
        assert len(transitions_in_spine) == 2

        tr_crossfade = transitions_in_spine[0]
        assert tr_crossfade.attrib.get("name") == "Cross Dissolve"
        assert tr_crossfade.attrib.get("offset") == "142/30s"
        assert tr_crossfade.attrib.get("duration") == "15/30s"

        fx_vid = tr_crossfade.find("filter-video")
        assert fx_vid is not None
        assert fx_vid.attrib.get("ref") == "r_crossfade"


class TestCMX3600EDLTransitions:
    """Verifies CMX3600 EDL transition annotations."""

    def test_edl_includes_transition_comments(self, sample_segments, sample_transitions):
        # Anchor transition to segment cut boundary (frame 150)
        transitions = [
            {
                "preset": "crossfade",
                "duration": 0.5,
                "start_f": 150,
                "len_f": 15,
            }
        ]
        edl = generate_cmx3600_edl(
            project_name="EDL_Transitions",
            source_filename="camera_raw.mp4",
            kept_segments=sample_segments,
            timebase=30,
            transitions=transitions,
        )

        assert "TITLE: EDL_Transitions" in edl
        assert "* TRANSITION: CROSSFADE (15 FRAMES)" in edl


class TestCompositorFFmpegTransitions:
    """Verifies FFmpeg transition filtergraph generation and segment tagging."""

    def test_ffmpeg_xfade_map_covers_canonical_presets(self):
        canonical_presets = [
            "crossfade",
            "fade_to_black",
            "wipe_left",
            "wipe_right",
            "slide_up",
            "zoom_in",
            "whip_pan",
        ]
        for preset in canonical_presets:
            assert preset in FFMPEG_XFADE_MAP
            assert isinstance(FFMPEG_XFADE_MAP[preset], str)

    def test_build_segment_xfade_filter_graph(self):
        filter_str = build_segment_xfade_filter(
            preset="wipe_left",
            duration=0.5,
            offset=4.5,
            has_audio=True,
        )
        assert "xfade=transition=wipeleft:duration=0.500:offset=4.500[vout]" in filter_str
        assert "acrossfade=d=0.500[aout]" in filter_str

    def test_build_segment_xfade_filter_video_only(self):
        filter_str = build_segment_xfade_filter(
            preset="fade_to_black",
            duration=0.6,
            offset=9.4,
            has_audio=False,
        )
        assert "xfade=transition=fadeblack:duration=0.600:offset=9.400[vout]" in filter_str
        assert "acrossfade" not in filter_str

    def test_build_segment_timeline_tags_adjacent_cut_transitions(self):
        edits = [
            {"action": "cut", "start": 5.0, "end": 7.0},
            {"action": "transition", "preset": "crossfade", "duration": 0.5, "start": 5.0},
        ]
        timeline = _build_segment_timeline(edits, {}, total_duration=15.0)
        kept_segs = [s for s in timeline if not s.get("is_cut")]
        assert len(kept_segs) == 2

        # First segment should have transition_out, second should have transition_in
        assert kept_segs[0].get("transition_out") is not None
        assert kept_segs[0]["transition_out"]["preset"] == "crossfade"
        assert kept_segs[1].get("transition_in") is not None
        assert kept_segs[1]["transition_in"]["preset"] == "crossfade"

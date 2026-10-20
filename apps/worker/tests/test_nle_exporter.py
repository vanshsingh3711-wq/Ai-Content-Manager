"""
Unit & Integration Tests for NLE Timeline Exporter (Phase 2)
Tests FCPXML 1.10, Premiere Pro XML (xmeml 4), CMX3600 EDL, SRT subtitles, and CapCut export.
"""

import json
import os
import shutil
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import pytest
from services.nle_exporter import (
    get_frame_rate,
    seconds_to_frames,
    frames_to_seconds,
    format_timecode,
    format_rational_time,
    format_srt_timestamp,
    resolve_kept_segments,
    generate_srt,
    generate_cmx3600_edl,
    generate_premiere_xmeml,
    generate_fcpxml_1_10,
    generate_capcut_markdown,
    export_nle_project,
)


def test_timing_and_timecode_helpers():
    """Verifies precision timecode, frame rate fractions, and timestamp conversions."""
    num, den = get_frame_rate(29.97)
    assert (num, den) == (30000, 1001)

    num, den = get_frame_rate(30.0)
    assert (num, den) == (30, 1)

    assert seconds_to_frames(1.0, 30.0) == 30
    assert seconds_to_frames(1.5, 30.0) == 45
    assert frames_to_seconds(30, 30.0) == 1.0

    # SMPTE timecode (HH:MM:SS:FF)
    assert format_timecode(0, 30) == "00:00:00:00"
    assert format_timecode(45, 30) == "00:00:01:15"
    assert format_timecode(3600 * 30, 30) == "01:00:00:00"

    # FCPXML rational time
    assert format_rational_time(0, (30, 1)) == "0s"
    assert format_rational_time(30, (30, 1)) == "30/30s"

    # SRT timestamp (HH:MM:SS,mmm)
    assert format_srt_timestamp(1.234) == "00:00:01,234"
    assert format_srt_timestamp(65.5) == "00:01:05,500"


def test_resolve_kept_segments():
    """Tests inversion of cuts into non-destructive kept source segments."""
    total_dur = 20.0
    edits = [
        {"action": "cut", "start": 3.0, "end": 5.0},
        {"action": "cut", "start": 10.0, "end": 12.0},
        {"action": "cut", "start": 11.5, "end": 13.0},  # Overlapping cut
    ]

    kept, time_map = resolve_kept_segments(total_dur, edits, fps=30.0)
    # Expected kept intervals: [0.0 - 3.0], [5.0 - 10.0], [13.0 - 20.0]
    assert len(kept) == 3

    assert kept[0]["source_start"] == 0.0
    assert kept[0]["source_end"] == 3.0
    assert kept[0]["timeline_start"] == 0.0
    assert kept[0]["timeline_end"] == 3.0

    assert kept[1]["source_start"] == 5.0
    assert kept[1]["source_end"] == 10.0
    assert kept[1]["timeline_start"] == 3.0
    assert kept[1]["timeline_end"] == 8.0

    assert kept[2]["source_start"] == 13.0
    assert kept[2]["source_end"] == 20.0
    assert kept[2]["timeline_start"] == 8.0
    assert kept[2]["timeline_end"] == 15.0

    # Test time mapping function
    assert time_map(1.5) == 1.5
    assert time_map(4.0) is None  # inside cut
    assert time_map(6.0) == 4.0   # 3.0 + (6.0 - 5.0)
    assert time_map(14.0) == 9.0  # 8.0 + (14.0 - 13.0)


def test_generate_srt():
    """Tests standard SubRip SRT formatting."""
    subtitles = [
        {"start_s": 0.5, "end_s": 2.1, "text": "Welcome to the video."},
        {"start_s": 2.3, "end_s": 4.0, "text": "Here is an incredible metric."},
    ]
    srt = generate_srt(subtitles)
    assert "1\n00:00:00,500 --> 00:00:02,100\nWelcome to the video." in srt
    assert "2\n00:00:02,300 --> 00:00:04,000\nHere is an incredible metric." in srt


def test_generate_cmx3600_edl():
    """Tests CMX3600 standard EDL output."""
    kept = [
        {
            "seg_idx": 0,
            "source_start_f": 0,
            "source_end_f": 90,
            "timeline_start_f": 0,
            "timeline_end_f": 90,
        },
        {
            "seg_idx": 1,
            "source_start_f": 150,
            "source_end_f": 300,
            "timeline_start_f": 90,
            "timeline_end_f": 240,
        },
    ]
    edl = generate_cmx3600_edl("My_Edit", "camera_raw.mp4", kept, timebase=30)
    assert "TITLE: My_Edit" in edl
    assert "FCM: NON-DROP FRAME" in edl
    assert "001  AX       V     C        00:00:00:00 00:00:03:00 00:00:00:00 00:00:03:00" in edl
    assert "* FROM CLIP NAME: camera_raw.mp4" in edl
    assert "002  AX       V     C        00:00:05:00 00:00:10:00 00:00:03:00 00:00:08:00" in edl


def test_generate_premiere_xmeml_valid_xml():
    """Tests Adobe Premiere Pro FCP7 XML (xmeml version 4) generation and XML validity."""
    meta = {
        "duration": 15.0,
        "width": 1080,
        "height": 1920,
        "fps": 30.0,
        "channels": 2,
        "sample_rate": 48000,
    }
    kept = [
        {
            "seg_idx": 0,
            "source_start_f": 0,
            "source_end_f": 90,
            "timeline_start_f": 0,
            "timeline_end_f": 90,
            "len_f": 90,
        }
    ]
    mg = [{
        "i": 1,
        "name": "MG: cooked_likes",
        "start_f": 30,
        "len_f": 45,
        "path": "/tmp/mg_01.mov",
    }]
    broll = [{
        "i": 1,
        "name": "B-Roll: tech office",
        "start_f": 40,
        "len_f": 50,
        "path": "/tmp/broll_01.mp4",
    }]
    sfx = [{
        "i": 1,
        "name": "SFX: hit",
        "start_f": 30,
        "len_f": 20,
        "path": "/tmp/sfx_01.wav",
        "channels": 2,
    }]
    markers = [{"start_f": 30, "text": "Big Reveal"}]

    xml_text = generate_premiere_xmeml(
        project_name="Test_Project",
        width=1080,
        height=1920,
        fps=30.0,
        source_path="/media/raw.mp4",
        source_meta=meta,
        kept_segments=kept,
        mg_overlays=mg,
        broll_clips=broll,
        sfx_cues=sfx,
        markers=markers,
    )

    # Must parse cleanly without syntax errors
    root = ET.fromstring(xml_text)
    assert root.tag == "xmeml"
    assert root.attrib.get("version") == "4"

    seq = root.find("sequence")
    assert seq is not None
    assert seq.find("name").text == "Test_Project"

    # Verify tracks
    v_tracks = seq.findall(".//video/track")
    assert len(v_tracks) == 3  # V1: Raw, V2: MG, V3: B-Roll

    a_tracks = seq.findall(".//audio/track")
    assert len(a_tracks) == 2  # A1: Dialog, A2: SFX

    marker = seq.find("marker")
    assert marker is not None
    assert marker.find("name").text == "Big Reveal"


def test_generate_fcpxml_1_10_valid_xml():
    """Tests DaVinci Resolve & FCPX FCPXML 1.10 generation and XML validity."""
    meta = {
        "duration": 10.0,
        "width": 1080,
        "height": 1920,
        "fps": 30.0,
        "channels": 2,
        "sample_rate": 48000,
    }
    kept = [
        {
            "seg_idx": 0,
            "source_start_f": 0,
            "source_end_f": 90,
            "timeline_start_f": 0,
            "timeline_end_f": 90,
            "len_f": 90,
        }
    ]
    mg = [{
        "i": 1,
        "name": "MG: hero_reveal",
        "start_f": 15,
        "len_f": 45,
        "path": "/tmp/mg_01.mov",
    }]
    sfx = [{
        "i": 1,
        "name": "SFX: pop",
        "start_f": 15,
        "len_f": 15,
        "path": "/tmp/sfx_01.wav",
        "channels": 2,
    }]
    markers = [{"start_f": 15, "text": "Card Entrance"}]
    subtitles = [{"start_f": 10, "len_f": 30, "text": "Hello world"}]

    fcpxml_text = generate_fcpxml_1_10(
        project_name="Resolve_Project",
        width=1080,
        height=1920,
        fps=30.0,
        source_path="/media/raw.mp4",
        source_meta=meta,
        kept_segments=kept,
        mg_overlays=mg,
        broll_clips=[],
        sfx_cues=sfx,
        markers=markers,
        subtitles=subtitles,
    )

    root = ET.fromstring(fcpxml_text)
    assert root.tag == "fcpxml"
    assert root.attrib.get("version") == "1.10"

    # Resources check
    res = root.find("resources")
    assert res is not None
    assets = res.findall("asset")
    assert len(assets) >= 2  # raw video + sfx + mg

    # Sequence spine check
    spine = root.find(".//spine")
    assert spine is not None
    asset_clips = spine.findall("asset-clip")
    assert len(asset_clips) == 1  # 1 primary raw clip


def test_export_nle_project_e2e(tmp_path):
    """Full end-to-end test creating the export directory, XMLs, media assets, and zip package."""
    # Create mock raw media file
    raw_file = tmp_path / "raw.mp4"
    raw_file.write_bytes(b"\x00" * 1024)

    # Sample edit decisions
    edits = [
        {"action": "cut", "start": 1.0, "end": 2.0},
        {"action": "motion_graphics", "motion_graphics_type": "cooked_likes", "motion_graphics_text": "Subscribers", "start": 2.5, "end": 4.0},
        {"action": "sfx", "sound_effect": "hit", "start": 2.5},
        {"action": "b_roll", "broll_query": "ai tech", "start": 4.5, "end": 6.0},
    ]

    timestamp_map = {
        "chunk_1": {"start": 0.0, "end": 1.0, "text": "Welcome to our channel."},
        "chunk_2": {"start": 2.2, "end": 4.2, "text": "Look at these results."},
        "chunk_3": {"start": 4.3, "end": 6.0, "text": "The growth is insane."},
    }

    export_dir = tmp_path / "test_export"
    result = export_nle_project(
        output_dir=str(export_dir),
        project_name="Growth_Video",
        raw_video_path=str(raw_file),
        edits=edits,
        timestamp_map=timestamp_map,
        settings={"fps": 30.0, "width": 1080, "height": 1920},
        create_zip=True,
    )

    assert result["status"] == "success"
    assert os.path.exists(result["files"]["fcpxml"])
    assert os.path.exists(result["files"]["premiere_xml"])
    assert os.path.exists(result["files"]["edl"])
    assert os.path.exists(result["files"]["srt"])
    assert os.path.exists(result["files"]["capcut_md"])
    assert result["zip_path"] is not None
    assert os.path.exists(result["zip_path"])

    # Verify zip archive content
    with zipfile.ZipFile(result["zip_path"], "r") as zf:
        namelist = zf.namelist()
        assert any("Growth_Video.fcpxml" in name for name in namelist)
        assert any("Growth_Video.xml" in name for name in namelist)
        assert any("Growth_Video.edl" in name for name in namelist)
        assert any("Growth_Video.srt" in name for name in namelist)
        assert any("CAPCUT.md" in name for name in namelist)

    assert result["stats"]["motion_graphics_count"] == 1
    assert result["stats"]["broll_count"] == 1
    assert result["stats"]["sfx_count"] == 1


def test_transition_export_fcpxml_and_premiere_xml(tmp_path):
    """Verifies that transitions are written into both Premiere Pro xmeml and FCPXML 1.10."""
    raw_file = tmp_path / "raw.mp4"
    raw_file.write_bytes(b"\x00" * 1024)

    edits = [
        {"action": "cut", "start": 3.0, "end": 4.0},
        {
            "action": "add_transition",
            "preset": "crossfade",
            "start": 3.0,
            "duration": 0.5,
            "from_clip_id": "c1",
            "to_clip_id": "c2",
            "alignment": "center",
        },
    ]

    export_dir = tmp_path / "trans_export"
    result = export_nle_project(
        output_dir=str(export_dir),
        project_name="Transition_Test",
        raw_video_path=str(raw_file),
        edits=edits,
        timestamp_map={},
        settings={"fps": 30.0, "width": 1080, "height": 1920},
        create_zip=False,
    )

    # 1. Check Premiere XML contains <transitionitem>
    premiere_xml = Path(result["files"]["premiere_xml"]).read_text(encoding="utf-8")
    assert "<transitionitem>" in premiere_xml
    assert "<effectid>crossfade</effectid>" in premiere_xml
    assert "<mediatype>video</mediatype>" in premiere_xml

    # 2. Check FCPXML contains <transition> and <filter-video>
    fcpxml = Path(result["files"]["fcpxml"]).read_text(encoding="utf-8")
    assert "<transition" in fcpxml
    assert 'name="Crossfade"' in fcpxml or 'name="Cross Dissolve"' in fcpxml
    assert '<filter-video ref="r_crossfade"' in fcpxml


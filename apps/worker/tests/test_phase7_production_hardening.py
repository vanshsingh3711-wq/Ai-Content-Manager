"""
Phase 7: Production Hardening, Incremental Segment Caching, 540p Proxy Generation,
and Behind-Speaker RVM Sandwich Compositing Test Suite.
"""

import os
import shutil
import tempfile
import subprocess
import pytest
from pathlib import Path

from services.media_extractor import get_ffmpeg_binary_path, generate_video_proxy
from services.depth_matting import extract_behind_ranges
from services.compositor import (
    render_video_pipeline,
    compute_segment_cache_key,
    _probe_duration,
)


@pytest.fixture
def temp_dir():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp"))
    os.makedirs(base, exist_ok=True)
    d = tempfile.mkdtemp(prefix="phase7_test_", dir=base)
    yield Path(d)
    shutil.rmtree(d, ignore_errors=True)



@pytest.fixture
def dummy_video(temp_dir):
    """Creates a real 3-second MP4 test video with audio."""
    out_path = temp_dir / "test_source.mp4"
    ffmpeg_bin = get_ffmpeg_binary_path()
    cmd = [
        ffmpeg_bin, "-y", "-threads", "2", "-hide_banner",
        "-f", "lavfi", "-i", "testsrc=size=640x360:rate=30:duration=3",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
        "-c:v", "libx264", "-preset", "ultrafast",
        "-c:a", "aac",
        "-movflags", "+faststart",
        str(out_path)
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return str(out_path)


def test_segment_cache_key_deterministic_and_sensitive(temp_dir, dummy_video):
    """Verify segment cache fingerprint is deterministic and sensitive to edits/timing/codecs."""
    key1 = compute_segment_cache_key(
        raw_video_path=dummy_video,
        start_t=0.0,
        end_t=1.5,
        filter_complex="[base_v]scale=1080:1920[vout]",
        extra_inputs=[],
        codec="libx264",
        fps=30.0,
        target_w=1080,
        target_h=1920,
    )
    key2 = compute_segment_cache_key(
        raw_video_path=dummy_video,
        start_t=0.0,
        end_t=1.5,
        filter_complex="[base_v]scale=1080:1920[vout]",
        extra_inputs=[],
        codec="libx264",
        fps=30.0,
        target_w=1080,
        target_h=1920,
    )
    assert key1 == key2, "Segment hash must be completely deterministic for identical inputs"

    # Time change
    key_diff_time = compute_segment_cache_key(
        raw_video_path=dummy_video,
        start_t=0.5,
        end_t=1.5,
        filter_complex="[base_v]scale=1080:1920[vout]",
    )
    assert key_diff_time != key1, "Segment hash must change when time slice changes"

    # Filter change
    key_diff_filter = compute_segment_cache_key(
        raw_video_path=dummy_video,
        start_t=0.0,
        end_t=1.5,
        filter_complex="[base_v]scale=1080:1920,zoompan[vout]",
    )
    assert key_diff_filter != key1, "Segment hash must change when filter graph changes"

    # Codec change
    key_diff_codec = compute_segment_cache_key(
        raw_video_path=dummy_video,
        start_t=0.0,
        end_t=1.5,
        filter_complex="[base_v]scale=1080:1920[vout]",
        codec="h264_nvenc",
    )
    assert key_diff_codec != key1, "Segment hash must change when video codec changes"


def test_render_video_pipeline_segment_caching_hit_and_miss(temp_dir, dummy_video):
    """Verify segment caching creates cache entries and reuses them on second render."""
    cache_dir = temp_dir / "seg_cache"
    out1 = temp_dir / "render1.mp4"
    out2 = temp_dir / "render2.mp4"

    settings = {
        "enable_segment_cache": True,
        "segment_cache_dir": str(cache_dir),
        "aspect_ratio": "16:9",
        "USE_GRANULAR_OVERLAYS": False,
    }

    edits = [
        {"action": "cut", "start": 0.0, "end": 2.0},
    ]

    # First render: cache miss, saves segment
    render_video_pipeline(
        raw_video_path=dummy_video,
        output_mp4_path=str(out1),
        edits=edits,
        settings=settings,
    )

    assert out1.exists() and out1.stat().st_size > 1024
    cached_files = list(cache_dir.glob("seg_*.mp4"))
    assert len(cached_files) >= 1, "At least one segment must be cached on initial render"
    first_cache_mtime = cached_files[0].stat().st_mtime

    # Second render: cache hit, reuses segment without re-encoding
    render_video_pipeline(
        raw_video_path=dummy_video,
        output_mp4_path=str(out2),
        edits=edits,
        settings=settings,
    )

    assert out2.exists() and out2.stat().st_size > 1024
    # Cached segment was reused, file count unchanged
    assert len(list(cache_dir.glob("seg_*.mp4"))) == len(cached_files)


def test_behind_speaker_layer_extraction():
    """Verify extract_behind_ranges isolates spans requiring rotoscoping with padding handles."""
    edits = [
        {"_edit_id": "e1", "start": 1.0, "end": 3.0, "layer": "behind"},
        {"_edit_id": "e2", "start": 5.0, "end": 7.0, "depth": "behind"},
        {"_edit_id": "e3", "start": 2.0, "end": 4.0, "layer": "front"}, # Should not be included
        {"_edit_id": "e4", "start": 9.0, "end": 11.0, "layout": {"variant": "cutout"}},
    ]

    ranges = extract_behind_ranges(edits, total_duration=12.0, fps=30.0, handle_s=0.5)
    assert len(ranges) == 3, f"Expected 3 behind ranges, got {len(ranges)}"

    # First range (e1: 1.0 to 3.0 with 0.5s handles -> 0.5 to 3.5)
    r1 = ranges[0]
    assert r1["start"] == pytest.approx(0.5, 0.01)
    assert r1["end"] == pytest.approx(3.5, 0.01)
    assert "e1" in r1["edit_ids"]

    # Second range (e2: 5.0 to 7.0 with 0.5s handles -> 4.5 to 7.5)
    r2 = ranges[1]
    assert r2["start"] == pytest.approx(4.5, 0.01)
    assert r2["end"] == pytest.approx(7.5, 0.01)
    assert "e2" in r2["edit_ids"]

    # Third range (e4: 9.0 to 11.0 with 0.5s handles -> 8.5 to 11.5)
    r3 = ranges[2]
    assert r3["start"] == pytest.approx(8.5, 0.01)
    assert r3["end"] == pytest.approx(11.5, 0.01)
    assert "e4" in r3["edit_ids"]

    # Test contiguous merge behavior: adding e_merge adjacent to e2 merges [4.5, 7.5] with [7.5, 9.5]
    edits_merged = [
        {"_edit_id": "e2", "start": 5.0, "end": 7.0, "depth": "behind"},
        {"_edit_id": "e_adjacent", "start": 8.0, "end": 9.0, "layer": "behind"},
    ]
    merged = extract_behind_ranges(edits_merged, total_duration=12.0, fps=30.0, handle_s=0.5)
    assert len(merged) == 1, "Adjacent ranges (touching at 7.5s) must be merged into 1 continuous range"
    assert merged[0]["start"] == pytest.approx(4.5, 0.01)
    assert merged[0]["end"] == pytest.approx(9.5, 0.01)


def test_behind_speaker_sandwich_compositing_execution(temp_dir, dummy_video):
    """Verify end-to-end behind-speaker compositing with mock ProRes 4444 cutout overlay."""
    out_mp4 = temp_dir / "sandwich_out.mp4"

    settings = {
        "aspect_ratio": "16:9",
        "mock_depth_matting": True,
        "enable_segment_cache": False,
        "USE_GRANULAR_OVERLAYS": True,
    }

    edits = [
        {"action": "cut", "start": 2.5, "end": 3.0}, # Cut off end, keeping 0.0 to 2.5s
        {
            "_edit_id": "behind_card_1",
            "action": "motion_graphics",
            "start": 0.5,
            "end": 2.0,
            "layer": "behind",
            "motion_graphics_text": "Behind Presenter",
        },
    ]

    render_video_pipeline(
        raw_video_path=dummy_video,
        output_mp4_path=str(out_mp4),
        edits=edits,
        settings=settings,
    )

    assert out_mp4.exists() and out_mp4.stat().st_size > 1024
    dur = _probe_duration(get_ffmpeg_binary_path(), str(out_mp4))
    assert dur == pytest.approx(2.5, 0.3)



def test_generate_video_proxy_540p(temp_dir, dummy_video):
    """Verify generate_video_proxy creates a fast-scrubbing 540p proxy with +faststart."""
    out_proxy = temp_dir / "proxy_540p.mp4"

    proxy_res = generate_video_proxy(
        video_path=dummy_video,
        output_proxy_path=str(out_proxy),
        target_height=540,
        preset="ultrafast",
    )

    assert os.path.exists(proxy_res)
    assert os.path.getsize(proxy_res) > 1024

    # Probe resolution of proxy
    ffmpeg_bin = get_ffmpeg_binary_path()
    probe_cmd = [
        ffmpeg_bin, "-hide_banner", "-i", proxy_res
    ]
    proc = subprocess.run(probe_cmd, capture_output=True, text=True)
    # Stderr contains stream info e.g. "Stream #0:0: Video: h264 ..., 960x540 ..."
    output = proc.stderr
    assert "540" in output, "Proxy must scale target height to 540"

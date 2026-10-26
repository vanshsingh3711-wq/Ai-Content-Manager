"""
Unit and integration tests for Studio Depth Matting (Subject Rotoscoping / RVM).
"""

import os
import shutil
import tempfile
import numpy as np
import pytest
from pathlib import Path

from services.depth_matting import (
    extract_behind_ranges,
    stabilise_temporal_alpha,
    refine_matte_edge,
    _fill,
    get_model_path,
    is_depth_matting_available,
    HANDLE_S,
    WARM_S,
)


def test_extract_behind_ranges_empty():
    """Returns empty list when no behind cards are present."""
    edits = [
        {"action": "motion_graphics", "start": 1.0, "end": 3.0, "layer": "front"},
        {"action": "b_roll", "start": 4.0, "end": 6.0},
    ]
    res = extract_behind_ranges(edits, total_duration=10.0)
    assert res == []


def test_extract_behind_ranges_single_card():
    """Extracts a single behind card and adds handles."""
    edits = [
        {"action": "motion_graphics", "start": 2.0, "end": 4.0, "layer": "behind", "_edit_id": "mg1"}
    ]
    res = extract_behind_ranges(edits, total_duration=10.0, fps=30.0, handle_s=0.5)
    assert len(res) == 1
    # 2.0 - 0.5 = 1.5s, 4.0 + 0.5 = 4.5s
    assert res[0]["start"] == 1.5
    assert res[0]["end"] == 4.5
    assert res[0]["start_frame"] == 45
    assert res[0]["end_frame"] == 135
    assert res[0]["edit_ids"] == ["mg1"]


def test_extract_behind_ranges_merged_overlapping():
    """Merges overlapping or nearby behind cards into a single continuous cutout range."""
    edits = [
        {"action": "motion_graphics", "start": 1.0, "end": 2.5, "layer": "behind", "_edit_id": "c1"},
        {"action": "motion_graphics", "start": 2.8, "end": 4.0, "layer": "behind", "_edit_id": "c2"},
    ]
    # With 0.5s handle:
    # c1: [0.5, 3.0]
    # c2: [2.3, 4.5]
    # They overlap between 2.3 and 3.0, so they should merge to [0.5, 4.5]
    res = extract_behind_ranges(edits, total_duration=10.0, fps=30.0, handle_s=0.5)
    assert len(res) == 1
    assert res[0]["start"] == 0.5
    assert res[0]["end"] == 4.5
    assert res[0]["start_frame"] == 15
    assert res[0]["end_frame"] == 135
    assert "c1" in res[0]["edit_ids"]
    assert "c2" in res[0]["edit_ids"]


def test_extract_behind_ranges_distinct_separated():
    """Keeps distinct, non-overlapping ranges separate."""
    edits = [
        {"action": "motion_graphics", "start": 1.0, "end": 2.0, "layer": "behind", "_edit_id": "c1"},
        {"action": "motion_graphics", "start": 7.0, "end": 8.0, "depth": "behind", "_edit_id": "c2"},
    ]
    # c1: [0.5, 2.5]
    # c2: [6.5, 8.5]
    res = extract_behind_ranges(edits, total_duration=10.0, fps=30.0, handle_s=0.5)
    assert len(res) == 2
    assert res[0]["start"] == 0.5
    assert res[0]["end"] == 2.5
    assert res[1]["start"] == 6.5
    assert res[1]["end"] == 8.5


def test_extract_behind_ranges_clamped_boundaries():
    """Clamps range starts to 0.0 and ends to total_duration."""
    edits = [
        {"action": "motion_graphics", "start": 0.2, "end": 9.9, "layer": "behind"}
    ]
    res = extract_behind_ranges(edits, total_duration=10.0, fps=30.0, handle_s=0.5)
    assert len(res) == 1
    assert res[0]["start"] == 0.0
    assert res[0]["end"] == 10.0


def test_extract_behind_ranges_with_timestamp_map():
    """Correctly resolves trigger_id from timestamp_map."""
    ts_map = {
        "chunk_1": {"start": 3.0, "end": 5.0}
    }
    edits = [
        {"action": "motion_graphics", "trigger_id": "chunk_1", "layer": "behind"}
    ]
    res = extract_behind_ranges(edits, timestamp_map=ts_map, total_duration=10.0, handle_s=0.5)
    assert len(res) == 1
    assert res[0]["start"] == 2.5
    assert res[0]["end"] == 5.5


def test_stabilise_temporal_alpha():
    """
    Verifies that still pixels take the temporal median across frames,
    while moving pixels keep their current frame alpha.
    """
    import cv2
    h, w = 10, 10
    # Create 5 identical frames (still pixel scenario)
    cams = [np.full((h, w, 3), 128, dtype=np.uint8) for _ in range(5)]
    # Alpha values at center pixel across frames: 0.2, 0.9, 0.1, 0.8, 0.85
    # Median is 0.8
    alphas = [np.full((h, w), val, dtype=np.float32) for val in (0.2, 0.9, 0.1, 0.8, 0.85)]

    still_res = stabilise_temporal_alpha(cams, alphas, center_idx=2, cv2=cv2, np=np)
    # Edge pixel (alpha between 0.01 and 0.99) should equal median 0.8
    assert abs(still_res[5, 5] - 0.8) < 1e-5

    # Now make center frame moving by drastically changing RGB at center frame
    cams[2] = np.full((h, w, 3), 240, dtype=np.uint8)
    moving_res = stabilise_temporal_alpha(cams, alphas, center_idx=2, cv2=cv2, np=np)
    # Moving pixel retains its own frame alpha (alphas[2] was 0.1)
    assert abs(moving_res[5, 5] - 0.1) < 1e-5


def test_refine_matte_edge_unmixing():
    """
    Verifies that wall background color bleed is subtracted from edge pixels,
    and firm alpha is produced on foreground regions.
    """
    import cv2
    h, w = 40, 40
    yy, xx = np.mgrid[:h, :w]
    d = np.hypot(yy - 20, xx - 20)
    # Circular alpha mask: 1.0 inside (r < 10), transition (10 <= r <= 16), 0.0 outside
    alpha = np.clip((16.0 - d) / 6.0, 0.0, 1.0).astype(np.float32)

    # Orange foreground (230, 120, 40), Grey wall (128, 128, 128)
    fg = np.array([230, 120, 40], np.float32)
    wall = np.array([128, 128, 128], np.float32)
    cam = (alpha[..., None] * fg + (1.0 - alpha[..., None]) * wall).astype(np.uint8)

    rgb, ref_alpha = refine_matte_edge(cam, alpha, cv2=cv2, np=np)

    # Center is solid foreground
    assert ref_alpha[20, 20] > 0.95
    # Outer corners are zero background
    assert ref_alpha[0, 0] == 0.0

    # Unmixed edge colors should closely match original orange foreground
    edge_ring = (alpha > 0.3) & (alpha < 0.7)
    mean_err = np.abs(rgb[edge_ring] - fg).max(axis=-1).mean()
    assert mean_err < 15.0


def test_fill_background():
    """Tests the inpainting blur fill helper."""
    import cv2
    img = np.full((32, 32, 3), 100, dtype=np.float32)
    mask = np.zeros((32, 32), dtype=np.float32)
    mask[10:20, 10:20] = 1.0  # masked area

    filled = _fill(img, mask, cv2, np)
    assert filled.shape == (32, 32, 3)
    assert not np.isnan(filled).any()


def test_is_depth_matting_available():
    """Verifies that the RVM model is recognized and available."""
    from services.depth_matting import ensure_model_downloaded
    ensure_model_downloaded()
    assert is_depth_matting_available() is True
    assert get_model_path().exists()
    assert get_model_path().stat().st_size > 10 * 1024 * 1024


def test_rvm_onnx_inference():
    """Verifies live ONNX inference with recurrent states on RVM MobileNetV3."""
    import onnxruntime as ort
    from services.depth_matting import ensure_model_downloaded
    ensure_model_downloaded()
    model_path = str(get_model_path())
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])

    h, w = 128, 128
    dummy_frame = np.random.rand(1, 3, h, w).astype(np.float32)
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    ratio = np.array([0.25], np.float32)

    outputs = sess.run(
        None,
        {
            "src": dummy_frame,
            "r1i": rec[0],
            "r2i": rec[1],
            "r3i": rec[2],
            "r4i": rec[3],
            "downsample_ratio": ratio,
        }
    )
    # Output signature: fgr, pha, r1o, r2o, r3o, r4o
    fgr, pha, *rec_out = outputs
    assert fgr.shape == (1, 3, h, w)
    assert pha.shape == (1, 1, h, w)
    assert len(rec_out) == 4
    assert pha.min() >= 0.0 and pha.max() <= 1.0


def test_cut_range_to_prores_pipeline(tmp_path):
    """End-to-end integration test: takes a video take, mats a range to ProRes 4444 .mov."""
    import subprocess
    from services.depth_matting import cut_range_to_prores

    # Generate a small 0.5s 128x128 test video take with FFmpeg
    video_path = tmp_path / "test_take.mp4"
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "lavfi",
        "-i", "testsrc=duration=0.5:size=128x128:rate=30",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        str(video_path)
    ]
    subprocess.run(cmd, check=True)

    out_mov = tmp_path / "cutout.mov"
    stats = cut_range_to_prores(
        video_path=str(video_path),
        start_s=0.1,
        end_s=0.4,
        output_mov_path=str(out_mov),
        fps=30.0,
        width=128,
        height=128
    )

    assert out_mov.exists()
    assert out_mov.stat().st_size > 500
    assert stats["frames"] > 0
    assert stats["wall_s"] > 0


def test_cut_range_to_png_sequence_pipeline(tmp_path):
    """End-to-end integration test: takes a video take, mats a range to PNG frame sequence."""
    import subprocess
    import cv2
    from services.depth_matting import cut_range_to_png_sequence

    video_path = tmp_path / "test_take_png.mp4"
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "lavfi",
        "-i", "testsrc=duration=0.5:size=128x128:rate=30",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        str(video_path)
    ]
    subprocess.run(cmd, check=True)

    out_dir = tmp_path / "png_cutout"
    stats = cut_range_to_png_sequence(
        video_path=str(video_path),
        start_s=0.1,
        end_s=0.3,
        output_dir=str(out_dir),
        fps=30.0,
        width=128,
        height=128
    )

    assert out_dir.exists()
    png_files = list(out_dir.glob("*.png"))
    assert len(png_files) == stats["frames"]
    assert stats["frames"] > 0

    # Verify PNG has 4 channels (RGBA)
    first_png = cv2.imread(str(png_files[0]), cv2.IMREAD_UNCHANGED)
    assert first_png.shape == (128, 128, 4)


def test_compositor_behind_layer_e2e(tmp_path):
    """
    Verifies that compositor renders an edit with layer: behind using depth matting,
    producing an output video with the sandwich compositing stack.
    """
    import subprocess
    from services.compositor import render_video_pipeline, _probe_streams, get_ffmpeg_binary_path

    ffmpeg_bin = get_ffmpeg_binary_path()
    input_mp4 = str(tmp_path / "camera_take.mp4")
    output_mp4 = str(tmp_path / "final_behind.mp4")

    # Generate 1.0s camera take with testsrc
    cmd_gen = [
        ffmpeg_bin, "-y", "-v", "error",
        "-f", "lavfi", "-i", "testsrc=duration=1.0:size=240x320:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=1.0",
        "-c:v", "libx264", "-c:a", "aac",
        "-shortest", "-pix_fmt", "yuv420p",
        input_mp4
    ]
    subprocess.run(cmd_gen, check=True)

    timestamp_map = {
        "chunk_1": {"start": 0.0, "end": 1.0, "text": "Behind motion graphics card test"}
    }
    edits = [
        {
            "action": "motion_graphics",
            "trigger_id": "chunk_1",
            "start": 0.1,
            "end": 0.8,
            "motion_graphics_type": "hero_reveal",
            "motion_graphics_targets": {"title": "Behind Card"},
            "layer": "behind",
        }
    ]

    final_video = render_video_pipeline(
        raw_video_path=input_mp4,
        output_mp4_path=output_mp4,
        edits=edits,
        timestamp_map=timestamp_map,
        settings={"USE_GRANULAR_OVERLAYS": True, "target_width": 240, "target_height": 320}
    )

    assert os.path.exists(final_video)
    assert os.path.getsize(final_video) > 2000
    streams = _probe_streams(ffmpeg_bin, final_video)
    assert streams["has_video"]
    assert streams["has_audio"]
    assert streams["video_duration"] >= 0.8



import os
import shutil
import subprocess
import tempfile
import pytest
from services.compositor import prepare_ffmpeg_command, get_ffmpeg_binary_path


def test_prepare_ffmpeg_command_places_threads_before_output():
    cmd = [
        "ffmpeg", "-y",
        "-ss", "0.0", "-t", "5.0",
        "-i", "input.mp4",
        "-c:v", "libx264", "-crf", "23",
        "output.mp4"
    ]
    prepared = prepare_ffmpeg_command(cmd, threads=2)

    # Global option
    assert prepared[1] == "-hide_banner"

    # Destination output file must remain the very last argument
    assert prepared[-1] == "output.mp4"

    # -threads 2 must directly precede the output file
    assert prepared[-3] == "-threads"
    assert prepared[-2] == "2"

    # Verify -threads is NOT placed before -i input.mp4
    input_idx = prepared.index("-i")
    assert "-threads" not in prepared[:input_idx]


def test_prepare_ffmpeg_command_multiple_inputs():
    cmd = [
        "ffmpeg", "-y",
        "-i", "background.mp4",
        "-i", "broll.mp4",
        "-i", "watermark.png",
        "-filter_complex", "[0:v][1:v]overlay[v]",
        "-map", "[v]",
        "-c:v", "libx264",
        "composite.mp4"
    ]
    prepared = prepare_ffmpeg_command(cmd, threads=3)

    assert prepared[-1] == "composite.mp4"
    assert prepared[-3] == "-threads"
    assert prepared[-2] == "3"

    # Make sure inputs are consecutive and not polluted with premature thread flags
    assert prepared[prepared.index("background.mp4") + 1] == "-i"


def test_prepare_ffmpeg_command_preserves_existing_threads():
    cmd = [
        "ffmpeg", "-y",
        "-i", "input.mp4",
        "-c:v", "libx264",
        "-threads", "4",
        "output.mp4"
    ]
    prepared = prepare_ffmpeg_command(cmd, threads=2)

    # Should NOT append another -threads 2
    assert prepared.count("-threads") == 1
    idx = prepared.index("-threads")
    assert prepared[idx + 1] == "4"


def test_prepare_ffmpeg_command_preserves_per_stream_threads():
    cmd = [
        "ffmpeg", "-y",
        "-i", "input.mp4",
        "-threads:v", "1",
        "output.mp4"
    ]
    prepared = prepare_ffmpeg_command(cmd, threads=2)
    assert "-threads" not in prepared
    assert "-threads:v" in prepared


def test_ffmpeg_integration_encoder_thread_constrainment(tmp_path):
    """
    Integration test: Runs actual FFmpeg on a synthetic 0.5s fixture
    and verifies libx264 receives threads=2 in output configuration.
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    if not shutil.which(ffmpeg_bin):
        pytest.skip("FFmpeg binary not available on system")

    out_file = str(tmp_path / "test_out.mp4")
    raw_cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "color=c=blue:s=160x120:d=0.5:r=25",
        "-c:v", "libx264", "-preset", "ultrafast",
        out_file
    ]

    final_cmd = prepare_ffmpeg_command(raw_cmd, threads=2)
    res = subprocess.run(final_cmd, capture_output=True, text=True)

    assert res.returncode == 0, f"FFmpeg execution failed: {res.stderr}"
    assert os.path.exists(out_file)
    assert os.path.getsize(out_file) > 500

    # Inspect x264 banner options in stderr
    stderr = res.stderr or ""
    if "threads=" in stderr:
        assert "threads=2" in stderr, f"Expected threads=2 in libx264 options, got:\n{stderr}"

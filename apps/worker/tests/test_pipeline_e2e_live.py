import os
import sys
import subprocess
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.compositor import render_video_pipeline, _probe_duration, _probe_streams, get_ffmpeg_binary_path


def test_live_compositor_e2e_render():
    """
    Live end-to-end rendering smoke test:
    - Creates a 6-second video with audio
    - Applies dynamic zoompan easing (Phase 4)
    - Applies local SFX audio mixing (Phase 4)
    - Renders via FFmpeg
    - Probes output streams and validates A/V synchronization
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    with tempfile.TemporaryDirectory() as temp_dir:
        input_mp4 = os.path.join(temp_dir, "input_test.mp4")
        output_mp4 = os.path.join(temp_dir, "output_rendered.mp4")

        # 1. Generate 6s test video with audio
        cmd_gen = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=6:size=1080x1920:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
            "-c:v", "libx264", "-c:a", "aac",
            "-shortest", "-pix_fmt", "yuv420p",
            input_mp4
        ]
        res = subprocess.run(cmd_gen, capture_output=True, text=True)
        assert res.returncode == 0, f"Failed to generate test input video: {res.stderr}"

        # 2. Build test timestamp map & edits
        timestamp_map = {
            "chunk_1": {"start": 0.0, "end": 3.0, "text": "Welcome to AI content manager", "words": []},
            "chunk_2": {"start": 3.0, "end": 6.0, "text": "This is fully automated video creation", "words": []},
        }

        edits = [
            # Dynamic zoompan test (Phase 4)
            {"action": "zoom_in", "trigger_id": "chunk_1", "start": 0.0, "end": 3.0},
            # SFX test (Phase 4)
            {"action": "sfx", "trigger_id": "chunk_1", "start": 0.0, "end": 1.0, "sound_effect": "pop"},
        ]

        # 3. Execute full compositor render
        final_video = render_video_pipeline(
            raw_video_path=input_mp4,
            output_mp4_path=output_mp4,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "9:16"}
        )

        assert os.path.exists(final_video), "Rendered video does not exist!"
        file_size = os.path.getsize(final_video)
        assert file_size > 5000, f"Rendered video size is suspiciously small: {file_size} bytes"

        # 4. Probe output streams and verify A/V sync
        streams = _probe_streams(ffmpeg_bin, final_video)
        assert streams["has_video"], "Output is missing video stream"
        assert streams["has_audio"], "Output is missing audio stream"
        assert streams["video_duration"] > 5.5, f"Video duration too short: {streams['video_duration']}"
        assert streams["audio_duration"] > 5.5, f"Audio duration too short: {streams['audio_duration']}"

        duration_diff = abs(streams["video_duration"] - streams["audio_duration"])
        assert duration_diff < 0.5, f"A/V sync drift detected: {duration_diff}s"

        print(f"\n🎉 LIVE E2E RENDER PASSED! File size: {file_size} bytes, Duration: {streams['video_duration']:.2f}s")


if __name__ == "__main__":
    test_live_compositor_e2e_render()

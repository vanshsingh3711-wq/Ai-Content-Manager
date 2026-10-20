import os
import pytest
from unittest.mock import patch, MagicMock
from services.compositor import render_video_pipeline

def test_mg_pre_path_propagates_to_segment_actions():
    """
    Test that the `_pre_mg_path` set during pre-rendering correctly propagates
    to the shallow copies of `edits` stored inside `timeline` segments.
    If it fails to propagate, the FFmpeg filter graph will be built without
    including the motion graphics overlay.
    """
    edits = [
        {
            "action": "motion_graphics",
            "start": 2.0,
            "end": 5.0,
            "trigger_id": "beat_1",
            "motion_graphics_type": "hero_reveal",
            "motion_graphics_targets": {"text": "Test"}
        }
    ]

    with patch("services.compositor.os.path.exists", return_value=True), \
         patch("services.compositor.os.path.getsize", return_value=50000), \
         patch("services.compositor._probe_duration", return_value=10.0), \
         patch("services.compositor._probe_streams", return_value={"has_video": True, "has_audio": True, "fps": 30.0, "video_duration": 10.0, "audio_duration": 10.0}), \
         patch("services.compositor._render_canvas_composition", return_value="/fake/mg_path.mov"), \
         patch("services.compositor.subprocess.run") as mock_run, \
         patch("services.compositor.os.makedirs"), \
         patch("services.compositor._validate_rendered_output"):
        
        settings = {"USE_GRANULAR_OVERLAYS": True}
        
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_run.return_value = mock_result
        
        import tempfile
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, "output.mp4")
            render_video_pipeline(
                raw_video_path="/fake/input.mp4",
                output_mp4_path=output_path,
                edits=edits,
                settings=settings
            )

        # Check the ffmpeg commands generated for the segments
        # The segment should include '-i', '/fake/mg_path.mov'
        ffmpeg_commands = [call.args[0] for call in mock_run.call_args_list]
        
        found_mg_path = False
        for cmd in ffmpeg_commands:
            if "/fake/mg_path.mov" in cmd:
                found_mg_path = True
                break
                
        assert found_mg_path, "MG path was not found in the ffmpeg segment rendering command. The alpha compositing bug is present."


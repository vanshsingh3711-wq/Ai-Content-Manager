import pytest
import os
import json
from unittest.mock import patch, MagicMock
from services.remotion_renderer import ALLOWED_COMPOSITIONS, render_motion_graphic


def test_allowed_compositions_includes_app_screen_upload():
    assert "app_screen_upload" in ALLOWED_COMPOSITIONS
    assert "app-screen-upload" in ALLOWED_COMPOSITIONS


def test_render_motion_graphic_app_screen_upload():
    props = {
        "title": "VIDEO UPLOAD",
        "appName": "Video Studio Pro",
        "fileName": "demo.mp4",
        "fileSize": "35.4 MB",
        "progress": 100,
        "status": "Upload Complete",
    }

    with patch("os.path.isdir", return_value=True), \
         patch("subprocess.run") as mock_run, \
         patch("os.path.exists", return_value=True), \
         patch("os.path.getsize", return_value=1024 * 1024 * 2):

        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")

        result = render_motion_graphic(
            composition_id="app_screen_upload",
            props=props,
            duration_frames=90,
            fps=30,
            width=1080,
            height=1920,
            output_path="/tmp/test_out.mov",
        )

        assert result == "/tmp/test_out.mov"
        assert mock_run.called

        cmd_args = mock_run.call_args[0][0]
        # Composition argument must be kebab-case
        assert "app-screen-upload" in cmd_args
        assert "--codec=prores" in cmd_args
        assert "--fps=30" in cmd_args
        assert "--width=1080" in cmd_args
        assert "--height=1920" in cmd_args


def test_render_motion_graphic_unknown_composition_rejected():
    result = render_motion_graphic(
        composition_id="invalid_composition_xyz",
        props={},
        duration_frames=90,
        fps=30,
        width=1080,
        height=1920,
        output_path="/tmp/test_out.mov",
    )
    assert result is None

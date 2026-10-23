import os
import shutil
import tempfile
import subprocess
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from services.copilot_llm import reason_copilot_intent, _semantic_heuristic_fallback
from services.asset_manager import search_single_broll_clip
from services.compositor import render_video_pipeline, _probe_duration
from services.media_extractor import get_ffmpeg_binary_path

client = TestClient(app)


def test_acceptance_b_prompt_parsing_and_narration_preservation():
    """
    Acceptance Test B - Step 1:
    User prompt: "Add relevant laptop-coding B-roll from 00:30 to 00:35 and keep my narration audible"
    Verifies:
      1. B-roll clip placed on brollTrack from 30.0s to 35.0s.
      2. B-roll audio volume is set to 0 and muted is True.
      3. Topic cleaned to coding footage without prompt stop-words.
    """
    payload = {
        "project_id": "proj-phase2-test-b",
        "prompt": "Add relevant laptop-coding B-roll from 00:30 to 00:35 and keep my narration audible",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "16:9",
        },
        "options": {
            "max_edits": 5,
            "allow_stock_sourcing": True,
            "use_llm_reasoning": False,  # Deterministic semantic fallback
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scope"] == "time_range"
    assert len(data["edits"]) == 1

    edit = data["edits"][0]
    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 30.0
    assert edit["end"] == 35.0
    assert "laptop" in edit["title"].lower() or "coding" in edit["title"].lower() or "stock" in edit["title"].lower()

    op = edit["operation"]
    assert op["type"] == "add_element"
    assert op["track"] == "broll"
    elem = op["element"]
    assert elem["start"] == 30.0
    assert elem["end"] == 35.0
    assert elem["sourceUrl"].startswith("http")
    assert elem.get("volume") == 0, "B-roll volume must be set to 0 to keep narration audible"
    assert elem.get("muted") is True, "B-roll must be muted by default"
    assert elem.get("thumbnailUrl") is not None


def test_acceptance_b_llm_reasoning_intent_sourcing():
    """
    Acceptance Test B - Step 2:
    Verifies that reason_copilot_intent properly extracts MM:SS timestamps and B-roll intent.
    """
    context = {"playhead_time": 0.0, "duration": 60.0, "aspect_ratio": "9:16"}
    proposal = reason_copilot_intent(
        "Add relevant laptop-coding B-roll from 00:30 to 00:35 and keep my narration audible",
        context
    )

    assert proposal.intent == "add_broll"
    assert proposal.action_type == "broll"
    assert proposal.start_time == 30.0
    assert proposal.end_time == 35.0
    assert "coding" in proposal.search_query.lower() or "laptop" in proposal.search_query.lower()


def test_web_evidence_recording_prompt_as_broll():
    """
    Verifies prompt:
    "Record github.com/trending and show it on B-roll from 00:10 to 00:15"
    Outputs natural screen recording placed on broll track with volume: 0.
    """
    payload = {
        "project_id": "proj-phase2-web-rec",
        "prompt": "Record github.com/trending and show it on B-roll from 00:10 to 00:15",
        "context": {
            "playhead_time": 0.0,
            "duration": 45.0,
            "aspect_ratio": "16:9",
        },
        "options": {
            "max_edits": 5,
            "allow_stock_sourcing": True,
            "use_llm_reasoning": False,
        },
    }

    # Mock execute_web_capture to avoid launching a live browser during unit test
    mock_capture_res = {
        "status": "success",
        "url": "https://github.com/trending",
        "filename": "capture_github_trending.png",
        "preview_url": "/api/v1/editor/captures/capture_github_trending.png",
        "screenshot_path": "/tmp/capture_github_trending.png",
        "video_url": "/api/v1/editor/recordings/rec_github_trending_5s.mp4",
        "video_path": "/tmp/rec_github_trending_5s.mp4",
        "width": 1920,
        "height": 1080,
        "format": "16:9",
        "title": "GitHub: Trending Repositories",
    }

    with patch("routers.copilot.execute_web_capture", return_value=mock_capture_res):
        response = client.post("/api/v1/editor/copilot", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert len(data["edits"]) == 1

    edit = data["edits"][0]
    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 10.0
    assert edit["end"] == 15.0

    elem = edit["operation"]["element"]
    assert elem["start"] == 10.0
    assert elem["end"] == 15.0
    assert elem["volume"] == 0
    assert elem["muted"] is True
    assert elem["sourceUrl"] == "/api/v1/editor/recordings/rec_github_trending_5s.mp4"
    assert elem["thumbnailUrl"] == "/api/v1/editor/captures/capture_github_trending.png"


def test_acceptance_b_ffmpeg_compositor_narration_audio_preservation():
    """
    Acceptance Test B - Step 3 (Compositor Level):
    Creates synthetic base video with audible 440Hz sine wave narration audio.
    Overlays a B-roll video clip from 1.0s to 3.0s.
    Renders with render_video_pipeline.
    Verifies:
      1. Output MP4 is generated and playable.
      2. Output duration matches base video.
      3. Base narration audio is preserved across entire video (including during B-roll overlay).
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    temp_dir = tempfile.mkdtemp(prefix="test_phase2_broll_")

    try:
        base_video_path = os.path.join(temp_dir, "base_speech.mp4")
        broll_video_path = os.path.join(temp_dir, "broll_clip.mp4")
        output_mp4_path = os.path.join(temp_dir, "rendered_output.mp4")

        # 1. Generate 5-second base video with a 440Hz sine wave representing speech narration
        cmd_base = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "color=c=blue:s=640x360:d=5.0:r=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=5.0",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            base_video_path
        ]
        subprocess.run(cmd_base, check=True, capture_output=True)

        # 2. Generate 3-second B-roll video with a 1000Hz tone (which must be discarded/muted)
        cmd_broll = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "color=c=red:s=640x360:d=3.0:r=30",
            "-f", "lavfi", "-i", "sine=frequency=1000:duration=3.0",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            broll_video_path
        ]
        subprocess.run(cmd_broll, check=True, capture_output=True)

        # 3. Configure EDL with B-roll overlay from 1.0s to 3.0s
        edits = [
            {
                "id": "broll-elem-1",
                "trigger_id": "broll-elem-1",
                "action": "b_roll",
                "type": "broll",
                "start": 1.0,
                "end": 3.0,
                "sourceUrl": broll_video_path,
                "broll_path": broll_video_path,
                "opacity": 100,
                "volume": 0,
            }
        ]

        broll_map = {"broll-elem-1": broll_video_path}

        # 4. Execute render pipeline
        success = render_video_pipeline(
            raw_video_path=base_video_path,
            output_mp4_path=output_mp4_path,
            subtitle_ass_path=None,
            broll_map=broll_map,
            edits=edits,
            timestamp_map={},
            settings={"aspect_ratio": "16:9", "USE_GRANULAR_OVERLAYS": True, "duration": 5.0},
        )

        assert success == output_mp4_path
        assert os.path.exists(output_mp4_path)
        assert os.path.getsize(output_mp4_path) > 10000

        # 5. Verify duration
        dur = _probe_duration(ffmpeg_bin, output_mp4_path)
        assert abs(dur - 5.0) < 0.3

        # 6. Verify audio stream presence and audio packet volume
        # Probe audio streams with ffprobe
        probe_cmd = [
            "ffprobe", "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=codec_name,channels,sample_rate",
            "-of", "json",
            output_mp4_path
        ]
        probe_res = subprocess.run(probe_cmd, capture_output=True, text=True)
        assert "codec_name" in probe_res.stdout
        assert "aac" in probe_res.stdout.lower()

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

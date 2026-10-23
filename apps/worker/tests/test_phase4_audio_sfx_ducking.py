import os
import sys
import pytest
import subprocess
from unittest.mock import patch, MagicMock

# Ensure worker and api paths are on sys.path
worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
api_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "api"))
if worker_path not in sys.path:
    sys.path.insert(0, worker_path)
if api_path not in sys.path:
    sys.path.insert(0, api_path)

from fastapi.testclient import TestClient
from main import app
from services.compositor import (
    build_sidechain_ducking_filter,
    apply_bgm_and_ducking,
    _probe_duration,
    get_ffmpeg_binary_path,
)
from services.sfx_manager import fetch_sfx, LOCAL_SFX_MAP
from routers.videos import _compile_timeline_project_to_edl

client = TestClient(app)


class TestPhase4AudioSFXAndDucking:
    """
    Phase 4: Audio Engineering, SFX Placement, & Narration Ducking.
    Fulfills Acceptance Test D:
      1. 'Add a subtle whoosh sound when the headline enters between 00:12 and 00:13'
      2. 'Add chill background music and duck it whenever I speak'
    """

    def test_acceptance_test_d1_sfx_placement(self):
        """
        Acceptance Test D.1:
        'Add a subtle whoosh sound when the headline enters between 00:12 and 00:13'
        - AudioClip placed on audioTrack from start=12.0 to end=13.0
        - Points to verified SFX asset (/assets/audio/whoosh.mp3)
        """
        payload = {
            "prompt": "Add a subtle whoosh sound when the headline enters between 00:12 and 00:13",
            "context": {
                "playhead_time": 10.0,
                "duration": 30.0,
                "aspect_ratio": "9:16",
            },
        }
        res = client.post("/api/v1/editor/copilot", json=payload)
        assert res.status_code == 200
        plan = res.json()

        assert len(plan["edits"]) >= 1
        sfx_edit = plan["edits"][0]

        assert sfx_edit["action_type"] == "sfx"
        assert sfx_edit["track"] == "audio"
        assert sfx_edit["start"] == 12.0
        assert sfx_edit["end"] == 13.0
        assert "whoosh" in sfx_edit["title"].lower()

        elem = sfx_edit["operation"].get("element", {})
        assert elem.get("start") == 12.0
        assert elem.get("end") == 13.0
        assert "whoosh" in elem.get("sourceUrl", "").lower()
        assert elem.get("isBgm") is False

    def test_acceptance_test_d2_bgm_with_ducking(self):
        """
        Acceptance Test D.2:
        'Add chill background music and duck it whenever I speak'
        - BGM audio clip on timeline with isBgm: true, volume, fadeIn, fadeOut
        - Speech ducking via FFmpeg sidechaincompress filtergraph (-14dB attenuation)
        """
        payload = {
            "prompt": "Add chill background music and duck it whenever I speak",
            "context": {
                "playhead_time": 5.0,
                "duration": 45.0,
                "aspect_ratio": "9:16",
            },
        }
        res = client.post("/api/v1/editor/copilot", json=payload)
        assert res.status_code == 200
        plan = res.json()

        assert len(plan["edits"]) >= 1
        bgm_edit = plan["edits"][0]

        assert bgm_edit["action_type"] == "audio"
        assert bgm_edit["track"] == "audio"
        assert bgm_edit["start"] == 0.0
        assert bgm_edit["end"] == 45.0

        elem = bgm_edit["operation"].get("element", {})
        assert elem.get("isBgm") is True
        assert elem.get("ducking") is True
        assert elem.get("duckingDb") == -14.0
        assert elem.get("volume") == 35
        assert elem.get("fadeIn") == 1.0
        assert elem.get("fadeOut") == 1.5

    def test_sidechain_ducking_filtergraph_builder(self):
        """
        Verifies build_sidechain_ducking_filter constructs valid FFmpeg syntax
        with sidechaincompress, threshold, ratio, attack, and release.
        """
        filter_str = build_sidechain_ducking_filter(
            bgm_volume=0.35,
            ducking=True,
            ducking_db=-14.0,
            fade_in=1.0,
            fade_out=1.5,
            total_duration=30.0,
        )

        assert "volume=0.350" in filter_str
        assert "afade=t=in:st=0:d=1.00" in filter_str
        assert "afade=t=out:st=28.50:d=1.50" in filter_str
        assert "sidechaincompress=" in filter_str
        assert "threshold=0.03" in filter_str
        assert "ratio=8" in filter_str
        assert "attack=20" in filter_str
        assert "release=350" in filter_str
        assert "amix=inputs=2" in filter_str
        assert "[aout]" in filter_str

    def test_sidechain_ducking_filtergraph_without_ducking(self):
        """
        When ducking is disabled, sidechaincompress should be omitted from filter.
        """
        filter_str = build_sidechain_ducking_filter(
            bgm_volume=0.5,
            ducking=False,
            fade_in=0.5,
            fade_out=0.5,
            total_duration=10.0,
        )
        assert "sidechaincompress" not in filter_str
        assert "amix=inputs=2" in filter_str

    def test_apply_bgm_and_ducking_ffmpeg_execution(self, tmp_path):
        """
        End-to-end execution of apply_bgm_and_ducking with FFmpeg on generated media.
        """
        ffmpeg_bin = get_ffmpeg_binary_path()

        # 1. Generate base speech video (3 seconds)
        base_video = str(tmp_path / "base_video.mp4")
        cmd_base = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "color=c=navy:s=640x360:d=3:r=30",
            "-f", "lavfi", "-i", "sine=f=440:d=2.0,adelay=500|500,volume=0.8",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-shortest",
            base_video,
        ]
        subprocess.run(cmd_base, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        assert os.path.exists(base_video)

        # 2. Use chill-bgm.mp3
        bgm_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips", "chill-bgm.mp3"))
        assert os.path.exists(bgm_path)

        # 3. Apply BGM + ducking
        ducked_output = str(tmp_path / "final_ducked.mp4")
        success = apply_bgm_and_ducking(
            video_path=base_video,
            output_path=ducked_output,
            bgm_path=bgm_path,
            bgm_volume=0.35,
            ducking=True,
            ducking_db=-14.0,
            fade_in=0.5,
            fade_out=0.5,
            ffmpeg_bin=ffmpeg_bin,
        )

        assert success is True
        assert os.path.exists(ducked_output)
        assert os.path.getsize(ducked_output) > 5000

        # Validate duration matches base video exactly
        base_dur = _probe_duration(ffmpeg_bin, base_video)
        dur = _probe_duration(ffmpeg_bin, ducked_output)
        assert abs(dur - base_dur) < 0.1

    def test_compile_timeline_project_to_edl_preserves_audio_attributes(self):
        """
        Verifies _compile_timeline_project_to_edl retains all audio attributes
        including isBgm, ducking, ducking_db, fadeIn, fadeOut.
        """
        project = {
            "id": "proj-audio-test",
            "title": "Audio Compilation Test",
            "duration": 20.0,
            "tracks": {
                "videoTrack": [
                    {"id": "v1", "start": 0.0, "end": 20.0, "sourceUrl": "v1.mp4"}
                ],
                "audioTrack": [
                    {
                        "id": "sfx-whoosh",
                        "name": "Whoosh SFX",
                        "start": 12.0,
                        "end": 13.0,
                        "sourceUrl": "/assets/audio/whoosh.mp3",
                        "volume": 80,
                        "isBgm": False,
                    },
                    {
                        "id": "bgm-chill",
                        "name": "Chill BGM",
                        "start": 0.0,
                        "end": 20.0,
                        "sourceUrl": "/assets/audio/chill-bgm.mp3",
                        "volume": 35,
                        "isBgm": True,
                        "ducking": True,
                        "duckingDb": -14.0,
                        "fadeIn": 1.0,
                        "fadeOut": 1.5,
                    },
                ],
            },
        }

        edl = _compile_timeline_project_to_edl(project, fps=30)
        edits = edl["edits"]

        # Check SFX edit
        sfx_edit = next(e for e in edits if e["id"] == "sfx-whoosh")
        assert sfx_edit["action"] == "sfx"
        assert sfx_edit["start"] == 12.0
        assert sfx_edit["end"] == 13.0
        assert sfx_edit["volume"] == 80
        assert sfx_edit["isBgm"] is False
        assert sfx_edit["sourceUrl"] == "/assets/audio/whoosh.mp3"

        # Check BGM edit
        bgm_edit = next(e for e in edits if e["id"] == "bgm-chill")
        assert bgm_edit["action"] == "audio"
        assert bgm_edit["isBgm"] is True
        assert bgm_edit["ducking"] is True
        assert bgm_edit["ducking_db"] == -14.0
        assert bgm_edit["volume"] == 35
        assert bgm_edit["fade_in"] == 1.0
        assert bgm_edit["fade_out"] == 1.5

    def test_sfx_library_resolution(self, tmp_path):
        """
        Verifies fetch_sfx resolves whoosh, pop, and chime from curated library.
        """
        dest_whoosh = str(tmp_path / "whoosh.mp3")
        res1 = fetch_sfx("whoosh", dest_whoosh)
        assert res1 is True
        assert os.path.exists(dest_whoosh)
        assert os.path.getsize(dest_whoosh) > 1000

        dest_pop = str(tmp_path / "pop.mp3")
        res2 = fetch_sfx("pop", dest_pop)
        assert res2 is True
        assert os.path.exists(dest_pop)
        assert os.path.getsize(dest_pop) > 1000

        dest_chime = str(tmp_path / "chime",)
        res3 = fetch_sfx("chime", dest_chime)
        assert res3 is True
        assert os.path.exists(dest_chime)
        assert os.path.getsize(dest_chime) > 1000

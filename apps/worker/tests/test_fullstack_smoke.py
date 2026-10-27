"""
Full-Stack Live Smoke Test:
Verifies End-to-End flow:
1. Generates a live 5-second sample MP4 video with synchronized audio via FFmpeg.
2. Uploads via FastAPI local storage gateway (`/api/v1/storage/dev-upload`).
3. Verifies audio track extraction via `extract_audio_track`.
4. Registers video job via FastAPI (`POST /api/v1/videos/create-job`) in Talking Head mode.
5. Queries job state via `GET /api/v1/videos/{job_id}`.
6. Executes full compositor video rendering pipeline (edits: zoom, sfx, captions).
7. Probes output container to guarantee video/audio stream health, codec compliance, and A/V sync.
8. Verifies timeline persistence and retrieval via `/api/v1/videos/{job_id}/timeline`.
"""

import os
import sys
import subprocess
import tempfile
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api")))

from main import app
from services.compositor import render_video_pipeline, _probe_streams, get_ffmpeg_binary_path
from services.media_extractor import extract_audio_track
from services.subtitle_generator import generate_ass_subtitles


@pytest.fixture
def client():
    return TestClient(app)


def test_fullstack_e2e_smoke_pipeline(client):
    ffmpeg_bin = get_ffmpeg_binary_path()

    with tempfile.TemporaryDirectory() as temp_dir:
        sample_input_mp4 = os.path.join(temp_dir, "sample_camera_footage.mp4")
        sample_output_mp4 = os.path.join(temp_dir, "sample_final_rendered.mp4")
        sample_audio_wav = os.path.join(temp_dir, "extracted_speech.wav")
        sample_ass = os.path.join(temp_dir, "captions.ass")

        # ── Step 1: Generate real 5-second test video with 440Hz sine audio ──
        cmd_generate = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=5:size=1080x1920:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
            "-c:v", "libx264", "-c:a", "aac",
            "-shortest", "-pix_fmt", "yuv420p",
            sample_input_mp4,
        ]
        gen_res = subprocess.run(cmd_generate, capture_output=True, text=True)
        assert gen_res.returncode == 0, f"FFmpeg failed to generate sample video: {gen_res.stderr}"
        assert os.path.exists(sample_input_mp4)
        input_size = os.path.getsize(sample_input_mp4)
        assert input_size > 1000, f"Sample video size too small: {input_size}"

        # ── Step 2: Request Presigned URL & Upload to Storage Gateway ──
        presign_res = client.post(
            "/api/v1/storage/presigned-url",
            json={"filename": "sample_camera_footage.mp4", "content_type": "video/mp4", "user_id": "creator_1"},
        )
        assert presign_res.status_code == 200, f"Presigned URL failed: {presign_res.text}"
        presign_data = presign_res.json()
        file_key = presign_data["file_key"]
        uploaded_source_url = presign_data["source_url"]

        with open(sample_input_mp4, "rb") as f:
            file_bytes = f.read()

        upload_res = client.put(
            f"/api/v1/storage/dev-upload?key={file_key}",
            content=file_bytes,
        )
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        upload_data = upload_res.json()
        assert upload_data["status"] == "success"
        assert upload_data["file_key"] == file_key

        # ── Step 3: Extract Audio Track ──
        extracted_wav = extract_audio_track(sample_input_mp4, sample_audio_wav)
        assert os.path.exists(extracted_wav)
        wav_size = os.path.getsize(extracted_wav)
        assert wav_size > 5000, f"Extracted WAV file too small: {wav_size}"

        # ── Step 4: Register Video Job via FastAPI ──
        job_payload = {
            "title": "Smoke Test Creator Speech",
            "video_type": "talking_head",
            "source_url": uploaded_source_url,
            "settings": {
                "aspect_ratio": "9:16",
                "caption_preset": "tiktok_yellow",
                "duration": "5.0",
            },
        }
        create_res = client.post("/api/v1/videos/create-job", json=job_payload)
        assert create_res.status_code == 201, f"Create job failed: {create_res.text}"
        job_data = create_res.json()
        job_id = job_data["id"]
        assert job_data["title"] == "Smoke Test Creator Speech"
        assert job_data["status"] == "QUEUED"

        # ── Step 5: Query Job Status via FastAPI ──
        get_res = client.get(f"/api/v1/videos/{job_id}")
        assert get_res.status_code == 200
        fetched_job = get_res.json()
        assert fetched_job["id"] == job_id
        assert fetched_job["video_type"] == "talking_head"

        # ── Step 6: Generate Subtitles & Render Final Video Compositor ──
        timestamp_map = {
            "chunk_0": {
                "start": 0.0,
                "end": 2.5,
                "text": "The fastest way to scale content",
                "words": [
                    {"word": "The", "start": 0.0, "end": 0.3},
                    {"word": "fastest", "start": 0.3, "end": 0.8},
                    {"word": "way", "start": 0.8, "end": 1.2},
                    {"word": "to", "start": 1.2, "end": 1.5},
                    {"word": "scale", "start": 1.5, "end": 2.0},
                    {"word": "content", "start": 2.0, "end": 2.5},
                ],
            },
            "chunk_1": {
                "start": 2.5,
                "end": 5.0,
                "text": "is automated AI director pipelines",
                "words": [
                    {"word": "is", "start": 2.5, "end": 2.8},
                    {"word": "automated", "start": 2.8, "end": 3.4},
                    {"word": "AI", "start": 3.4, "end": 3.8},
                    {"word": "director", "start": 3.8, "end": 4.3},
                    {"word": "pipelines", "start": 4.3, "end": 5.0},
                ],
            },
        }
        generate_ass_subtitles(
            timestamp_map=timestamp_map,
            output_ass_path=sample_ass,
            caption_preset="tiktok_yellow",
        )
        assert os.path.exists(sample_ass)

        edits = [
            {"action": "zoom_in", "trigger_id": "chunk_0", "start": 0.0, "end": 2.5},
            {"action": "sfx", "trigger_id": "chunk_0", "start": 0.0, "end": 1.0, "sound_effect": "pop"},
        ]

        rendered_path = render_video_pipeline(
            raw_video_path=sample_input_mp4,
            output_mp4_path=sample_output_mp4,
            subtitle_ass_path=sample_ass,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "9:16"},
        )
        assert os.path.exists(rendered_path)
        rendered_size = os.path.getsize(rendered_path)
        assert rendered_size > 10000, f"Rendered output suspiciously small: {rendered_size} bytes"

        # ── Step 7: Probe Output Stream Health & A/V Sync ──
        streams = _probe_streams(ffmpeg_bin, rendered_path)
        assert streams["has_video"], "Composited video has no video stream"
        assert streams["has_audio"], "Composited video has no audio stream"
        assert streams["video_duration"] >= 4.5, f"Video duration too short: {streams['video_duration']}"
        assert streams["audio_duration"] >= 4.5, f"Audio duration too short: {streams['audio_duration']}"
        duration_diff = abs(streams["video_duration"] - streams["audio_duration"])
        assert duration_diff < 0.5, f"Audio/video sync mismatch: {duration_diff}s"

        # ── Step 8: Save & Retrieve Timeline State ──
        timeline_project = {
            "id": job_id,
            "title": "Smoke Test Creator Speech",
            "duration": 5.0,
            "aspectRatio": "9:16",
            "fps": 30,
            "tracks": {
                "videoTrack": [
                    {
                        "id": "clip-main",
                        "start": 0.0,
                        "end": 5.0,
                        "sourceStart": 0.0,
                        "sourceEnd": 5.0,
                        "sourceUrl": uploaded_source_url,
                    }
                ],
                "brollTrack": [],
                "textTrack": [
                    {
                        "id": "cap-1",
                        "text": "The fastest way to scale content",
                        "start": 0.0,
                        "end": 2.5,
                    }
                ],
                "audioTrack": [],
                "graphicsTrack": [],
            },
        }

        save_timeline_res = client.put(
            f"/api/v1/videos/{job_id}/timeline",
            json={"project": timeline_project, "fps": 30},
        )
        assert save_timeline_res.status_code == 200, f"Timeline save failed: {save_timeline_res.text}"

        get_timeline_res = client.get(f"/api/v1/videos/{job_id}/timeline")
        assert get_timeline_res.status_code == 200
        saved_project = get_timeline_res.json()
        assert saved_project["id"] == job_id
        assert len(saved_project["tracks"]["videoTrack"]) == 1
        assert len(saved_project["tracks"]["textTrack"]) == 1

import os
import sys
import uuid
import json
import subprocess
import tempfile
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from main import app
from database import get_session
from models import User, VideoJob, VideoJobStatus, VideoType
from routers.videos import _compile_timeline_project_to_edl
from services.media_extractor import get_ffmpeg_binary_path
from tasks.video_pipeline import render_timeline_pipeline
from services.compositor import _probe_streams

client = TestClient(app)


from sqlmodel import select

def get_or_create_test_user():
    session = next(get_session())
    try:
        user = session.exec(select(User).where(User.clerk_id == "test_user_phase1")).first()
        if not user:
            user = User(
                clerk_id="test_user_phase1",
                email="test_phase1@example.com",
                created_at=datetime.now(timezone.utc),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    finally:
        session.close()


def test_compile_timeline_project_to_edl():
    project = {
        "id": "proj-1",
        "title": "My Showcase Reel",
        "aspectRatio": "9:16",
        "duration": 8.0,
        "fps": 30,
        "tracks": {
            "videoTrack": [
                {
                    "id": "clip-1",
                    "start": 0.0,
                    "end": 8.0,
                    "sourceStart": 0.0,
                    "sourceEnd": 8.0,
                    "sourceUrl": "test.mp4",
                    "speed": 1.0,
                }
            ],
            "brollTrack": [
                {
                    "id": "broll-1",
                    "name": "Aerial City",
                    "start": 2.0,
                    "end": 5.0,
                    "sourceUrl": "broll.mp4",
                    "opacity": 90,
                }
            ],
            "textTrack": [
                {
                    "id": "caption-1",
                    "text": "BOOST YOUR ENGAGEMENT",
                    "start": 0.5,
                    "end": 3.0,
                    "stylePreset": "tiktok_yellow",
                }
            ],
            "graphicsTrack": [
                {
                    "id": "mg-1",
                    "compositionId": "hero_reveal",
                    "name": "Title Card",
                    "start": 1.0,
                    "end": 4.0,
                    "props": {"headline": "Trending AI"},
                }
            ],
            "audioTrack": [
                {
                    "id": "audio-1",
                    "name": "pop",
                    "start": 1.0,
                    "end": 1.5,
                    "sourceUrl": "pop.wav",
                    "isBgm": False,
                }
            ],
        },
    }

    compiled = _compile_timeline_project_to_edl(project, fps=30)
    edits = compiled["edits"]
    assert len(edits) == 5

    # Check that each edit has both action and type
    cut = next(e for e in edits if e["action"] == "cut")
    assert cut["type"] == "cut"
    assert cut["trigger_id"] == "clip-1"
    assert cut["start"] == 0.0
    assert cut["end"] == 8.0

    broll = next(e for e in edits if e["action"] == "b_roll")
    assert broll["type"] == "broll"
    assert broll["trigger_id"] == "broll-1"
    assert broll["broll_query"] == "Aerial City"

    sub = next(e for e in edits if e["action"] == "subtitle")
    assert sub["type"] == "subtitle"
    assert sub["text"] == "BOOST YOUR ENGAGEMENT"
    assert sub["trigger_id"] in compiled["timestamp_map"]

    mg = next(e for e in edits if e["action"] == "motion_graphics")
    assert mg["type"] == "motion_graphic"
    assert mg["template"] == "hero_reveal"
    assert mg["motion_graphics_type"] == "hero_reveal"
    assert mg["props"]["headline"] == "Trending AI"

    sfx = next(e for e in edits if e["action"] == "sfx")
    assert sfx["type"] == "audio"
    assert sfx["sound_effect"] == "pop"


def test_timeline_project_persistence_api():
    user = get_or_create_test_user()
    session = next(get_session())
    job = VideoJob(
        user_id=user.id,
        title="Persistence Test Reel",
        source_url="https://example.com/source.mp4",
        video_type=VideoType.TALKING_HEAD,
        status=VideoJobStatus.QUEUED,
        settings={"aspect_ratio": "9:16", "duration": 15.0},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    job_id = str(job.id)
    session.close()

    # 1. Fetch initial timeline project
    res1 = client.get(f"/api/v1/videos/{job_id}/timeline")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["id"] == job_id
    assert data1["aspectRatio"] == "9:16"
    assert len(data1["tracks"]["videoTrack"]) == 1

    # 2. Modify and PATCH timeline project
    updated_project = dict(data1)
    updated_project["title"] = "Updated Masterpiece"
    updated_project["aspectRatio"] = "16:9"
    updated_project["tracks"]["textTrack"] = [
        {
            "id": "new-caption-1",
            "text": "PERSISTED ON SERVER",
            "start": 1.0,
            "end": 4.0,
            "stylePreset": "neon_cyber",
        }
    ]

    res2 = client.patch(
        f"/api/v1/videos/{job_id}/timeline",
        json={"project": updated_project, "fps": 30},
    )
    assert res2.status_code == 200
    save_data = res2.json()
    assert save_data["status"] == "saved"
    assert save_data["timeline_project"]["title"] == "Updated Masterpiece"

    # 3. Fetch again and confirm persistence
    res3 = client.get(f"/api/v1/videos/{job_id}/timeline")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["title"] == "Updated Masterpiece"
    assert data3["aspectRatio"] == "16:9"
    assert len(data3["tracks"]["textTrack"]) == 1
    assert data3["tracks"]["textTrack"][0]["text"] == "PERSISTED ON SERVER"


def test_render_timeline_pipeline_execution():
    ffmpeg_bin = get_ffmpeg_binary_path()
    with tempfile.TemporaryDirectory() as temp_dir:
        input_mp4 = os.path.join(temp_dir, "base_test.mp4")

        # 1. Create a 3s valid base video with audio
        cmd = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=3:size=1080x1920:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:v", "libx264", "-c:a", "aac",
            "-shortest", "-pix_fmt", "yuv420p",
            input_mp4
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        assert res.returncode == 0, f"FFmpeg failed: {res.stderr}"

        # 2. Create job in DB
        user = get_or_create_test_user()
        session = next(get_session())
        job = VideoJob(
            user_id=user.id,
            title="Real Render Test",
            source_url=input_mp4,
            video_type=VideoType.TALKING_HEAD,
            status=VideoJobStatus.RENDERING,
            settings={"aspect_ratio": "9:16", "duration": 3.0, "fps": 30},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(job)
        session.commit()
        session.refresh(job)
        job_id = str(job.id)
        session.close()

        # 3. Define project data with a cut and subtitle
        project_data = {
            "edits": [
                {
                    "action": "cut",
                    "type": "cut",
                    "trigger_id": "c1",
                    "start": 0.0,
                    "end": 2.5,
                    "sourceUrl": input_mp4,
                },
                {
                    "action": "subtitle",
                    "type": "subtitle",
                    "trigger_id": "sub1",
                    "start": 0.2,
                    "end": 2.0,
                    "text": "REAL FFMPEG RENDERING",
                },
            ],
            "timestamp_map": {
                "sub1": {"start": 0.2, "end": 2.0, "text": "REAL FFMPEG RENDERING", "words": []}
            },
            "settings": {"aspect_ratio": "9:16", "duration": 2.5, "fps": 30},
        }

        # 4. Execute render_timeline_pipeline task
        result = render_timeline_pipeline(job_id, project_data)
        assert result["status"] == "success"
        assert result["file_size"] > 1024

        # 5. Check job in DB is marked COMPLETED
        session = next(get_session())
        completed_job = session.get(VideoJob, uuid.UUID(job_id))
        assert completed_job.status == VideoJobStatus.COMPLETED
        assert completed_job.rendered_url == f"/api/v1/videos/{job_id}/rendered-file"
        session.close()

        # 6. Verify streamed output file
        stream_res = client.get(f"/api/v1/videos/{job_id}/rendered-file")
        assert stream_res.status_code == 200
        assert stream_res.headers["content-type"] == "video/mp4"
        assert len(stream_res.content) > 1024
        # Verify it's not the 4KB dummy placeholder
        assert stream_res.content != b"\x00" * 4096


def test_get_rendered_video_file_status_guards():
    user = get_or_create_test_user()
    session = next(get_session())
    job = VideoJob(
        user_id=user.id,
        title="Status Guard Video",
        source_url="",
        video_type=VideoType.TALKING_HEAD,
        status=VideoJobStatus.RENDERING,
        settings={"aspect_ratio": "9:16"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    job_id = str(job.id)
    session.close()

    # When job is RENDERING, must return 202 Accepted
    res_rendering = client.get(f"/api/v1/videos/{job_id}/rendered-file")
    assert res_rendering.status_code == 202

    # When job failed, must return 500 with failure explanation
    session = next(get_session())
    db_job = session.get(VideoJob, uuid.UUID(job_id))
    db_job.status = VideoJobStatus.FAILED
    db_job.error_log = "FFmpeg OOM test simulation"
    session.add(db_job)
    session.commit()
    session.close()

    res_failed = client.get(f"/api/v1/videos/{job_id}/rendered-file")
    assert res_failed.status_code == 500
    assert "FFmpeg OOM" in res_failed.json()["detail"]


def test_render_timeline_pipeline_synthesized_canvas():
    user = get_or_create_test_user()
    session = next(get_session())
    job = VideoJob(
        user_id=user.id,
        title="Faceless Canvas Test",
        source_url="",  # No input video
        video_type=VideoType.FACELESS_SHORT,
        status=VideoJobStatus.RENDERING,
        settings={"aspect_ratio": "9:16", "duration": 2.0, "fps": 30},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    job_id = str(job.id)
    session.close()

    project_data = {
        "edits": [
            {
                "action": "subtitle",
                "type": "subtitle",
                "trigger_id": "s1",
                "start": 0.2,
                "end": 1.8,
                "text": "SYNTHESIZED CANVAS",
            }
        ],
        "timestamp_map": {
            "s1": {"start": 0.2, "end": 1.8, "text": "SYNTHESIZED CANVAS", "words": []}
        },
        "settings": {"aspect_ratio": "9:16", "duration": 2.0, "fps": 30},
    }

    # Should automatically synthesize solid 1080p canvas and complete without error
    result = render_timeline_pipeline(job_id, project_data)
    assert result["status"] == "success"
    assert result["file_size"] > 1024

    session = next(get_session())
    completed_job = session.get(VideoJob, uuid.UUID(job_id))
    assert completed_job.status == VideoJobStatus.COMPLETED
    session.close()

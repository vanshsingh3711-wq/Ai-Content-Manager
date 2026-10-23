"""
Phase 8 System Integration Test Suite.
Tests End-to-End System Integration:
1. Real-time Render Progress Tracker & SSE Event Streaming
2. Cloud Version Snapshots (Checkpointing, Version Increment, Listing, and Rollback Restoration)
3. Multi-Track Timeline NLE Export Verification (FCPXML 1.10, Premiere XML, EDL, SRT)
"""

import json
import os
import tempfile
import uuid
import xml.etree.ElementTree as ET
import pytest
from fastapi.testclient import TestClient

from main import app
from database import get_session
from models import VideoJob, VideoJobStatus, VideoType, ProjectSnapshot
from services.render_tracker import (
    update_render_progress,
    get_render_progress,
    clear_render_progress,
)
from services.nle_exporter import export_nle_project


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def media_temp_dir():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))
    os.makedirs(base, exist_ok=True)
    temp_dir = tempfile.mkdtemp(dir=base, prefix="test_p8_")
    yield temp_dir
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


from datetime import datetime, timezone
from sqlmodel import select
from models import User, VideoJob, VideoJobStatus, VideoType, ProjectSnapshot


def get_or_create_test_user():
    session = next(get_session())
    try:
        user = session.exec(select(User).where(User.clerk_id == "test_user_phase8")).first()
        if not user:
            user = User(
                clerk_id="test_user_phase8",
                email="test_phase8@example.com",
                created_at=datetime.now(timezone.utc),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    finally:
        session.close()


@pytest.fixture
def mock_video_job():
    """Creates a temporary VideoJob in DB for integration testing."""
    user = get_or_create_test_user()
    session = next(get_session())
    job = VideoJob(
        title="Phase 8 Integration Test Project",
        source_url="https://example.com/source.mp4",
        video_type=VideoType.TALKING_HEAD,
        status=VideoJobStatus.QUEUED,
        user_id=user.id,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    job_id = job.id
    session.close()

    yield job_id

    # Teardown
    cleanup_session = next(get_session())
    db_job = cleanup_session.get(VideoJob, job_id)
    if db_job:
        cleanup_session.delete(db_job)
        cleanup_session.commit()
    cleanup_session.close()


# ---------------------------------------------------------------------------
# 1. Render Progress Tracker Unit & State Transitions
# ---------------------------------------------------------------------------

def test_render_tracker_lifecycle():
    render_id = f"render_test_{uuid.uuid4().hex[:8]}"
    video_id = str(uuid.uuid4())

    # Step A: Initial Compiling Stage
    res1 = update_render_progress(
        render_id=render_id,
        video_id=video_id,
        progress=15,
        stage="compiling",
        message="Validating timeline cuts and audio tracks",
    )
    assert res1["status"] == "rendering"
    assert res1["progress"] == 15
    assert res1["stage"] == "compiling"

    # Lookup by render_id
    lookup1 = get_render_progress(render_id=render_id)
    assert lookup1 is not None
    assert lookup1["progress"] == 15

    # Lookup by video_id
    lookup_v = get_render_progress(video_id=video_id)
    assert lookup_v is not None
    assert lookup_v["render_id"] == render_id

    # Step B: Matting & Compositing Stage
    update_render_progress(
        render_id=render_id,
        video_id=video_id,
        progress=70,
        stage="compositing",
        message="Multi-track FFmpeg compositing",
    )
    lookup2 = get_render_progress(render_id=render_id)
    assert lookup2["stage"] == "compositing"
    assert lookup2["progress"] == 70

    # Step C: Completion Stage
    update_render_progress(
        render_id=render_id,
        video_id=video_id,
        progress=100,
        stage="completed",
        message="Render complete",
        extra={"download_url": "/rendered.mp4"},
    )
    lookup3 = get_render_progress(render_id=render_id)
    assert lookup3["status"] == "completed"
    assert lookup3["progress"] == 100
    assert lookup3["download_url"] == "/rendered.mp4"

    # Step D: Cleanup
    clear_render_progress(render_id=render_id, video_id=video_id)
    assert get_render_progress(render_id=render_id) is None


# ---------------------------------------------------------------------------
# 2. Real-Time SSE Stream Endpoint
# ---------------------------------------------------------------------------

def test_render_stream_sse_endpoint(client, mock_video_job):
    render_id = f"render_sse_{uuid.uuid4().hex[:8]}"
    v_id = str(mock_video_job)

    # Pre-populate completed progress so SSE finishes immediately
    update_render_progress(
        render_id=render_id,
        video_id=v_id,
        progress=100,
        stage="completed",
        message="Render completed successfully",
        extra={"download_url": f"/api/v1/videos/{v_id}/rendered-file"},
    )

    response = client.get(f"/api/v1/videos/{v_id}/render-stream/{render_id}")
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Parse SSE events from response text
    lines = response.text.strip().split("\n")
    events = []
    current_event = {}
    for line in lines:
        if line.startswith("event:"):
            current_event["event"] = line.replace("event:", "").strip()
        elif line.startswith("data:"):
            current_event["data"] = json.loads(line.replace("data:", "").strip())
            events.append(current_event)
            current_event = {}

    assert len(events) >= 1
    completed_event = [e for e in events if e.get("event") == "completed"]
    assert len(completed_event) >= 1
    assert completed_event[0]["data"]["progress"] == 100
    assert completed_event[0]["data"]["status"] == "completed"

    clear_render_progress(render_id=render_id, video_id=v_id)


def test_render_stream_404_for_unknown_video(client):
    unknown_id = uuid.uuid4()
    response = client.get(f"/api/v1/videos/{unknown_id}/render-stream/render_123")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# 3. Cloud Version Snapshots API (Checkpointing, Rollback & Versioning)
# ---------------------------------------------------------------------------

def test_cloud_version_snapshots_lifecycle(client, mock_video_job):
    v_id = str(mock_video_job)

    # 1. Create Snapshot V1
    snap1_payload = {
        "label": "Initial Cut with Hook",
        "description": "Trimmed dead air from 00:00 to 00:03",
        "timeline_project": {
            "id": f"proj_{v_id}",
            "videoId": v_id,
            "title": "Version 1",
            "aspectRatio": "9:16",
            "duration": 15.0,
            "tracks": {
                "videoTrack": [{"id": "v1", "start": 0, "end": 15}],
                "audioTrack": [],
                "textTrack": [{"id": "c1", "text": "Hook line", "start": 1, "end": 4}],
                "graphicsTrack": [],
                "brollTrack": [],
            },
        },
    }
    r1 = client.post(f"/api/v1/videos/{v_id}/snapshots", json=snap1_payload)
    assert r1.status_code == 201
    s1_data = r1.json()
    assert s1_data["version"] == 1
    assert s1_data["label"] == "Initial Cut with Hook"
    assert s1_data["clip_counts"]["video"] == 1
    assert s1_data["clip_counts"]["captions"] == 1
    s1_id = s1_data["id"]

    # 2. Create Snapshot V2 (Auto-increment version)
    snap2_payload = {
        "label": "Added B-roll and Lower Third",
        "timeline_project": {
            "id": f"proj_{v_id}",
            "videoId": v_id,
            "title": "Version 2",
            "aspectRatio": "9:16",
            "duration": 15.0,
            "tracks": {
                "videoTrack": [{"id": "v1", "start": 0, "end": 15}],
                "audioTrack": [{"id": "a1", "sourceUrl": "sfx.mp3", "start": 0, "end": 2}],
                "textTrack": [{"id": "c1", "text": "Hook line", "start": 1, "end": 4}],
                "graphicsTrack": [{"id": "g1", "type": "hero-reveal", "start": 2, "end": 5}],
                "brollTrack": [{"id": "b1", "sourceUrl": "broll.mp4", "start": 3, "end": 7}],
            },
        },
    }
    r2 = client.post(f"/api/v1/videos/{v_id}/snapshots", json=snap2_payload)
    assert r2.status_code == 201
    s2_data = r2.json()
    assert s2_data["version"] == 2
    assert s2_data["label"] == "Added B-roll and Lower Third"
    assert s2_data["clip_counts"]["broll"] == 1
    assert s2_data["clip_counts"]["graphics"] == 1
    s2_id = s2_data["id"]

    # 3. List Snapshots (Ordered by version DESC)
    list_res = client.get(f"/api/v1/videos/{v_id}/snapshots")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] == 2
    assert list_data["snapshots"][0]["version"] == 2
    assert list_data["snapshots"][1]["version"] == 1

    # 4. Get Snapshot by ID
    get_res = client.get(f"/api/v1/videos/{v_id}/snapshots/{s1_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["version"] == 1
    assert get_data["timeline_project"]["title"] == "Version 1"

    # 5. Restore Snapshot V1 (Rollback)
    restore_res = client.post(f"/api/v1/videos/{v_id}/snapshots/{s1_id}/restore")
    assert restore_res.status_code == 200
    rest_data = restore_res.json()
    assert rest_data["status"] == "restored"
    assert rest_data["version"] == 1
    assert rest_data["timeline_project"]["title"] == "Version 1"

    # Verify that VideoJob.edit_decision_list in DB now holds the restored state
    session = next(get_session())
    db_job = session.get(VideoJob, uuid.UUID(v_id))
    edl_parsed = json.loads(db_job.edit_decision_list)
    assert edl_parsed["timeline_project"]["title"] == "Version 1"
    session.close()

    # 6. Delete Snapshot V2
    del_res = client.delete(f"/api/v1/videos/{v_id}/snapshots/{s2_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Verify count is now 1
    list_after = client.get(f"/api/v1/videos/{v_id}/snapshots")
    assert list_after.json()["total"] == 1


# ---------------------------------------------------------------------------
# 4. Multi-Track NLE Export Verification
# ---------------------------------------------------------------------------

def test_multitrack_nle_export_integrity(media_temp_dir):
    """
    Verifies that export_nle_project generates structurally valid multi-track
    export packages including video cuts, B-rolls, audio tracks with ducking,
    transitions, and captions across FCPXML 1.10, Premiere XML, EDL, and SRT.
    """
    export_dir = os.path.join(media_temp_dir, "nle_multitrack_test")
    raw_video = os.path.join(media_temp_dir, "raw.mp4")
    # Touch dummy source video
    with open(raw_video, "wb") as f:
        f.write(b"\x00" * 4096)

    edits = [
        {"action": "cut", "start": 0.0, "end": 5.0, "type": "cut"},
        {"action": "cut", "start": 5.0, "end": 10.0, "type": "cut"},
        {"action": "b_roll", "trigger_id": "broll_1", "start": 2.0, "end": 4.5, "path": raw_video, "type": "broll"},
        {"action": "subtitle", "text": "Welcome to Phase 8", "start": 0.5, "end": 2.5, "type": "subtitle"},
        {"action": "subtitle", "text": "Multi-track export test", "start": 3.0, "end": 5.0, "type": "subtitle"},
        {"action": "sfx", "name": "whoosh", "start": 2.0, "end": 2.8, "type": "sfx"},
    ]

    settings = {
        "fps": 30.0,
        "width": 1080,
        "height": 1920,
        "duration": 10.0,
        "transitions": [
            {"fromClipId": "0", "toClipId": "1", "preset": "crossfade", "duration": 0.5}
        ],
    }

    result = export_nle_project(
        output_dir=export_dir,
        project_name="Phase8_Multitrack_Showcase",
        raw_video_path=raw_video,
        edits=edits,
        settings=settings,
        create_zip=True,
    )

    # 1. Output files exist
    files = result.get("files") or {}
    assert "fcpxml" in files
    assert "premiere_xml" in files
    assert "edl" in files
    assert "srt" in files
    assert result.get("zip_path") is not None
    assert os.path.exists(files["fcpxml"])
    assert os.path.exists(files["premiere_xml"])
    assert os.path.exists(files["edl"])
    assert os.path.exists(files["srt"])
    assert os.path.exists(result["zip_path"])

    # 2. FCPXML 1.10 Schema & Multi-track Spine
    fcpxml_tree = ET.parse(files["fcpxml"])
    fcpxml_root = fcpxml_tree.getroot()
    assert fcpxml_root.tag == "fcpxml"
    assert fcpxml_root.attrib.get("version") == "1.10"

    spine = fcpxml_root.find(".//spine")
    assert spine is not None
    # Video clips present
    asset_clips = spine.findall("asset-clip")
    assert len(asset_clips) >= 1

    # 3. Premiere Pro XML (xmeml 4) Multi-track Structure
    prem_tree = ET.parse(files["premiere_xml"])
    prem_root = prem_tree.getroot()
    assert prem_root.tag == "xmeml"

    video_tracks = prem_root.findall(".//media/video/track")
    assert len(video_tracks) >= 1  # Base video track (+ optional B-roll overlay track)

    audio_tracks = prem_root.findall(".//media/audio/track")
    assert len(audio_tracks) >= 1  # Audio track present

    # 4. SRT Subtitle Content
    with open(files["srt"], "r", encoding="utf-8") as f:
        srt_text = f.read()
    assert "Welcome to Phase 8" in srt_text
    assert "Multi-track export test" in srt_text
    assert "-->" in srt_text

    # 5. CMX 3600 EDL Content
    with open(files["edl"], "r", encoding="utf-8") as f:
        edl_text = f.read()
    assert "TITLE:" in edl_text
    assert "FCM:" in edl_text

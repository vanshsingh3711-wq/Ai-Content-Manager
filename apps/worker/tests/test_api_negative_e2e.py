"""
End-to-End Negative Verification Suite (Phase 4)
Tests FastAPI HTTP boundaries directly via TestClient:
1. POST /api/v1/videos/create-job with empty source_url in talking_head -> HTTP 422
2. POST /api/v1/videos/create-job with file:// URI -> HTTP 422
3. POST /api/v1/videos/create-job with missing script in faceless_short -> HTTP 422
4. PUT /api/v1/storage/dev-upload with path traversal key -> HTTP 400
5. GET /api/v1/storage/download with path traversal key -> HTTP 400
6. POST /api/v1/jobs/00000000-0000-0000-0000-000000000000/dispatch (nonexistent job) -> HTTP 404
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_e2e_talking_head_empty_source_url_rejected():
    """Attempting to dispatch a talking head video without footage returns HTTP 422."""
    res = client.post(
        "/api/v1/videos/create-job",
        json={
            "title": "Bypass Attempt",
            "source_url": "",
            "video_type": "talking_head",
        },
    )
    assert res.status_code == 422
    data = res.json()
    assert "source_url" in str(data).lower()


def test_e2e_talking_head_ssrf_protocol_rejected():
    """Attempting to provide a local file:// URI returns HTTP 422."""
    res = client.post(
        "/api/v1/videos/create-job",
        json={
            "title": "SSRF Attempt",
            "source_url": "file:///etc/passwd",
            "video_type": "talking_head",
        },
    )
    assert res.status_code == 422
    data = res.json()
    assert "protocol" in str(data).lower() or "disallowed" in str(data).lower()


def test_e2e_faceless_short_empty_script_rejected():
    """Attempting to dispatch a faceless short with 0-word script returns HTTP 422."""
    res = client.post(
        "/api/v1/videos/create-job",
        json={
            "title": "Empty Script Attempt",
            "source_url": "",
            "video_type": "faceless_short",
            "settings": {"script_text": "   "},
        },
    )
    assert res.status_code == 422
    data = res.json()
    assert "script_text" in str(data).lower()


def test_e2e_storage_upload_path_traversal_blocked():
    """Path traversal attack on dev-upload returns HTTP 400."""
    res = client.put(
        "/api/v1/storage/dev-upload?key=../../../evil.mp4",
        content=b"malicious_bytes",
    )
    assert res.status_code == 400
    data = res.json()
    assert "directory traversal" in data["detail"].lower()


def test_e2e_storage_download_path_traversal_blocked():
    """Path traversal attack on download returns HTTP 400."""
    res = client.get("/api/v1/storage/download?key=../../etc/passwd")
    assert res.status_code == 400
    data = res.json()
    assert "directory traversal" in data["detail"].lower()


def test_e2e_dispatch_nonexistent_job_returns_404():
    """Dispatching a nonexistent job UUID returns HTTP 404."""
    res = client.post("/api/v1/jobs/00000000-0000-0000-0000-000000000000/dispatch")
    assert res.status_code == 404

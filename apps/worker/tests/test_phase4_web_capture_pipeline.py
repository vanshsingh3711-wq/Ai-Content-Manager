import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_capture_web_endpoint():
    """Verifies direct POST /api/v1/editor/capture-web endpoint."""
    payload = {
        "url": "https://github.com/facebook/react",
        "width": 1280,
        "height": 800,
    }
    response = client.post("/api/v1/editor/capture-web", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["url"] == "https://github.com/facebook/react"
    assert data["preview_url"].startswith("/api/v1/editor/captures/")
    assert data["filename"].endswith(".png")
    assert os.path.exists(data["screenshot_path"])


def test_capture_web_empty_url_rejected():
    """Verifies that an empty URL returns 400."""
    response = client.post("/api/v1/editor/capture-web", json={"url": "   "})
    assert response.status_code == 400


def test_get_capture_image_file():
    """Verifies GET /api/v1/editor/captures/{filename} serves image/png."""
    # First capture an image
    cap_res = client.post("/api/v1/editor/capture-web", json={"url": "https://example.com/test"})
    assert cap_res.status_code == 200
    filename = cap_res.json()["filename"]

    # Now fetch it via GET endpoint
    img_res = client.get(f"/api/v1/editor/captures/{filename}")
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] == "image/png"
    assert len(img_res.content) > 100


def test_get_capture_image_not_found():
    """Verifies 404 for non-existent capture image."""
    response = client.get("/api/v1/editor/captures/non_existent_file_9999.png")
    assert response.status_code == 404


def test_copilot_direct_url_evidence_capture():
    """Verifies that a prompt containing a URL triggers natural screen recording on B-roll track."""
    payload = {
        "prompt": "show https://github.com/facebook/react between 10s and 14s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]

    # Must be placed on broll track as natural video recording (NOT a graphic card)
    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 10.0
    assert edit["end"] == 14.0

    # Must generate preview_url pointing to the captured screenshot
    assert edit["preview_url"] is not None
    assert "/api/v1/editor/captures/" in edit["preview_url"]

    element = edit["operation"]["element"]
    assert element["sourceUrl"] is not None
    assert "react" in element["name"].lower() or "facebook" in element["name"].lower()


def test_copilot_explicit_graphic_card_request():
    """Verifies that when explicitly requested as a graphic card, browser walkthrough is used."""
    payload = {
        "prompt": "add graphic card mockup with website https://github.com/facebook/react from 10s to 14s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]

    assert edit["action_type"] == "graphic"
    assert edit["track"] == "graphic"
    assert edit["operation"]["element"]["compositionId"] == "browser-walkthrough"


def test_copilot_article_url_at_specific_time():
    """Verifies that an article URL at a specific timestamp creates natural screen recording with proper timing."""
    payload = {
        "prompt": "show the article from https://techcrunch.com/2026/04/ai-video at 25s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]

    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 25.0
    assert edit["end"] == 28.5  # default 3.5s duration
    assert edit["operation"]["element"]["sourceUrl"] is not None
    assert edit["preview_url"] is not None

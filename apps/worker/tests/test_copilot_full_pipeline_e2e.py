"""
Comprehensive End-to-End Pipeline Verification Test
Verifies all 5 phases of the Hybrid AI Copilot, Web Capture, and Custom Command UI Pipeline:
1. Gatekeeper & typo-tolerant intent routing.
2. Tier-3 LLM semantic parsing with schema enforcement.
3. App Screen Upload Remotion composition & validation.
4. Live Web Evidence Capture, caching, and FastAPI endpoints.
5. Conversational fallback (zero blind captions) and custom parameter dispatch.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api")))

from main import app
from services.remotion_renderer import ALLOWED_COMPOSITIONS


@pytest.fixture
def client():
    return TestClient(app)


def test_e2e_scenario_1_app_screen_upload_with_typos(client):
    """
    Scenario 1: User requests an app video upload graphic with spelling typos.
    Verifies typo correction, time range extraction, Remotion composition mapping,
    and Remotion props schema compliance.
    """
    payload = {
        "prompt": "i want a screen in which user is uploading vidoe from 10s to 12s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "transcript": [],
            "current_elements": [],
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200, f"Copilot error: {response.text}"

    data = response.json()
    assert len(data["edits"]) >= 1, "Expected at least 1 proposed edit"
    edit = data["edits"][0]

    # Verify intent & timing
    assert edit["action_type"] == "graphic"
    assert edit["track"] in ["graphics", "graphic"]
    assert edit["start"] == pytest.approx(10.0, abs=0.2)
    assert edit["end"] == pytest.approx(12.0, abs=0.2)

    element = edit["operation"]["element"]
    comp_id = element.get("compositionId")
    assert comp_id in ["app-screen-upload", "app_screen_upload"]

    # Verify Remotion renderer allowlist
    assert "app_screen_upload" in ALLOWED_COMPOSITIONS or "app-screen-upload" in ALLOWED_COMPOSITIONS

    # Verify element props
    props = element.get("props", {})
    assert "appName" in props or "title" in props
    assert "fileName" in props or "status" in props


def test_e2e_scenario_2_live_web_screen_capture_pipeline(client):
    """
    Scenario 2: User provides a live URL for evidence walkthrough.
    Verifies URL extraction, natural screen recording B-roll assignment,
    preview URL generation, and screenshot capture API endpoint.
    """
    test_url = "https://news.ycombinator.com"
    payload = {
        "prompt": f"Show natural screen recording from {test_url} between 4.0s and 8.0s",
        "context": {
            "playhead_time": 2.0,
            "duration": 30.0,
            "transcript": [],
            "current_elements": [],
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200, f"Copilot error: {response.text}"

    data = response.json()
    assert len(data["edits"]) >= 1
    edit = data["edits"][0]

    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    element = edit["operation"]["element"]
    assert element.get("sourceUrl") is not None

    # Check timing
    assert edit["start"] == pytest.approx(4.0, abs=0.2)
    assert edit["end"] == pytest.approx(8.0, abs=0.2)

    # Check preview URL
    assert edit.get("preview_url") is not None
    assert "/api/v1/editor/captures/" in edit["preview_url"]

    # Verify capture endpoint responds with image
    capture_path = edit["preview_url"]
    capture_res = client.get(capture_path)
    assert capture_res.status_code == 200
    assert capture_res.headers["content-type"].startswith("image/png")


def test_e2e_scenario_3_stock_broll_pipeline(client):
    """
    Scenario 3: User requests b-roll footage.
    Verifies broll intent classification, video track targeting, and media sourcing.
    """
    payload = {
        "prompt": "Insert drone city skyline b-roll from 5s to 9s",
        "context": {
            "playhead_time": 0.0,
            "duration": 45.0,
            "transcript": [],
            "current_elements": [],
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200, f"Copilot error: {response.text}"

    data = response.json()
    assert len(data["edits"]) >= 1
    edit = data["edits"][0]

    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == pytest.approx(5.0, abs=0.2)
    assert edit["end"] == pytest.approx(9.0, abs=0.2)
    assert edit.get("preview_url") is not None


def test_e2e_scenario_4_conversational_fallback_no_blind_captions(client):
    """
    Scenario 4: User sends an ambiguous aesthetic prompt.
    Verifies that the copilot NEVER creates a blind caption from the user's raw prompt,
    and instead returns helpful conversational clarification with interactive quick action chips.
    """
    payload = {
        "prompt": "can you make this look much more aesthetic and vibrant",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "transcript": [],
            "current_elements": [],
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200, f"Copilot error: {response.text}"

    data = response.json()
    # Absolutely zero blind edits created
    assert len(data.get("edits", [])) == 0, "Ambiguous prompt must not create blind edits"

    # Must provide conversational suggestions
    assert "suggested_actions" in data
    assert len(data["suggested_actions"]) >= 2
    assert any("stock" in s.lower() or "b-roll" in s.lower() for s in data["suggested_actions"])
    assert any("graphic" in s.lower() or "motion" in s.lower() for s in data["suggested_actions"])


def test_e2e_scenario_5_direct_web_capture_endpoint(client):
    """
    Scenario 5: Direct POST /api/v1/editor/capture-web endpoint.
    Verifies direct capture endpoint returns 200, filename, preview_url, and serves image.
    """
    capture_req = {
        "url": "https://example.com",
        "width": 1280,
        "height": 720,
        "wait_ms": 300,
    }
    res = client.post("/api/v1/editor/capture-web", json=capture_req)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert "preview_url" in data
    assert "filename" in data

    # Verify retrieval
    img_res = client.get(data["preview_url"])
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] == "image/png"
    assert len(img_res.content) > 1000

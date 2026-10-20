import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_copilot_broll_prompt():
    payload = {
        "project_id": "test-proj-123",
        "prompt": "i want here a person is watching video",
        "context": {
            "playhead_time": 13.1,
            "duration": 45.0,
            "aspect_ratio": "9:16",
            "safe_zones": [{"x": 30, "y": 20, "width": 40, "height": 60}],
        },
        "options": {
            "max_edits": 5,
            "allow_stock_sourcing": True,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["plan_id"].startswith("plan_")
    assert data["user_prompt"] == "i want here a person is watching video"
    assert data["scope"] == "time_range"
    assert len(data["edits"]) == 1

    edit = data["edits"][0]
    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 13.1
    assert edit["end"] == 16.6
    assert edit["is_destructive"] is False
    assert edit["operation"]["type"] == "add_element"
    assert edit["operation"]["track"] == "broll"
    assert edit["operation"]["element"]["start"] == 13.1
    assert edit["operation"]["element"]["end"] == 16.6


def test_copilot_motion_graphic_prompt():
    payload = {
        "prompt": "add animated metric counter",
        "context": {
            "playhead_time": 5.0,
            "duration": 60.0,
            "aspect_ratio": "16:9",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    assert edit["action_type"] == "graphic"
    assert edit["track"] == "graphic"
    assert edit["operation"]["type"] == "add_element"
    assert edit["operation"]["track"] == "graphic"
    assert edit["operation"]["element"]["compositionId"] == "metric-reveal"


def test_copilot_rising_graph_motion_graphic_prompt():
    payload = {
        "prompt": "add motion graphics for a rising graphs animation",
        "context": {
            "playhead_time": 4.5,
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
    assert edit["operation"]["type"] == "add_element"
    assert edit["operation"]["track"] == "graphic"
    assert edit["operation"]["element"]["compositionId"] == "chart-reveal"
    assert "dataPoint1" in edit["operation"]["element"]["props"]
    assert edit["operation"]["element"]["props"]["title"] == "GROWTH TREND"


def test_copilot_whole_video_scope_detection():
    payload = {
        "prompt": "improve the whole video with engaging visual hooks",
        "context": {
            "playhead_time": 0.0,
            "duration": 90.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scope"] == "whole_video"


def test_copilot_empty_prompt_validation():
    payload = {
        "prompt": "",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 422


def test_copilot_typo_and_explicit_time_range():
    # User's exact prompt with typo 'vidoe' and explicit time 'from 10s to 12s'
    payload = {
        "prompt": "i want a screen in which user is uploading vidoe on screen. from 10s to 12s",
        "context": {
            "playhead_time": 25.0,  # playhead is at 25s, but prompt says from 10s to 12s
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
        "options": {
            "allow_stock_sourcing": False,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    # Must be broll or app graphic on screen, NOT a blind caption, NOT a chart/graph
    assert edit["action_type"] in ["broll", "graphic"]
    assert edit["track"] in ["broll", "graphic"]
    # Must respect the explicit time range from the prompt (10.0 to 12.0), not the 25.0s playhead!
    assert edit["start"] == 10.0
    assert edit["end"] == 12.0
    assert edit["operation"]["element"]["start"] == 10.0
    assert edit["operation"]["element"]["end"] == 12.0


def test_copilot_app_screen_upload_motion_graphic():
    # User's exact prompt for app upload motion graphics
    payload = {
        "prompt": "i want a screen in which user is uploading video on app . add this motion graphics",
        "context": {
            "playhead_time": 10.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    # Must be graphic, with compositionId == 'app-screen-upload', NOT 'chart-reveal'!
    assert edit["action_type"] == "graphic"
    assert edit["track"] == "graphic"
    assert edit["operation"]["element"]["compositionId"] == "app-screen-upload"
    assert "upload" in edit["operation"]["element"]["props"]["fileName"].lower()


def test_copilot_explicit_time_formats():
    # Test 'between 15s and 22s'
    payload1 = {
        "prompt": "put a stock clip of city traffic between 15s and 22s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
        "options": {
            "allow_stock_sourcing": False,
        },
    }
    resp1 = client.post("/api/v1/editor/copilot", json=payload1)
    assert resp1.status_code == 200
    edit1 = resp1.json()["edits"][0]
    assert edit1["start"] == 15.0
    assert edit1["end"] == 22.0

    # Test 'at 5s for 3s'
    payload2 = {
        "prompt": "add a metric counter at 5s for 3s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
    }
    resp2 = client.post("/api/v1/editor/copilot", json=payload2)
    assert resp2.status_code == 200
    edit2 = resp2.json()["edits"][0]
    assert edit2["start"] == 5.0
    assert edit2["end"] == 8.0


def test_copilot_safe_conversational_fallback():
    # An ambiguous/conversational prompt that does not match any known action
    payload = {
        "prompt": "can you make this look much more aesthetic and vibrant",
        "context": {
            "playhead_time": 10.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Must NOT generate a blind caption!
    assert len(data["edits"]) == 0
    # Must provide suggested actions
    assert data.get("suggested_actions") is not None
    assert len(data["suggested_actions"]) > 0


def test_copilot_motion_graphics_does_not_default_to_chart_reveal():
    # Verify 'motion graphics' alone defaults to hero-reveal, NOT chart-reveal (fixing substring collision)
    payload = {
        "prompt": "add a cool motion graphics at 10s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    assert edit["action_type"] == "graphic"
    assert edit["start"] == 10.0
    # Must NOT be chart-reveal
    assert edit["operation"]["element"]["compositionId"] != "chart-reveal"
    assert edit["operation"]["element"]["compositionId"] == "hero-reveal"


def test_copilot_single_transition_request():
    payload = {
        "prompt": "add crossfade transition at 12s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    assert edit["action_type"] == "transition"
    assert edit["track"] == "video"
    assert edit["start"] == 12.0
    assert edit["operation"]["preset"] == "crossfade"


def test_copilot_single_sfx_request():
    payload = {
        "prompt": "add whoosh sfx at 4s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    assert edit["action_type"] == "sfx"
    assert edit["track"] == "audio"
    assert edit["start"] == 4.0
    assert "whoosh" in edit["operation"]["element"]["sourceUrl"]


def test_copilot_ambiguous_i_want_does_not_create_broll_or_caption():
    # Prompt containing "i want" but with subjective/ambiguous request
    payload = {
        "prompt": "i want this to feel significantly more cinematic and exciting",
        "context": {
            "playhead_time": 10.0,
            "duration": 60.0,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Must NOT create a blind caption or generic broll for subjective advice
    assert len(data["edits"]) == 0
    assert data.get("suggested_actions") is not None
    assert "Add stock video footage" in data["suggested_actions"]


def test_copilot_implicit_range_format():
    # Test '12s to 18s' format without leading 'from'
    payload = {
        "prompt": "add video of city street 12s to 18s",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
        },
        "options": {
            "allow_stock_sourcing": False,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]
    assert edit["action_type"] == "broll"
    assert edit["start"] == 12.0
    assert edit["end"] == 18.0



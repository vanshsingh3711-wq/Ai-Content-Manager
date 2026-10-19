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

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from services.asset_manager import search_single_broll_clip

client = TestClient(app)


def test_search_single_broll_clip_with_mocked_pexels():
    mock_pexels_response = {
        "page": 1,
        "per_page": 5,
        "total_results": 1,
        "videos": [
            {
                "id": 98765,
                "width": 1080,
                "height": 1920,
                "duration": 12,
                "image": "https://images.pexels.com/videos/98765/pictures/preview-0.jpg",
                "video_files": [
                    {
                        "id": 1,
                        "quality": "hd",
                        "file_type": "video/mp4",
                        "width": 1080,
                        "height": 1920,
                        "link": "https://vod-progressive.akamaized.net/exp=1/video-98765.mp4",
                    },
                    {
                        "id": 2,
                        "quality": "sd",
                        "file_type": "video/mp4",
                        "width": 540,
                        "height": 960,
                        "link": "https://vod-progressive.akamaized.net/exp=1/video-98765-sd.mp4",
                    },
                ],
            }
        ],
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_pexels_response

    with patch("requests.get", return_value=mock_resp):
        res = search_single_broll_clip(
            query="person watching video",
            aspect_ratio="9:16",
            duration_min=3.5,
            api_key="mock_pexels_key",
        )

    assert res is not None
    assert res["video_id"] == "pexels-98765"
    assert res["is_fallback"] is False
    assert res["video_url"] == "https://vod-progressive.akamaized.net/exp=1/video-98765.mp4"
    assert res["preview_url"] == "https://images.pexels.com/videos/98765/pictures/preview-0.jpg"
    assert res["width"] == 1080
    assert res["height"] == 1920
    assert res["duration"] == 12.0
    assert res["orientation"] == "portrait"


def test_search_single_broll_clip_fallback_when_offline_or_no_key():
    # Without API key or when network throws, should return safe fallback without crashing
    with patch("requests.get", side_effect=Exception("Network connection failed")):
        res = search_single_broll_clip(
            query="software engineer coding",
            aspect_ratio="9:16",
            duration_min=4.0,
            api_key="mock_key",
        )

    assert res is not None
    assert res["is_fallback"] is True
    assert "video_url" in res and res["video_url"].startswith("http")
    assert "preview_url" in res and res["preview_url"].startswith("http")
    assert res["width"] == 1080
    assert res["height"] == 1920
    assert res["duration"] >= 3.5


def test_search_single_broll_clip_landscape_orientation():
    res = search_single_broll_clip(
        query="city drone shot",
        aspect_ratio="16:9",
        duration_min=3.0,
        api_key=None,
    )

    assert res["orientation"] == "landscape"
    assert res["width"] == 1920
    assert res["height"] == 1080


def test_copilot_endpoint_live_broll_sourcing():
    # Test end-to-end user prompt "i want here a person is watching video"
    payload = {
        "project_id": "proj-broll-test",
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

    assert data["scope"] == "time_range"
    assert len(data["edits"]) == 1

    edit = data["edits"][0]
    assert edit["action_type"] == "broll"
    assert edit["track"] == "broll"
    assert edit["start"] == 13.1
    assert edit["end"] == 16.6
    assert edit["is_destructive"] is False
    assert edit["preview_url"] is not None
    assert edit["preview_url"].startswith("http")

    op = edit["operation"]
    assert op["type"] == "add_element"
    assert op["track"] == "broll"
    assert op["element"]["start"] == 13.1
    assert op["element"]["end"] == 16.6
    assert op["element"]["sourceUrl"].startswith("http")
    assert op["element"]["opacity"] == 100
    assert op["element"]["fitMode"] == "cover"

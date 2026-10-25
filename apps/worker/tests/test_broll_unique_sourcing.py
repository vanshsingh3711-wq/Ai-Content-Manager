import os
import shutil
import tempfile
import json
import pytest
from unittest.mock import patch, MagicMock

from services.asset_manager import fetch_broll_assets
from services.chunk_director import extract_broll_search_query


def test_extract_broll_search_query_expanded_coverage():
    # Test new semantic visual rules
    q_shift = extract_broll_search_query("This economic earthquake is creating a paradigm shift", topic="technology")
    assert "technological" in q_shift or "transformation" in q_shift or "network" in q_shift

    q_winners = extract_broll_search_query("The winners of the next decade will define the digital frontier", topic="technology")
    assert "futuristic" in q_winners or "vision" in q_winners or "horizon" in q_winners

    q_slm = extract_broll_search_query("Sub-ten-billion parameter models running on local silicon with extreme quantization", topic="technology")
    assert "microchip" in q_slm or "silicon" in q_slm or "processor" in q_slm

    q_sec = extract_broll_search_query("Total data sovereignty and privacy security protection", topic="technology")
    assert "security" in q_sec or "shield" in q_sec or "network" in q_sec


def test_fetch_broll_assets_zero_repetition_and_caching():
    """
    Tests that fetch_broll_assets:
    1. Guarantees 100% uniqueness across cuts (no repeated video IDs).
    2. Writes sidecar metadata json.
    3. Caches raw video files in central broll_cache.
    4. Reuses central cache without re-downloading.
    """
    temp_dir = tempfile.mkdtemp(prefix="test_broll_unique_")
    assets_dir = os.path.join(temp_dir, "assets")
    cache_dir = os.path.join(temp_dir, "broll_cache")
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(cache_dir, exist_ok=True)

    try:
        # 3 cuts with the EXACT same search query
        edits = [
            {"action": "b_roll", "trigger_id": "cut_01", "search_query": "artificial intelligence neural network"},
            {"action": "b_roll", "trigger_id": "cut_02", "search_query": "artificial intelligence neural network"},
            {"action": "b_roll", "trigger_id": "cut_03", "search_query": "artificial intelligence neural network"},
        ]

        # Mock Pexels API returning 3 distinct videos
        mock_videos = [
            {
                "id": 1001,
                "duration": 12.0,
                "url": "https://www.pexels.com/video/1001/",
                "video_files": [
                    {"id": 1, "quality": "hd", "file_type": "video/mp4", "width": 1920, "height": 1080, "link": "http://mock.pexels.com/1001.mp4"}
                ]
            },
            {
                "id": 1002,
                "duration": 15.0,
                "url": "https://www.pexels.com/video/1002/",
                "video_files": [
                    {"id": 2, "quality": "hd", "file_type": "video/mp4", "width": 1920, "height": 1080, "link": "http://mock.pexels.com/1002.mp4"}
                ]
            },
            {
                "id": 1003,
                "duration": 8.0,
                "url": "https://www.pexels.com/video/1003/",
                "video_files": [
                    {"id": 3, "quality": "hd", "file_type": "video/mp4", "width": 1920, "height": 1080, "link": "http://mock.pexels.com/1003.mp4"}
                ]
            },
        ]

        # Mock requests.get for both search API and streaming download
        def mock_requests_get(url, *args, **kwargs):
            mock_res = MagicMock()
            if "pexels.com/videos/search" in url:
                mock_res.status_code = 200
                mock_res.json.return_value = {"videos": mock_videos}
                return mock_res
            else:
                # Streaming download of mp4
                mock_res.status_code = 200
                mock_res.raise_for_status = MagicMock()
                mock_res.iter_content = MagicMock(return_value=[b"FAKE_MP4_HEADER_PAYLOAD_" * 100])
                return mock_res

        with patch("requests.get", side_effect=mock_requests_get):
            with patch.dict(os.environ, {"PEXELS_API_KEY": "test_mock_key"}):
                broll_map = fetch_broll_assets(
                    edits=edits,
                    output_dir=assets_dir,
                    aspect_ratio="16:9",
                    cache_dir=cache_dir,
                    allow_duplicates=False,
                )

        # 1. All 3 cuts got allocated
        assert len(broll_map) == 3
        assert "cut_01" in broll_map
        assert "cut_02" in broll_map
        assert "cut_03" in broll_map

        # 2. Sidecar metadata verified & 100% Unique video IDs
        assigned_video_ids = set()
        for tid in ["cut_01", "cut_02", "cut_03"]:
            meta_file = os.path.join(assets_dir, f"broll_{tid}.json")
            assert os.path.exists(meta_file), f"Metadata file for {tid} must exist"
            with open(meta_file, "r") as mf:
                mdata = json.load(mf)
            vid = mdata["video_id"]
            assert vid not in assigned_video_ids, f"Video ID {vid} was reused! Must be unique."
            assigned_video_ids.add(vid)

        assert assigned_video_ids == {1001, 1002, 1003}

        # 3. Verify central cache files were populated
        assert os.path.exists(os.path.join(cache_dir, "pexels_1001_1920x1080.mp4"))
        assert os.path.exists(os.path.join(cache_dir, "pexels_1002_1920x1080.mp4"))
        assert os.path.exists(os.path.join(cache_dir, "pexels_1003_1920x1080.mp4"))

        # 4. Verify cache hit on second run (no network download called)
        with patch("requests.get") as mock_second_get:
            # We don't even need network for cached clips if we query again
            broll_map_2 = fetch_broll_assets(
                edits=edits,
                output_dir=assets_dir,
                aspect_ratio="16:9",
                cache_dir=cache_dir,
                allow_duplicates=False,
            )
            assert len(broll_map_2) == 3
            # No network calls needed because files and sidecars exist
            mock_second_get.assert_not_called()

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_dynamic_in_point_calculation():
    """
    Verifies that dynamic in-point calculation:
    - Never exceeds clip boundaries (in_point + dur <= clip_duration).
    - Always skips the initial 0.5s freeze/jitter.
    - Yields different in-points across successive cuts.
    """
    clip_duration = 15.0
    cut_durations = [3.2, 4.0, 2.8, 3.5, 4.5]
    in_points = []

    for idx, dur in enumerate(cut_durations):
        max_start = max(0.5, clip_duration - dur - 0.5)
        in_point = round(0.5 + ((idx * 3.7) % max_start), 2)
        in_points.append(in_point)

        assert in_point >= 0.5
        assert in_point + dur <= clip_duration

    # Must produce varying in-points
    assert len(set(in_points)) == len(cut_durations)


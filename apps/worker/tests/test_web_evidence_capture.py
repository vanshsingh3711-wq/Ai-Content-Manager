"""
Unit & Integration Tests for Real Web Evidence Capture (Phase 4)
Tests Headless Chrome screenshots, Twitter syndication, GitHub repository cards,
YouTube thumbnails, disk caching, and unified dispatcher.
"""

import json
import os
from pathlib import Path
import pytest

from services.web_evidence_capture import (
    find_chrome_binary,
    format_count,
    fetch_tweet_evidence,
    fetch_github_repo_evidence,
    fetch_youtube_evidence,
    capture_web_page,
    capture_web_evidence,
)


def test_find_chrome_binary():
    """Verifies that a functional Chrome/Chromium headless binary is discovered on the machine."""
    bin_path = find_chrome_binary()
    assert bin_path is not None
    assert os.path.exists(bin_path)
    assert os.access(bin_path, os.X_OK)


def test_format_count():
    """Tests count formatting for social metrics and star counts."""
    assert format_count(950) == "950"
    assert format_count(1500) == "1.5K"
    assert format_count(251183) == "251K"
    assert format_count(1400000) == "1.4M"
    assert format_count(None) == "0"


def test_fetch_tweet_evidence():
    """Verifies Twitter/X evidence extraction from syndication endpoint (zero API keys)."""
    # Tweet ID 20 (Jack Dorsey's first tweet)
    result = fetch_tweet_evidence("https://x.com/jack/status/20")
    assert result["platform"] == "x"
    assert result["id"] == "20"
    assert result["name"].lower() == "jack"
    assert "just setting up my twttr" in result["text"].lower()
    assert result["handle"] == "@jack"


def test_fetch_github_repo_evidence(tmp_path):
    """Verifies GitHub repo metadata and social card extraction."""
    card_path = tmp_path / "react_card.png"
    result = fetch_github_repo_evidence("facebook/react", output_card_path=str(card_path))
    assert result["platform"] == "github"
    assert result["full_name"] == "react/react"
    assert "K" in result["stars"] or int(result["stars"]) > 1000
    assert "library" in result["description"].lower() or "ui" in result["description"].lower()
    assert result["og_image_url"].startswith("https://opengraph.githubassets.com")


def test_fetch_youtube_evidence():
    """Verifies YouTube thumbnail URL extraction."""
    # Test standard watch URL
    res1 = fetch_youtube_evidence("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert res1["video_id"] == "dQw4w9WgXcQ"
    assert "img.youtube.com" in res1["thumbnail_url"]

    # Test short URL
    res2 = fetch_youtube_evidence("https://youtu.be/dQw4w9WgXcQ?t=10")
    assert res2["video_id"] == "dQw4w9WgXcQ"


def test_capture_web_page_data_uri(tmp_path):
    """Tests Chrome Headless Shell capturing an HTML document into a PNG image."""
    out_png = tmp_path / "sample_page.png"
    html_data = "data:text/html,<html><body style='background:%230f172a;color:%23ffffff;padding:40px;'><h1>Evidence Title</h1><p>Real SaaS documentation evidence.</p></body></html>"

    result = capture_web_page(
        url=html_data,
        output_png_path=str(out_png),
        width=1200,
        height=700,
        wait_ms=1000,
    )

    assert result["path"] == str(out_png)
    assert os.path.exists(out_png)
    assert os.path.getsize(out_png) > 1000  # valid PNG bytes


def test_capture_web_evidence_dispatcher(tmp_path):
    """Tests unified evidence dispatcher for GitHub and Twitter sources."""
    gh_out = tmp_path / "gh.png"
    res_gh = capture_web_evidence("https://github.com/facebook/react", output_path=str(gh_out))
    assert res_gh["type"] == "github_repo"
    assert res_gh["data"]["full_name"] == "react/react"

    tw_out = tmp_path / "tw.png"
    res_tw = capture_web_evidence("https://x.com/jack/status/20", output_path=str(tw_out))
    assert res_tw["type"] == "social_post"
    assert "just setting up my twttr" in res_tw["data"]["text"].lower()

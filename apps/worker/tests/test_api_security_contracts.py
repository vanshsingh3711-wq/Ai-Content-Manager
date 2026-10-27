"""
Unit & Integration Tests for Backend Security & Input Validation Contracts (Phase 2)
Verifies:
1. CreateVideoJobRequest enforces valid source_url for talking_head videos.
2. CreateVideoJobRequest enforces non-empty script_text for faceless_short videos.
3. CreateVideoJobRequest blocks dangerous protocols (file://, javascript:, etc.).
4. resolve_safe_local_path blocks directory traversal attacks on media_temp.
5. sanitize_filename strips directory traversal and hostile characters.
"""

import os
import pytest
from pydantic import ValidationError
from fastapi import HTTPException

from models import VideoType
from routers.videos import CreateVideoJobRequest
from routers.storage import resolve_safe_local_path, MEDIA_TEMP_DIR
from storage import sanitize_filename


def test_talking_head_requires_source_url():
    """Talking head jobs must reject empty or whitespace source_url."""
    with pytest.raises(ValidationError) as exc_info:
        CreateVideoJobRequest(
            title="Empty Source Test",
            source_url="",
            video_type=VideoType.TALKING_HEAD,
        )
    assert "Talking head videos require a valid, non-empty source_url" in str(exc_info.value)


def test_talking_head_rejects_unsafe_uri_schemes():
    """Talking head jobs must reject file://, gopher://, javascript: protocols."""
    with pytest.raises(ValidationError) as exc_info:
        CreateVideoJobRequest(
            title="SSRF Attempt",
            source_url="file:///etc/passwd",
            video_type=VideoType.TALKING_HEAD,
        )
    err_str = str(exc_info.value)
    assert "Invalid source_url protocol" in err_str or "Disallowed URI protocol" in err_str


def test_talking_head_accepts_valid_https_url():
    """Talking head jobs must accept valid HTTPS or cloud URIs."""
    req = CreateVideoJobRequest(
        title="Valid Talking Head",
        source_url="https://storage.googleapis.com/test-bucket/interview.mp4",
        video_type=VideoType.TALKING_HEAD,
    )
    assert req.source_url.startswith("https://")
    assert req.title == "Valid Talking Head"


def test_faceless_short_requires_script_text():
    """Faceless shorts must enforce script_text in settings."""
    with pytest.raises(ValidationError) as exc_info:
        CreateVideoJobRequest(
            title="Missing Script Faceless",
            source_url="",
            video_type=VideoType.FACELESS_SHORT,
            settings={},
        )
    assert "Faceless short videos require 'script_text'" in str(exc_info.value)


def test_faceless_short_accepts_valid_script():
    """Faceless shorts must accept valid script_text."""
    req = CreateVideoJobRequest(
        title="Valid Faceless Short",
        source_url="",
        video_type=VideoType.FACELESS_SHORT,
        settings={"script_text": "Did you know that gravity bends time according to relativity?"},
    )
    assert req.video_type == VideoType.FACELESS_SHORT
    assert "gravity bends time" in req.settings["script_text"]


def test_resolve_safe_local_path_allows_legitimate_keys():
    """Legitimate storage keys must resolve safely within MEDIA_TEMP_DIR."""
    resolved = resolve_safe_local_path("raw-uploads/user123/video.mp4")
    assert resolved.startswith(MEDIA_TEMP_DIR)
    assert resolved.endswith("video.mp4")


def test_resolve_safe_local_path_blocks_directory_traversal():
    """Directory traversal keys (../) must be rejected with HTTP 400."""
    with pytest.raises(HTTPException) as exc_info:
        resolve_safe_local_path("../../../etc/shadow")
    assert exc_info.value.status_code == 400
    assert "directory traversal" in exc_info.value.detail.lower()


def test_sanitize_filename_strips_traversal():
    """sanitize_filename must strip path components and preserve safe extensions."""
    clean = sanitize_filename("../../malicious_payload.mp4")
    assert "/" not in clean
    assert "\\" not in clean
    assert ".." not in clean
    assert clean.endswith(".mp4")

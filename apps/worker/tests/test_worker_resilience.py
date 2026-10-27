"""
Unit Tests for Worker & Pipeline Resilience (Phase 3)
Verifies:
1. Ingest manager caps streaming retries to 4 attempts and does not infinite loop.
2. Media extractor raises descriptive ValueError for audio-less videos.
3. Media extractor produces silent audio fallback when allow_silent_fallback=True.
4. Video pipeline circuit breaker filters out deterministic errors and only retries transient network errors.
"""

import os
import socket
import pytest
from unittest.mock import MagicMock, patch
import requests

from services.ingest_manager import stage_raw_video
from services.media_extractor import extract_audio_track, generate_silent_audio


def test_ingest_streaming_caps_retries_on_network_error(tmp_path):
    """stage_raw_video must cap HTTP retries to 4 attempts and raise FileNotFoundError on exhaustion."""
    dest_path = str(tmp_path / "raw_video.mp4")
    temp_dir = str(tmp_path)

    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Network down")) as mock_get:
        with patch("time.sleep") as mock_sleep:
            with pytest.raises(FileNotFoundError) as exc_info:
                stage_raw_video("https://cdn.example.com/stream.mp4", dest_path, temp_dir)

            assert mock_get.call_count == 4
            assert mock_sleep.call_count == 3
            assert "Could not stage raw video" in str(exc_info.value)


def test_media_extractor_raises_descriptive_error_on_audio_less_video(tmp_path):
    """extract_audio_track must raise descriptive ValueError when video lacks audio track."""
    video_path = str(tmp_path / "silent_video.mp4")
    wav_path = str(tmp_path / "output.wav")
    
    # Write a dummy file >= 1024 bytes so size check passes
    with open(video_path, "wb") as f:
        f.write(b"0" * 2048)

    import ffmpeg
    err_stream_mock = ffmpeg.Error(
        cmd=["ffmpeg"],
        stdout=b"",
        stderr=b"Output file #0 does not contain any stream. Stream map '0:a' matches no streams.",
    )

    with patch("ffmpeg.run", side_effect=err_stream_mock):
        with pytest.raises(ValueError) as exc_info:
            extract_audio_track(video_path, wav_path, allow_silent_fallback=False)
        assert "contains no audio track" in str(exc_info.value)


def test_media_extractor_generates_silent_fallback_when_allowed(tmp_path):
    """extract_audio_track generates silent audio when allow_silent_fallback=True."""
    video_path = str(tmp_path / "silent_video.mp4")
    wav_path = str(tmp_path / "output.wav")

    with open(video_path, "wb") as f:
        f.write(b"0" * 2048)

    import ffmpeg
    err_stream_mock = ffmpeg.Error(
        cmd=["ffmpeg"],
        stdout=b"",
        stderr=b"Stream map '0:a' matches no streams.",
    )

    with patch("ffmpeg.run", side_effect=err_stream_mock):
        with patch("services.media_extractor.generate_silent_audio", return_value=wav_path) as mock_gen_silent:
            result = extract_audio_track(video_path, wav_path, allow_silent_fallback=True)
            assert result == wav_path
            assert mock_gen_silent.called


def test_circuit_breaker_exception_classification():
    """Verify transient vs deterministic exception classification using is_retryable_exception."""
    from tasks.video_pipeline import is_retryable_exception

    # Transient exceptions must be classified as retryable (True)
    assert is_retryable_exception(requests.exceptions.Timeout("Connection timeout")) is True
    assert is_retryable_exception(requests.exceptions.ConnectionError("Connection reset")) is True
    assert is_retryable_exception(ConnectionError("Broker connection lost")) is True
    assert is_retryable_exception(TimeoutError("Socket deadline exceeded")) is True
    assert is_retryable_exception(socket.gaierror("DNS lookup failure")) is True

    # Deterministic exceptions must NOT be classified as retryable (False)
    assert is_retryable_exception(ValueError("Invalid video aspect ratio")) is False
    assert is_retryable_exception(FileNotFoundError("Video file missing")) is False
    assert is_retryable_exception(KeyError("script_text")) is False
    assert is_retryable_exception(TypeError("NoneType object is not subscriptable")) is False
    assert is_retryable_exception(PermissionError("Read only access")) is False

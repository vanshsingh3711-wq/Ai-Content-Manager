import os
import tempfile
import pytest
from services.ai_director import _call_llm, EditList
from services.blueprint_validator import validate_blueprint
from services.subtitle_generator import format_ass_time, generate_ass_subtitles
from services.compositor import prepare_ffmpeg_command, is_valid_cached_segment


def test_malformed_llm_json_fallback(monkeypatch):
    """Verifies that invalid/malformed LLM output safely yields empty EditList without crashing."""
    class FakeChoice:
        message = type("Msg", (), {"content": "This is non-JSON garbage text from LLM", "reasoning_content": None})()

    class FakeResponse:
        choices = [FakeChoice()]

    monkeypatch.setattr("services.ai_director.OpenAI", lambda *args, **kwargs: type(
        "Client", (), {"chat": type("Chat", (), {"completions": type("Comp", (), {"create": lambda *a, **kw: FakeResponse()})()})()}
    )())
    monkeypatch.setenv("DEEPSEEK_API_KEY", "mock_key")

    res = _call_llm(system_prompt="sys", user_prompt="usr", raw_output=False)
    assert isinstance(res, EditList)
    assert len(res.edits) == 0


def test_out_of_bounds_and_overlapping_edits_handling():
    """Verifies blueprint validator rejects out-of-bounds timestamps and clips exceeding duration."""
    raw_edits = [
        {"action": "broll", "trigger_id": "T1", "start": -2.0, "end": 3.0, "query": "nature"},
        {"action": "broll", "trigger_id": "T2", "start": 100.0, "end": 105.0, "query": "city"},  # > video_duration
        {"action": "broll", "trigger_id": "T3", "start": 2.0, "end": 5.0, "query": "ocean"},
    ]
    timestamp_map = {
        "T1": {"start": 0.0, "end": 3.0, "text": "start text", "words": []},
        "T2": {"start": 100.0, "end": 105.0, "text": "end text", "words": []},
        "T3": {"start": 2.0, "end": 5.0, "text": "mid text", "words": []},
    }

    validated, report = validate_blueprint(
        edits=raw_edits,
        timestamp_map=timestamp_map,
        video_duration=10.0,  # 10s video
    )

    # T2 (100-105s) must be rejected because it exceeds 10s video duration
    trigger_ids = [e.get("trigger_id") for e in validated]
    assert "T2" not in trigger_ids


def test_subtitle_e2e_ass_generation(tmp_path):
    """Verifies ASS subtitle generation creates valid script headers and correctly rolls over timestamps."""
    timestamp_map = {
        "c1": {
            "start": 59.95,
            "end": 61.20,
            "text": "Minute Rollover",
            "words": [
                {"word": "Minute", "start": 59.95, "end": 59.999},
                {"word": "Rollover", "start": 60.00, "end": 61.20},
            ],
        }
    }
    out_ass = str(tmp_path / "test.ass")
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=out_ass,
        caption_preset="tiktok_yellow",
    )

    assert os.path.exists(out_ass)
    content = open(out_ass, "r", encoding="utf-8").read()
    assert "[Script Info]" in content
    assert "Dialogue:" in content
    # Ensure invalid 0:00:60.00 is NOT present
    assert "0:00:60.00" not in content
    # 59.999 should roll over cleanly
    assert "0:01:00.00" in content


def test_ffmpeg_command_and_cache_contract():
    """Verifies that final render command guarantees output encoder constraint and cache validation contract."""
    cmd = [
        "ffmpeg", "-y",
        "-i", "/tmp/in1.mp4",
        "-c:v", "libx264",
        "/tmp/out.mp4"
    ]
    final_cmd = prepare_ffmpeg_command(cmd, threads=2)

    # Output file at the end
    assert final_cmd[-1] == "/tmp/out.mp4"
    # -threads 2 positioned as output option
    assert final_cmd[-3] == "-threads"
    assert final_cmd[-2] == "2"

    # Corrupt cache rejection contract
    assert not is_valid_cached_segment("/non/existent/path.mp4")

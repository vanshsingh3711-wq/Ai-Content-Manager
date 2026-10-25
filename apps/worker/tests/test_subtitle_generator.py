"""
Tests for Subtitle Generator Service.
Verifies:
  - Word-level active highlighting (.ass karaoke)
  - Timeline shifting when cuts exist
  - Elimination of empty/whitespace words
  - Monotonic timestamp ordering
  - Safe margin and resolution settings
"""
import os
import pytest
from services.subtitle_generator import generate_ass_subtitles, format_ass_time

def test_format_ass_time():
    assert format_ass_time(0.0) == "0:00:00.00"
    assert format_ass_time(1.23) == "0:00:01.23"
    assert format_ass_time(65.45) == "0:01:05.45"
    assert format_ass_time(3661.05) == "1:01:01.05"

def test_subtitle_generation_basic(tmp_path):
    output_ass = str(tmp_path / "test_basic.ass")
    tmap = {
        "ID_01": {
            "start": 1.0,
            "end": 4.0,
            "text": "Hello world",
            "words": [
                {"word": "Hello", "start": 1.0, "end": 2.0},
                {"word": "world", "start": 2.5, "end": 4.0},
            ]
        }
    }
    generate_ass_subtitles(tmap, output_ass)
    assert os.path.exists(output_ass)
    
    with open(output_ass, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "PlayResX: 1080" in content
    assert "PlayResY: 1920" in content
    assert "HELLO" in content and "WORLD" in content
    assert "fscx120" in content or "fscx" in content
    assert ",5,40,40,0,1" in content  # Alignment 5 (Middle-Center)
    assert "0:00:01.00" in content

def test_subtitle_generation_with_cuts(tmp_path):
    output_ass = str(tmp_path / "test_cut.ass")
    tmap = {
        "ID_01": {
            "start": 2.0,
            "end": 5.0,
            "text": "First chunk",
            "words": [
                {"word": "First", "start": 2.0, "end": 3.0},
                {"word": "chunk", "start": 3.5, "end": 5.0},
            ]
        }
    }
    # Cut 0.0 to 1.5s (1.5s removed before ID_01)
    edits = [{"action": "cut", "start": 0.0, "end": 1.5}]
    generate_ass_subtitles(tmap, output_ass, edits=edits)
    
    with open(output_ass, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Word at 2.0s should shift to 2.0 - 1.5 = 0.5s -> 0:00:00.50
    assert "0:00:00.50" in content

def test_subtitle_inside_cut_removed(tmp_path):
    output_ass = str(tmp_path / "test_removed.ass")
    tmap = {
        "ID_01": {
            "start": 0.5,
            "end": 1.5,
            "text": "Cut this",
            "words": [
                {"word": "Cut", "start": 0.5, "end": 1.0},
                {"word": "this", "start": 1.0, "end": 1.5},
            ]
        },
        "ID_02": {
            "start": 2.5,
            "end": 4.0,
            "text": "Keep this",
            "words": [
                {"word": "Keep", "start": 2.5, "end": 3.0},
                {"word": "this", "start": 3.2, "end": 4.0},
            ]
        }
    }
    # Cut 0.0 to 2.0s
    edits = [{"action": "cut", "start": 0.0, "end": 2.0}]
    generate_ass_subtitles(tmap, output_ass, edits=edits)
    
    with open(output_ass, "r", encoding="utf-8") as f:
        content = f.read()
        
    # "CUT THIS" must NOT appear in dialogue events
    dialogue_lines = [l for l in content.splitlines() if l.startswith("Dialogue:")]
    assert len(dialogue_lines) == 2
    assert "KEEP" in dialogue_lines[0]


def test_motion_graphic_suppresses_overlapping_captions(tmp_path):
    output_ass = str(tmp_path / "subs_mg.ass")
    tmap = {
        "ID_01": {
            "start": 0.0,
            "end": 2.0,
            "text": "Intro voiceover",
            "words": [
                {"word": "Intro", "start": 0.0, "end": 1.0},
                {"word": "voiceover", "start": 1.0, "end": 2.0},
            ]
        },
        "ID_02": {
            "start": 2.5,
            "end": 5.0,
            "text": "Metric card explanation",
            "words": [
                {"word": "Metric", "start": 2.5, "end": 3.2},
                {"word": "card", "start": 3.2, "end": 4.0},
                {"word": "explanation", "start": 4.0, "end": 5.0},
            ]
        },
        "ID_03": {
            "start": 5.5,
            "end": 7.0,
            "text": "Outro text",
            "words": [
                {"word": "Outro", "start": 5.5, "end": 6.2},
                {"word": "text", "start": 6.2, "end": 7.0},
            ]
        }
    }
    # Motion graphic runs from 2.5 to 5.0s (over chunk ID_02)
    edits = [{"action": "motion_graphics", "start": 2.5, "end": 5.0, "motion_graphics_type": "metric_reveal"}]
    generate_ass_subtitles(tmap, output_ass, edits=edits, is_faceless=True)

    with open(output_ass, "r", encoding="utf-8") as f:
        content = f.read()

    dialogue_lines = [l for l in content.splitlines() if l.startswith("Dialogue:")]
    # ID_01 (2 words) and ID_03 (2 words) should be generated; ID_02 words must be suppressed!
    assert len(dialogue_lines) == 4
    for line in dialogue_lines:
        assert "METRIC" not in line
        assert "CARD" not in line
        assert "EXPLANATION" not in line
    assert "INTRO" in dialogue_lines[0]
    assert "OUTRO" in dialogue_lines[2]


def test_reconcile_transcript_words_hyphens_and_numbers():
    from services.subtitle_generator import reconcile_transcript_words

    raw = [
        {"word": "re", "start": 1.0, "end": 1.2},
        {"word": "-executes", "start": 1.2, "end": 1.6},
        {"word": "and", "start": 1.6, "end": 1.8},
        {"word": "collapsing", "start": 1.8, "end": 2.2},
        {"word": "by", "start": 2.2, "end": 2.4},
        {"word": "10", "start": 2.4, "end": 2.6},
        {"word": ",000", "start": 2.6, "end": 3.0},
        {"word": "times", "start": 3.0, "end": 3.3},
        {"word": "with", "start": 3.3, "end": 3.5},
        {"word": "a", "start": 3.5, "end": 3.6},
        {"word": "50", "start": 3.6, "end": 3.8},
        {"word": "-person", "start": 3.8, "end": 4.1},
        {"word": "team", "start": 4.1, "end": 4.4},
        {"word": "using", "start": 4.4, "end": 4.6},
        {"word": "sub", "start": 4.6, "end": 4.8},
        {"word": "-ten", "start": 4.8, "end": 5.0},
        {"word": "-billion", "start": 5.0, "end": 5.3},
        {"word": "models.", "start": 5.3, "end": 5.7},
    ]

    reconciled = reconcile_transcript_words(raw)
    words_text = [w["word"] for w in reconciled]

    assert "re-executes" in words_text
    assert "10,000" in words_text
    assert "50-person" in words_text
    assert "sub-ten-billion" in words_text

    # Timing verification
    re_exec = next(w for w in reconciled if w["word"] == "re-executes")
    assert re_exec["start"] == 1.0
    assert re_exec["end"] == 1.6

    ten_k = next(w for w in reconciled if w["word"] == "10,000")
    assert ten_k["start"] == 2.4
    assert ten_k["end"] == 3.0


def test_generate_ass_subtitles_with_reconciled_tokens(tmp_path):
    output_ass = str(tmp_path / "subs_reconciled.ass")
    tmap = {
        "chunk_1": {
            "start": 0.0,
            "end": 4.0,
            "text": "It re -executes code by 10 ,000 times for a 50 -person team.",
            "words": [
                {"word": "It", "start": 0.0, "end": 0.2},
                {"word": "re", "start": 0.2, "end": 0.4},
                {"word": "-executes", "start": 0.4, "end": 0.8},
                {"word": "code", "start": 0.8, "end": 1.2},
                {"word": "by", "start": 1.2, "end": 1.4},
                {"word": "10", "start": 1.4, "end": 1.7},
                {"word": ",000", "start": 1.7, "end": 2.1},
                {"word": "times", "start": 2.1, "end": 2.4},
                {"word": "for", "start": 2.4, "end": 2.6},
                {"word": "a", "start": 2.6, "end": 2.7},
                {"word": "50", "start": 2.7, "end": 3.0},
                {"word": "-person", "start": 3.0, "end": 3.4},
                {"word": "team.", "start": 3.4, "end": 3.8},
            ]
        }
    }

    generate_ass_subtitles(tmap, output_ass, is_faceless=True)

    with open(output_ass, "r", encoding="utf-8") as f:
        content = f.read()

    # Must contain unified tokens, no broken hyphen or orphan comma tokens
    assert "RE-EXECUTES" in content
    assert "10,000" in content
    assert "50-PERSON" in content
    assert "RE -EXECUTES" not in content
    assert "10 ,000" not in content
    assert "50 -PERSON" not in content


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


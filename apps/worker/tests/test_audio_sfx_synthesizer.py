import os
import tempfile
import pytest
from services.audio_sfx_synthesizer import (
    SFX_PRESETS,
    synthesize_cue,
    synthesize_project_sfx_library,
    measure_speech_db,
    recommend_sfx_for_action,
    resolve_cue_name,
)

def test_resolve_cue_name():
    assert resolve_cue_name("whoosh") == "whoosh-in"
    assert resolve_cue_name("swoosh") == "whoosh-in"
    assert resolve_cue_name("exit") == "whoosh-out"
    assert resolve_cue_name("punch") == "zoom"
    assert resolve_cue_name("stat") == "hit"
    assert resolve_cue_name("keyboard") == "tick"
    assert resolve_cue_name("toast") == "ding"
    assert resolve_cue_name("unknown_sound") == "whoosh-in"

def test_synthesize_all_presets():
    with tempfile.TemporaryDirectory() as temp_dir:
        for preset_name in SFX_PRESETS:
            out_file = os.path.join(temp_dir, f"{preset_name}.wav")
            info = synthesize_cue(preset_name, out_file, speech_level_db=-20.0)
            
            assert os.path.exists(out_file), f"File {out_file} was not created"
            assert os.path.getsize(out_file) > 1000, f"File {out_file} is too small"
            assert info["name"] == preset_name
            assert 0.0 <= info["attack_s"] <= 0.7
            assert info["db"] <= -1.0

def test_synthesize_project_sfx_library():
    with tempfile.TemporaryDirectory() as temp_dir:
        kit = synthesize_project_sfx_library(temp_dir, speech_level_db=-22.5)
        
        assert os.path.exists(os.path.join(temp_dir, "kit.json"))
        assert kit["speech_db"] == -22.5
        assert len(kit["cues"]) == len(SFX_PRESETS)
        for cue_name in SFX_PRESETS:
            assert cue_name in kit["cues"]
            assert os.path.exists(kit["cues"][cue_name]["path"])

def test_recommend_sfx_for_action():
    assert recommend_sfx_for_action({"action": "zoom_in"}) == "zoom"
    assert recommend_sfx_for_action({"action": "sfx", "sound_effect": "ding"}) == "ding"
    assert recommend_sfx_for_action({"action": "motion_graphics", "motion_graphics_type": "cooked_likes"}) == "hit"
    assert recommend_sfx_for_action({"action": "motion_graphics", "motion_graphics_type": "cooked_toasts"}) == "ding"
    assert recommend_sfx_for_action({"action": "motion_graphics", "motion_graphics_type": "cooked_terminal"}) == "tick"
    assert recommend_sfx_for_action({"action": "motion_graphics", "motion_graphics_type": "hero_reveal"}) == "whoosh-in"

def test_measure_speech_db_fallback():
    # Non-existent file should gracefully return default -21.0 dB
    assert measure_speech_db("/path/does/not/exist.mp4") == -21.0

def test_generate_sfx_plan_integration():
    from services.ai_director import EditList, EditDecision
    from services.sfx_planner import generate_sfx_plan

    initial_edits = EditList(edits=[
        EditDecision(action="motion_graphics", trigger_id="b1", start=1.0, end=3.0, motion_graphics_type="cooked_likes"),
        EditDecision(action="zoom_in", trigger_id="b2", start=4.5, end=5.5),
        EditDecision(action="motion_graphics", trigger_id="b3", start=8.0, end=10.0, motion_graphics_type="cooked_toasts"),
    ])

    result = generate_sfx_plan("{}", initial_edits)
    sfx_items = [e for e in result.edits if e.action == "sfx"]
    assert len(sfx_items) == 3
    assert sfx_items[0].sound_effect == "hit"   # for cooked_likes
    assert sfx_items[1].sound_effect == "zoom"  # for zoom_in
    assert sfx_items[2].sound_effect == "ding"  # for cooked_toasts

def test_fetch_sfx_procedural_fallback():
    from services.sfx_manager import fetch_sfx
    with tempfile.TemporaryDirectory() as temp_dir:
        out_file = os.path.join(temp_dir, "custom_whoosh.wav")
        # Keyword not in local clips directory should procedurally synthesize
        res = fetch_sfx("whoosh-out", out_file)
        assert res is True
        assert os.path.exists(out_file)
        assert os.path.getsize(out_file) > 1000

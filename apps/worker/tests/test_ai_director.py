import pytest
from services.ai_director import SYSTEM_PROMPT

def test_system_prompt_contains_audio_analysis_rules():
    """Verify that the AI Director prompt includes the new audio analysis rules."""
    
    assert "AUDIO ANALYSIS RULES:" in SYSTEM_PROMPT
    assert "'SPEECH': Treat as spoken content. Do not cut through meaningful speech." in SYSTEM_PROMPT
    assert "'SILENCE': Represents genuinely quiet audio." in SYSTEM_PROMPT
    assert "'NON_SPEECH_AUDIO': Represents audible music/noise/audio without detected speech." in SYSTEM_PROMPT
    assert "audio_analysis.regions" in SYSTEM_PROMPT
    assert "do not make decisions based on audio_analysis alone" in SYSTEM_PROMPT

def test_system_prompt_contains_pacing_rules():
    """Verify that the AI Director prompt includes the conservative pacing rules."""
    
    assert "PACING RULES:" in SYSTEM_PROMPT
    assert "Optimize pacing for short-form video while preserving natural speech." in SYSTEM_PROMPT
    assert "Beginning:" in SYSTEM_PROMPT
    assert "Between speech:" in SYSTEM_PROMPT
    assert "Ending:" in SYSTEM_PROMPT
    assert "Do not cut: meaningful speech, intentional music transitions" in SYSTEM_PROMPT
    assert "Prefer shorter trims:" in SYSTEM_PROMPT
    assert "NON_SPEECH_AUDIO is NOT automatically a cut." in SYSTEM_PROMPT
    assert "Preserve natural pacing." in SYSTEM_PROMPT

def test_system_prompt_contains_broll_rules():
    """Verify that the AI Director prompt includes the relaxed B-roll rules."""
    
    assert "B-roll is OPTIONAL but VALUABLE" in SYSTEM_PROMPT
    assert "visually reinforces an important concept" in SYSTEM_PROMPT
    assert "adds meaningful visual variety" in SYSTEM_PROMPT
    assert "approximately 1-3 strongest B-roll opportunities" in SYSTEM_PROMPT
    assert "Do NOT add B-roll merely because a keyword appears." in SYSTEM_PROMPT
    assert "If the original footage already visually demonstrates the concept, prefer keeping it." in SYSTEM_PROMPT

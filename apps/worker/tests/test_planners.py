import json
import pytest
from unittest.mock import patch
from pydantic import ValidationError
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.visual_analysis.schemas import UnifiedAnalysis, UnifiedVisualTimeline

def get_base_unified_analysis(with_beat_sheet=False):
    timeline = UnifiedVisualTimeline(video_id="test")
    ua = UnifiedAnalysis(transcript="Test transcript", visual_analysis=timeline)
    
    if with_beat_sheet:
        ua.beat_sheet = {
            "beats": [
                {
                    "id": 1,
                    "start": 0.0,
                    "end": 2.0,
                    "importance": 5,
                    "concreteness": "concrete",
                    "role": "hook"
                }
            ]
        }
    return ua

@patch("services.broll_planner._call_llm")
def test_broll_planner_prompts(mock_call_llm):
    from services.ai_director import EditList, EditDecision
    mock_call_llm.return_value = EditList(edits=[])
    
    # Test WITHOUT beat sheet
    ua_no_beats = get_base_unified_analysis(with_beat_sheet=False).model_dump_json()
    generate_broll_plan(ua_no_beats)
    call_args = mock_call_llm.call_args[0]
    system_prompt_no_beats = call_args[0]
    
    assert "BEAT SHEET INTEGRATION (STRICT):" not in system_prompt_no_beats
    
    # Test WITH beat sheet
    ua_beats = get_base_unified_analysis(with_beat_sheet=True).model_dump_json()
    generate_broll_plan(ua_beats)
    call_args = mock_call_llm.call_args[0]
    system_prompt_beats = call_args[0]
    
    assert "BEAT SHEET INTEGRATION (STRICT):" in system_prompt_beats
    
    # The part before the injection should be perfectly identical
    assert system_prompt_beats.startswith(system_prompt_no_beats)


@patch("services.motion_graphic_planner._call_llm")
def test_mg_planner_prompts(mock_call_llm):
    from services.ai_director import EditList, EditDecision
    mock_call_llm.return_value = EditList(edits=[])
    
    # Test WITHOUT beat sheet
    ua_no_beats = get_base_unified_analysis(with_beat_sheet=False).model_dump_json()
    generate_motion_graphics_plan(ua_no_beats)
    call_args = mock_call_llm.call_args[0]
    system_prompt_no_beats = call_args[0]
    
    assert "BEAT SHEET INTEGRATION (STRICT):" not in system_prompt_no_beats
    
    # Test WITH beat sheet
    ua_beats = get_base_unified_analysis(with_beat_sheet=True).model_dump_json()
    generate_motion_graphics_plan(ua_beats)
    call_args = mock_call_llm.call_args[0]
    system_prompt_beats = call_args[0]
    
    assert "BEAT SHEET INTEGRATION (STRICT):" in system_prompt_beats
    
    assert system_prompt_beats.startswith(system_prompt_no_beats)

def test_unified_analysis_optional_beat_sheet():
    # Should not raise any error
    json_str = '{"transcript": "hello", "visual_analysis": {"video_id": "1"}}'
    ua = UnifiedAnalysis.model_validate_json(json_str)
    assert ua.beat_sheet == {} or ua.beat_sheet is None

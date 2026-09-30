import pytest
import json
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.ai_director import EditList, EditDecision
from unittest.mock import patch

def test_template_whitelist_rejected():
    ua_json = json.dumps({
        "transcript": "Hello world",
        "visual_analysis": {"video_id": "test"},
        "beat_sheet": {
            "beats": [
                {"id": 1, "text": "Hello world", "start": 0.0, "end": 2.0}
            ]
        }
    })
    
    with patch("services.motion_graphic_planner._call_llm") as mock_llm:
        mock_llm.return_value = EditList(edits=[
            EditDecision(
                action="motion_graphics",
                trigger_id="beat_1",
                start=0.0,
                end=2.0,
                motion_graphics_type="unknown_template",
                motion_graphics_targets={"text": "hello"}
            )
        ])
        
        with pytest.raises(RuntimeError, match="uses template 'unknown_template' which has no draw function"):
            generate_motion_graphics_plan(ua_json)

def test_before_after_rule():
    # beat 4 passes
    ua_json_4 = json.dumps({
        "transcript": "programmed with explicit rules vs learning from examples",
        "visual_analysis": {"video_id": "test"},
        "beat_sheet": {
            "beats": [
                {"id": 4, "text": "programmed with explicit rules vs learning from examples", "start": 0.0, "end": 2.0}
            ]
        }
    })
    
    # beat 6 fails
    ua_json_6 = json.dumps({
        "transcript": "AI does the exact same thing, but it uses massive amounts of data and adjusts numbers called weights.",
        "visual_analysis": {"video_id": "test"},
        "beat_sheet": {
            "beats": [
                {"id": 6, "text": "AI does the exact same thing, but it uses massive amounts of data and adjusts numbers called weights.", "start": 0.0, "end": 2.0}
            ]
        }
    })
    
    with patch("services.motion_graphic_planner._call_llm") as mock_llm:
        mock_llm.return_value = EditList(edits=[
            EditDecision(
                action="motion_graphics",
                trigger_id="beat_4",
                start=0.0,
                end=2.0,
                motion_graphics_type="before_after",
                motion_graphics_targets={"beforeLabel": "programmed", "afterLabel": "learn"}
            )
        ])
        
        # should pass without raising
        result = generate_motion_graphics_plan(ua_json_4)
        assert len(result.edits) == 1

        mock_llm.return_value = EditList(edits=[
            EditDecision(
                action="motion_graphics",
                trigger_id="beat_6",
                start=0.0,
                end=2.0,
                motion_graphics_type="before_after",
                motion_graphics_targets={"beforeLabel": "programmed", "afterLabel": "learn"}
            )
        ])
        
        with pytest.raises(RuntimeError, match="does not contain a strong contrast keyword"):
            generate_motion_graphics_plan(ua_json_6)


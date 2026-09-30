import pytest
from pydantic import BaseModel
from services.motion_graphic_planner import _call_llm

class MockEdit(BaseModel):
    action: str = "motion_graphics"
    trigger_id: str
    motion_graphics_type: str = "quote_reveal"
    motion_graphics_targets: dict
    
class MockResult(BaseModel):
    edits: list[MockEdit]

def mock_call_llm(system_prompt, context, ai_model_pref):
    # Depending on test case, return a mock result
    # We will patch this in the test
    pass

def test_text_validator(monkeypatch):
    beat_sheet = {
        "beats": [
            {"id": "1", "text": "This is beat one", "focus_phrase": "beat one"},
            {"id": "10", "text": "Welcome to a quick explainer on how artificial intelligence actually learns", "focus_phrase": "artificial intelligence learns"}
        ]
    }
    
    # We want to run the planner logic to see if it generates validation errors.
    # Since planner has a loop and calls LLM, we can just extract the validation block or patch LLM.
    from services.motion_graphic_planner import generate_motion_graphics_plan as plan_motion_graphics
    
    # Case 1: Edit for beat 10 with correct words
    good_result = MockResult(edits=[
        MockEdit(trigger_id="beat_10", motion_graphics_targets={"quote": "explainer on artificial intelligence learns"})
    ])
    
    calls = []
    def mock_llm_good(*args):
        calls.append(1)
        return good_result
        
    monkeypatch.setattr("services.motion_graphic_planner._call_llm", mock_llm_good)
    
    import json
    res = plan_motion_graphics(json.dumps({"beat_sheet": beat_sheet}), "mock_model")
    # Should pass on first attempt
    assert len(calls) == 1
    
    # Case 2: Edit for beat 1 with the same words (should fail and retry 3 times)
    bad_result = MockResult(edits=[
        MockEdit(trigger_id="beat_1", motion_graphics_targets={"quote": "explainer on artificial intelligence learns"})
    ])
    
    calls.clear()
    def mock_llm_bad(*args):
        calls.append(1)
        return bad_result
        
    monkeypatch.setattr("services.motion_graphic_planner._call_llm", mock_llm_bad)
    
    import json
    res = plan_motion_graphics(json.dumps({"beat_sheet": beat_sheet}), "mock_model")
    # Should fail and retry max_retries (3) times
    assert len(calls) == 3

def test_number_validator(monkeypatch):
    beat_sheet = {
        "beats": [
            {"id": "1", "text": "I have ten apples", "focus_phrase": ""}, # no digits
            {"id": "2", "text": "I have 10 apples and 20 oranges", "focus_phrase": ""}
        ]
    }
    
    from services.motion_graphic_planner import generate_motion_graphics_plan as plan_motion_graphics
    
    # Bad case: beat 1 with chart_reveal
    bad_result = MockResult(edits=[
        MockEdit(trigger_id="beat_1", motion_graphics_type="chart_reveal", motion_graphics_targets={"data": [10, 20]})
    ])
    
    calls = []
    def mock_llm_bad(*args):
        calls.append(1)
        return bad_result
    
    monkeypatch.setattr("services.motion_graphic_planner._call_llm", mock_llm_bad)
    import json
    plan_motion_graphics(json.dumps({"beat_sheet": beat_sheet}), "mock_model")
    assert len(calls) == 3
    
    # Good case: beat 2 with chart_reveal and matching digits
    good_result = MockResult(edits=[
        MockEdit(trigger_id="beat_2", motion_graphics_type="chart_reveal", motion_graphics_targets={"data": [10, 20]})
    ])
    
    calls.clear()
    def mock_llm_good(*args):
        calls.append(1)
        return good_result
        
    monkeypatch.setattr("services.motion_graphic_planner._call_llm", mock_llm_good)
    import json
    plan_motion_graphics(json.dumps({"beat_sheet": beat_sheet}), "mock_model")
    assert len(calls) == 1

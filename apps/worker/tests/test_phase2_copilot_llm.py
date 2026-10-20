import pytest
from services.copilot_llm import (
    CopilotIntentProposal,
    reason_copilot_intent,
    _semantic_heuristic_fallback,
    _clean_json_text,
)


def test_copilot_intent_proposal_schema_validation():
    # Valid proposal
    valid_data = {
        "intent": "add_graphic",
        "confidence": 0.95,
        "start_time": 10.0,
        "end_time": 12.0,
        "action_type": "graphic",
        "summary": "Animated upload graphic from 10.0s to 12.0s",
        "graphic_template": "app_screen_upload",
        "graphic_props": {"title": "VIDEO UPLOAD", "fileName": "video.mp4"},
        "search_query": None,
        "clarification_prompt": None,
        "suggested_actions": ["Add animated app upload graphic"],
    }
    proposal = CopilotIntentProposal(**valid_data)
    assert proposal.intent == "add_graphic"
    assert proposal.start_time == 10.0
    assert proposal.end_time == 12.0
    assert proposal.graphic_template == "app_screen_upload"

    # Invalid confidence range (> 1.0)
    with pytest.raises(Exception):
        invalid_data = dict(valid_data)
        invalid_data["confidence"] = 1.5
        CopilotIntentProposal(**invalid_data)


def test_clean_json_text_strips_markdown_and_think_tags():
    raw_response = """<think>
User is asking for an upload animation.
We should use app_screen_upload template.
</think>
```json
{
  "intent": "add_graphic",
  "confidence": 0.9,
  "start_time": 10.0,
  "end_time": 12.0,
  "action_type": "graphic",
  "summary": "App upload graphic"
}
```"""
    cleaned = _clean_json_text(raw_response)
    assert "<think>" not in cleaned
    assert "```" not in cleaned
    assert '"intent": "add_graphic"' in cleaned


def test_copilot_llm_typo_and_explicit_time():
    # Prompt with typo 'vidoe' and explicit time 'from 10s to 12s'
    context = {
        "playhead_time": 25.0,
        "duration": 60.0,
        "aspect_ratio": "9:16",
        "active_transcript_words": [{"word": "uploading", "start": 9.8, "end": 10.4}],
    }
    proposal = reason_copilot_intent(
        "i want a screen in which user is uploading vidoe on screen. from 10s to 12s",
        context
    )

    assert proposal.intent in ["add_broll", "add_graphic"]
    assert proposal.start_time == 10.0
    assert proposal.end_time == 12.0
    assert proposal.confidence >= 0.8


def test_copilot_llm_app_screen_upload_motion_graphic():
    context = {"playhead_time": 5.0, "duration": 60.0, "aspect_ratio": "9:16"}
    proposal = reason_copilot_intent(
        "i want a screen in which user is uploading video on app . add this motion graphics",
        context
    )

    assert proposal.intent == "add_graphic"
    assert proposal.action_type == "graphic"
    assert proposal.graphic_template == "app_screen_upload"


def test_copilot_llm_web_evidence_intent():
    context = {"playhead_time": 15.0, "duration": 60.0}
    proposal = reason_copilot_intent(
        "Show the article from https://techcrunch.com/article-name at 15s",
        context
    )

    assert proposal.intent == "capture_web_evidence"
    assert proposal.graphic_template == "browser_walkthrough"
    assert proposal.start_time == 15.0


def test_copilot_llm_ambiguous_prompt_clarification():
    context = {"playhead_time": 10.0, "duration": 60.0}
    proposal = reason_copilot_intent(
        "can you make this look much more aesthetic and vibrant",
        context
    )

    assert proposal.intent == "clarification_needed"
    assert proposal.clarification_prompt is not None
    assert proposal.suggested_actions is not None
    assert len(proposal.suggested_actions) >= 2


def test_copilot_semantic_heuristic_fallback():
    # Fallback when offline
    fallback_upload = _semantic_heuristic_fallback(
        "add animated upload card from 5s to 9s",
        playhead=0.0,
        duration=30.0
    )
    assert fallback_upload.intent == "add_graphic"
    assert fallback_upload.graphic_template == "app_screen_upload"
    assert fallback_upload.start_time == 5.0
    assert fallback_upload.end_time == 9.0

    fallback_ambiguous = _semantic_heuristic_fallback(
        "make it look cooler",
        playhead=12.0,
        duration=40.0
    )
    assert fallback_ambiguous.intent == "clarification_needed"
    assert fallback_ambiguous.suggested_actions is not None

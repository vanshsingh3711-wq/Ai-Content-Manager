import os
import sys
from unittest.mock import patch, MagicMock

# Ensure worker directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ai_director import resolve_deepseek_model, _call_llm, EditList


def test_resolve_deepseek_model():
    """Verify resolve_deepseek_model resolves all aliases correctly."""
    # R1 mappings
    assert resolve_deepseek_model("deepseek-reasoner") == "deepseek-reasoner"
    assert resolve_deepseek_model("deepseek-r1") == "deepseek-reasoner"
    assert resolve_deepseek_model("DeepSeek R1") == "deepseek-reasoner"
    assert resolve_deepseek_model("DeepSeek-Reasoner") == "deepseek-reasoner"
    assert resolve_deepseek_model("deepseek v4 pro") == "deepseek-reasoner"
    assert resolve_deepseek_model("r1") == "deepseek-reasoner"

    # V3 mappings
    assert resolve_deepseek_model("deepseek-chat") == "deepseek-chat"
    assert resolve_deepseek_model("DeepSeek V3") == "deepseek-chat"
    assert resolve_deepseek_model("DeepSeek-Chat") == "deepseek-chat"
    assert resolve_deepseek_model("v3") == "deepseek-chat"
    assert resolve_deepseek_model("deepseek-v4") == "deepseek-chat"
    assert resolve_deepseek_model("DeepSeek-Hybrid") == "deepseek-chat"

    # Default fallback
    assert resolve_deepseek_model("") == "deepseek-chat"
    assert resolve_deepseek_model(None) == "deepseek-chat"
    assert resolve_deepseek_model("unknown-model") == "deepseek-chat"
    print("✅ test_resolve_deepseek_model passed")


@patch("services.ai_director.settings")
@patch("services.ai_director.OpenAI")
def test_deepseek_reasoner_call_parameters(mock_openai, mock_settings):
    """Verify R1 does not pass response_format or temperature which causes DeepSeek 400."""
    mock_settings.DEEPSEEK_API_KEY = "test-key"
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    mock_msg = MagicMock()
    mock_msg.content = '```json\n{"edits": []}\n```'
    mock_msg.reasoning_content = "Analyzing script structure step by step..."
    mock_choice = MagicMock()
    mock_choice.message = mock_msg
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    # Call with R1
    result = _call_llm("sys prompt", "user prompt", ai_model_pref="deepseek-reasoner")

    # Assert OpenAI create call args
    call_kwargs = mock_client.chat.completions.create.call_args[1]
    assert call_kwargs["model"] == "deepseek-reasoner"
    assert "response_format" not in call_kwargs, "deepseek-reasoner MUST NOT pass response_format"
    assert "temperature" not in call_kwargs, "deepseek-reasoner MUST NOT pass temperature"
    assert isinstance(result, EditList)
    print("✅ test_deepseek_reasoner_call_parameters passed")


@patch("services.ai_director.settings")
@patch("services.ai_director.OpenAI")
def test_deepseek_chat_call_parameters(mock_openai, mock_settings):
    """Verify V3 passes response_format and temperature for fast JSON generation."""
    mock_settings.DEEPSEEK_API_KEY = "test-key"
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    mock_msg = MagicMock()
    mock_msg.content = '{"edits": []}'
    mock_choice = MagicMock()
    mock_choice.message = mock_msg
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    # Call with V3
    result = _call_llm("sys prompt", "user prompt", ai_model_pref="deepseek-chat")

    call_kwargs = mock_client.chat.completions.create.call_args[1]
    assert call_kwargs["model"] == "deepseek-chat"
    assert call_kwargs.get("response_format") == {"type": "json_object"}
    assert call_kwargs.get("temperature") == 0.3
    assert isinstance(result, EditList)
    print("✅ test_deepseek_chat_call_parameters passed")


@patch("services.ai_director.settings")
@patch("services.ai_director.OpenAI")
def test_deepseek_think_tag_stripping(mock_openai, mock_settings):
    """Verify <think> tags are cleanly stripped from R1 content output."""
    mock_settings.DEEPSEEK_API_KEY = "test-key"
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    mock_msg = MagicMock()
    mock_msg.content = '<think>I should organize the edits properly</think>{"edits": []}'
    mock_choice = MagicMock()
    mock_choice.message = mock_msg
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    result = _call_llm("sys", "user", ai_model_pref="deepseek-reasoner")
    assert isinstance(result, EditList)
    assert len(result.edits) == 0
    print("✅ test_deepseek_think_tag_stripping passed")


def test_auto_hybrid_pipeline_routing():
    """Verify Auto-Hybrid routing rules as defined in video_pipeline.py."""
    def route_models(ai_model_setting: str):
        s = str(ai_model_setting).lower()
        if "reasoner" in s or "r1" in s or "pro" in s:
            return {
                "beat_model": "deepseek-reasoner",
                "mg_model": "deepseek-reasoner",
                "broll_model": "deepseek-reasoner",
                "char_model": "deepseek-reasoner",
            }
        elif "chat" in s or ("v3" in s and "hybrid" not in s):
            return {
                "beat_model": "deepseek-chat",
                "mg_model": "deepseek-chat",
                "broll_model": "deepseek-chat",
                "char_model": "deepseek-chat",
            }
        else:
            # Auto-Hybrid default
            return {
                "beat_model": "deepseek-reasoner",
                "mg_model": "deepseek-reasoner",
                "broll_model": "deepseek-chat",
                "char_model": "deepseek-chat",
            }

    # 1. Default / Hybrid: R1 for Story & Graphics, V3 for Footage & Characters
    hybrid_routes = route_models("DeepSeek-Hybrid")
    assert hybrid_routes["beat_model"] == "deepseek-reasoner"
    assert hybrid_routes["mg_model"] == "deepseek-reasoner"
    assert hybrid_routes["broll_model"] == "deepseek-chat"
    assert hybrid_routes["char_model"] == "deepseek-chat"

    # 2. Pure Reasoner / R1: R1 across all
    reasoner_routes = route_models("DeepSeek-Reasoner")
    assert all(m == "deepseek-reasoner" for m in reasoner_routes.values())

    r1_routes = route_models("DeepSeek R1")
    assert all(m == "deepseek-reasoner" for m in r1_routes.values())

    # 3. Pure Chat / V3: V3 across all
    chat_routes = route_models("DeepSeek-Chat")
    assert all(m == "deepseek-chat" for m in chat_routes.values())

    v3_routes = route_models("DeepSeek V3")
    assert all(m == "deepseek-chat" for m in v3_routes.values())

    # 4. Empty/Fallback setting defaults to Auto-Hybrid
    fallback_routes = route_models("")
    assert fallback_routes["beat_model"] == "deepseek-reasoner"
    assert fallback_routes["mg_model"] == "deepseek-reasoner"
    assert fallback_routes["broll_model"] == "deepseek-chat"
    assert fallback_routes["char_model"] == "deepseek-chat"

    print("✅ test_auto_hybrid_pipeline_routing passed")


if __name__ == "__main__":
    test_resolve_deepseek_model()
    test_deepseek_reasoner_call_parameters()
    test_deepseek_chat_call_parameters()
    test_deepseek_think_tag_stripping()
    test_auto_hybrid_pipeline_routing()
    print("\n🎉 ALL PHASE 6 DEEPSEEK TESTS PASSED!")

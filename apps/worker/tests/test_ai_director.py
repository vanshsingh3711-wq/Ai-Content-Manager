from unittest.mock import patch
from services.ai_director import _call_llm, EditList

@patch("services.ai_director.OpenAI")
def test_call_llm_default_behavior(mock_openai):
    # Setup mock to return a valid EditList JSON
    mock_client = mock_openai.return_value
    mock_response = mock_client.chat.completions.create.return_value
    mock_response.choices = [
        type("Choice", (), {"message": type("Message", (), {"content": '{"edits": []}'})})()
    ]
    
    # default raw_output=False should return EditList
    result = _call_llm("sys", "user")
    assert isinstance(result, EditList)
    assert len(result.edits) == 0

@patch("services.ai_director.OpenAI")
def test_call_llm_raw_output_behavior(mock_openai):
    # Setup mock to return any JSON
    mock_client = mock_openai.return_value
    mock_response = mock_client.chat.completions.create.return_value
    mock_response.choices = [
        type("Choice", (), {"message": type("Message", (), {"content": '{"anything": true}'})})()
    ]
    
    # raw_output=True should return string
    result = _call_llm("sys", "user", raw_output=True)
    assert isinstance(result, str)
    assert 'anything' in result

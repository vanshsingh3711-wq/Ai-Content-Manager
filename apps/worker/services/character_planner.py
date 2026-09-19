from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_character_plan(unified_analysis_json: str) -> EditList:
    system_prompt = """You are the 2D Character Planner for a video editing pipeline.
You only focus on one action: 'character' (placing a 2D character reaction/animation on screen).
Do NOT output any other actions.

RULES:
1. 'character': Use when the script calls for an emotional reaction (surprised, explaining, pointing). 
2. Provide 'trigger_id', 'character_action' (the emotion/pose), and 'reason'.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "character",
      "trigger_id": "ID_01 (Required)",
      "character_action": "surprised | explaining | pointing",
      "reason": "Why this character reaction fits the tone here"
    }
  ]
}
"""
    return _call_llm(system_prompt, f"Context:\n{unified_analysis_json}")

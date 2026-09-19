from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_broll_plan(unified_analysis_json: str) -> EditList:
    system_prompt = """You are the B-Roll & Cut Planner for a video editing pipeline.
You only focus on two actions: 'cut' (removing mistakes/silences) and 'b_roll' (overlaying stock footage).
Do NOT output any other actions.

RULES:
1. 'cut': Remove ONLY genuine mistakes or extremely long unnecessary pauses. Provide precise 'start' and 'end' timestamps.
2. 'b_roll': Use when visually reinforcing an important concept. Provide 'trigger_id', 'search_query', and a strong 'reason'.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "cut | b_roll",
      "trigger_id": "ID_01 (Required for b_roll)",
      "start": 0.0, "end": 3.75,
      "search_query": "B-roll keywords",
      "reason": "Why this b-roll works here"
    }
  ]
}
"""
    return _call_llm(system_prompt, f"Context:\n{unified_analysis_json}")

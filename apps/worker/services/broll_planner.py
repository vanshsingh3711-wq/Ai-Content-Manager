from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_broll_plan(unified_analysis_json: str) -> EditList:
    system_prompt = """You are the B-Roll & Cut Planner for a video editing pipeline.
You only focus on two actions: 'cut' (removing mistakes/silences) and 'b_roll' (overlaying stock footage).
Do NOT output any other actions.

RULES:
1. 'cut': Remove ONLY genuine mistakes or extremely long unnecessary pauses. Do NOT cut the video repeatedly in the middle of a sentence or thought. A scene should continue as long as the current visual still supports the dialogue. Keep related dialogue together. Provide precise 'start' and 'end' timestamps.
2. 'b_roll': Use when visually reinforcing an important concept. Provide 'trigger_id', 'search_query', and a strong 'reason'.
3. **Transitions**: Provide a `transition` (e.g., "fade", "crossfade", "slide", "push", "zoom", "wipe", "morph") if the incoming B-roll should blend smoothly from the previous visual. Leave null for a clean cut. Transition selection should depend on the relationship between scenes.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "cut | b_roll",
      "trigger_id": "ID_01 (Required for b_roll)",
      "start": 0.0, "end": 3.75,
      "search_query": "B-roll keywords",
      "transition": "fade",
      "reason": "Why this b-roll works here"
    }
  ]
}
"""
    print("\n[B-ROLL PLANNER] Asking LLM to find stock footage metaphors and cuts...")
    result = _call_llm(system_prompt, f"Context:\n{unified_analysis_json}")
    print(f"[B-ROLL PLANNER] LLM proposed {len(result.edits)} b-roll/cut edits.")
    return result

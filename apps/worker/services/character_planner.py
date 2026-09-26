from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_character_plan(unified_analysis_json: str) -> EditList:
    system_prompt = """You are the 2D Character Planner for a video editing pipeline.
You only focus on one action: 'character' (placing a 2D character reaction/animation on screen).
Do NOT output any other actions.

RULES:
1. 'character': Use when the script calls for an emotional reaction (surprised, explaining, pointing). 
2. Provide 'trigger_id', 'character_action' (the emotion/pose), and 'reason'.
3. **Visual Beats**: Do NOT keep the character static for long scenes. Break the dialogue into `visual_beats`. A beat occurs when the idea or emotion changes. For each beat, define `timestamp` (seconds into the chunk), `text` (relevant text), `emphasis` (e.g. nod, point, emphasis), and `animation_state` (the new emotion/pose, e.g. surprised, explaining, thinking).
4. **Transitions**: Provide a `transition` (e.g., "fade", "slide", "wipe", "morph") if the character should enter smoothly. Leave null for a clean cut.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "character",
      "trigger_id": "ID_01 (Required)",
      "character_action": "explaining",
      "transition": "fade",
      "visual_beats": [
        { "timestamp": 0.0, "text": "Let me explain", "emphasis": "intro", "animation_state": "explaining" },
        { "timestamp": 2.5, "text": "Wow!", "emphasis": "jump", "animation_state": "surprised" }
      ],
      "reason": "Why this character reaction fits the tone here"
    }
  ]
}
"""
    print("\n[CHARACTER PLANNER] Asking LLM to plan character emotions and gestures...")
    result = _call_llm(system_prompt, f"Context:\n{unified_analysis_json}")
    print(f"[CHARACTER PLANNER] LLM proposed {len(result.edits)} character reaction events.")
    return result

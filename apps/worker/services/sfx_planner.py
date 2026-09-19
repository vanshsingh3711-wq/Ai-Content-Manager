from pydantic import BaseModel
from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_sfx_plan(unified_analysis_json: str, resolved_visual_blueprint: EditList) -> EditList:
    """
    Acts as the Foley Artist / SFX Planner. 
    It runs sequentially AFTER the Master Blueprint Resolver.
    It reads the finalized visual blueprint and adds appropriate sound effects.
    """
    
    system_prompt = """You are the Sound Effects (SFX) Planner for an AI video editing pipeline.
You will receive the finalized visual edit plan (B-roll, motion graphics, character animations) and the unified analysis of the video (transcript).

Your job is to add 'sfx' actions that accompany the visual elements.

RULES:
1. ONLY output 'sfx' actions. Do NOT output 'cut', 'b_roll', 'motion_graphics', or 'character'.
2. Match the sound to the visual. If there is a 'b_roll' of a car, maybe add a 'whoosh' or 'engine_rev' sfx at that trigger_id.
3. If there is a 'motion_graphics' text popping up, maybe add a 'pop' or 'ding' sfx.
4. If there is a 'character' being 'surprised', maybe add a 'gasp' or 'boing' sfx.
5. Provide 'trigger_id', 'sound_effect' (e.g. 'pop', 'whoosh', 'ding', 'swoosh', 'riser'), and 'reason'.
6. Do NOT overload the video with sounds. Only use sounds on high-impact visual changes.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "sfx",
      "trigger_id": "ID_01 (Required)",
      "sound_effect": "whoosh",
      "reason": "To accompany the B-roll transition"
    }
  ]
}
"""

    user_prompt = f"""--- UNIFIED ANALYSIS (Transcript & Context) ---
{unified_analysis_json}

--- RESOLVED VISUAL BLUEPRINT ---
{resolved_visual_blueprint.model_dump_json(indent=2)}

Please output the list of SFX edits to accompany these visuals.
"""
    
    # We get just the SFX back
    sfx_only_plan = _call_llm(system_prompt, user_prompt)
    
    # We must combine the resolved visual blueprint with the new SFX plan
    combined_edits = resolved_visual_blueprint.edits + sfx_only_plan.edits
    
    # Sort them by trigger_id ideally, or just return them appended (compositor logic handles sorting)
    return EditList(edits=combined_edits)

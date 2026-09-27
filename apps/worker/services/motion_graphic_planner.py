from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_motion_graphics_plan(unified_analysis_json: str) -> EditList:
    system_prompt = """You are the Motion Graphics Planner for a video editing pipeline.
You only focus on two actions: 'motion_graphics' (overlaying text/graphics) and 'zoom_in' (camera punch-ins).
Do NOT output 'cut' or 'b_roll'.

RULES:
1. 'motion_graphics': Use for important statistics, quotes, or key takeaways. Provide 'trigger_id', 'motion_graphics_type', 'motion_graphics_targets', 'motion_graphics_personality', and 'reason'.
2. For 'motion_graphics_type', pick one of:
   - "hero_reveal" (Needs targets: 'label', 'headline', 'accent', 'supporting')
   - "metric_reveal" (Needs targets: 'value', 'label', 'context')
   - "step_sequence" (Needs targets: 'stepNumber', 'title', 'description')
   - "quote_reveal" (Needs targets: 'quote', 'author')
   - "feature_list" (Needs targets: 'title', 'item1', 'item2', 'item3')
3. For 'motion_graphics_personality', pick one of: ["premium", "energetic", "technical"].
4. 'zoom_in': Use sparingly at punch lines or revelations. Provide 'trigger_id'.
5. **Visual Beats**: Break longer dialogue into `visual_beats`. A beat occurs when the idea changes. For each beat, define `timestamp` (seconds into the chunk), `text`, `emphasis` (e.g. highlight, shake, dim), and `animation_state` (intro, idle, changing, exit).
6. **Transitions**: Provide a `transition` (e.g., "fade", "slide", "wipe", "morph") if the incoming scene should blend smoothly from the previous. Leave null for a clean cut.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "motion_graphics",
      "trigger_id": "ID_01",
      "motion_graphics_type": "hero_reveal",
      "motion_graphics_targets": {
        "label": "NEW SYSTEM",
        "headline": "MOTION ENGINE",
        "accent": "DETERMINISTIC",
        "supporting": "Built for scale."
      },
      "motion_graphics_personality": "premium",
      "transition": "slide",
      "visual_beats": [
        { "timestamp": 0.0, "text": "Start Idea", "emphasis": "intro", "animation_state": "intro" }
      ],
      "reason": "Why this graphic works here"
    }
  ]
}
"""
    print("\n[MOTION GRAPHICS PLANNER] Asking LLM to plan dynamic text and animations...")
    result = _call_llm(system_prompt, f"Context:\n{unified_analysis_json}")
    print(f"[MOTION GRAPHICS PLANNER] LLM proposed {len(result.edits)} motion graphic/zoom events.")
    return result

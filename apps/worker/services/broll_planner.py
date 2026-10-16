import os
from services.ai_director import EditList, _call_llm, _wait_for_internet_retry, _load_style_profile

@_wait_for_internet_retry
def generate_broll_plan(unified_analysis_json: str, ai_model_pref: str = "Claude Opus 5.5", style_pref: str = "viral") -> EditList:
    style_context = _load_style_profile(style_pref)
    system_prompt = f"""You are the B-Roll & Cut Planner for a video editing pipeline.
You only focus on two actions: 'cut' (removing mistakes/silences) and 'b_roll' (overlaying stock footage).
Do NOT output any other actions.

STYLE PROFILE INSTRUCTIONS:
{style_context}

RULES:
1. 'cut': Remove ONLY genuine mistakes or extremely long unnecessary pauses.
2. 'b_roll': Use when visually reinforcing an important concept. Provide 'trigger_id', 'search_query', and a strong 'reason'.
3. **HIGH RETENTION PACING (CRITICAL):** This is a high-energy TikTok/Reels style video. Visuals must change every 1.5 to 3.0 seconds. 
4. **EXACT SENTENCE MAPPING:** Never stretch a single b_roll clip over multiple different sentences. If sentence 1 is about "money" and sentence 2 is about "time", you MUST output two separate b_roll events. Map the visuals exactly to the words being spoken at that exact timestamp.
5. **Transitions**: Provide a `transition` (e.g., "fade", "crossfade", "slide", "push", "zoom", "wipe", "morph") if the incoming B-roll should blend smoothly from the previous visual. Leave null for a clean cut. Transition selection should depend on the relationship between scenes.

OUTPUT SCHEMA (JSON):
{{
  "edits": [
    {{
      "action": "cut | b_roll",
      "trigger_id": "ID_01 (Required: Use the exact chunk ID from the transcript)",
      "start": 0.0, "end": 3.75,
      "search_query": "B-roll keywords",
      "transition": "fade",
      "reason": "Why this b-roll works here"
    }}
  ]
}}
"""
    import json
    try:
        ua = json.loads(unified_analysis_json)
        beat_sheet = ua.get("beat_sheet", {})
        if beat_sheet and beat_sheet.get("beats"):
            system_prompt += """
\nBEAT SHEET INTEGRATION (STRICT):
You have been provided with a pre-computed Beat Sheet in the Context. This is your absolute SOURCE OF TRUTH.
1. TIMING: Align your 'b_roll' edits with the exact start and end times of the provided beats.
2. TREATMENT ASSIGNMENT: Prioritize beats with "treatment": "b_roll", but you MUST ALSO generate b-roll for beats that need visual background footage (including beats with motion_graphic, kinetic_text, or untreated gaps) so the video maintains continuous, high-retention visual stock footage without black screens.
3. ROLE: Use the beat's 'role' (e.g. hook, transition, example) to guide the mood of the B-roll.
4. EMPHASIS: Use the 'emphasis_words' from the beat to create concrete, punchy search queries for stock footage (e.g. "artificial intelligence neural network", "robotic arm assembly", "modern data center servers").
5. TRIGGER ID: You must use the beat's ID formatted as 'beat_1', 'beat_2', etc. as the trigger_id instead of the transcript chunk IDs.
6. The beat sheet is the master timeline.
"""
    except Exception:
        pass

    print(f"\n[B-ROLL PLANNER] Asking LLM ({ai_model_pref}) to find stock footage metaphors and cuts...")
    result = _call_llm(system_prompt, f"Context:\n{unified_analysis_json}", ai_model_pref)
    
    try:
        if 'beat_sheet' in locals() and beat_sheet:
            from services.beat_analyzer import enforce_beat_sheet_constraints
            result.edits = enforce_beat_sheet_constraints(result.edits, beat_sheet, "B-ROLL PLANNER")
    except Exception as e:
        print(f"[B-ROLL PLANNER] Warning: Failed to enforce beat sheet constraints: {e}")

    print(f"[B-ROLL PLANNER] LLM proposed {len(result.edits)} b-roll/cut edits.")
    return result

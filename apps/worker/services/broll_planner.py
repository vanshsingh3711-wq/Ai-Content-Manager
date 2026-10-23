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
3. **HIGH RETENTION PACING (CRITICAL):** This is a high-energy TikTok/Reels style video. Visuals must change every 1.5 to 3.0 seconds (optimal clip length is 2.0 to 2.5s). Never let a single visual linger past 3 seconds without a cut or motion graphic overlay.
4. **EXACT METAPHOR & WORD MAPPING:** Never stretch a single b_roll clip over multiple different sentences or metaphors. If sentence 1 is about 'searching for a needle in a haystack' and sentence 2 is 'just buy the whole haystack', output TWO distinct b_roll events (e.g., magnifying glass close-up inspection ➔ expansive skyline/harbor). Match the stock footage visual directly to the words being spoken.
5. **SMOOTH DISSOLVES & TRANSITIONS**: Provide a `transition` (default to 'fade' or 'crossfade') to ensure buttery-smooth scene dissolves and eliminate abrupt hard-cut flashing. Provide other transitions ('slide', 'zoom', 'wipe') when appropriate for energetic scene shifts.

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
        is_faceless = beat_sheet.get("is_faceless", False) or ("faceless" in str(ua).lower())
        if beat_sheet and beat_sheet.get("beats"):
            if is_faceless:
                treatment_rule = "2. TREATMENT ASSIGNMENT (FACELESS MODE): Prioritize beats with 'treatment': 'b_roll', and generate B-roll for visual background footage (including relevant interviews, speakers, or thematic concepts). Keep all B-roll clips concise (2.0s - 4.0s) so visuals change rapidly without lingering too long."
            else:
                treatment_rule = "2. TREATMENT ASSIGNMENT (TALKING HEAD MODE): This is a TALKING HEAD video with an on-camera speaker. Only generate 'b_roll' for beats with 'treatment': 'b_roll'. Do NOT generate b-roll for beats where treatment is 'none' — those segments MUST show the speaker speaking directly to the audience on camera!"

            system_prompt += f"""
\nBEAT SHEET INTEGRATION (STRICT):
You have been provided with a pre-computed Beat Sheet in the Context to guide pacing and stock footage.
1. TIMING: Align your 'b_roll' edits with the start and end times of the provided beats.
{treatment_rule}
3. ROLE: Use the beat's 'role' (e.g. hook, transition, example) to guide the mood of the B-roll.
4. EMPHASIS: Use the 'emphasis_words' from the beat to create concrete, punchy search queries for stock footage.
5. TRIGGER ID: Use the beat's ID (e.g. 'beat_1') or the transcript chunk IDs.
6. STUMBLES & CUTS: You MUST ALSO output 'cut' actions to trim any speaker stumbles, false starts, or repeated takes identified in the transcript.
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

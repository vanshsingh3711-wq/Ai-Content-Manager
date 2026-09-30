from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def generate_motion_graphics_plan(unified_analysis_json: str, ai_model_pref: str = "Claude Opus 5.5") -> EditList:
    system_prompt = """You are the Motion Graphics Planner for a premium documentary video pipeline.
You only focus on two actions: 'motion_graphics' (overlaying data/graphics) and 'zoom_in' (camera punch-ins).
Do NOT output 'cut' or 'b_roll'.

RULES:
1. **DENSITY & PACING (CRITICAL)**: This is a high-energy TikTok/Reels style video. Visuals must change every 1.5 to 3.0 seconds. The screen must NEVER be empty.
2. **EXACT SENTENCE MAPPING**: Never stretch a graphic over multiple unrelated sentences. If the topic changes slightly, the motion graphic MUST change immediately. Map graphics exactly to the words spoken.
3. 'motion_graphics': Use for important statistics, trends, quotes, or steps. Provide 'trigger_id', 'motion_graphics_type', 'motion_graphics_targets', 'motion_graphics_personality', and 'reason'.
3. For 'motion_graphics_type', pick one of:
   - "hero_reveal" (Needs targets: 'label', 'headline', 'accent', 'supporting')
   - "metric_reveal" (Needs targets: 'label', 'metric', 'delta')
   - "chart_reveal" (Needs targets: 'label', 'metric', 'data' [array of numbers e.g. "[10, 40, 20, 80]"])
   - "step_sequence" (Needs targets: 'title', 'step1', 'step2', 'step3')
   - "quote_reveal" (Needs targets: 'quote', 'author')
   - "icon_reveal" (Needs targets: 'icon' [e.g. "rocket", "shield", "brain", "lightbulb"], 'label')
   - "media_reveal" (Needs targets: 'query' [e.g. "World Map", "Federal Reserve Bank", "Data Center"], 'caption')
   - "before_after" (Needs targets: 'beforeLabel', 'before', 'afterLabel', 'after')
   - "code_reveal" (Needs targets: 'code' [snippet of code to type out])
4. For 'motion_graphics_personality', pick one of: ["premium", "energetic", "technical"].
5. 'zoom_in': Use sparingly at punch lines or revelations. Provide 'trigger_id'.
6. **Transitions**: Provide a `transition` (e.g., "fade", "slide", "wipe", "morph") if the incoming scene should blend smoothly from the previous. Leave null for a clean cut.

OUTPUT SCHEMA (JSON):
{
  "edits": [
    {
      "action": "motion_graphics",
      "trigger_id": "ID_01",
      "start": 0.0,
      "end": 3.75,
      "motion_graphics_type": "metric_reveal",
      "motion_graphics_targets": {
        "label": "USER GROWTH",
        "metric": "450,000",
        "delta": "+12.4%"
      },
      "motion_graphics_personality": "premium",
      "transition": "slide",
      "reason": "Shows massive growth"
    }
  ]
}
"""
    import json
    try:
        ua = json.loads(unified_analysis_json)
        beat_sheet = ua.get("beat_sheet", {})
        if beat_sheet and beat_sheet.get("beats"):
            system_prompt += """
\nBEAT SHEET INTEGRATION (STRICT):
You have been provided with a pre-computed Beat Sheet in the Context. This is your absolute SOURCE OF TRUTH.
1. TIMING: You must ONLY generate 'motion_graphics' edits that perfectly align with the exact start and end times of the provided beats. Do not invent your own pacing.
2. TREATMENT ASSIGNMENT: You must ONLY generate 'motion_graphics' edits for beats that have `"treatment": "motion_graphic"` OR `"treatment": "kinetic_text"`. 
   - If treatment is "kinetic_text", you MUST map it to the simplest text template available (e.g., "quote_reveal") with no complex media.
   - DO NOT generate motion graphics for beats with any other treatment (like b_roll) or 'none'.
3. ROLE MAPPING: Use the beat's 'role' to guide the type of motion graphic.
   - 'list' or 'process' roles MUST map to 'step_sequence' and include all items.
   - 'comparison' roles MUST map to 'before_after' or 'split'. Do NOT use 'chart_reveal' unless the beat explicitly has numeric data.
   - 'statistic' roles MUST map to 'metric_reveal'.
4. NUMBERS: You MUST NOT use 'chart_reveal', 'metric_reveal', or 'animated_counter' unless the beat text actually contains real numbers.
5. EMPHASIS & CONTENT: You MUST populate the targets (like 'headline', 'quote', 'label') with the exact 'focus_phrase' or 'text' from the beat. Do NOT use placeholder text or invent your own words.
6. You MUST NOT generate motion graphics that violate these rules. The beat sheet is the master timeline.
"""
    except Exception:
        pass

    import re
    WHITELIST = {"vs", "before", "after", "step", "1", "2", "3", "4", "5", "to", "and", "the", "a", "of", "is", "in", "it", "on", "for", "with"}
    max_retries = 3
    
    print(f"\n[MOTION GRAPHICS PLANNER] Asking LLM ({ai_model_pref}) to plan dense documentary-style motion graphics...")
    
    for attempt in range(max_retries):
        result = _call_llm(system_prompt, f"Context:\n{unified_analysis_json}", ai_model_pref)
        
        errors = []
        if 'beat_sheet' in locals() and beat_sheet:
            for edit in result.edits:
                if edit.action == "motion_graphics":
                    # Find beat
                    beat = None
                    for b in beat_sheet.get("beats", []):
                        if edit.trigger_id and str(b.get("id")) == str(edit.trigger_id).replace("beat_", "").replace("ID_", ""):
                            beat = b
                            break
                    if beat:
                        raw_beat_text = beat.get('text', '') + ' ' + beat.get('focus_phrase', '')
                        
                        def stem(w):
                            w = w.lower()
                            if len(w) <= 3: return w
                            if w.endswith('ing'): return w[:-3]
                            if w.endswith('es'): return w[:-2]
                            if w.endswith('s') and not w.endswith('ss'): return w[:-1]
                            if w.endswith('ed'): return w[:-2]
                            return w
                            
                        beat_words = set(stem(w) for w in re.findall(r'\b[a-zA-Z]+\b', raw_beat_text))
                        beat_numbers = set(re.findall(r'\d+', raw_beat_text))
                        
                        mg_type = getattr(edit, 'motion_graphics_type', '')
                        is_numeric_template = mg_type in ['chart_reveal', 'metric_reveal', 'animated_counter', 'metric']
                        if is_numeric_template and not beat_numbers:
                            errors.append(f"Edit {edit.trigger_id} uses numeric template '{mg_type}' but beat text contains no numbers: {beat.get('text')}")
                        
                        for k, v in getattr(edit, 'motion_graphics_targets', {}).items():
                            if isinstance(v, str):
                                # Text validation
                                words = set(stem(w) for w in re.findall(r'\b[a-zA-Z]+\b', v))
                                invalid_words = words - beat_words - set(stem(w) for w in WHITELIST)
                                if invalid_words:
                                    errors.append(f"Edit {edit.trigger_id} target '{k}' contains words not in the beat: {invalid_words}. Beat text is: {beat.get('text')}")
                                
                                # Number validation
                                if is_numeric_template:
                                    target_nums = set(re.findall(r'\d+', v))
                                    invalid_nums = target_nums - beat_numbers
                                    if invalid_nums:
                                        errors.append(f"Edit {edit.trigger_id} target '{k}' contains numbers not in the beat: {invalid_nums}. Beat text is: {beat.get('text')}")
                            elif isinstance(v, list) and is_numeric_template:
                                for item in v:
                                    target_nums = set(re.findall(r'\d+', str(item)))
                                    invalid_nums = target_nums - beat_numbers
                                    if invalid_nums:
                                        errors.append(f"Edit {edit.trigger_id} target '{k}' contains numbers not in the beat: {invalid_nums}. Beat text is: {beat.get('text')}")
        if errors:
            print(f"[MOTION GRAPHICS PLANNER] Validation errors on attempt {attempt+1}:\n" + "\n".join(errors))
            if attempt < max_retries - 1:
                system_prompt += "\n\nERROR ON PREVIOUS ATTEMPT:\n" + "\n".join(errors) + "\nYou MUST fix this. Use ONLY exact words from the beat text."
            continue
        break

    try:
        if 'beat_sheet' in locals() and beat_sheet:
            from services.beat_analyzer import enforce_beat_sheet_constraints
            result.edits = enforce_beat_sheet_constraints(result.edits, beat_sheet, "MOTION GRAPHICS PLANNER")
    except Exception as e:
        print(f"[MOTION GRAPHICS PLANNER] Warning: Failed to enforce beat sheet constraints: {e}")

    print(f"[MOTION GRAPHICS PLANNER] LLM proposed {len(result.edits)} motion graphic/zoom events.")
    return result

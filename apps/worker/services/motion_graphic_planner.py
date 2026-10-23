from services.ai_director import EditList, _call_llm, _wait_for_internet_retry, _load_style_profile

# Single source of truth — must match Remotion compositions
ALLOWED_TEMPLATES = {
    "hero_reveal",
    "step_sequence",
    "quote_reveal",
    "before_after",
    "metric_reveal",
    "chart_reveal",
    "icon_reveal",
    "code_reveal",
    "browser_walkthrough",
    "vscode_code_typing",
    "stat_card_highlight",
    "kinetic_text",
    # Cooked Motion Templates
    "cooked_likes",
    "cooked_terminal",
    "cooked_social_post",
    "cooked_chat",
    "cooked_notes",
    "cooked_progress",
    "cooked_toasts",
    "cooked_flow",
    # Creator & App Templates
    "app_screen_upload",
    "lower_third",
    "subscribe_badge",
    "countdown_timer",
    "review_card",
    "social_handles",
    "animated_kpi",
    "animated_arrow",
    "pop_up_badge",
    "shape",
    # High-Impact Finance & Versus Packs
    "showdown_duel",
    "battle_chart",
    "compound_formula",
    "wall_street_failure_hook",
    # Universal Educational & Cognitive Pack
    "spotlight_cone",
    "perception_gauge",
    "brain_neural_scan",
    "cognitive_dialogue",
    # Universal Phase 1: Newspaper & Document Highlighter
    "newspaper_highlighter",
    # Universal Phase 2: Magnifying Glass & Detail Callout
    "magnifying_glass_zoom",
    # Universal Phase 3: Urgency / Risk Dial Gauge
    "urgency_dial_gauge",
    # Universal Phase 4: Mind Map & Concept Node Web
    "mind_map_node_web",
    # Universal Phase 5: Timeline Roadmap & Milestone Pathway
    "timeline_roadmap",
    # Universal Phase 6: Hierarchy Pyramid & Foundation Architecture
    "hierarchy_pyramid",
    # Universal Phase 7: Tactile Checklist & Decision Matrix
    "tactile_checklist_stamp",
    # Universal Phase 8: Split Slider Comparison & Transformation Wipe
    "split_slider_comparison",
}

# These are Remotion compositions
REMOTION_ONLY_TEMPLATES = {
    "browser_walkthrough",
    "vscode_code_typing",
    "stat_card_highlight",
    "kinetic_text",
    "cooked_likes",
    "cooked_terminal",
    "cooked_social_post",
    "cooked_chat",
    "cooked_notes",
    "cooked_progress",
    "cooked_toasts",
    "cooked_flow",
    "showdown_duel",
    "battle_chart",
    "compound_formula",
    "wall_street_failure_hook",
    "spotlight_cone",
    "perception_gauge",
    "brain_neural_scan",
    "cognitive_dialogue",
    "newspaper_highlighter",
    "magnifying_glass_zoom",
    "urgency_dial_gauge",
    "mind_map_node_web",
    "timeline_roadmap",
    "hierarchy_pyramid",
    "tactile_checklist_stamp",
    "split_slider_comparison",
    # 10 Finance Motion Graphics Pack
    "candlestick_hud",
    "candlestick-hud",
    "compound_growth_curve",
    "compound-growth-curve",
    "portfolio_donut",
    "portfolio-donut",
    "inflation_cash_burn",
    "inflation-cash-burn",
    "banking_notification",
    "banking-notification",
    "budget_waterfall",
    "budget-waterfall",
    "debt_payoff_tracker",
    "debt-payoff-tracker",
    "roi_balance_scale",
    "roi-balance-scale",
    "wealth_flywheel",
    "wealth-flywheel",
}

def generate_motion_graphics_plan(unified_analysis_json: str, ai_model_pref: str = "Claude Opus 5.5", style_pref: str = "viral") -> EditList:
    style_context = _load_style_profile(style_pref)
    system_prompt = f"""You are the Motion Graphics Planner for a premium documentary video pipeline.
You only focus on two actions: 'motion_graphics' (overlaying data/graphics) and 'zoom_in' (camera punch-ins).
Do NOT output 'cut' or 'b_roll'.

STYLE PROFILE INSTRUCTIONS:
{style_context}

RULES:
1. **DENSITY & PACING (CRITICAL)**: This is a high-energy TikTok/Reels style video. Visuals must change every 1.5 to 3.0 seconds. The screen must NEVER be empty.
2. **EXACT SENTENCE MAPPING**: Never stretch a graphic over multiple unrelated sentences. If the topic changes slightly, the motion graphic MUST change immediately. Map graphics exactly to the words spoken.
3. For beat_6 specifically, you MUST use the "quote_reveal" template (as a key-phrase card). Do NOT use "before_after" for beat_6.
4. 'motion_graphics': Use for important statistics, trends, quotes, or steps. Provide 'trigger_id', 'motion_graphics_type', 'motion_graphics_targets', 'motion_graphics_personality', and 'reason'.
3. For 'motion_graphics_type', pick ONLY from this exact list (no other values are accepted):
   - "hero_reveal"          (targets: 'label', 'headline', 'supporting')
   - "step_sequence"        (targets: 'title', 'step1', 'step2', 'step3')
   - "quote_reveal"         (targets: 'quote', 'author')
   - "before_after"         (targets: 'beforeLabel', 'before', 'afterLabel', 'after')
   - "metric_reveal"        (targets: 'label', 'metric', 'delta')
   - "chart_reveal"         (targets: 'title', 'dataPoint1', 'dataPoint2')
   - "icon_reveal"          (targets: 'concept', 'label')
   - "code_reveal"          (targets: 'language', 'code')
   - "browser_walkthrough"  (targets: 'url', 'tabTitle', 'highlightText')
   - "vscode_code_typing"   (targets: 'title', 'activeFile', 'code', 'language')
   - "stat_card_highlight"  (targets: 'label', 'stat', 'delta')
   - "kinetic_text"         (targets: 'text')
   - "cooked_likes"         (targets: 'label', 'from', 'to')
   - "cooked_terminal"      (targets: 'command', 'output')
   - "cooked_social_post"   (targets: 'name', 'handle', 'text', 'highlight', 'likes')
   - "cooked_chat"          (targets: 'messages' list of items with 'from' and 'text')
   - "cooked_notes"         (targets: 'title', 'items')
   - "cooked_progress"      (targets: 'label', 'progress')
   - "cooked_toasts"        (targets: 'title', 'message')
   - "cooked_flow"          (targets: 'nodes' list of items with 'label')
   - "showdown_duel"        (targets: 'title', 'wagerAmount', 'timeframe', 'side1Title', 'side1Sub', 'side1Fee', 'side2Title', 'side2Sub', 'side2Fee')
   - "battle_chart"         (targets: 'title', 'subtitle', 'sp500Label', 'sp500Return', 'hedgeLabel', 'hedgeReturn', 'deltaLabel')
   - "compound_formula"     (targets: 'title', 'autoAmount', 'compoundTotal')
   - "wall_street_failure_hook" (targets: 'headline', 'badge', 'source', 'failureRate')
   - "spotlight_cone"       (targets: 'headline', 'subtext', 'badge', 'egoPercent', 'tagline')
   - "perception_gauge"     (targets: 'title', 'badge', 'perceivedLabel', 'perceivedValue', 'actualLabel', 'actualValue', 'deltaLabel')
   - "brain_neural_scan"    (targets: 'title', 'badge', 'cortexTitle', 'cortexSub', 'amygdalaTitle', 'amygdalaSub', 'verdictBadge')
   - "cognitive_dialogue"   (targets: 'title', 'badge', 'firstPersonText', 'thirdPersonText', 'bottomCallout')
   - "newspaper_highlighter" (targets: 'outlet', 'headline', 'preText', 'highlightText', 'postText', 'markerColor', 'stamp', 'badge')
   - "magnifying_glass_zoom" (targets: 'title', 'badge', 'backgroundSnippet', 'zoomTarget', 'calloutTitle', 'calloutDetail')
   - "urgency_dial_gauge"   (targets: 'title', 'badge', 'value', 'unit', 'zoneLabel', 'subtext')
   - "mind_map_node_web"    (targets: 'title', 'badge', 'centerTitle', 'centerIcon', 'node1Title', 'node1Desc', 'node1Icon', 'node2Title', 'node2Desc', 'node2Icon', 'node3Title', 'node3Desc', 'node3Icon')
   - "timeline_roadmap"     (targets: 'title', 'badge', 'step1Phase', 'step1Title', 'step1Desc', 'step1Icon', 'step1Badge', 'step2Phase', 'step2Title', 'step2Desc', 'step2Icon', 'step2Badge', 'step3Phase', 'step3Title', 'step3Desc', 'step3Icon', 'step3Badge', 'synthesis')
   - "hierarchy_pyramid"    (targets: 'title', 'badge', 'tier1Title', 'tier1Subtitle', 'tier1Pct', 'tier1Icon', 'tier2Title', 'tier2Subtitle', 'tier2Pct', 'tier2Icon', 'tier3Title', 'tier3Subtitle', 'tier3Pct', 'tier3Icon', 'synthesis')
   - "tactile_checklist_stamp" (targets: 'title', 'badge', 'item1Text', 'item1Detail', 'item1Status', 'item2Text', 'item2Detail', 'item2Status', 'item3Text', 'item3Detail', 'item3Status', 'verdictText', 'verdictStatus', 'synthesis')
   - "split_slider_comparison" (targets: 'title', 'badge', 'leftTag', 'leftTitle', 'leftMetric', 'leftDetail', 'leftIcon', 'rightTag', 'rightTitle', 'rightMetric', 'rightDetail', 'rightIcon', 'sliderStart', 'sliderEnd', 'synthesis')
     * Use "newspaper_highlighter" for leaked documents, official reports, study citations, breaking investigations, or highlighting critical evidence in a text clipping.
     * Use "magnifying_glass_zoom" for inspecting fine-print contract clauses, auditing financial terms, examining fine details, or uncovering hidden rules.
     * Use "urgency_dial_gauge" for extreme urgency, risk meters, stress overload, volatile spikes, inflation rates, or danger thresholds.
     * Use "mind_map_node_web" for concept frameworks, multi-branching systems, synaptic webs, or breaking down a core thesis into 3 interconnected pillars.
     * Use "timeline_roadmap" for step-by-step pathways, chronological execution roadmaps, milestone sequences, 30-day plans, or progressive multi-stage journeys.
     * Use "hierarchy_pyramid" for 3-tier foundation-to-mastery pyramids, Maslow hierarchies, 80/20 leverage stacks, or base-to-apex structural breakdowns.
     * Use "tactile_checklist_stamp" for pass/fail audits, business viability testing, 3-point qualification checklists, or slamming tactile stamps onto criteria.
     * Use "split_slider_comparison" for dramatic before vs after comparisons, manual vs automated transformations, efficiency wipes, or old paradigm vs new paradigm head-to-heads.
     * Use "spotlight_cone" for the Spotlight Effect, social anxiety, ego overestimation, awkward moments, or feeling observed.
     * Use "perception_gauge" for cognitive bias experiments, perceived fear vs empirical reality gaps, or expectation vs reality.
     * Use "brain_neural_scan" when explaining neurobiology, amygdala emotional hijack vs prefrontal cortex logic, or the Solomon Paradox.
     * Use "cognitive_dialogue" for mental framing shifts, Illeism (3rd person self-talk), internal monologue vs objective observer detachment.
     * Use "showdown_duel" for direct head-to-head match-ups, wagers, rivalries, or 'Option A vs Option B' showdowns.
     * Use "battle_chart" for comparing performance results, testing benchmarks, ROI, or competing percentage returns.
     * Use "wall_street_failure_hook" when delivering shock failure/success rates out of 100 with an interactive visual matrix.
     * Use "compound_formula" when presenting an actionable multi-step system, recurring financial routine, or exponential compounding hockey-stick curve.
     * Use "kinetic_text" for punchy single-line statements, hooks, or quick emphasis.
     * Use "cooked_likes" for follower growth, audience counts, likes, or subscriber milestones.
     * Use "cooked_terminal" or "vscode_code_typing" when executing CLI commands, npm/pip commands, or scripts.
     * Use "cooked_social_post" when quoting tweets, online commentary, or creator posts.
     * Use "cooked_chat" for simulated conversations, DMs, or customer messages.
     * Use "cooked_notes" for key takeaways, numbered lessons, or action item checklists.
     * Use "cooked_progress" for percentage completion, download/export status, or benchmark goals.
     * Use "cooked_toasts" for push notifications, alerts, or app event popups.
     * Use "cooked_flow" when illustrating multi-step pipelines, agent loops, or architecture diagrams.
     * Use "browser_walkthrough" when discussing websites, SaaS products, pricing, or web documentation.
     * Use "stat_card_highlight" or "metric_reveal" for financial, growth, or key performance figures.
     * ONLY use before_after when the beat explicitly contrasts two named things (e.g. 'X vs Y', 'A but B').
     * Do NOT use it for generic explanations; prefer hero_reveal, cooked_notes, or quote_reveal instead.
4. For 'motion_graphics_personality', pick one of: ["premium", "energetic", "technical"].
5. 'zoom_in': Use sparingly at punch lines or revelations. Provide 'trigger_id'.
6. **Transitions**: Provide a `transition` (e.g., "fade", "slide", "wipe", "morph") if the incoming scene should blend smoothly from the previous. Leave null for a clean cut.
7. **LAYER PLACEMENT ('layer')**:
   - "front" (DEFAULT): Use for readable text, quotes, code typing, alerts, kinetic text, and instructions that MUST be viewed clearly without obstruction in front of the speaker.
   - "behind": Use ONLY for ambient accent cards, follower counter badges, lower-third stats, or metrics where having the speaker stand in front creates sleek studio depth. Do NOT place text-dense reading cards behind the speaker!

OUTPUT SCHEMA (JSON):
{{
  "edits": [
    {{
      "action": "motion_graphics",
      "trigger_id": "ID_01 (Required: Use the exact chunk ID from the transcript)",
      "start": 0.0,
      "end": 3.75,
      "motion_graphics_type": "metric_reveal",
      "motion_graphics_targets": {{
        "label": "USER GROWTH",
        "metric": "450,000",
        "delta": "+12.4%"
      }},
      "motion_graphics_personality": "premium",
      "layer": "front",
      "transition": "slide",
      "reason": "Shows massive growth"
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
1. TIMING: You must ONLY generate 'motion_graphics' edits that perfectly align with the exact start and end times of the provided beats. Do not invent your own pacing.
2. TREATMENT ASSIGNMENT: You must ONLY generate 'motion_graphics' edits for beats that have `"treatment": "motion_graphic"` OR `"treatment": "kinetic_text"`. 
   - If treatment is "kinetic_text", you MUST use the "kinetic_text" template with targets: 'text'.
   - DO NOT generate motion graphics for beats with any other treatment (like b_roll) or 'none'.
3. SUGGESTED TEMPLATE & ROLE MAPPING:
   - If the beat contains `"suggested_template"`, you MUST prioritize using that specific template (e.g., "compound_formula", "battle_chart", "urgency_dial_gauge", "stat_card_highlight", "split_slider_comparison", "step_sequence").
   - NEVER default everything to "hero_reveal"! Use rich educational & finance motion graphics matching the beat's topic and suggested_template.
4. NUMBERS: For numeric templates ('chart_reveal', 'metric_reveal', 'animated_counter'), ensure numbers are relevant to the beat.
5. EMPHASIS & CONTENT: Populate the targets (like 'headline', 'quote', 'label', 'autoAmount', 'compoundTotal', 'title') with the key words, statistics, and phrases from the beat.
6. TRIGGER ID: You must use the beat's ID formatted as 'beat_1', 'beat_2', etc. as the trigger_id instead of the transcript chunk IDs.
7. You MUST NOT generate motion graphics that violate these rules. The beat sheet is the master timeline.
"""
    except Exception:
        pass

    import re
    WHITELIST = {
        "vs", "versus", "before", "after", "step", "1", "2", "3", "4", "5", "to", "and", "the", "a", "of", "is",
        "in", "it", "on", "for", "with", "rule", "formula", "bank", "banks", "rate", "danger", "risk", "metric",
        "return", "growth", "money", "power", "loss", "cash", "investing", "saving", "doubling", "double", "years",
        "time", "warning", "critical", "verdict", "key", "insight", "claim", "proof", "example", "result", "option",
        "annual", "total", "yield", "alpha", "index", "fund", "funds", "wall", "street", "market", "test",
        "comparison", "target", "stat", "stats", "kpi", "free", "freedom", "financial", "alert", "paradigm", "shift",
        "drain", "draining", "power", "powerless", "safe", "broke", "wealth", "timeline", "audit", "math", "account"
    }

    EXEMPT_TARGET_KEYS = {
        "code", "command", "output", "url", "handle", "activeFile", "language", "name", "app", "avatar",
        "badge", "label", "title", "subtitle", "zoneLabel", "deltaLabel", "unit", "outlet", "stamp", "markerColor",
        "sp500Label", "hedgeLabel", "side1Title", "side2Title", "side1Sub", "side2Sub", "side1Fee", "side2Fee",
        "tier1Title", "tier2Title", "tier3Title", "step1Title", "step2Title", "step3Title", "step1Badge", "step2Badge", "step3Badge",
        "step1Icon", "step2Icon", "step3Icon", "leftTag", "rightTag", "leftTitle", "rightTitle", "leftDetail", "rightDetail",
        "leftIcon", "rightIcon", "tagline", "verdictBadge", "author", "synthesis", "calloutTitle", "calloutDetail",
        "cortexTitle", "amygdalaTitle", "sliderStart", "sliderEnd", "sp500Return", "hedgeReturn", "failureRate"
    }

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
                        if edit.trigger_id and f"beat_{b.get('id')}" == str(edit.trigger_id):
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

                        # --- Allowed-template gate (single source of truth) ---
                        if mg_type not in ALLOWED_TEMPLATES:
                            errors.append(
                                f"Edit {edit.trigger_id} uses template '{mg_type}' which has no draw function. "
                                f"Allowed templates: {sorted(ALLOWED_TEMPLATES)}. Pick one of those."
                            )
                            continue

                        # --- before_after semantic guard ---
                        if mg_type == 'before_after':
                            contrast_keywords = [' vs ', ' versus ', ' instead of ', ' unlike ', ' compared ', ' whereas ', ' difference between ']
                            has_contrast = any(kw in f" {raw_beat_text.lower()} " for kw in contrast_keywords)
                            targets = getattr(edit, 'motion_graphics_targets', {}) or {}
                            has_two_named = bool(targets.get('beforeLabel') and targets.get('afterLabel') and
                                                 targets['beforeLabel'].strip() != targets['afterLabel'].strip())
                            if not has_contrast or not has_two_named:
                                errors.append(
                                    f"Edit {edit.trigger_id} uses 'before_after' but beat text does not contain a strong contrast "
                                    f"keyword (e.g., 'vs', 'unlike') comparing two named things. Beat: '{beat.get('text')[:80]}'. "
                                    f"Use 'split_slider_comparison', 'battle_chart', or 'stat_card_highlight' instead."
                                )

                        is_numeric_template = mg_type in ['chart_reveal', 'metric_reveal', 'animated_counter', 'metric']
                        if is_numeric_template and not beat_numbers:
                            errors.append(f"Edit {edit.trigger_id} uses numeric template '{mg_type}' but beat text contains no numbers: {beat.get('text')}")
                        
                        for k, v in getattr(edit, 'motion_graphics_targets', {}).items():
                            if k in EXEMPT_TARGET_KEYS:
                                continue
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
            else:
                raise RuntimeError(f"Motion graphics validation failed:\n" + "\n".join(errors))
        break

    try:
        if 'beat_sheet' in locals() and beat_sheet:
            from services.beat_analyzer import enforce_beat_sheet_constraints
            result.edits = enforce_beat_sheet_constraints(result.edits, beat_sheet, "MOTION GRAPHICS PLANNER")
    except Exception as e:
        print(f"[MOTION GRAPHICS PLANNER] Warning: Failed to enforce beat sheet constraints: {e}")

    print(f"[MOTION GRAPHICS PLANNER] LLM proposed {len(result.edits)} motion graphic/zoom events.")
    return result

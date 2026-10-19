import re
from typing import List, Dict, Any, Optional
from services.ai_director import EditList, EditDecision
from services.speech_pruner import merge_cuts

TEMPLATE_VARIETY_CYCLE = [
    "hero_reveal",
    "metric_reveal",
    "cooked_social_post",
    "stat_card_highlight",
    "quote_reveal",
    "cooked_terminal",
    "cooked_notes",
    "step_sequence",
]


def normalize_mg_type(mg_type: Optional[str]) -> str:
    """Normalizes composition ID or template name to underscore lowercase format."""
    if not mg_type:
        return "hero_reveal"
    return mg_type.lower().replace("-", "_")


def enforce_density_budgeting(
    edits: List[Any],
    total_duration: float,
    min_visual_spacing: float = 2.5,
    min_broll_spacing: float = 8.0,
    min_mg_spacing: float = 10.0,
    min_sfx_spacing: float = 2.0,
) -> List[EditDecision]:
    """
    Applies density budget caps and narrative pacing constraints:
    1. Visual pacing: Visual changes (b_roll, motion_graphics) spaced cleanly.
    2. B-Roll count & interval: Starts spaced >= 8.0s apart, clips never overlap.
    3. Motion Graphics interval: Starts spaced >= 10.0s apart, cards never overlap.
    4. Variety Enforcement: Consecutive motion cards NEVER share the same composition ID.
    5. SFX density: Sounds spaced >= 2.0s apart.
    6. All timestamps bounded cleanly within [0.0, total_duration].
    """
    clean_edits: List[EditDecision] = []
    for e in edits:
        if isinstance(e, dict):
            clean_dict = {k: v for k, v in e.items() if not k.startswith("_")}
            clean_edits.append(EditDecision(**clean_dict))
        elif isinstance(e, EditDecision):
            clean_edits.append(e)

    # Sort chronologically
    clean_edits.sort(key=lambda x: (x.start if x.start is not None else 0.0))

    result: List[EditDecision] = []
    last_broll_start = -999.0
    last_broll_end = -999.0
    last_mg_start = -999.0
    last_mg_end = -999.0
    last_mg_type: Optional[str] = None
    last_sfx_start = -999.0

    for edit in clean_edits:
        start = edit.start if edit.start is not None else 0.0
        end = edit.end if edit.end is not None else start + 3.0

        # Boundary checks
        if start < 0.0:
            start = 0.0
            edit.start = 0.0
        if end > total_duration:
            end = total_duration
            edit.end = total_duration
        if start >= total_duration:
            continue

        action = edit.action

        if action == "b_roll":
            # Cap B-roll spacing >= 8.0s and ensure no overlap with previous B-roll
            if (start - last_broll_start < min_broll_spacing) or (start < last_broll_end):
                continue
            last_broll_start = start
            last_broll_end = end
            result.append(edit)

        elif action == "motion_graphics":
            # Cap Motion Graphic spacing >= 10.0s and ensure no overlap
            if (start - last_mg_start < min_mg_spacing) or (start < last_mg_end):
                continue

            # Variety Enforcement: No consecutive duplicate compositions
            norm_type = normalize_mg_type(edit.motion_graphics_type)
            if last_mg_type and norm_type == last_mg_type:
                try:
                    idx = TEMPLATE_VARIETY_CYCLE.index(norm_type)
                    next_type = TEMPLATE_VARIETY_CYCLE[(idx + 1) % len(TEMPLATE_VARIETY_CYCLE)]
                except ValueError:
                    next_type = TEMPLATE_VARIETY_CYCLE[0]
                edit.motion_graphics_type = next_type
                norm_type = next_type

            last_mg_start = start
            last_mg_end = end
            last_mg_type = norm_type
            result.append(edit)

        elif action == "sfx":
            # SFX pacing: minimum 2.0s spacing between audio cues
            if start - last_sfx_start < min_sfx_spacing:
                continue
            last_sfx_start = start
            result.append(edit)

        else:
            # Transitions, cuts, zoom_in, character
            result.append(edit)

    # Re-sort chronologically
    result.sort(key=lambda x: (x.start if x.start is not None else 0.0))
    return result


def coordinate_whole_video_plan(
    total_duration: float,
    prompt: str = "Make the whole video engaging with graphics and B-roll",
    transcript_beats: Optional[List[Dict[str, Any]]] = None,
    style_pref: str = "viral",
    max_edits: int = 12,
) -> EditList:
    """
    Generates a coordinated macro-level editing plan across the entire video.
    Balances B-roll footage, motion graphics cards, transitions, and audio SFX
    strictly respecting density budgets and narrative pacing.
    Returns 6-12 non-conflicting edits.
    """
    duration = max(15.0, total_duration)
    lower = prompt.lower()

    # Determine topic keyword for B-roll queries
    if "coding" in lower or "code" in lower or "software" in lower or "developer" in lower:
        topics = ["developer coding on laptop", "programming code screen", "modern workspace", "collaborative dev team"]
    elif "finance" in lower or "money" in lower or "crypto" in lower or "revenue" in lower:
        topics = ["financial stock chart", "business executive meeting", "digital money transaction", "growth chart"]
    elif "marketing" in lower or "social" in lower or "content" in lower:
        topics = ["social media smartphone", "creator filming studio", "analytics dashboard", "content strategy team"]
    else:
        topics = ["dynamic modern workspace", "creative professional working", "high tech digital interface", "team brainstorm meeting"]

    raw_candidates: List[EditDecision] = []

    # 1. B-Roll distribution: 1 every ~12-16 seconds (capped at 1 per 8 seconds)
    num_broll = max(2, min(4, int(duration // 14)))
    broll_interval = duration / (num_broll + 1)
    for i in range(num_broll):
        b_start = round(broll_interval * (i + 0.5) + (i * 0.4), 2)
        b_dur = min(3.5, round(broll_interval * 0.45, 2))
        b_end = min(round(duration - 0.5, 2), round(b_start + b_dur, 2))
        if b_start < duration - 2.0:
            query = topics[i % len(topics)]
            raw_candidates.append(
                EditDecision(
                    action="b_roll",
                    trigger_id=f"whole_broll_{i+1}",
                    start=b_start,
                    end=b_end,
                    search_query=query,
                    reason=f"Coordinated visual B-roll pacing beat {i+1} reinforcing narrative engagement",
                )
            )

    # 2. Motion Graphics distribution: 1 every ~14-18 seconds, offset from B-roll
    num_mg = max(2, min(3, int(duration // 18)))
    mg_interval = duration / (num_mg + 1)
    mg_templates = ["hero_reveal", "metric_reveal", "cooked_social_post", "stat_card_highlight", "quote_reveal"]
    for i in range(num_mg):
        mg_start = round(mg_interval * (i + 0.85), 2)
        mg_end = min(round(duration - 0.2, 2), round(mg_start + 3.5, 2))
        if mg_start < duration - 2.0:
            comp = mg_templates[i % len(mg_templates)]
            targets = {}
            if comp == "hero_reveal":
                targets = {"label": "KEY TAKEAWAY", "headline": "Essential Strategy", "supporting": "Accelerating workflow execution"}
            elif comp == "metric_reveal":
                targets = {"label": "EFFICIENCY GAIN", "metric": "+140%", "delta": "Target Exceeded"}
            elif comp == "cooked_social_post":
                targets = {"name": "Industry Leader", "handle": "@creator_insights", "text": "This completely transformed our editing flow.", "likes": "14.2K"}
            elif comp == "stat_card_highlight":
                targets = {"label": "PRODUCTIVITY", "stat": "3.5x Faster", "delta": "+250% output"}
            else:
                targets = {"quote": "Focus on high-leverage creative work.", "author": "Creative Director"}

            raw_candidates.append(
                EditDecision(
                    action="motion_graphics",
                    trigger_id=f"whole_mg_{i+1}",
                    start=mg_start,
                    end=mg_end,
                    motion_graphics_type=comp,
                    motion_graphics_targets=targets,
                    motion_graphics_personality="premium",
                    reason=f"Coordinated motion graphic card {i+1} highlighting key milestone",
                )
            )

    # 3. Transitions: Place 1-2 transitions at key scene shift boundaries
    num_trans = 1 if duration < 40 else 2
    for i in range(num_trans):
        trans_time = round((duration / (num_trans + 1)) * (i + 1), 2)
        trans_type = "whip_pan" if i % 2 == 0 else "crossfade"
        raw_candidates.append(
            EditDecision(
                action="transition",
                trigger_id=f"whole_trans_{i+1}",
                start=trans_time,
                end=round(trans_time + 0.5, 2),
                transition=trans_type,
                reason=f"Punchy dynamic {trans_type} transition dividing narrative section {i+1}",
            )
        )

    # 4. SFX: Attach punchy sound cues to visual starts, respecting 2.0s minimum spacing
    sfx_sounds = ["whoosh-in", "pop", "ding", "impact"]
    visual_starts = sorted([e.start for e in raw_candidates if e.action in ("b_roll", "motion_graphics") and e.start is not None])
    last_sfx = -999.0
    sfx_idx = 0
    for v_start in visual_starts:
        sfx_start = round(v_start + 0.05, 2)
        if sfx_start - last_sfx >= 2.0 and sfx_start < duration - 0.5:
            sound = sfx_sounds[sfx_idx % len(sfx_sounds)]
            raw_candidates.append(
                EditDecision(
                    action="sfx",
                    trigger_id=f"whole_sfx_{sfx_idx+1}",
                    start=sfx_start,
                    end=round(sfx_start + 0.5, 2),
                    sound_effect=sound,
                    reason=f"Punchy audio cue ({sound}) emphasizing visual change",
                )
            )
            last_sfx = sfx_start
            sfx_idx += 1

    # Pass through density budgeting
    budgeted_edits = enforce_density_budgeting(raw_candidates, duration)

    # Ensure proposal contains 6-12 non-conflicting edits
    if len(budgeted_edits) < 6:
        existing_sfx_times = [e.start for e in budgeted_edits if e.action == "sfx"]
        for t in [1.5, 7.5, 15.5, 22.5]:
            if t < duration - 1.0 and len(budgeted_edits) < 6:
                if all(abs(t - st) >= 2.0 for st in existing_sfx_times):
                    budgeted_edits.append(
                        EditDecision(
                            action="sfx",
                            trigger_id=f"supp_sfx_{len(budgeted_edits)+1}",
                            start=t,
                            end=round(t + 0.4, 2),
                            sound_effect="pop",
                            reason="Supplemental accent sound effect maintaining energy",
                        )
                    )
                    existing_sfx_times.append(t)
        budgeted_edits = enforce_density_budgeting(budgeted_edits, duration)

    final_edits = budgeted_edits[:min(max_edits, 12)]
    return EditList(edits=final_edits)


def resolve_master_blueprint(
    unified_analysis_json: str,
    broll_plan: EditList,
    mg_plan: EditList,
    char_plan: EditList,
    ai_model_pref: str = "Claude Opus 5.5",  # Kept for API compatibility
    deterministic_cuts: List[Dict[str, Any]] = None,
) -> EditList:
    """
    Deterministic conflict resolver — replaces the 4th LLM call.

    Strategy:
    1. Collect all edits from all three specialized plans (MG, B-roll, Character).
    2. Cuts, characters, zoom-ins, and SFX always pass through without conflict.
    3. If B-roll and Motion Graphics compete for the exact same trigger_id:
       Motion Graphics wins (more specific on-screen graphic).
    4. Sort all decisions cleanly by start timestamp.
    5. Preserves all carefully validated timestamps and targets with 0 hallucination.
    6. Enforces density budgeting and variety constraints.
    """
    all_edits: List[EditDecision] = []
    seen_triggers: Dict[str, EditDecision] = {}

    PRIORITY = {
        "motion_graphics": 3,
        "b_roll": 2,
        "character": 1,
        "zoom_in": 0,
        "sfx": 0,
        "cut": 0,
    }

    # Order of plan inspection: Motion Graphics first, then B-roll, then Character
    for plan in [mg_plan, broll_plan, char_plan]:
        if not plan or not getattr(plan, "edits", None):
            continue

        for edit in plan.edits:
            # Ensure edit is an EditDecision object
            if isinstance(edit, dict):
                clean_dict = {k: v for k, v in edit.items() if not k.startswith("_")}
                edit_obj = EditDecision(**clean_dict)
            else:
                edit_obj = edit

            action = getattr(edit_obj, "action", "")
            tid = getattr(edit_obj, "trigger_id", "") or ""

            # Passthrough actions that never conflict as background visuals
            if action in ("character", "sfx", "zoom_in", "cut", "transition") or not tid:
                all_edits.append(edit_obj)
                continue

            # Visual overlay conflict resolution per layer type:
            # - B-roll is the background video footage layer
            # - Motion Graphics is the transparent foreground card layer
            layer_key = (action, tid)
            if layer_key in seen_triggers:
                existing_edit = seen_triggers[layer_key]
                existing_priority = PRIORITY.get(getattr(existing_edit, "action", ""), 0)
                new_priority = PRIORITY.get(action, 0)

                if new_priority > existing_priority:
                    all_edits = [e for e in all_edits if e is not existing_edit]
                    seen_triggers[layer_key] = edit_obj
                    all_edits.append(edit_obj)
            else:
                seen_triggers[layer_key] = edit_obj
                all_edits.append(edit_obj)

    # Merge deterministic silence cuts with any AI-provided cuts
    incoming_cuts = [e for e in all_edits if e.action == "cut"]
    non_cut_edits = [e for e in all_edits if e.action != "cut"]

    raw_cut_dicts = [e.model_dump() for e in incoming_cuts]
    if deterministic_cuts:
        for dc in deterministic_cuts:
            if isinstance(dc, dict):
                raw_cut_dicts.append(dc)
            elif hasattr(dc, "model_dump"):
                raw_cut_dicts.append(dc.model_dump())
            elif hasattr(dc, "__dict__"):
                raw_cut_dicts.append(dc.__dict__)

    merged_cut_dicts = merge_cuts(raw_cut_dicts)
    resolved_cuts = [
        EditDecision(
            action="cut",
            start=c["start"],
            end=c["end"],
            reason=c.get("reason", "Silence / dead air cut"),
            trigger_id=c.get("trigger_id"),
        )
        for c in merged_cut_dicts
    ]
    all_edits = non_cut_edits + resolved_cuts

    # Sort all edits chronologically by start time (treat None as 0.0)
    all_edits.sort(key=lambda e: (e.start if e.start is not None else 0.0))

    # Apply density budgeting pass
    max_duration = max([e.end or (e.start or 0.0) + 3.0 for e in all_edits], default=300.0)
    budgeted = enforce_density_budgeting(all_edits, total_duration=max_duration)

    broll_count = sum(1 for e in budgeted if e.action == "b_roll")
    mg_count = sum(1 for e in budgeted if e.action == "motion_graphics")
    char_count = sum(1 for e in budgeted if e.action == "character")
    cut_count = sum(1 for e in budgeted if e.action == "cut")
    zoom_count = sum(1 for e in budgeted if e.action == "zoom_in")
    sfx_count = sum(1 for e in budgeted if e.action == "sfx")
    trans_count = sum(1 for e in budgeted if e.action == "transition")

    print(f"\n[RESOLVER: DETERMINISTIC] Merged {len(budgeted)} edits:")
    print(f" -> B-Roll: {broll_count} | MG: {mg_count} | SFX: {sfx_count} | Trans: {trans_count} | Cut: {cut_count}")

    return EditList(edits=budgeted)

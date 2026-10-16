import random
from typing import List
from services.ai_director import EditList, EditDecision

# Deterministic SFX mapping based on visual action types
SFX_ACTION_MAP = {
    "motion_graphics": ["whoosh", "ding", "pop"],
    "b_roll":          ["swoosh", "whoosh"],
    "zoom_in":         ["whoosh", "riser"],
    "character":       ["pop", "boing"],
}

def generate_sfx_plan(
    unified_analysis_json: str,
    resolved_visual_blueprint: EditList,
    ai_model_pref: str = "Claude Opus 5.5",
    style_pref: str = "viral"
) -> EditList:
    """
    Deterministic rule-based SFX assignment (replaces 5th LLM call).
    Attaches high-impact, contextual sound effects to visual transitions
    while respecting audio pacing (minimum 2.0s spacing between SFX).
    """
    sfx_edits: List[EditDecision] = []
    last_sfx_time = -999.0
    MIN_SFX_SPACING = 2.0

    for edit in resolved_visual_blueprint.edits:
        if isinstance(edit, dict):
            action = edit.get("action", "")
            start_raw = edit.get("start", 0.0)
            trigger_id = edit.get("trigger_id", "")
        else:
            action = getattr(edit, "action", "")
            start_raw = getattr(edit, "start", 0.0)
            trigger_id = getattr(edit, "trigger_id", "")

        start_val = 0.0 if start_raw is None else float(start_raw)

        # Attach SFX to visual transition events
        if action in SFX_ACTION_MAP:
            if start_val - last_sfx_time >= MIN_SFX_SPACING:
                sounds = SFX_ACTION_MAP[action]
                chosen = random.choice(sounds)
                sfx_edits.append(
                    EditDecision(
                        action="sfx",
                        trigger_id=trigger_id,
                        start=start_val,
                        end=start_val + 0.5,
                        sound_effect=chosen,
                        reason=f"Rule-based SFX punch ({chosen}) for {action}",
                    )
                )
                last_sfx_time = start_val

    print(f"\n[SFX PLANNER: RULE-BASED] Generated {len(sfx_edits)} sound effects deterministically (no LLM call)")
    combined_edits = resolved_visual_blueprint.edits + sfx_edits
    return EditList(edits=combined_edits)

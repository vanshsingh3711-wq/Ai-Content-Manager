from typing import List, Dict, Any
from services.ai_director import EditList, EditDecision

def resolve_master_blueprint(
    unified_analysis_json: str,
    broll_plan: EditList,
    mg_plan: EditList,
    char_plan: EditList,
    ai_model_pref: str = "Claude Opus 5.5"  # Kept for API compatibility
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
            if action in ("character", "sfx", "zoom_in", "cut") or not tid:
                all_edits.append(edit_obj)
                continue

            # Visual overlay conflict resolution on identical trigger_id
            if tid in seen_triggers:
                existing_edit = seen_triggers[tid]
                existing_priority = PRIORITY.get(getattr(existing_edit, "action", ""), 0)
                new_priority = PRIORITY.get(action, 0)

                if new_priority > existing_priority:
                    # Replace existing with higher-priority edit
                    all_edits = [e for e in all_edits if e is not existing_edit]
                    seen_triggers[tid] = edit_obj
                    all_edits.append(edit_obj)
                # else: keep existing higher-priority edit, skip this one
            else:
                seen_triggers[tid] = edit_obj
                all_edits.append(edit_obj)

    # Sort all edits chronologically by start time (treat None as 0.0)
    all_edits.sort(key=lambda e: (e.start if e.start is not None else 0.0))

    broll_count = sum(1 for e in all_edits if e.action == "b_roll")
    mg_count = sum(1 for e in all_edits if e.action == "motion_graphics")
    char_count = sum(1 for e in all_edits if e.action == "character")
    cut_count = sum(1 for e in all_edits if e.action == "cut")
    zoom_count = sum(1 for e in all_edits if e.action == "zoom_in")

    print(f"\n[RESOLVER: DETERMINISTIC] Merged {len(all_edits)} edits without LLM:")
    print(f" -> B-Roll: {broll_count} | MG: {mg_count} | Char: {char_count} | Zoom: {zoom_count} | Cut: {cut_count}")

    return EditList(edits=all_edits)

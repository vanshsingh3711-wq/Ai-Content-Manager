import json
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from services.motion_graphic_planner import ALLOWED_TEMPLATES

MAX_UNTREATED_GAP_SEC = 9.0

def lint_plan(plan_file, beat_sheet_file, total_duration):
    try:
        with open(plan_file, 'r') as f:
            plan = json.load(f)
        with open(beat_sheet_file, 'r') as f:
            bs = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {plan_file} or {beat_sheet_file}")
        return

    beats_list = bs.get("beats", [])
    beats = {str(b["id"]): b for b in beats_list}

    r_trigger = 0
    r_window = 0
    r_numbers = 0
    r_template = 0
    r_overlap = 0

    edits = plan.get("edits", [])
    overlays = [e for e in edits if e.get("action", "") != "cut"]
    overlays.sort(key=lambda e: e.get("start", 0))

    print(f"--- LINTING {plan_file} (ALLOWED_TEMPLATES={sorted(ALLOWED_TEMPLATES)}) ---")
    
    treated_beat_ids = set()

    last_end = 0.0
    for idx, edit in enumerate(overlays):
        action = edit.get("action", "")
        trigger_id = str(edit.get("trigger_id", ""))
        tid = trigger_id.replace("beat_", "").replace("ID_", "")

        if f"beat_{tid}" != trigger_id:
            print(f"[FAIL] Edit {idx}: trigger_id '{trigger_id}' is not in 'beat_N' format.")
        else:
            r_trigger += 1

        beat = beats.get(tid)
        if not beat:
            print(f"[FAIL] Edit {idx}: beat '{tid}' not found in beat sheet.")
            continue
            
        treated_beat_ids.add(int(tid))

        start = edit.get("start", 0.0)
        end = edit.get("end", 0.0)

        # Overlap check
        if start < last_end - 0.1: # 0.1 tolerance
            print(f"[FAIL] Edit {idx}: overlaps with previous edit (start {start:.2f} < previous end {last_end:.2f})")
        else:
            r_overlap += 1
        last_end = max(last_end, end)

        if start < beat["start"] or end > beat["end"]:
            if end > beat["end"] and end >= total_duration:
                r_window += 1
            else:
                print(f"[FAIL] Edit {idx} ({action}): Window [{start:.2f}, {end:.2f}] outside beat [{beat['start']:.2f}, {beat['end']:.2f}]")
        else:
            r_window += 1

        if action == "motion_graphics":
            mg_type = edit.get("motion_graphics_type", "")

            # --- TEMPLATE_ALLOWED ---
            if mg_type not in ALLOWED_TEMPLATES:
                print(f"[FAIL] Edit {idx} ({trigger_id}): template '{mg_type}' not in ALLOWED_TEMPLATES")
            else:
                r_template += 1

            # --- NUMBERS ---
            is_numeric = mg_type in ['chart_reveal', 'metric_reveal', 'animated_counter', 'metric']
            if is_numeric:
                import re
                beat_numbers = set(re.findall(r'\d+', beat["text"]))
                if not beat_numbers:
                    print(f"[FAIL] Edit {idx}: uses numeric template '{mg_type}' but beat has no numbers.")
                else:
                    r_numbers += 1
            else:
                r_numbers += 1
        else:
            r_template += 1
            r_numbers += 1

    n = len(overlays)
    
    # Gap check
    max_gap = 0.0
    pass_gap = True
    l_end = 0.0
    for ov in overlays:
        gap = ov.get("start", 0) - l_end
        if gap > max_gap:
            max_gap = gap
        l_end = max(l_end, ov.get("end", 0))
    final_gap = total_duration - l_end
    if final_gap > max_gap:
        max_gap = final_gap
        
    if max_gap > MAX_UNTREATED_GAP_SEC:
        print(f"[FAIL] Max gap is {max_gap:.2f}s, which exceeds {MAX_UNTREATED_GAP_SEC}s")
        pass_gap = False
        
    # Consecutive check
    consecutive = 0
    max_consecutive = 0
    pass_consecutive = True
    sorted_beats = sorted(beats_list, key=lambda b: b["start"])
    for b in sorted_beats:
        if b["id"] in treated_beat_ids:
            consecutive += 1
            if consecutive > max_consecutive:
                max_consecutive = consecutive
            if consecutive > 2:
                print(f"[FAIL] Max consecutive treated beats exceeded at beat {b['id']} (got {consecutive})")
                pass_consecutive = False
        else:
            consecutive = 0
            
    # Overlays per minute
    if total_duration > 0:
        opm = (n / total_duration) * 60
    else:
        opm = 0
        
    print(
        f"Rules Passed: ID_FORMAT: {r_trigger}/{n}, "
        f"WINDOW_CLAMP: {r_window}/{n}, "
        f"NUMBERS: {r_numbers}/{n}, "
        f"TEMPLATE_ALLOWED: {r_template}/{n}, "
        f"NO_OVERLAPS: {r_overlap}/{n}, "
        f"MAX_GAP (<=9.0s): {'PASS' if pass_gap else 'FAIL'} (max={max_gap:.2f}s), "
        f"MAX_CONSECUTIVE (<=2): {'PASS' if pass_consecutive else 'FAIL'} (max={max_consecutive})\n"
        f"Overlays per minute: {opm:.1f}"
    )

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python lint_plan.py <plan.json> <beat_sheet.json> <total_duration>")
        sys.exit(1)
    lint_plan(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 60.0)

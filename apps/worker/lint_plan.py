import json
import sys

def lint_plan(plan_file, beat_sheet_file, total_duration):
    try:
        with open(plan_file, 'r') as f:
            plan = json.load(f)
        with open(beat_sheet_file, 'r') as f:
            bs = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {plan_file} or {beat_sheet_file}")
        return

    beats = {str(b["id"]): b for b in bs.get("beats", [])}
    
    # Rules
    r_trigger = 0
    r_window = 0
    r_numbers = 0
    
    edits = plan.get("edits", [])
    
    print(f"--- LINTING {plan_file} ---")
    for idx, edit in enumerate(edits):
        action = edit.get("action", "")
        if action == "cut": continue
        
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
            
        start = edit.get("start", 0.0)
        end = edit.get("end", 0.0)
        
        if start < beat["start"] or end > beat["end"]:
            # unless total duration clamped
            if end > beat["end"] and end >= total_duration:
                r_window += 1
            else:
                print(f"[FAIL] Edit {idx} ({action}): Window [{start:.2f}, {end:.2f}] outside beat [{beat['start']:.2f}, {beat['end']:.2f}]")
        else:
            r_window += 1
            
        if action == "motion_graphics":
            mg_type = edit.get("motion_graphics_type", "")
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
            r_numbers += 1
            
    print(f"Rules Passed: ID_FORMAT: {r_trigger}/{len(edits)}, WINDOW_CLAMP: {r_window}/{len(edits)}, NUMBERS: {r_numbers}/{len(edits)}\n")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python lint_plan.py <plan.json> <beat_sheet.json> <total_duration>")
        sys.exit(1)
    lint_plan(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv)>3 else 60.0)

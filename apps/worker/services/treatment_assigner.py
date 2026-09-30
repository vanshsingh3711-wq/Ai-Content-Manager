import math
from typing import List, Dict, Any, Tuple

def assign_visual_treatments(
    beat_sheet: Dict[str, Any],
    total_duration_sec: float,
    settings: Dict[str, Any]
) -> Tuple[Dict[str, Any], List[Dict[str, str]]]:
    """
    Deterministically assigns a single primary visual treatment to each beat.
    Returns (updated_beat_sheet, log_table)
    """
    beats = beat_sheet.get("beats", [])
    if not beats:
        return beat_sheet, []

    max_overlays_per_min = settings.get("MAX_OVERLAYS_PER_MIN", 8)
    max_overlays = int((total_duration_sec / 60.0) * max_overlays_per_min)
    if max_overlays < 1:
        max_overlays = 1

    log_table = []
    
    # Pass 1: Assign draft treatments based on deterministic rules
    for i, beat in enumerate(beats):
        role = beat.get("role", "")
        importance = beat.get("importance", 1)
        concreteness = beat.get("concreteness", "abstract")
        
        # Emphasis window derivation
        # (In a real implementation with word timings available in the beat or via timestamp_map,
        # we would map emphasis_words back to their timestamps. Since they are strings here, 
        # we use the beat's start/end as a fallback.)
        start = beat["start"]
        end = beat["end"]
            
        dur = end - start
        min_dur = settings.get("MIN_OVERLAY_DURATION", 2.0)
        max_dur = settings.get("MAX_OVERLAY_DURATION", 6.0)
        
        if dur < min_dur:
            if beat["end"] - beat["start"] >= min_dur:
                end = start + min_dur
            else:
                pass # Handled by snapping downstream
                
        if dur > max_dur:
            # Snap to max duration centered around start, or just start + max
            end = start + max_dur
            
        beat["emphasis_start"] = start
        beat["emphasis_end"] = end

        if importance <= 2:
            beat["treatment"] = "none"
            beat["treatment_reason"] = "Importance <= 2"
        elif role in ["statistic", "comparison", "list"]:
            beat["treatment"] = "motion_graphic"
            beat["treatment_reason"] = f"Role: {role}"
        elif role == "hook":
            beat["treatment"] = "kinetic_text"
            beat["treatment_reason"] = "Role: hook"
        elif role == "cta":
            beat["treatment"] = "kinetic_text"
            beat["treatment_reason"] = "Role: cta"
        else:
            if concreteness == "concrete":
                beat["treatment"] = "b_roll"
                beat["treatment_reason"] = "Concreteness: concrete"
            else:
                beat["treatment"] = "motion_graphic"
                beat["treatment_reason"] = "Concreteness: abstract -> motion_graphic"

    # Pass 2: Enforce max consecutive treated beats (demote lowest importance in the run)
    while True:
        # Find the first run > 2 of treated beats
        run_start = -1
        max_run = []
        for i in range(len(beats)):
            if beats[i]["treatment"] != "none":
                if run_start == -1:
                    run_start = i
            else:
                if run_start != -1:
                    if (i - run_start) > 2:
                        max_run = beats[run_start:i]
                        break
                    run_start = -1
                    
        if not max_run and run_start != -1 and (len(beats) - run_start) > 2:
            max_run = beats[run_start:]
            
        if not max_run:
            break # No more runs > 2 found
            
        # Demote lowest importance beat in this run
        demotable = [b for b in max_run if b.get("role") not in ["hook", "cta"]]
        if not demotable:
            break # Can't demote anything (e.g. they are all hooks/ctas)
            
        # Sort by importance ascending
        demotable.sort(key=lambda x: x.get("importance", 1))
        lowest_beat = demotable[0]
        
        lowest_beat["treatment"] = "none"
        lowest_beat["treatment_reason"] = "Demoted: Lowest importance in consecutive treated run > 2"

    # Pass 3: Enforce minimum untreated share (by duration)
    total_treated_duration = sum(b["emphasis_end"] - b["emphasis_start"] for b in beats if b["treatment"] != "none")
    target_untreated_duration = total_duration_sec * 0.35
    max_treated_duration = total_duration_sec - target_untreated_duration
    
    if total_treated_duration > max_treated_duration:
        # Sort treated beats by importance ascending
        treated_beats = [b for b in beats if b["treatment"] != "none" and b.get("role") not in ["hook", "cta"]]
        treated_beats.sort(key=lambda x: x.get("importance", 1))
        
        for b in treated_beats:
            if total_treated_duration <= max_treated_duration:
                break
            dur = b["emphasis_end"] - b["emphasis_start"]
            b["treatment"] = "none"
            b["treatment_reason"] = "Demoted: Untreated share constraint (35%)"
            total_treated_duration -= dur

    # Pass 4: Enforce max untreated gap rule
    max_gap_sec = settings.get("MAX_UNTREATED_GAP_SEC", 9.0)
    current_gap_start = 0.0
    for i, beat in enumerate(beats):
        if beat["treatment"] != "none":
            gap_dur = beat["start"] - current_gap_start
            if gap_dur > max_gap_sec:
                gap_beats = [b for b in beats if b["treatment"] == "none" and b["start"] >= current_gap_start and b["end"] <= beat["start"] and b.get("importance", 1) > 1]
                if gap_beats:
                    gap_beats.sort(key=lambda x: x.get("importance", 1), reverse=True)
                    target = gap_beats[0]
                    target["treatment"] = "b_roll" if target.get("concreteness") == "concrete" else "motion_graphic"
                    target["treatment_reason"] = f"Promoted: Max untreated gap > {max_gap_sec}s"
            current_gap_start = beat["end"]
            
    # Check gap at the end
    if total_duration_sec - current_gap_start > max_gap_sec:
        gap_beats = [b for b in beats if b["treatment"] == "none" and b["start"] >= current_gap_start and b.get("importance", 1) > 1]
        if gap_beats:
            gap_beats.sort(key=lambda x: x.get("importance", 1), reverse=True)
            target = gap_beats[0]
            target["treatment"] = "b_roll" if target.get("concreteness") == "concrete" else "motion_graphic"
            target["treatment_reason"] = f"Promoted: Max untreated gap > {max_gap_sec}s"

    # Build log table
    for i, beat in enumerate(beats):
        log_table.append({
            "beat_idx": i,
            "treatment": beat["treatment"],
            "reason": beat["treatment_reason"],
            "role": beat.get("role"),
            "importance": beat.get("importance"),
            "concreteness": beat.get("concreteness")
        })

    return beat_sheet, log_table

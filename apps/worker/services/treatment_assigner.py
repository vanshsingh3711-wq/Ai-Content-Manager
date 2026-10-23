import math
from typing import List, Dict, Any, Tuple

def infer_suggested_template(beat: Dict[str, Any]) -> str:
    """
    Infers the optimal high-impact Remotion motion graphic template
    based on the semantic theme, vocabulary, numbers, and role of the beat.
    """
    text = (beat.get("text") or "").lower()
    focus = (beat.get("focus_phrase") or "").lower()
    combined = f"{text} {focus}"
    role = beat.get("role", "").lower()

    # 1. Compounding, Formulas & Math Systems (Rule of 72, growth formulas, doubling calculations)
    if any(k in combined for k in ["rule of 72", "formula", "compound", "divide it by", "rate of return", "doubling", "years to double", "exponential"]):
        return "compound_formula"

    # 2. Performance Battles & Head-to-Head Comparisons (Bank vs Index, vs, versus, compared to)
    if (("vs" in combined or "versus" in combined or "unlike" in combined or "compared" in combined) and any(k in combined for k in ["bank", "index", "fund", "rate", "percent", "%"])) \
       or ("bank" in combined and any(k in combined for k in ["index fund", "s&p", "market", "stocks"])) \
       or (role == "comparison" and any(k in combined for k in ["%", "return", "gain", "double", "bank", "invest"])):
        return "battle_chart"

    # 3. Contrast transformation / Split slider (Before vs After, safe vs broke, paradigm shifts)
    if any(k in combined for k in ["feels safe", "guaranteeing you stay broke", "stop saving", "start investing", "before and after", "instead of"]):
        return "split_slider_comparison"

    # 4. Urgency, Inflation, Capital Destruction & Risk Meters
    if any(k in combined for k in ["inflation", "drain", "drained", "silently drained", "losing money", "purchasing power", "bleeding", "danger", "broke", "dead", "destroy"]):
        return "urgency_dial_gauge"

    # 5. Big Milestone Metrics & Wealth Transformation ($20k -> $160k, massive multiples)
    if ("turn" in combined or "transform" in combined or "into $" in combined or "doublings" in combined) and ("$" in combined or "k" in combined):
        return "stat_card_highlight"

    # 6. Checklists, Step Sequences, Multi-stage processes
    if role in ["list", "process"] or any(k in combined for k in ["step 1", "step 2", "three rules", "checklist"]):
        return "step_sequence"

    # 7. Exact statistics / KPI metrics
    if role in ["statistic", "data", "metric"] or "%" in combined or "$" in combined:
        return "metric_reveal"

    # 8. Hook / CTA
    if role in ["hook", "cta"]:
        return "kinetic_text"

    # 9. Fallback for insights
    return "stat_card_highlight" if role in ["insight", "claim"] else "hero_reveal"


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

        is_faceless = settings.get("is_faceless", False)
        if importance <= 2:
            beat["treatment"] = "b_roll" if is_faceless else "none"
            beat["treatment_reason"] = "Importance <= 2 (Faceless b-roll fallback)" if is_faceless else "Importance <= 2"
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

        if beat["treatment"] in ["motion_graphic", "kinetic_text"]:
            beat["suggested_template"] = infer_suggested_template(beat)

    # Pass 2: Enforce max consecutive treated beats (demote lowest importance in the run)
    is_faceless = settings.get("is_faceless", False)
    while True:
        # Find the first run > 2 of treated beats (for faceless, only limit consecutive motion_graphics)
        run_start = -1
        max_run = []
        for i in range(len(beats)):
            treated = (beats[i]["treatment"] in ["motion_graphic", "kinetic_text"]) if is_faceless else (beats[i]["treatment"] != "none")
            if treated:
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
        
        lowest_beat["treatment"] = "b_roll" if is_faceless else "none"
        lowest_beat["treatment_reason"] = "Demoted: Lowest importance in consecutive treated run > 2"

    # Pass 3: Enforce minimum untreated share (by duration) - Only for talking-head videos with speaker
    if not is_faceless:
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

    beat_sheet["is_faceless"] = is_faceless

    return beat_sheet, log_table

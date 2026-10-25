"""
Pacing & Budget Gatekeeper (Phase 3)
Enforces cinematic editorial rhythm, prevents visual fatigue, and guarantees
optimal distribution of motion graphic explainer cards across any video runtime.

Key Guardrails:
1. Reel Budget Limit:
   - 60s vertical reel: Maximum 3 to 4 motion graphics (default max 4 for viral, 3 for minimal).
   - 3-to-4 minute explainer: Maximum 7 to 9 motion graphics.
   - Pro-rated dynamically based on duration.
2. Minimum B-Roll Breathing Interval:
   - Minimum 3.5s to 5.0s of raw B-roll footage between any two motion graphics.
   - Zero consecutive back-to-back motion graphic cards allowed.
3. Information Density Ranking & Pruning:
   - When candidate motion graphics exceed the budget or collide within the spacing window,
     each candidate is scored across 4 dimensions:
       a) Archetype Rhetorical Weight (deep systemic models vs simple stat reveals)
       b) Prop Richness & Target Fill Factor (structured complexity of extracted entities)
       c) Classifier Confidence Score
       d) Narrative Arc Distribution (rewarding balanced spacing across hook, core, and climax)
   - Pruned or colliding candidates are gracefully downgraded to contextual B-roll cuts,
     synthesizing clean search queries from the underlying script entities.
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union


# ---------------------------------------------------------------------------
# Archetype Rhetorical Value Weights
# Systemic, multi-entity models provide the highest cognitive retention payoff.
# ---------------------------------------------------------------------------

ARCHETYPE_WEIGHTS: Dict[str, float] = {
    # Systemic, high-retention architectural & cognitive models (Tier 1: 1.0)
    "trilemma_tradeoff": 1.00,
    "bottleneck_constriction": 1.00,
    "exploded_layer_stack": 1.00,
    "causal_loop": 1.00,
    "radar_spider_chart": 1.00,
    "pareto_power_law": 1.00,
    "chrono_dial_clock": 1.00,

    # High-impact comparative, transformation & roadmap models (Tier 2: 0.88 - 0.95)
    "showdown_duel": 0.94,
    "split_slider_comparison": 0.94,
    "battle_chart": 0.90,
    "architecture_pipeline": 0.90,
    "timeline_roadmap": 0.88,
    "decision_tree_fork": 0.88,
    "scale_zoom_ladder": 0.88,
    "hierarchy_pyramid": 0.86,
    "tactile_checklist_stamp": 0.86,
    "mind_map_node_web": 0.85,

    # Investigative, analytical & diagnostic models (Tier 3: 0.78 - 0.84)
    "urgency_dial_gauge": 0.84,
    "newspaper_highlighter": 0.82,
    "magnifying_glass_zoom": 0.82,
    "todo_list": 0.80,
    "step_sequence": 0.78,
    "vscode_code_typing": 0.78,

    # Specialized cognitive & formula models (Tier 4: 0.70 - 0.75)
    "compound_formula": 0.74,
    "perception_gauge": 0.72,
    "spotlight_cone": 0.72,
    "brain_neural_scan": 0.70,
    "cognitive_dialogue": 0.70,
    "code_reveal": 0.70,

    # Single-stat & micro-reveal cards (Tier 5: 0.55 - 0.65)
    "stat_card_highlight": 0.65,
    "metric_reveal": 0.65,
    "hero_reveal": 0.62,
    "quote_reveal": 0.60,
    "cooked_terminal": 0.62,
    "cooked_chat": 0.58,
    "cooked_social_post": 0.55,
    "cooked_notes": 0.55,
    "kinetic_text": 0.50,
}

# Stopwords to clean from generated B-roll search queries
BROLL_QUERY_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "this", "that", "these", "those",
    "and", "or", "but", "in", "on", "at", "to", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "can", "will", "just", "don", "should", "now"
}


# ---------------------------------------------------------------------------
# Budget Calculation
# ---------------------------------------------------------------------------

def get_motion_graphic_budget(
    video_duration: float,
    style: str = "viral",
    max_limit: Optional[int] = None,
) -> int:
    """
    Computes the maximum motion graphic cards allowed for a given video duration.
    
    Guarantees:
      - 60s Reel (<= 75s): 3-4 cards (4 for viral, 3 for minimal).
      - Short Clips (< 40s): 2-3 cards.
      - Mid-length (75s - 150s): 5-6 cards.
      - 3-4 min Explainer (150s - 240s): 7-9 cards.
      - Longer format (> 240s): scales at ~2.2 cards/min up to max 12.
    """
    if max_limit is not None and max_limit > 0:
        return max_limit

    d = max(1.0, float(video_duration))
    is_minimal = (style.lower() == "minimal")

    if d <= 32.0:
        budget = 2
    elif d <= 48.0:
        budget = 2 if is_minimal else 3
    elif d <= 78.0:
        # Standard 60s reel sweet spot: 3 to 4 cards
        budget = 3 if is_minimal else 4
    elif d <= 135.0:
        budget = 4 if is_minimal else 6
    elif d <= 240.0:
        # 3 to 4 min explainer sweet spot: 7 to 9 cards
        budget = 7 if is_minimal else 9
    else:
        rate = 1.8 if is_minimal else 2.2
        calc = int(round((d / 60.0) * rate))
        budget = max(4, min(calc, 12))

    return budget


# ---------------------------------------------------------------------------
# Information Density Scoring
# ---------------------------------------------------------------------------

def calculate_prop_richness(targets: Optional[Dict[str, Any]]) -> float:
    """
    Calculates prop completeness and structural density of motion graphic targets.
    Returns a score between 0.2 and 1.0.
    """
    if not targets or not isinstance(targets, dict):
        return 0.20

    # Count non-empty, meaningful target keys
    valid_keys = 0
    substantive_keys = {
        "title", "subtitle", "badge", "synthesis", "axiom",
        "inputMetric", "chokeMetric", "outputMetric",
        "side1Title", "side2Title", "side1Metric", "side2Metric",
        "vitalReturn", "vitalLabel", "trivialReturn",
        "layer1Title", "layer2Title", "layer3Title", "layer4Title",
        "stage1Title", "stage2Title", "stage3Title", "stage4Title",
        "node1Title", "node2Title", "node3Title", "node4Title",
        "vertex1Title", "vertex2Title", "vertex3Title",
        "axis1", "axis2", "axis3", "axis4", "axis5",
        "epoch1Title", "epoch2Title", "epoch3Title", "epoch4Title",
        "step1Title", "step2Title", "step3Title",
        "point1", "point2", "point3",
        "leftTitle", "rightTitle", "leftMetric", "rightMetric",
    }

    for k, v in targets.items():
        if v and str(v).strip():
            if k in substantive_keys:
                valid_keys += 2
            else:
                valid_keys += 1

    # Normalize to [0.2, 1.0]
    if valid_keys >= 8:
        return 1.00
    elif valid_keys >= 6:
        return 0.88
    elif valid_keys >= 4:
        return 0.72
    elif valid_keys >= 2:
        return 0.55
    return 0.35


def calculate_information_density_score(
    edit: Dict[str, Any],
    timestamp_map: Optional[Dict[str, Any]] = None,
    video_duration: float = 60.0,
) -> float:
    """
    Scores a candidate motion graphic based on:
      1. Rhetorical Archetype Weight (40%)
      2. Prop Richness & Structured Entities (30%)
      3. Classifier Confidence (20%)
      4. Temporal Duration & Narrative Placement (10%)

    Returns a score between 0.0 and 1.0.
    """
    timestamp_map = timestamp_map or {}
    mg_type = str(edit.get("motion_graphics_type") or "hero_reveal").lower()
    targets = edit.get("motion_graphics_targets") or {}

    # 1. Archetype Weight (0.50 to 1.0)
    archetype_wt = ARCHETYPE_WEIGHTS.get(mg_type, 0.65)

    # 2. Prop Richness (0.20 to 1.0)
    prop_score = calculate_prop_richness(targets)

    # 3. Confidence (0.50 to 1.0)
    raw_conf = edit.get("confidence")
    if raw_conf is not None:
        try:
            confidence = max(0.1, min(1.0, float(raw_conf)))
        except (ValueError, TypeError):
            confidence = 0.80
    else:
        # If no explicit confidence was attached, infer baseline from keyword vs generic
        confidence = 0.92 if mg_type in ARCHETYPE_WEIGHTS and archetype_wt >= 0.85 else 0.80

    # 4. Narrative Positioning & Duration Hold Factor
    # Get chunk start & end
    start = edit.get("start")
    end = edit.get("end")
    trigger_id = str(edit.get("trigger_id") or "")
    if (start is None or end is None) and trigger_id in timestamp_map:
        cdata = timestamp_map[trigger_id]
        start = float(cdata.get("start", 0.0))
        end = float(cdata.get("end", start + 3.0))

    start_val = 0.0 if start is None else float(start)
    end_val = start_val + 3.0 if end is None else float(end)
    dur = max(0.5, end_val - start_val)

    # Duration bonus: ideal hold is 2.2s - 4.0s
    if 2.2 <= dur <= 4.2:
        dur_factor = 1.00
    elif dur < 1.8:
        dur_factor = 0.65  # Too rushed for human cognition
    else:
        dur_factor = 0.85

    # Narrative arc sweet spot: hooks (0-20% time), mid-climax (40-60% time), or payoff (75-90% time)
    rel_pos = start_val / max(1.0, video_duration)
    if rel_pos <= 0.25 or (0.40 <= rel_pos <= 0.65) or (0.75 <= rel_pos <= 0.95):
        arc_factor = 1.00
    else:
        arc_factor = 0.90

    narrative_score = (dur_factor * 0.6) + (arc_factor * 0.4)

    # Composite weighted score
    total_score = (
        (archetype_wt * 0.40) +
        (prop_score * 0.30) +
        (confidence * 0.20) +
        (narrative_score * 0.10)
    )

    return round(total_score, 4)


# ---------------------------------------------------------------------------
# B-Roll Query Synthesis for Pruned Graphics
# ---------------------------------------------------------------------------

def extract_broll_search_query(
    edit: Dict[str, Any],
    chunk_text: str = "",
    topic: str = "technology",
) -> str:
    """
    Synthesizes a clean, high-relevance B-roll search query from a downgraded motion graphic.
    Avoids punctuation, slop words, and keeps terms concrete for stock video search engines.
    """
    targets = edit.get("motion_graphics_targets") or {}
    candidates = []

    # Priority 1: Substantive title / subtitle from targets
    title = str(targets.get("title") or targets.get("headline") or targets.get("leftTitle") or "").strip()
    subtitle = str(targets.get("subtitle") or targets.get("stage1Title") or targets.get("layer1Title") or "").strip()

    # Priority 2: Edit reason
    reason = str(edit.get("reason") or "").strip()

    source_text = f"{title} {subtitle} {chunk_text} {reason}".strip()
    if not source_text:
        return f"{topic} dynamic abstract technology"

    # Remove special chars and emojis
    clean_text = re.sub(r"[^\w\s-]", " ", source_text.lower())
    words = [w for w in clean_text.split() if len(w) > 2 and w not in BROLL_QUERY_STOPWORDS]

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for w in words:
        if w not in seen:
            seen.add(w)
            deduped.append(w)

    # Take top 3 to 5 strong entity keywords
    selected_words = deduped[:4]
    if not selected_words:
        return f"{topic} dynamic cinematic"

    query = " ".join(selected_words)
    return query


def synthesize_broll_fallback_from_mg(
    edit: Dict[str, Any],
    chunk_text: str = "",
    topic: str = "technology",
    downgrade_reason: str = "Pacing budget gatekeeper",
) -> Dict[str, Any]:
    """
    Converts a pruned motion graphic into a contextual B-roll edit decision.
    """
    mg_type = edit.get("motion_graphics_type", "motion_graphics")
    search_query = extract_broll_search_query(edit, chunk_text=chunk_text, topic=topic)

    broll_edit = {
        "action": "b_roll",
        "trigger_id": edit.get("trigger_id", "broll_fallback"),
        "start": edit.get("start"),
        "end": edit.get("end"),
        "search_query": search_query,
        "reason": f"{downgrade_reason}: Downgraded '{mg_type}' to contextual B-roll to preserve 3-4 card reel pacing",
    }
    return broll_edit


# ---------------------------------------------------------------------------
# Master Pacing & Budget Gatekeeper Pruner
# ---------------------------------------------------------------------------

def prune_motion_graphics_by_pacing_and_budget(
    edits: List[Union[Dict[str, Any], Any]],
    timestamp_map: Optional[Dict[str, Any]] = None,
    video_duration: float = 60.0,
    max_mg_count: Optional[int] = None,
    min_spacing_sec: float = 3.5,
    style: str = "viral",
    topic: str = "technology",
    downgrade_to_broll: bool = True,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Deterministic Pacing & Budget Gatekeeper.

    Algorithm:
      1. Extract all candidate `motion_graphics` edits.
      2. If candidates <= budget and all comply with `min_spacing_sec`, all are retained.
      3. Otherwise, score every candidate with `calculate_information_density_score()`.
      4. Sort candidates by score descending.
      5. Greedy selection with interval constraints:
         - Iterate through highest-scoring candidates.
         - Accept candidate if it doesn't collide with already accepted candidates (spacing >= min_spacing_sec)
           and total accepted < budget.
      6. Downgrade non-selected candidate motion graphics to contextual `b_roll` edits.
      7. Return (new_edits, issues_summary, metrics).
    """
    timestamp_map = timestamp_map or {}
    budget = get_motion_graphic_budget(video_duration, style=style, max_limit=max_mg_count)

    # Convert edits to standard dicts
    dict_edits: List[Dict[str, Any]] = []
    for raw_e in edits:
        if isinstance(raw_e, dict):
            dict_edits.append(dict(raw_e))
        elif hasattr(raw_e, "model_dump"):
            dict_edits.append(raw_e.model_dump())
        else:
            dict_edits.append(dict(raw_e.__dict__))

    mg_candidates: List[Dict[str, Any]] = []
    other_edits: List[Dict[str, Any]] = []

    for e in dict_edits:
        if e.get("action") == "motion_graphics":
            mg_candidates.append(e)
        else:
            other_edits.append(e)

    # Fast path: No motion graphics
    if not mg_candidates:
        metrics = {
            "budget_max": budget,
            "original_mg_count": 0,
            "retained_mg_count": 0,
            "downgraded_count": 0,
        }
        return dict_edits, [], metrics

    # Normalize start/end for all candidates
    for mg in mg_candidates:
        tid = str(mg.get("trigger_id") or "")
        if (mg.get("start") is None or mg.get("end") is None) and tid in timestamp_map:
            cdata = timestamp_map[tid]
            mg["start"] = float(cdata.get("start", 0.0))
            mg["end"] = float(cdata.get("end", mg["start"] + 3.0))
        if mg.get("start") is None:
            mg["start"] = 0.0
        if mg.get("end") is None:
            mg["end"] = float(mg["start"]) + 3.0

    # Score all candidates
    scored_candidates = []
    for idx, mg in enumerate(mg_candidates):
        score = calculate_information_density_score(
            edit=mg,
            timestamp_map=timestamp_map,
            video_duration=video_duration,
        )
        scored_candidates.append({
            "index": idx,
            "edit": mg,
            "score": score,
            "start": float(mg["start"]),
            "end": float(mg["end"]),
            "type": mg.get("motion_graphics_type", "motion_graphics"),
            "trigger_id": mg.get("trigger_id", f"mg_{idx}"),
        })

    # Sort descending by score, breaking ties by earlier timeline position
    scored_candidates.sort(key=lambda x: (x["score"], -x["start"]), reverse=True)

    accepted_indices = set()
    accepted_intervals: List[Tuple[float, float]] = []
    issues: List[Dict[str, Any]] = []

    # Greedy selection honoring budget & min_spacing_sec
    for cand in scored_candidates:
        if len(accepted_indices) >= budget:
            issues.append({
                "trigger_id": cand["trigger_id"],
                "action": "motion_graphics",
                "issue": f"Exceeded reel budget limit ({budget} max for {video_duration:.0f}s). Score={cand['score']:.2f}. Downgraded to B-roll.",
                "severity": "modified",
                "candidate": cand,
            })
            continue

        c_start = cand["start"]
        c_end = cand["end"]

        # Check collision with already accepted candidates
        collision = False
        colliding_with = None
        for a_start, a_end in accepted_intervals:
            # Distance between intervals
            gap = max(0.0, max(a_start - c_end, c_start - a_end))
            if gap < min_spacing_sec:
                collision = True
                colliding_with = (a_start, a_end)
                break

        if collision:
            issues.append({
                "trigger_id": cand["trigger_id"],
                "action": "motion_graphics",
                "issue": f"Card at [{c_start:.1f}s-{c_end:.1f}s] violates minimum {min_spacing_sec:.1f}s breathing room with existing card at [{colliding_with[0]:.1f}s-{colliding_with[1]:.1f}s]. Score={cand['score']:.2f}. Downgraded to B-roll.",
                "severity": "modified",
                "candidate": cand,
            })
            continue

        # Accepted!
        accepted_indices.add(cand["index"])
        accepted_intervals.append((c_start, c_end))

    # Reassemble output edits
    final_edits: List[Dict[str, Any]] = list(other_edits)
    downgraded_count = 0

    for idx, mg in enumerate(mg_candidates):
        if idx in accepted_indices:
            final_edits.append(mg)
        else:
            # Downgrade to B-roll or drop
            if downgrade_to_broll:
                tid = str(mg.get("trigger_id") or "")
                chunk_text = timestamp_map.get(tid, {}).get("text", "")
                broll = synthesize_broll_fallback_from_mg(
                    edit=mg,
                    chunk_text=chunk_text,
                    topic=topic,
                    downgrade_reason="Pacing Gatekeeper",
                )
                final_edits.append(broll)
                downgraded_count += 1

    # Sort all edits chronologically
    final_edits.sort(key=lambda e: (float(e.get("start") or 0.0)))

    metrics = {
        "budget_max": budget,
        "original_mg_count": len(mg_candidates),
        "retained_mg_count": len(accepted_indices),
        "downgraded_count": downgraded_count,
    }

    return final_edits, issues, metrics

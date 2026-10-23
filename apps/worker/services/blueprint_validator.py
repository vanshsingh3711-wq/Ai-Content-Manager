"""
Blueprint Validator — Deterministic validation layer between AI Director and Renderer.

Ensures AI-generated editing decisions are safe, within budget, and correctly formed
before they reach FFmpeg. This is a hard safety net independent of LLM prompt quality.

Pipeline position:
    AI Director → Raw Blueprint → Blueprint Validator → Validated Blueprint → Renderer
"""

from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from services.editing_config import EDITING_CONFIG


class ValidationIssue(BaseModel):
    """A single validation issue found in the blueprint."""
    trigger_id: str
    action: str
    issue: str
    severity: str = "rejected"  # "rejected", "modified", "warning"


class ValidationReport(BaseModel):
    """Full report of what the validator accepted, rejected, or modified."""
    original_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    modified_count: int = 0
    issues: List[ValidationIssue] = []
    broll_budget_used: float = 0.0  # seconds of B-roll in validated blueprint
    broll_budget_max: float = 0.0   # maximum allowed seconds


def validate_blueprint(
    edits: List[Dict[str, Any]],
    timestamp_map: Dict[str, Any],
    video_duration: float,
    config: Optional[Any] = None,
    is_faceless: bool = False,
) -> Tuple[List[Dict[str, Any]], ValidationReport]:
    """
    Validates and filters AI-generated editing decisions.

    Args:
        edits: Raw list of edit decision dicts from the AI Director.
        timestamp_map: Mapping of chunk IDs to {start, end, text, words}.
        video_duration: Total duration of the original video in seconds.
        config: Optional EditingConfig override (uses EDITING_CONFIG singleton by default).
        is_faceless: True if the video is faceless (allows higher B-roll budgets).

    Returns:
        Tuple of (validated_edits, validation_report).
        validated_edits contains only the edits that passed validation.
    """
    cfg = config or EDITING_CONFIG
    max_broll_count = getattr(cfg, "MAX_BROLL_COUNT_FACELESS", 20) if is_faceless else cfg.MAX_BROLL_COUNT
    report = ValidationReport(original_count=len(edits))

    # Calculate B-roll budget
    broll_ratio = getattr(cfg, "MAX_BROLL_DURATION_RATIO_FACELESS", 1.0) if is_faceless else cfg.MAX_BROLL_DURATION_RATIO
    max_broll_duration = video_duration * broll_ratio
    report.broll_budget_max = round(max_broll_duration, 2)

    validated: List[Dict[str, Any]] = []
    broll_events: List[Dict[str, Any]] = []  # Track B-roll events for spacing/overlap checks
    total_broll_duration = 0.0

    for edit in edits:
        action = edit.get("action", "")

        # ── Basic schema validation ───────────────────────────────────
        if not action:
            report.issues.append(ValidationIssue(
                trigger_id="UNKNOWN",
                action="UNKNOWN",
                issue="Missing required field: action",
            ))
            report.rejected_count += 1
            continue

        # ── Cut-specific validation ───────────────────────────────────
        if action == "cut":
            start = edit.get("start")
            end = edit.get("end")
            if start is None or end is None:
                report.issues.append(ValidationIssue(
                    trigger_id="N/A",
                    action=action,
                    issue="Cut missing required start or end timestamps",
                ))
                report.rejected_count += 1
                continue
            
            try:
                start = float(start)
                end = float(end)
            except (ValueError, TypeError):
                report.issues.append(ValidationIssue(
                    trigger_id="N/A",
                    action=action,
                    issue=f"Invalid timestamps: start={start}, end={end}",
                ))
                report.rejected_count += 1
                continue

            if start < 0 or end > video_duration + 0.5:
                report.issues.append(ValidationIssue(
                    trigger_id="N/A",
                    action=action,
                    issue=f"Timestamps [{start:.2f}-{end:.2f}] outside video duration {video_duration:.2f}s",
                ))
                report.rejected_count += 1
                continue

            if end <= start:
                report.issues.append(ValidationIssue(
                    trigger_id="N/A",
                    action=action,
                    issue=f"Invalid timestamp range: start={start:.2f} >= end={end:.2f}",
                ))
                report.rejected_count += 1
                continue

            cut_duration = end - start
            if cut_duration < cfg.MIN_CUT_DURATION_SEC:
                report.issues.append(ValidationIssue(
                    trigger_id="N/A",
                    action=action,
                    issue=f"Cut duration {cut_duration:.2f}s below minimum {cfg.MIN_CUT_DURATION_SEC}s",
                ))
                report.rejected_count += 1
                continue
            
            validated.append(edit)
            report.accepted_count += 1
            continue

        # For non-cut actions, trigger_id is required.
        trigger_id = edit.get("trigger_id", "")
        if not trigger_id:
            report.issues.append(ValidationIssue(
                trigger_id="UNKNOWN",
                action=action,
                issue="Missing required field: trigger_id for non-cut action",
            ))
            report.rejected_count += 1
            continue

        # ── Validate trigger_id exists in timestamp_map ───────────────
        if trigger_id not in timestamp_map:
            report.issues.append(ValidationIssue(
                trigger_id=trigger_id,
                action=action,
                issue=f"trigger_id '{trigger_id}' not found in timestamp_map",
            ))
            report.rejected_count += 1
            continue

        chunk = timestamp_map[trigger_id]
        chunk_start = chunk.get("start", 0.0)
        chunk_end = chunk.get("end", 0.0)
        chunk_duration = chunk_end - chunk_start

        # ── Validate timestamps are within video duration ─────────────
        if chunk_start < 0 or chunk_end > video_duration + 0.5:
            report.issues.append(ValidationIssue(
                trigger_id=trigger_id,
                action=action,
                issue=f"Timestamps [{chunk_start:.2f}-{chunk_end:.2f}] outside video duration {video_duration:.2f}s",
            ))
            report.rejected_count += 1
            continue

        if chunk_end <= chunk_start:
            report.issues.append(ValidationIssue(
                trigger_id=trigger_id,
                action=action,
                issue=f"Invalid timestamp range: start={chunk_start:.2f} >= end={chunk_end:.2f}",
            ))
            report.rejected_count += 1
            continue

        # ── B-roll-specific validation ────────────────────────────────
        if action == "b_roll":
            # 1. Justification required
            reason = edit.get("reason", "")
            if cfg.BROLL_REASON_REQUIRED and not reason:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue="B-roll missing required 'reason' justification",
                ))
                report.rejected_count += 1
                continue

            # 2. Count limit
            broll_count_so_far = len([e for e in validated if e.get("action") == "b_roll"])
            if broll_count_so_far >= max_broll_count:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"B-roll count limit reached ({max_broll_count})",
                ))
                report.rejected_count += 1
                continue

            # 3. Individual duration limits
            if chunk_duration < cfg.MIN_BROLL_DURATION_SEC:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"B-roll duration {chunk_duration:.2f}s below minimum {cfg.MIN_BROLL_DURATION_SEC}s",
                ))
                report.rejected_count += 1
                continue

            if chunk_duration > cfg.MAX_BROLL_DURATION_SEC:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"B-roll duration {chunk_duration:.2f}s exceeds maximum {cfg.MAX_BROLL_DURATION_SEC}s",
                    severity="warning",
                ))
                # Allow but warn — the chunk duration is set by the transcriber, not the AI

            # 4. Total duration budget
            if total_broll_duration + chunk_duration > max_broll_duration:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"B-roll budget exhausted: {total_broll_duration:.2f}s + {chunk_duration:.2f}s > {max_broll_duration:.2f}s",
                ))
                report.rejected_count += 1
                continue

            # 5. Overlap detection
            overlap = False
            for existing in broll_events:
                ex_start = existing["start"]
                ex_end = existing["end"]
                if chunk_start < ex_end and chunk_end > ex_start:
                    overlap = True
                    report.issues.append(ValidationIssue(
                        trigger_id=trigger_id,
                        action=action,
                        issue=f"B-roll overlaps with existing B-roll at [{ex_start:.2f}-{ex_end:.2f}]",
                    ))
                    break
            if overlap:
                report.rejected_count += 1
                continue

            # 6. Minimum spacing from previous B-roll
            if broll_events:
                min_broll_spacing = getattr(cfg, "MIN_BROLL_SPACING_SEC_FACELESS", 0.0) if is_faceless else cfg.MIN_BROLL_SPACING_SEC
                last_broll_end = broll_events[-1]["end"]
                spacing = chunk_start - last_broll_end
                if spacing < min_broll_spacing:
                    report.issues.append(ValidationIssue(
                        trigger_id=trigger_id,
                        action=action,
                        issue=f"B-roll spacing {spacing:.2f}s below minimum {min_broll_spacing}s",
                    ))
                    report.rejected_count += 1
                    continue

            # 7. Valid search query
            search_query = edit.get("search_query", "")
            if not search_query:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue="B-roll missing search_query",
                ))
                report.rejected_count += 1
                continue

            # B-roll passed all checks
            total_broll_duration += chunk_duration
            broll_events.append({"start": chunk_start, "end": chunk_end, "trigger_id": trigger_id})
            validated.append(edit)
            report.accepted_count += 1
            continue

        # ── zoom_in / sfx / character — lightweight validation ────────────────────
        if action in ("zoom_in", "sfx", "character"):
            validated.append(edit)
            report.accepted_count += 1
            continue

        # ── motion_graphics — validate template + required keys ───────
        if action == "motion_graphics":
            from services.motion_graphic_planner import ALLOWED_TEMPLATES

            TEMPLATE_REQUIRED_KEYS = {
                "hero_reveal":         {"label", "headline", "supporting"},
                "metric_reveal":       {"label", "metric"},
                "quote_reveal":        {"quote"},
                "step_sequence":       {"title", "step1", "step2"},
                "before_after":        {"beforeLabel", "before", "afterLabel", "after"},
                "chart_reveal":        {"title", "dataPoint1"},
                "icon_reveal":         {"concept", "label"},
                "code_reveal":         {"code"},
                "stat_card_highlight": {"label", "stat"},
                "browser_walkthrough": {"url", "tabTitle"},
                "vscode_code_typing":  {"title", "activeFile", "code"},
                "kinetic_text":        {"text"},
                "cooked_likes":        {"label"},
                "cooked_terminal":     {"command"},
                "cooked_social_post":  {"text"},
                "cooked_chat":         {"messages"},
                "cooked_notes":        {"items"},
                "cooked_progress":     {"progress"},
                "cooked_toasts":       {"title"},
                "cooked_flow":         {"nodes"},
                "showdown_duel":       {"title", "side1Title", "side2Title"},
                "battle_chart":        {"title", "sp500Return", "hedgeReturn"},
                "compound_formula":    {"title", "compoundTotal"},
                "wall_street_failure_hook": {"failureRate"},
                # Universal Educational & Cognitive Pack
                "spotlight_cone":      {"headline"},
                "perception_gauge":    {"title"},
                "brain_neural_scan":   {"title"},
                "cognitive_dialogue":  {"title"},
                # Universal Phase 1: Newspaper & Document Highlighter
                "newspaper_highlighter": {"headline"},
                # Universal Phase 2: Magnifying Glass & Detail Callout
                "magnifying_glass_zoom": {"zoomTarget", "calloutTitle"},
                # Universal Phase 3: Urgency / Risk Dial Gauge
                "urgency_dial_gauge": {"value", "unit", "zoneLabel"},
                # Universal Phase 4: Mind Map & Concept Node Web
                "mind_map_node_web": {"centerTitle", "node1Title", "node2Title", "node3Title"},
                # Universal Phase 5: Timeline Roadmap & Milestone Pathway
                "timeline_roadmap": {"step1Title", "step2Title", "step3Title"},
                # Universal Phase 6: Hierarchy Pyramid & Foundation Architecture
                "hierarchy_pyramid": {"tier1Title", "tier2Title", "tier3Title"},
                # Universal Phase 7: Tactile Checklist & Decision Matrix
                "tactile_checklist_stamp": {"item1Text", "item2Text", "item3Text"},
                # Universal Phase 8: Split Slider Comparison & Transformation Wipe
                "split_slider_comparison": {"leftTitle", "leftMetric", "rightTitle", "rightMetric"},
            }

            KEY_DEFAULTS = {
                "beforeLabel": "BEFORE",
                "afterLabel": "AFTER",
                "delta": "",
                "author": "",
                "language": "python",
                "url": "https://example.com",
                "tabTitle": "Overview",
                "title": "KEY TAKEAWAY",
                "label": "KEY INSIGHT",
                "concept": "💡",
                "activeFile": "main.py",
                "command": "npm run dev",
                "output": "Ready on http://localhost:3000",
                "name": "Creator",
                "handle": "@creator",
                "highlight": "game changer",
                "likes": "42.8K",
                "messages": [{"from": "them", "text": "How did you build this?"}, {"from": "me", "text": "Automated workflow pipelines."}],
                "items": ["Record take", "Run AI editing pipeline", "Publish high retention video"],
                "progress": 85,
                "nodes": [{"label": "Input Data"}, {"label": "AI Transform"}, {"label": "Final Output"}],
                "side1Title": "OPTION A",
                "side2Title": "OPTION B",
                "side1Sub": "",
                "side1Fee": "",
                "side2Sub": "",
                "side2Fee": "",
                "wagerAmount": "VS",
                "timeframe": "HEAD TO HEAD",
                "sp500Label": "OPTION A",
                "sp500Return": 120,
                "hedgeLabel": "OPTION B",
                "hedgeReturn": 40,
                "deltaLabel": "+80% ADVANTAGE",
                "autoAmount": "$500 / Month",
                "compoundTotal": 1450000,
                "failureRate": 90,
                "headline": "KEY CONCEPT",
                "subtext": "Visualizing core cognitive principles",
                "tagline": "REALITY CHECK",
                "perceivedLabel": "PERCEIVED",
                "perceivedValue": 50,
                "actualLabel": "ACTUAL",
                "actualValue": 20,
                "cortexTitle": "PREFRONTAL CORTEX",
                "cortexSub": "Pure Logic",
                "amygdalaTitle": "AMYGDALA",
                "amygdalaSub": "Stress Hijack",
                "firstPersonText": "Why am I overwhelmed?",
                "thirdPersonText": "Why is this person stressed?",
                "badge": "⚠️ KEY STATISTIC",
                "source": "Official Benchmark Data",
                "outlet": "INVESTIGATIVE DISPATCH",
                "edition": "SPECIAL REPORT • VOL. XLVIII",
                "date": "OCTOBER 2024",
                "preText": "According to official documentation, ",
                "highlightText": "the key finding was conclusively verified.",
                "postText": " Continued testing showed substantial improvements.",
                "markerColor": "#FDE047",
                "stamp": "VERIFIED REPORT",
                "zoomTarget": "HIDDEN CLAUSE EXPOSED",
                "calloutTitle": "FINE PRINT DETECTED",
                "calloutDetail": "Critical terms hidden in sub-clause paragraphs.",
                "backgroundSnippet": "Standard service tier agreements remain operational under section 14.",
                "value": 94,
                "unit": "%",
                "zoneLabel": "MAXIMUM HAZARD ZONE",
                "subtext": "Telemetry indicates risk has entered the red saturation zone.",
                "centerTitle": "RETENTION ENGINE",
                "centerIcon": "⚡",
                "node1Title": "Curiosity Gap Hook",
                "node1Desc": "Subconscious intrigue trigger",
                "node1Icon": "🎯",
                "node2Title": "Dynamic Pacing Loops",
                "node2Desc": "Visual rhythm shift every 2.5s",
                "node2Icon": "🔄",
                "node3Title": "High-Value Payoff",
                "node3Desc": "Unfiltered actionable insight",
                "node3Icon": "💎",
                "step1Phase": "PHASE 01",
                "step1Title": "Curiosity Gap Architecture",
                "step1Desc": "Engineered subconscious intrigue loops eliminate initial drop-off.",
                "step1Icon": "🎯",
                "step1Badge": "COMPLETED ✓",
                "step2Phase": "PHASE 02",
                "step2Title": "Dynamic Velocity Modulation",
                "step2Desc": "Visual and cognitive pacing shifts every 2.5s maintain peak arousal.",
                "step2Icon": "⚡",
                "step2Badge": "ACTIVE EXECUTION",
                "step3Phase": "PHASE 03",
                "step3Title": "High-Value Compounding Payoff",
                "step3Desc": "Unfiltered actionable insight locks in viewer loyalty and viral shares.",
                "step3Icon": "🏆",
                "step3Badge": "TARGET DESTINATION",
                "synthesis": "SYSTEM PROGRESS: Sequential compounding drives exponential audience retention.",
                "tier1Title": "Structural Value Thesis",
                "tier1Subtitle": "80% of audience retention is determined by solving an acute curiosity gap.",
                "tier1Pct": "80% FOUNDATION",
                "tier1Icon": "🧱",
                "tier2Title": "Velocity Pacing Loops",
                "tier2Subtitle": "Dynamic visual pattern interrupts every 2.5s sustain subconscious arousal.",
                "tier2Pct": "19% LEVERAGE",
                "tier2Icon": "⚡",
                "tier3Title": "Compounding Viral Climax",
                "tier3Subtitle": "The top 1% memorable payoff that guarantees saves, shares, and algorithmic lift.",
                "tier3Pct": "1% PINNACLE",
                "tier3Icon": "👑",
                "item1Text": "High Organic Search Volume",
                "item1Detail": "5.4M monthly search queries verified across algorithmic search graphs.",
                "item1Status": "pass",
                "item2Text": "Zero Capital Barrier to Entry",
                "item2Detail": "Requires $45,000 upfront specialized production equipment & studio lease.",
                "item2Status": "fail",
                "item3Text": "Compounding Replay Retention",
                "item3Detail": "High subconscious curiosity gap delivers above 85% average completion rate.",
                "item3Status": "pass",
                "verdictText": "CRITICAL BOTTLENECK: CAPITAL BARRIER INVALIDATES MODEL",
                "verdictStatus": "warning",
                "leftTag": "MANUAL PROCESS",
                "leftTitle": "Traditional Agency Grind",
                "leftMetric": "18.5 HOURS",
                "leftDetail": "Manual keyframing, timeline cut bloat, asset hunting, and high human fatigue.",
                "leftIcon": "⏳",
                "rightTag": "AI PIPELINE ENGINE",
                "rightTitle": "Autonomous Production Loop",
                "rightMetric": "4.2 MINUTES",
                "rightDetail": "Algorithmic storyboarding, Remotion rendering, automated B-roll, and instant audio ducking.",
                "rightIcon": "⚡",
                "sliderStart": 20,
                "sliderEnd": 62,
            }

            mg_type = edit.get("motion_graphics_type", "")
            if mg_type not in ALLOWED_TEMPLATES:
                # Auto-correct to hero_reveal rather than reject
                edit["motion_graphics_type"] = "hero_reveal"
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"Unknown template '{mg_type}' → corrected to hero_reveal",
                    severity="modified",
                ))
                report.modified_count += 1

            targets = edit.get("motion_graphics_targets") or {}
            required = TEMPLATE_REQUIRED_KEYS.get(edit.get("motion_graphics_type", ""), set())
            missing = required - set(targets.keys())
            if missing:
                # Fill in missing keys with sensible defaults from motion_graphics_text, reason, or semantic defaults
                fallback_text = edit.get("motion_graphics_text") or edit.get("reason", "")
                for key in missing:
                    if key in KEY_DEFAULTS:
                        targets[key] = KEY_DEFAULTS[key]
                    else:
                        targets[key] = fallback_text[:60] if fallback_text else "..."
                edit["motion_graphics_targets"] = targets
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"Missing keys {missing} for {edit.get('motion_graphics_type')} filled with fallbacks",
                    severity="modified",
                ))
                report.modified_count += 1

            # ── Studio Depth Matting: normalize layer / depth ─────────────
            raw_layer = edit.get("layer") or edit.get("depth")
            norm_layer = "front"
            if raw_layer and str(raw_layer).lower() in ("behind", "back", "background"):
                # User constraint: readable / text-dense graphics MUST stay in front
                UNSUITABLE_FOR_BEHIND = {
                    "cooked_terminal", "cooked_chat", "cooked_notes",
                    "code_reveal", "vscode_code_typing", "quote_reveal",
                    "step_sequence", "kinetic_text", "browser_walkthrough",
                    "newspaper_highlighter", "magnifying_glass_zoom",
                    "urgency_dial_gauge", "mind_map_node_web",
                    "timeline_roadmap", "hierarchy_pyramid",
                    "tactile_checklist_stamp", "split_slider_comparison"
                }
                if edit.get("motion_graphics_type") in UNSUITABLE_FOR_BEHIND:
                    norm_layer = "front"
                    report.issues.append(ValidationIssue(
                        trigger_id=trigger_id,
                        action=action,
                        issue=f"Template '{edit.get('motion_graphics_type')}' has readable text; forced layer from 'behind' to 'front' to prevent obscuring speaker",
                        severity="modified",
                    ))
                    report.modified_count += 1
                else:
                    norm_layer = "behind"
            edit["layer"] = norm_layer

            validated.append(edit)
            report.accepted_count += 1
            continue

        # ── Unknown action type ───────────────────────────────────────
        report.issues.append(ValidationIssue(
            trigger_id=trigger_id,
            action=action,
            issue=f"Unknown action type: '{action}'",
        ))
        report.rejected_count += 1

    # ── Phase 3: Anti-AI Quality Guardian & Pacing Linter ──────────────
    try:
        from services.ai_tells_linter import lint_and_guard_blueprint
        linted, linter_summary = lint_and_guard_blueprint(
            edits=validated,
            timestamp_map=timestamp_map,
            video_duration=video_duration,
        )
        for l_issue in linter_summary.get("issues", []):
            report.issues.append(ValidationIssue(
                trigger_id=l_issue["trigger_id"],
                action=l_issue["action"],
                issue=f"[{l_issue['rule']}] {l_issue['details']}",
                severity=l_issue["severity"],
            ))
            if l_issue["severity"] == "rejected":
                report.rejected_count += 1
                report.accepted_count = max(0, report.accepted_count - 1)
            elif l_issue["severity"] == "modified":
                report.modified_count += 1
        validated = linted
    except Exception as e:
        print(f"[Blueprint Validator] Linter pass skipped: {e}")

    report.broll_budget_used = round(total_broll_duration, 2)
    return validated, report


def format_validation_report(report: ValidationReport) -> str:
    """Format the validation report for logging."""
    lines = [
        f"Blueprint Validation: {report.original_count} decisions → "
        f"{report.accepted_count} accepted, {report.rejected_count} rejected, "
        f"{report.modified_count} modified",
        f"B-roll budget: {report.broll_budget_used:.1f}s / {report.broll_budget_max:.1f}s",
    ]
    for issue in report.issues:
        lines.append(f"  [{issue.severity.upper()}] {issue.trigger_id} ({issue.action}): {issue.issue}")
    return "\n".join(lines)

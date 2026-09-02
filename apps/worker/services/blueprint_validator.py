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
) -> Tuple[List[Dict[str, Any]], ValidationReport]:
    """
    Validates and filters AI-generated editing decisions.

    Args:
        edits: Raw list of edit decision dicts from the AI Director.
        timestamp_map: Mapping of chunk IDs to {start, end, text, words}.
        video_duration: Total duration of the original video in seconds.
        config: Optional EditingConfig override (uses EDITING_CONFIG singleton by default).

    Returns:
        Tuple of (validated_edits, validation_report).
        validated_edits contains only the edits that passed validation.
    """
    cfg = config or EDITING_CONFIG
    report = ValidationReport(original_count=len(edits))

    # Calculate B-roll budget
    max_broll_duration = video_duration * cfg.MAX_BROLL_DURATION_RATIO
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
            if broll_count_so_far >= cfg.MAX_BROLL_COUNT:
                report.issues.append(ValidationIssue(
                    trigger_id=trigger_id,
                    action=action,
                    issue=f"B-roll count limit reached ({cfg.MAX_BROLL_COUNT})",
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
                last_broll_end = broll_events[-1]["end"]
                spacing = chunk_start - last_broll_end
                if spacing < cfg.MIN_BROLL_SPACING_SEC:
                    report.issues.append(ValidationIssue(
                        trigger_id=trigger_id,
                        action=action,
                        issue=f"B-roll spacing {spacing:.2f}s below minimum {cfg.MIN_BROLL_SPACING_SEC}s",
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

        # ── zoom_in / sfx — lightweight validation ────────────────────
        if action in ("zoom_in", "sfx"):
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

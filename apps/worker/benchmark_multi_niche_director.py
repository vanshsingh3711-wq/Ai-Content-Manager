"""
Multi-Niche AI Motion Graphics Director Benchmark Suite (Phase 4).

Executes comprehensive evaluation of the AI Motion Graphics Director across 3 core niches:
  1. Tech / AI Systems
  2. Personal Finance / Wealth
  3. Psychology / Cognitive Science

Outputs:
  - Archetype classification confusion and accuracy metrics
  - Conversational filler rejection rate (True Negative Rate)
  - Pacing & Budget Gatekeeper compliance audit
  - Blueprint validation report with zero rejections
"""

import sys
import os
import json
import time
from typing import Dict, Any, List

# Ensure apps/worker is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from services.director_taxonomy import (
    VisualArchetype,
    classify_chunk_by_heuristics,
    ARCHETYPE_REGISTRY,
    sanitize_and_fill_defaults,
)
from services.script_chunker import ScriptChunk
from services.chunk_director import stitch_micro_scenes_to_blueprint
from services.blueprint_validator import validate_blueprint, format_validation_report
from tests.test_multi_niche_benchmarks import (
    TECH_SCRIPT_BEATS,
    FINANCE_SCRIPT_BEATS,
    PSYCHOLOGY_SCRIPT_BEATS,
    make_chunks,
)


def run_benchmark_for_niche(
    niche_name: str,
    beats: List[Dict[str, Any]],
    topic: str,
    video_duration: float = 60.0,
) -> Dict[str, Any]:
    print(f"\n{'='*75}")
    print(f" 🎬 BENCHMARK EVALUATION: {niche_name.upper()} NICHE")
    print(f"{'='*75}")

    total_beats = len(beats)
    correct_classifications = 0
    filler_beats_total = 0
    filler_beats_rejected = 0
    detected_archetypes_count = {}

    print("\n[1] Classification & Intent Detection:")
    for beat in beats:
        text = beat["text"]
        expected = beat["expected_archetype"]
        detected, conf, match_info = classify_chunk_by_heuristics(text)

        is_match = (detected == expected)
        if is_match:
            correct_classifications += 1

        if expected == VisualArchetype.NONE:
            filler_beats_total += 1
            if detected == VisualArchetype.NONE:
                filler_beats_rejected += 1

        arch_key = detected.value
        detected_archetypes_count[arch_key] = detected_archetypes_count.get(arch_key, 0) + 1

        status_icon = "✅" if is_match else "❌"
        print(f"  {status_icon} [{beat['id']}] Expected: {expected.value:<22} Detected: {detected.value:<22} (Conf: {conf:.2f})")
        print(f"     \"{text[:65]}...\"")

    classification_accuracy = (correct_classifications / total_beats) * 100.0
    filler_rejection_rate = (filler_beats_rejected / filler_beats_total * 100.0) if filler_beats_total else 100.0

    print(f"\n  → Classification Accuracy: {classification_accuracy:.1f}% ({correct_classifications}/{total_beats})")
    print(f"  → Conversational Filler Rejection: {filler_rejection_rate:.1f}% ({filler_beats_rejected}/{filler_beats_total})")

    # 2. End-to-End Blueprint Generation & Pacing Gatekeeper
    print("\n[2] Master Blueprint Stitching & Pacing Gatekeeper:")
    chunks = make_chunks(beats, interval_sec=8.5)
    t_start = time.time()
    blueprint = stitch_micro_scenes_to_blueprint(
        chunks=chunks,
        total_duration=video_duration,
        topic=topic,
        style="viral",
        is_faceless=True,
        min_mg_spacing=3.5,
    )
    t_elapsed = (time.time() - t_start) * 1000.0

    mgs = [e for e in blueprint.edits if e.action == "motion_graphics"]
    brolls = [e for e in blueprint.edits if e.action == "b_roll"]
    sfxs = [e for e in blueprint.edits if e.action == "sfx"]
    transitions = [e for e in blueprint.edits if e.action == "transition"]

    print(f"  ⚡ Blueprint stitched in {t_elapsed:.1f}ms")
    print(f"  📊 Output EDL: {len(blueprint.edits)} total decisions")
    print(f"     • Motion Graphic Cards: {len(mgs)} (Budget: 3-4 cards)")
    print(f"     • B-Roll Cuts: {len(brolls)} (Canvas: 0.0s to {video_duration:.1f}s)")
    print(f"     • Audio SFX Cues: {len(sfxs)}")
    print(f"     • Cinematic Transitions: {len(transitions)}")

    # Print Motion Graphics detail
    print("\n  🎨 Selected Motion Graphic Cards:")
    spacings = []
    for idx, mg in enumerate(mgs):
        dur = (mg.end or 0.0) - (mg.start or 0.0)
        gap_from_prev = ((mg.start or 0.0) - (mgs[idx-1].end or 0.0)) if idx > 0 else (mg.start or 0.0)
        if idx > 0:
            spacings.append(gap_from_prev)
        print(f"     Card #{idx+1}: [{mg.start:.1f}s - {mg.end:.1f}s] ({dur:.1f}s) | Template: {mg.motion_graphics_type:<24} | Breathing Gap: {gap_from_prev:.1f}s")
        targets = mg.motion_graphics_targets or {}
        title = targets.get("title") or targets.get("headline") or "N/A"
        print(f"             Title: \"{title}\"")

    avg_spacing = (sum(spacings) / len(spacings)) if spacings else 0.0

    # 3. Deterministic Validation Pass
    print("\n[3] Deterministic Safety Net Validation:")
    tmap = {c.chunk_id: {"start": c.start, "end": c.end, "text": c.text} for c in chunks}
    validated_edits, report = validate_blueprint(
        edits=[e.model_dump() for e in blueprint.edits],
        timestamp_map=tmap,
        video_duration=video_duration,
        is_faceless=True,
        enforce_pacing=True,
        style="viral",
        topic=topic,
    )

    print(f"  🛡️ Validator Result: {report.accepted_count} accepted, {report.rejected_count} rejected, {report.modified_count} modified")
    print(f"  ⏱️ B-roll Budget: {report.broll_budget_used:.1f}s / {report.broll_budget_max:.1f}s")
    print(f"  🎴 Motion Graphic Budget: {report.mg_count_used} used / {report.mg_budget_max} max (Downgraded: {report.mg_downgraded_count})")

    is_success = (
        classification_accuracy >= 90.0 and
        filler_rejection_rate == 100.0 and
        2 <= len(mgs) <= 4 and
        report.rejected_count == 0
    )

    result_status = "PASS" if is_success else "FAIL"
    print(f"\n  >>> NICHE STATUS: {result_status} <<<")

    return {
        "niche": niche_name,
        "topic": topic,
        "total_beats": total_beats,
        "classification_accuracy": classification_accuracy,
        "filler_rejection_rate": filler_rejection_rate,
        "motion_graphics_count": len(mgs),
        "broll_cuts_count": len(brolls),
        "avg_breathing_spacing": avg_spacing,
        "validator_rejected": report.rejected_count,
        "validator_accepted": report.accepted_count,
        "status": result_status,
        "edits_summary": [
            {
                "action": e.action,
                "start": e.start,
                "end": e.end,
                "type": getattr(e, "motion_graphics_type", None) or getattr(e, "sound_effect", None) or getattr(e, "search_query", None)
            }
            for e in blueprint.edits
        ]
    }


def run_all_benchmarks():
    print(f"\n{'#'*75}")
    print(" 🚀 RUNNING MULTI-NICHE AI MOTION GRAPHICS DIRECTOR BENCHMARK")
    print(f"{'#'*75}")

    niches = [
        ("Tech / AI Systems", TECH_SCRIPT_BEATS, "technology"),
        ("Personal Finance / Wealth", FINANCE_SCRIPT_BEATS, "finance"),
        ("Psychology / Cognitive Science", PSYCHOLOGY_SCRIPT_BEATS, "psychology"),
    ]

    results = []
    for name, beats, topic in niches:
        res = run_benchmark_for_niche(name, beats, topic, video_duration=60.0)
        results.append(res)

    print(f"\n\n{'='*75}")
    print(" 🏆 FINAL MULTI-NICHE BENCHMARK SUMMARY")
    print(f"{'='*75}")
    print(f"{'Niche':<32} | {'Accuracy':<10} | {'Filler Rej':<10} | {'MG Cards':<9} | {'Avg Gap':<8} | {'Status':<6}")
    print("-" * 75)
    for r in results:
        print(f"{r['niche']:<32} | {r['classification_accuracy']:>8.1f}% | {r['filler_rejection_rate']:>9.1f}% | {r['motion_graphics_count']:>8} | {r['avg_breathing_spacing']:>6.1f}s | {r['status']:<6}")
    print("-" * 75)

    all_passed = all(r["status"] == "PASS" for r in results)
    overall = "ALL BENCHMARKS PASSED (100%)" if all_passed else "SOME BENCHMARKS FAILED"
    print(f"\n🎯 OVERALL RESULT: {overall}\n")

    return results


if __name__ == "__main__":
    run_all_benchmarks()

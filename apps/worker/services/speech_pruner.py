"""
services/speech_pruner.py — Deterministic Speech Spine & Silence Trimmer

Extracts speech intervals from Whisper word-level timing, identifies dead air,
and generates deterministic jump-cut boundaries to produce an aggressive,
high-retention talking-head video.
"""

from typing import List, Dict, Any, Tuple, Optional


def merge_intervals(intervals: List[Tuple[float, float]], gap_tolerance: float = 0.08) -> List[Tuple[float, float]]:
    """
    Sorts and merges overlapping or near-adjacent intervals within gap_tolerance.
    """
    valid = [(float(s), float(e)) for s, e in intervals if e > s and s >= 0]
    if not valid:
        return []

    valid.sort(key=lambda x: x[0])
    merged = [valid[0]]

    for cur_s, cur_e in valid[1:]:
        prev_s, prev_e = merged[-1]
        if cur_s <= prev_e + gap_tolerance:
            merged[-1] = (prev_s, max(prev_e, cur_e))
        else:
            merged.append((cur_s, cur_e))

    return [(round(s, 3), round(e, 3)) for s, e in merged]


def merge_cuts(cuts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sorts and merges overlapping or adjacent cut decisions.
    Preserves action, start, end, and reasons.
    """
    if not cuts:
        return []

    # Filter valid cuts
    valid_cuts = []
    for c in cuts:
        if c.get("action") == "cut":
            s = c.get("start")
            e = c.get("end")
            if s is not None and e is not None and float(e) > float(s):
                valid_cuts.append({
                    "action": "cut",
                    "start": round(float(s), 3),
                    "end": round(float(e), 3),
                    "reason": c.get("reason", "Silence / dead air cut"),
                    "trigger_id": c.get("trigger_id"),
                })

    if not valid_cuts:
        return []

    valid_cuts.sort(key=lambda x: x["start"])
    merged = [valid_cuts[0]]

    for cur in valid_cuts[1:]:
        prev = merged[-1]
        if cur["start"] <= prev["end"] + 0.04:  # 40ms touch tolerance
            new_end = max(prev["end"], cur["end"])
            combined_reason = prev.get("reason", "")
            if cur.get("reason") and cur["reason"] not in combined_reason:
                combined_reason = f"{combined_reason}; {cur['reason']}"
            merged[-1] = {
                "action": "cut",
                "start": prev["start"],
                "end": round(new_end, 3),
                "reason": combined_reason,
                "trigger_id": prev.get("trigger_id") or cur.get("trigger_id"),
            }
        else:
            merged.append(cur)

    return merged


def invert_cuts_to_kept_ranges(
    cuts: List[Dict[str, Any]],
    total_duration: float
) -> List[Tuple[float, float]]:
    """
    Inverts a list of cut decisions over [0.0, total_duration] to determine
    the exact kept intervals.
    """
    merged = merge_cuts(cuts)
    kept: List[Tuple[float, float]] = []
    curr = 0.0

    for c in merged:
        cs = c["start"]
        ce = c["end"]
        if cs > curr:
            kept.append((round(curr, 3), round(cs, 3)))
        curr = max(curr, ce)

    if curr < total_duration:
        kept.append((round(curr, 3), round(total_duration, 3)))

    return kept


def generate_deterministic_silence_cuts(
    total_duration: float,
    speech_intervals: List[Tuple[float, float]],
    silence_intervals: Optional[List[Tuple[float, float]]] = None,
    head_margin_s: float = 0.15,
    tail_margin_s: float = 0.25,
    min_gap_duration: float = 0.60,
    breath_cushion_s: float = 0.10,
    min_cut_duration: float = 0.15,
) -> List[Dict[str, Any]]:
    """
    Computes deterministic cut decisions for:
    1. Pre-speech dead air: [0.0, first_speech - head_margin_s]
    2. Post-speech dead air: [last_speech + tail_margin_s, total_duration]
    3. Internal silence gaps >= min_gap_duration: [gap_start + breath_cushion, gap_end - breath_cushion]

    Args:
        total_duration: Total video length in seconds.
        speech_intervals: List of (start, end) tuples of recognized speech / words.
        silence_intervals: Optional list of (start, end) acoustic silence intervals from FFmpeg.
        head_margin_s: Breath buffer before speech begins (default 0.15s).
        tail_margin_s: Buffer after speech ends (default 0.25s).
        min_gap_duration: Minimum silence gap to cut (default 0.60s).
        breath_cushion_s: Breath cushion kept on both sides of a gap cut (default 0.10s).
        min_cut_duration: Minimum cut length to emit (default 0.15s).

    Returns:
        List of cut decision dicts ready for Master Blueprint Resolver.
    """
    if total_duration <= 0:
        return []

    # 1. Merge all speech intervals into contiguous blocks
    merged_speech = merge_intervals(speech_intervals, gap_tolerance=0.08)

    if not merged_speech:
        # If no speech recognized at all, we do NOT cut the whole video blindly
        return []

    raw_cuts: List[Dict[str, Any]] = []

    # 2. Leading dead air (pre-speech)
    first_speech_start = merged_speech[0][0]
    if first_speech_start > head_margin_s + 0.10:
        head_cut_end = max(0.0, first_speech_start - head_margin_s)
        if head_cut_end >= min_cut_duration:
            raw_cuts.append({
                "action": "cut",
                "start": 0.0,
                "end": round(head_cut_end, 3),
                "reason": f"Remove leading dead silence ({head_cut_end:.2f}s before speech begins)",
            })

    # 3. Trailing dead air (post-speech)
    last_speech_end = merged_speech[-1][1]
    if last_speech_end + tail_margin_s + 0.10 < total_duration:
        tail_cut_start = min(total_duration, last_speech_end + tail_margin_s)
        tail_cut_dur = total_duration - tail_cut_start
        if tail_cut_dur >= min_cut_duration:
            raw_cuts.append({
                "action": "cut",
                "start": round(tail_cut_start, 3),
                "end": round(total_duration, 3),
                "reason": f"Remove trailing dead silence ({tail_cut_dur:.2f}s after speech ends)",
            })

    # 4. Internal silence gaps between speech blocks
    for i in range(len(merged_speech) - 1):
        prev_end = merged_speech[i][1]
        next_start = merged_speech[i + 1][0]
        gap_dur = next_start - prev_end

        if gap_dur >= min_gap_duration:
            cut_start = prev_end + breath_cushion_s
            cut_end = next_start - breath_cushion_s
            cut_dur = cut_end - cut_start

            if cut_dur >= min_cut_duration:
                raw_cuts.append({
                    "action": "cut",
                    "start": round(cut_start, 3),
                    "end": round(cut_end, 3),
                    "reason": f"Remove internal silence pause ({gap_dur:.2f}s pause trimmed to {breath_cushion_s * 2:.2f}s breath cushion)",
                })

    # 5. Cross-reference with acoustic silences (FFmpeg silencedetect) if available
    # to catch any prolonged dead air that Whisper might have bridged
    if silence_intervals:
        for s_start, s_end in silence_intervals:
            s_dur = s_end - s_start
            # If silence is long (>1.2s), ensure it is pruned even if speech model hallucinated a word inside
            if s_dur >= 1.2:
                # Check how much of this silence is already covered by raw_cuts
                already_covered = False
                for c in raw_cuts:
                    if c["start"] <= s_start + 0.2 and c["end"] >= s_end - 0.2:
                        already_covered = True
                        break
                if not already_covered:
                    # Check if it overlaps any active speech
                    overlaps_speech = any(
                        max(s_start, sp_s) < min(s_end, sp_e)
                        for sp_s, sp_e in merged_speech
                    )
                    if not overlaps_speech:
                        c_start = max(0.0, s_start + breath_cushion_s)
                        c_end = min(total_duration, s_end - breath_cushion_s)
                        if c_end - c_start >= min_cut_duration:
                            raw_cuts.append({
                                "action": "cut",
                                "start": round(c_start, 3),
                                "end": round(c_end, 3),
                                "reason": f"Remove acoustic dead air ({s_dur:.2f}s silence detected by audio filter)",
                            })

    # 6. Final sort and merge to guarantee strictly ordered, non-overlapping cuts
    final_cuts = merge_cuts(raw_cuts)
    return final_cuts

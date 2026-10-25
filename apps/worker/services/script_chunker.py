"""
Script Chunker — Semantic Micro-Scene Chunking Service.

Partitions continuous Whisper speech transcripts into clean, high-impact
micro-scenes of 1-2 spoken sentences (typically 2.5s - 5.5s duration).
Enables micro-scene directing with zero LLM hallucination and exact visual alignment.
"""

import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

try:
    from services.subtitle_generator import reconcile_transcript_words
except ImportError:
    try:
        from subtitle_generator import reconcile_transcript_words
    except ImportError:
        def reconcile_transcript_words(w): return w


class ScriptChunk(BaseModel):
    """
    A single micro-scene segment covering 1-2 spoken sentences or clauses.
    """
    chunk_id: str
    chunk_index: int
    start: float
    end: float
    duration: float
    text: str
    words: List[Dict[str, Any]] = Field(default_factory=list)
    is_sentence_boundary: bool = False
    suggested_visual_role: str = "narrative"  # "statistic", "comparison", "step_process", "code_terminal", "quote", "narrative"
    extracted_metrics: List[str] = Field(default_factory=list)
    extracted_entities: List[str] = Field(default_factory=list)


def tag_chunk_semantics(text: str) -> Dict[str, Any]:
    """
    Heuristically analyzes the text of a micro-chunk to extract semantic roles,
    metrics, and key entities before LLM invocation.
    """
    clean = text.strip()
    lower = clean.lower()

    # 1. Metric / Number extraction
    metric_patterns = [
        r'\b\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:x|times|%|percent|\$|k|m|b|tokens?|sec|ms))\b',
        r'\$\d+(?:,\d+)*(?:\.\d+)?',
        r'\b\d+x\b',
        r'\b\d+%\b',
    ]
    extracted_metrics = []
    for pat in metric_patterns:
        matches = re.findall(pat, clean, flags=re.IGNORECASE)
        for m in matches:
            if m not in extracted_metrics:
                extracted_metrics.append(m.strip())

    # 2. Comparison detection
    comparison_keywords = [
        " vs ", " versus ", "unlike ", "instead of ", "compared to ",
        "monolith vs", "before and after", "feels safe", "stay broke",
        "100-person", "solo founder", "old way", "new way", "side by side"
    ]
    is_comparison = any(k in lower for k in comparison_keywords)

    # 3. Stepped process / Checklist / Playbook detection
    step_keywords = [
        "first:", "second:", "third:", "fourth:", "step 1", "step 2",
        "step 3", "rule 1", "rule 2", "playbook is simple", "checklist",
        "the winning playbook", "1.", "2.", "3.", "audit"
    ]
    is_step = any(k in lower for k in step_keywords)

    # 4. Code / Terminal / Quantization / Tech spec detection
    code_keywords = [
        "code", "terminal", "python", "cli", "npm", "pip", "docker",
        "quantization", "parameters", "slm", "small language model",
        "mixture-of-experts", "tokens per second", "latency", "inference"
    ]
    is_code = any(k in lower for k in code_keywords)

    # 5. Quote / Key insight
    quote_keywords = [
        "remember:", "takeaway", "stop doing", "the winners will be",
        "the lesson", "master cognitive leverage", "architect the system"
    ]
    is_quote = any(k in lower for k in quote_keywords)

    # Assign suggested role
    if is_step:
        role = "step_process"
    elif is_comparison:
        role = "comparison"
    elif extracted_metrics:
        role = "statistic"
    elif is_code and any(k in lower for k in ["tokens per second", "quantization", "terminal", "code", "run"]):
        role = "code_terminal"
    elif is_quote:
        role = "quote"
    else:
        role = "narrative"

    # Extract key capital words as candidate entities
    words = clean.split()
    entities = [
        w.strip(",.?!:;\"'") for w in words
        if w.isupper() and len(w) > 1 and w not in ["THE", "AND", "FOR", "BUT", "NOT", "YOU", "ALL", "ARE"]
    ]

    return {
        "suggested_visual_role": role,
        "extracted_metrics": extracted_metrics,
        "extracted_entities": entities,
    }


def chunk_transcript(
    timestamp_map: Dict[str, Any],
    total_duration: Optional[float] = None,
    target_chunk_sec: float = 3.5,
    min_chunk_sec: float = 2.0,
    max_chunk_sec: float = 6.0,
) -> List[ScriptChunk]:
    """
    Segments a continuous transcript timestamp map into clean 1-2 sentence micro-chunks.

    Args:
        timestamp_map: Dictionary of Whisper transcript chunks containing word-level timestamps.
        total_duration: Overall video/audio duration in seconds.
        target_chunk_sec: Target ideal duration for a micro-scene (default: 3.5s).
        min_chunk_sec: Minimum acceptable duration for a standalone chunk (default: 2.0s).
        max_chunk_sec: Maximum acceptable duration before forcing a break (default: 6.0s).

    Returns:
        List of ScriptChunk objects covering the entire speech timeline with zero gaps.
    """
    if not timestamp_map:
        return []

    # 1. Flatten all words in chronological sequence
    all_words: List[Dict[str, Any]] = []
    # Filter out beat sheet keys if mixed in timestamp_map
    sorted_items = sorted(
        [
            (k, v) for k, v in timestamp_map.items()
            if not str(k).startswith("beat_") and isinstance(v, dict) and "words" in v
        ],
        key=lambda item: item[1].get("start", 0.0)
    )

    if not sorted_items:
        # Fallback to direct items if no "words" key found
        sorted_items = sorted(
            [item for item in timestamp_map.items() if isinstance(item[1], dict)],
            key=lambda item: item[1].get("start", 0.0)
        )

    for _, chunk_data in sorted_items:
        words = chunk_data.get("words", [])
        if words:
            for w in words:
                word_clean = w.get("word", "").strip()
                if word_clean:
                    all_words.append({
                        "word": word_clean,
                        "start": float(w.get("start", 0.0)),
                        "end": float(w.get("end", 0.0)),
                    })
        else:
            # Fallback if words array is empty: split text by whitespace
            chunk_text = chunk_data.get("text", "").strip()
            c_start = float(chunk_data.get("start", 0.0))
            c_end = float(chunk_data.get("end", c_start + 1.0))
            if chunk_text:
                tokens = chunk_text.split()
                tok_dur = max(0.1, (c_end - c_start) / max(1, len(tokens)))
                for idx, tok in enumerate(tokens):
                    all_words.append({
                        "word": tok,
                        "start": round(c_start + (idx * tok_dur), 2),
                        "end": round(c_start + ((idx + 1) * tok_dur), 2),
                    })

    if not all_words:
        return []

    # Reconcile split Whisper tokens (e.g. 're' + '-executes' -> 're-executes', '10' + ',000' -> '10,000')
    all_words = reconcile_transcript_words(all_words)

    # 2. Accumulate words into micro-scenes
    raw_chunks: List[Dict[str, Any]] = []
    current_words: List[Dict[str, Any]] = []

    for i, w in enumerate(all_words):
        current_words.append(w)
        c_start = current_words[0]["start"]
        c_end = current_words[-1]["end"]
        dur = c_end - c_start

        word_text = w["word"]
        is_sentence_terminal = any(word_text.endswith(p) for p in [".", "!", "?", ".\"", "!\"", "?\""])
        is_clause_terminal = any(word_text.endswith(p) for p in [",", ";", ":", "—", "-"])

        # Lookahead: is next word available?
        has_next = (i < len(all_words) - 1)
        next_word = all_words[i + 1] if has_next else None
        next_gap = (next_word["start"] - w["end"]) if next_word else 0.0

        # Break Conditions:
        # A. Sentence terminal AND duration >= min_chunk_sec
        # B. Sentence terminal AND duration is at least 1.8s and next sentence would make it exceed max_chunk_sec
        # C. Speech pause gap >= 0.8s AND duration >= min_chunk_sec
        # D. Strong clause boundary (comma/colon) AND duration >= target_chunk_sec (3.5s)
        # E. Hard cap: duration >= max_chunk_sec (6.0s)

        should_break = False

        if is_sentence_terminal:
            if dur >= min_chunk_sec:
                should_break = True
            elif has_next:
                # If current is short (<2.0s), but next sentence is long, we can break if dur >= 1.5s
                if dur >= 1.5 and next_gap >= 0.4:
                    should_break = True

        elif next_gap >= 0.8 and dur >= min_chunk_sec:
            should_break = True

        elif is_clause_terminal and dur >= target_chunk_sec:
            should_break = True

        elif dur >= max_chunk_sec:
            should_break = True

        if should_break:
            raw_chunks.append({
                "words": current_words,
                "is_sentence_boundary": is_sentence_terminal,
            })
            current_words = []

    # Append remaining words
    if current_words:
        if raw_chunks and (current_words[-1]["end"] - current_words[0]["start"] < min_chunk_sec):
            # Merge short tail into the preceding chunk to prevent orphaned micro-fragments
            raw_chunks[-1]["words"].extend(current_words)
            raw_chunks[-1]["is_sentence_boundary"] = any(
                current_words[-1]["word"].endswith(p) for p in [".", "!", "?"]
            )
        else:
            raw_chunks.append({
                "words": current_words,
                "is_sentence_boundary": any(current_words[-1]["word"].endswith(p) for p in [".", "!", "?"]),
            })

    # 3. Format into final ScriptChunk models
    final_chunks: List[ScriptChunk] = []
    for idx, rc in enumerate(raw_chunks, start=1):
        words = rc["words"]
        start_t = round(float(words[0]["start"]), 2)
        end_t = round(float(words[-1]["end"]), 2)
        if end_t <= start_t:
            end_t = round(start_t + 0.5, 2)

        chunk_text = " ".join(w["word"] for w in words).strip()
        semantics = tag_chunk_semantics(chunk_text)

        chunk_obj = ScriptChunk(
            chunk_id=f"chunk_{idx:02d}",
            chunk_index=idx,
            start=start_t,
            end=end_t,
            duration=round(end_t - start_t, 2),
            text=chunk_text,
            words=words,
            is_sentence_boundary=rc["is_sentence_boundary"],
            suggested_visual_role=semantics["suggested_visual_role"],
            extracted_metrics=semantics["extracted_metrics"],
            extracted_entities=semantics["extracted_entities"],
        )
        final_chunks.append(chunk_obj)

    # 4. Snap final boundary to total_duration if provided
    if total_duration and final_chunks:
        final_chunks[-1].end = max(final_chunks[-1].end, round(total_duration, 2))
        final_chunks[-1].duration = round(final_chunks[-1].end - final_chunks[-1].start, 2)

    return final_chunks

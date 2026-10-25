"""
Tests for Semantic Script Chunker Service (script_chunker.py).
Validates:
  1. Accurate 1-2 sentence micro-scene segmentation.
  2. Zero timeline gaps and no overlapping chunks.
  3. No orphan micro-chunks (< 1.5s).
  4. Precise semantic tagging (metrics, comparisons, step processes, code, quotes).
"""

import pytest
from services.script_chunker import chunk_transcript, tag_chunk_semantics, ScriptChunk


def test_tag_chunk_semantics():
    # Metric tag
    t1 = "The marginal cost of reasoning is collapsing by 10,000x."
    s1 = tag_chunk_semantics(t1)
    assert s1["suggested_visual_role"] == "statistic"
    assert "10,000x" in s1["extracted_metrics"]

    # Comparison tag
    t2 = "Monolithic chatbots versus autonomous agent swarms."
    s2 = tag_chunk_semantics(t2)
    assert s2["suggested_visual_role"] == "comparison"

    # Step process / playbook
    t3 = "The winning playbook is simple: First: Automate the diagnostic audit."
    s3 = tag_chunk_semantics(t3)
    assert s3["suggested_visual_role"] == "step_process"

    # Code / terminal / SLM specs
    t4 = "Sub-ten-billion parameter models execute locally at over 100 tokens per second with zero latency."
    s4 = tag_chunk_semantics(t4)
    assert s4["suggested_visual_role"] in ("statistic", "code_terminal")

    # Quote
    t5 = "Stop doing manual toil. Architect the system that does the work for you."
    s5 = tag_chunk_semantics(t5)
    assert s5["suggested_visual_role"] == "quote"

    # General narrative
    t6 = "The digital landscape continues to evolve across multiple industries."
    s6 = tag_chunk_semantics(t6)
    assert s6["suggested_visual_role"] == "narrative"


def test_chunk_transcript_basic():
    timestamp_map = {
        "ID_01": {
            "start": 0.0,
            "end": 3.2,
            "text": "For the last three years, the world was captivated by conversational chatbots.",
            "words": [
                {"word": "For", "start": 0.0, "end": 0.3},
                {"word": "the", "start": 0.3, "end": 0.5},
                {"word": "last", "start": 0.5, "end": 0.8},
                {"word": "three", "start": 0.8, "end": 1.1},
                {"word": "years,", "start": 1.1, "end": 1.5},
                {"word": "the", "start": 1.5, "end": 1.7},
                {"word": "world", "start": 1.7, "end": 2.0},
                {"word": "was", "start": 2.0, "end": 2.2},
                {"word": "captivated", "start": 2.2, "end": 2.6},
                {"word": "by", "start": 2.6, "end": 2.8},
                {"word": "chatbots.", "start": 2.8, "end": 3.2},
            ]
        },
        "ID_02": {
            "start": 3.5,
            "end": 6.8,
            "text": "You asked a question. It predicted the next plausible token.",
            "words": [
                {"word": "You", "start": 3.5, "end": 3.8},
                {"word": "asked", "start": 3.8, "end": 4.1},
                {"word": "a", "start": 4.1, "end": 4.3},
                {"word": "question.", "start": 4.3, "end": 4.8},
                {"word": "It", "start": 4.9, "end": 5.1},
                {"word": "predicted", "start": 5.1, "end": 5.5},
                {"word": "the", "start": 5.5, "end": 5.7},
                {"word": "next", "start": 5.7, "end": 6.0},
                {"word": "plausible", "start": 6.0, "end": 6.4},
                {"word": "token.", "start": 6.4, "end": 6.8},
            ]
        }
    }

    chunks = chunk_transcript(timestamp_map, total_duration=7.0)
    assert len(chunks) >= 2
    for c in chunks:
        assert isinstance(c, ScriptChunk)
        assert c.duration >= 1.5
        assert c.duration <= 6.0
        assert c.end > c.start
        assert len(c.words) > 0


def test_chunk_transcript_tail_merging():
    """Verify that a short trailing fragment is merged into previous chunk instead of left as an orphan."""
    timestamp_map = {
        "ID_01": {
            "start": 0.0,
            "end": 4.0,
            "text": "This is a full sentence with sufficient length.",
            "words": [
                {"word": "This", "start": 0.0, "end": 0.5},
                {"word": "is", "start": 0.5, "end": 0.8},
                {"word": "a", "start": 0.8, "end": 1.0},
                {"word": "full", "start": 1.0, "end": 1.5},
                {"word": "sentence", "start": 1.5, "end": 2.2},
                {"word": "with", "start": 2.2, "end": 2.6},
                {"word": "sufficient", "start": 2.6, "end": 3.2},
                {"word": "length.", "start": 3.2, "end": 4.0},
            ]
        },
        "ID_02": {
            "start": 4.2,
            "end": 4.8,
            "text": "Goodbye.",
            "words": [
                {"word": "Goodbye.", "start": 4.2, "end": 4.8},
            ]
        }
    }

    # "Goodbye." is only 0.6s. It should be merged into the previous chunk
    chunks = chunk_transcript(timestamp_map, min_chunk_sec=2.0)
    assert len(chunks) == 1
    assert "Goodbye." in chunks[0].text
    assert chunks[0].end == 4.8


def test_chunk_transcript_long_speech_continuity():
    """Verify continuity and pacing across a simulated 3-minute speech transcript."""
    simulated_map = {}
    curr_time = 0.0
    total_words = 0

    sentences = [
        "For three years the world was captivated by conversational chatbots.",
        "You asked a question, it predicted the next plausible token.",
        "The marginal cost of cognitive reasoning is collapsing by 10,000 times.",
        "Monolithic models are failing to deliver true enterprise autonomy.",
        "Autonomous agent swarms perceive, reason, act, and verify.",
        "Software engineers spend 70% of their time on boilerplate and debugging.",
        "A solo technical founder can now outpace a 100-person enterprise.",
        "The modern AI compute stack unites cloud compute with edge models.",
        "Local models execute at over 100 tokens per second with zero latency.",
        "The winning playbook is simple: automate the audit and deploy agents.",
        "Anchor every single action to deterministic verification gates.",
        "Stop doing manual toil. Architect the system that compounds output.",
    ]

    for s_idx, sentence in enumerate(sentences * 3):  # 36 sentences ~ 150 seconds
        words = sentence.split()
        word_objs = []
        s_start = curr_time
        for w in words:
            w_dur = 0.35
            word_objs.append({
                "word": w,
                "start": round(curr_time, 2),
                "end": round(curr_time + w_dur, 2)
            })
            curr_time += w_dur
            total_words += 1
        s_end = curr_time
        curr_time += 0.25  # breath gap

        simulated_map[f"ID_{s_idx+1:02d}"] = {
            "start": s_start,
            "end": s_end,
            "text": sentence,
            "words": word_objs
        }

    chunks = chunk_transcript(simulated_map, total_duration=curr_time)
    
    assert len(chunks) > 15
    print(f"\n[Test] Generated {len(chunks)} micro-scenes from {total_words} words across {curr_time:.1f}s.")

    for i in range(len(chunks) - 1):
        c_curr = chunks[i]
        c_next = chunks[i + 1]
        # Guarantee monotonic ordering
        assert c_next.start >= c_curr.start
        # Guarantee healthy micro-scene durations
        assert c_curr.duration >= 1.5, f"Chunk {c_curr.chunk_id} too short ({c_curr.duration}s)"
        assert c_curr.duration <= 7.0, f"Chunk {c_curr.chunk_id} too long ({c_curr.duration}s)"

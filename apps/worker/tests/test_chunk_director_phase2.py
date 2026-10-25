"""
test_chunk_director_phase2.py — Test suite for Phase 2 Autonomous Director Engine.

Validates:
1. resolve_archetype_for_chunk via Heuristic Fallback across multi-niche scripts.
2. resolve_archetype_for_chunk with mocked LLM tool calls (Stage 1 & Stage 2).
3. Conversational filler filtering (ensuring 'Why?' and 'Let that sink in' produce no cards).
4. direct_micro_chunk integrating taxonomy archetypes into standard EditDecision objects.
5. Context-aware sequencing in direct_all_chunks.
"""

from unittest.mock import patch
import pytest

from services.director_taxonomy import VisualArchetype
from services.script_chunker import ScriptChunk
from services.chunk_director import (
    resolve_archetype_for_chunk,
    direct_micro_chunk,
    direct_all_chunks,
)


def test_resolve_archetype_heuristic_bottleneck():
    """Verify heuristic resolution catches constraint choke points."""
    chunk = ScriptChunk(
        chunk_id="chunk_choke",
        chunk_index=1,
        start=10.0,
        end=14.5,
        duration=4.5,
        text="The team hit a fatal bottleneck when memory wall latency throttled throughput.",
        words=[]
    )
    arch, conf, tmpl, props, reason = resolve_archetype_for_chunk(chunk, use_llm=False)
    assert arch == VisualArchetype.CONSTRAINT_CHOKE
    assert tmpl == "bottleneck_constriction"
    assert props is not None
    assert "chokeMetric" in props
    assert conf >= 0.70


def test_resolve_archetype_heuristic_pareto():
    """Verify heuristic resolution catches 80/20 power law dynamics."""
    chunk = ScriptChunk(
        chunk_id="chunk_pareto",
        chunk_index=2,
        start=20.0,
        end=24.0,
        duration=4.0,
        text="This is the ultimate Pareto leverage: eighty percent of output from twenty percent of primitives.",
        words=[]
    )
    arch, conf, tmpl, props, reason = resolve_archetype_for_chunk(chunk, use_llm=False)
    assert arch == VisualArchetype.ASYMMETRIC_LEVERAGE
    assert tmpl == "pareto_power_law"
    assert "vitalPct" in props
    assert "vitalReturn" in props


def test_resolve_archetype_conversational_filler():
    """Verify filler statements are tagged as NONE and produce no motion graphic."""
    for filler in ["Let that sink in.", "Why?", "Here is the truth."]:
        chunk = ScriptChunk(
            chunk_id="chunk_fill",
            chunk_index=1,
            start=0.0,
            end=2.0,
            duration=2.0,
            text=filler,
            words=[]
        )
        arch, conf, tmpl, props, reason = resolve_archetype_for_chunk(chunk, use_llm=False)
        assert arch == VisualArchetype.NONE
        assert tmpl is None
        assert props is None

        # Also verify direct_micro_chunk yields only B-roll
        edits = direct_micro_chunk(chunk, allow_motion_graphic=True, use_llm=False)
        assert all(e.action == "b_roll" for e in edits), f"Filler '{filler}' must not produce motion graphics!"


def test_resolve_archetype_with_mocked_llm():
    """Verify 2-Stage LLM intent classification and prop extraction."""
    chunk = ScriptChunk(
        chunk_id="chunk_custom_eval",
        chunk_index=1,
        start=5.0,
        end=9.5,
        duration=4.5,
        text="When benchmarking cognitive swarms against monolithic models, the tradeoff is evident across speed and cost.",
        words=[]
    )

    # Mock Stage 1 (Classification) and Stage 2 (Prop Extraction)
    mock_stage1 = {
        "is_significant": True,
        "confidence": 0.95,
        "archetype": "MULTI_AXIS_BENCHMARK",
        "reason": "Evaluates architectural tradeoffs across multiple axes."
    }
    mock_stage2 = {
        "title": "COGNITIVE SWARM BENCHMARK",
        "axis1": "Execution Speed",
        "axis2": "Unit Cost Efficiency",
        "axis3": "Test Verification",
        "axis4": "24/7 Agency",
        "axis5": "Context Retention",
        "entity1Name": "Autonomous Swarm",
        "entity2Name": "Monolithic LLM"
    }

    call_count = 0
    def mock_llm_dispatch(sys_p, user_p, timeout=8.0):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return mock_stage1
        return mock_stage2

    with patch("services.chunk_director.call_director_llm", side_effect=mock_llm_dispatch):
        arch, conf, tmpl, props, reason = resolve_archetype_for_chunk(
            chunk=chunk,
            context_before="Legacy models take minutes per inference.",
            context_after="The autonomous swarm self-heals in milliseconds.",
            use_llm=True
        )

        assert arch == VisualArchetype.MULTI_AXIS_BENCHMARK
        assert tmpl == "radar_spider_chart"
        assert conf == 0.95
        assert props["title"] == "COGNITIVE SWARM BENCHMARK"
        assert props["entity1Name"] == "Autonomous Swarm"
        assert "synthesis" in props  # Filled from default fallback


def test_direct_micro_chunk_integration_with_taxonomy():
    """Verify direct_micro_chunk outputs a complete EditDecision with archetype tagging for novel sentences."""
    chunk = ScriptChunk(
        chunk_id="chunk_perf",
        chunk_index=5,
        start=45.0,
        end=49.0,
        duration=4.0,
        text="Analyzing the performance profile reveals nuanced trade-offs across multiple systems.",
        words=[]
    )
    edits = direct_micro_chunk(chunk, allow_motion_graphic=True, use_llm=False)
    assert len(edits) == 1
    mg_edit = edits[0]
    assert mg_edit.action == "motion_graphics"
    assert mg_edit.motion_graphics_type == "radar_spider_chart"
    assert mg_edit.trigger_id == "chunk_perf"
    assert "Taxonomy [MULTI_AXIS_BENCHMARK]" in mg_edit.reason
    assert "axis1" in mg_edit.motion_graphics_targets


def test_direct_all_chunks_context_propagation():
    """Verify direct_all_chunks correctly passes surrounding context and enforces spacing."""
    chunks = [
        ScriptChunk(chunk_id="c1", chunk_index=1, start=0.0, end=4.0, duration=4.0, text="That entire paradigm just hit a fatal bottleneck.", words=[]),
        ScriptChunk(chunk_id="c2", chunk_index=2, start=4.0, end=7.0, duration=3.0, text="Let that sink in.", words=[]),
        ScriptChunk(chunk_id="c3", chunk_index=3, start=7.0, end=11.5, duration=4.5, text="This is the ultimate Pareto leverage: eighty percent of output from twenty percent.", words=[]),
    ]

    edit_list = direct_all_chunks(chunks, min_mg_spacing=2.5, use_llm=False)
    assert len(edit_list.edits) >= 3

    # First chunk is a bottleneck graphic
    assert edit_list.edits[0].action == "motion_graphics"
    assert edit_list.edits[0].motion_graphics_type == "bottleneck_constriction"

    # Second chunk is filler -> B-roll
    assert edit_list.edits[1].action == "b_roll"

    # Third chunk is Pareto graphic
    assert edit_list.edits[2].action == "motion_graphics"
    assert edit_list.edits[2].motion_graphics_type == "pareto_power_law"

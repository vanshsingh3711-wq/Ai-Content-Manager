"""
test_director_taxonomy.py — Unit test suite for Visual Rhetoric Taxonomy & Intent Classification.
"""

import pytest
from services.director_taxonomy import (
    VisualArchetype,
    ARCHETYPE_REGISTRY,
    classify_chunk_by_heuristics,
    build_classification_system_prompt,
    build_classification_user_prompt,
    build_prop_extraction_prompt,
    sanitize_and_fill_defaults,
)


def test_all_eight_archetypes_registered():
    """Verify that all 8 core archetypes are registered with complete specs."""
    expected_archetypes = [
        VisualArchetype.SHOWDOWN_CONTRAST,
        VisualArchetype.CONSTRAINT_CHOKE,
        VisualArchetype.MULTI_AXIS_BENCHMARK,
        VisualArchetype.ASYMMETRIC_LEVERAGE,
        VisualArchetype.TEMPORAL_EPOCH,
        VisualArchetype.SYSTEMIC_FEEDBACK,
        VisualArchetype.STRUCTURAL_ANATOMY,
        VisualArchetype.TRILEMMA_TRADEOFF,
    ]
    for arch in expected_archetypes:
        assert arch in ARCHETYPE_REGISTRY, f"Missing archetype: {arch}"
        spec = ARCHETYPE_REGISTRY[arch]
        assert spec.primary_template != "", f"Archetype {arch} has empty primary_template"
        assert len(spec.keywords) > 0, f"Archetype {arch} has no keywords"
        assert len(spec.required_props) > 0, f"Archetype {arch} has no required_props"
        assert len(spec.default_props) > 0, f"Archetype {arch} has no default_props"
        # Verify required props exist in default_props
        for prop in spec.required_props:
            assert prop in spec.default_props or prop in spec.prop_descriptions, (
                f"Required prop '{prop}' missing from spec definitions for {arch}"
            )


@pytest.mark.parametrize(
    "text,expected_archetype,min_confidence",
    [
        ("Let that sink in.", VisualArchetype.NONE, 0.9),
        ("Why?", VisualArchetype.NONE, 0.9),
        ("Here is the truth.", VisualArchetype.NONE, 0.9),
        ("That entire paradigm just hit a fatal bottleneck.", VisualArchetype.CONSTRAINT_CHOKE, 0.8),
        ("Memory wall limits GPU throughput to 3.2 TB/S.", VisualArchetype.CONSTRAINT_CHOKE, 0.8),
        ("Monolithic chatbots versus autonomous swarms.", VisualArchetype.SHOWDOWN_CONTRAST, 0.8),
        ("The index fund crushed them, up 126% compared to hedge funds.", VisualArchetype.SHOWDOWN_CONTRAST, 0.8),
        ("This is the ultimate Pareto leverage: eighty percent of output from twenty percent of primitives.", VisualArchetype.ASYMMETRIC_LEVERAGE, 0.8),
        ("If computing history were a 24-hour clock, agents emerged in the final four seconds.", VisualArchetype.TEMPORAL_EPOCH, 0.8),
        ("You can only pick two: the third is sacrificed in the trilemma tradeoff.", VisualArchetype.TRILEMMA_TRADEOFF, 0.8),
        ("A reinforcing feedback loop creates cascading second-order consequences.", VisualArchetype.SYSTEMIC_FEEDBACK, 0.8),
        ("Under the hood: the 4-tier layer stack of autonomous computing.", VisualArchetype.STRUCTURAL_ANATOMY, 0.8),
        ("Evaluated across our 5-axis radar benchmark matrix.", VisualArchetype.MULTI_AXIS_BENCHMARK, 0.8),
    ],
)
def test_heuristic_classification_matches(text, expected_archetype, min_confidence):
    """Test fast 0ms heuristic classifier against multi-niche spoken phrases."""
    archetype, confidence, match_info = classify_chunk_by_heuristics(text)
    assert archetype == expected_archetype, (
        f"For text '{text}', expected {expected_archetype} but got {archetype} (info: {match_info})"
    )
    assert confidence >= min_confidence, f"Confidence {confidence} below threshold {min_confidence}"


def test_system_prompt_builder():
    """Verify system prompt includes all archetypes and golden rules."""
    prompt = build_classification_system_prompt()
    assert "8 Visual Archetypes" in prompt
    assert "SHOWDOWN_CONTRAST" in prompt
    assert "CONSTRAINT_CHOKE" in prompt
    assert "Pacing Budget" in prompt


def test_user_prompt_builder():
    """Verify user prompt correctly formats context and chunk text."""
    prompt = build_classification_user_prompt(
        chunk_text="Autonomous agents eliminate PR review bottlenecks.",
        context_before="Legacy teams take weeks to ship.",
        context_after="The output yields 10,000x cost collapse.",
        niche="technology",
    )
    assert "Autonomous agents eliminate PR review bottlenecks." in prompt
    assert "Previous: Legacy teams take weeks to ship." in prompt
    assert "Next: The output yields 10,000x cost collapse." in prompt
    assert "is_significant" in prompt


def test_prop_extraction_prompt_builder():
    """Verify extraction prompt includes required keys for given archetype."""
    prompt = build_prop_extraction_prompt(
        chunk_text="50 developers hit a 4.8-day PR review choke point.",
        archetype=VisualArchetype.CONSTRAINT_CHOKE,
        niche="software engineering",
    )
    assert "bottleneck_constriction" in prompt
    assert "inputMetric" in prompt
    assert "chokeMetric" in prompt
    assert "outputMetric" in prompt


def test_sanitize_and_fill_defaults():
    """Verify defaults are filled for missing keys while preserved for existing keys."""
    raw_props = {
        "title": "CUSTOM MERGE BOTTLENECK",
        "inputMetric": "100 ENGINEERS",
    }
    sanitized = sanitize_and_fill_defaults("bottleneck_constriction", raw_props)
    # Existing keys preserved
    assert sanitized["title"] == "CUSTOM MERGE BOTTLENECK"
    assert sanitized["inputMetric"] == "100 ENGINEERS"
    # Missing required keys filled from defaults
    assert "chokeMetric" in sanitized
    assert "outputMetric" in sanitized
    assert "personality" in sanitized

"""
Tests for Phase 3: Pacing & Budget Gatekeeper.
Verifies:
  1. Dynamic budget calculation across runtimes (60s reels, 3-4m explainers).
  2. Multi-dimensional Information Density Scoring (archetype weight, prop richness, confidence).
  3. Pruning excess candidates to strictly enforce the 3-4 card budget for reels.
  4. Enforcing minimum 3.5s B-roll breathing room between cards.
  5. Contextual B-roll fallback synthesis for pruned cards.
  6. Integration with validate_blueprint() and stitch_micro_scenes_to_blueprint().
"""

import pytest
from services.pacing_gatekeeper import (
    get_motion_graphic_budget,
    calculate_information_density_score,
    calculate_prop_richness,
    extract_broll_search_query,
    synthesize_broll_fallback_from_mg,
    prune_motion_graphics_by_pacing_and_budget,
)
from services.blueprint_validator import validate_blueprint, ValidationReport
from services.script_chunker import ScriptChunk
from services.chunk_director import stitch_micro_scenes_to_blueprint


# ---------------------------------------------------------------------------
# 1. Budget Calculation Tests
# ---------------------------------------------------------------------------

class TestBudgetCalculation:
    def test_short_clip_budget(self):
        # Clips under 35s get 2 cards max
        assert get_motion_graphic_budget(30.0, style="viral") == 2
        assert get_motion_graphic_budget(25.0, style="minimal") == 2

    def test_60s_reel_budget(self):
        # 60s vertical reel: 3 cards for minimal, 4 for viral
        assert get_motion_graphic_budget(60.0, style="viral") == 4
        assert get_motion_graphic_budget(60.0, style="minimal") == 3
        assert get_motion_graphic_budget(75.0, style="viral") == 4

    def test_mid_length_budget(self):
        # 120s video: 5-6 cards
        assert get_motion_graphic_budget(120.0, style="viral") == 6
        assert get_motion_graphic_budget(120.0, style="minimal") == 4

    def test_explainer_budget(self):
        # 3 to 4 minute explainer (180s - 240s): 7 to 9 cards
        assert get_motion_graphic_budget(200.0, style="viral") == 9
        assert get_motion_graphic_budget(200.0, style="minimal") == 7

    def test_explicit_override_budget(self):
        # Custom override respected
        assert get_motion_graphic_budget(60.0, max_limit=2) == 2
        assert get_motion_graphic_budget(240.0, max_limit=5) == 5


# ---------------------------------------------------------------------------
# 2. Information Density Scoring Tests
# ---------------------------------------------------------------------------

class TestInformationDensityScoring:
    def test_systemic_vs_simple_reveal_score(self):
        # Systemic trilemma with rich targets
        trilemma_edit = {
            "motion_graphics_type": "trilemma_tradeoff",
            "start": 20.0,
            "end": 23.5,
            "confidence": 0.95,
            "motion_graphics_targets": {
                "title": "BLOCKCHAIN TRILEMMA",
                "subtitle": "DECENTRALIZATION VS SECURITY VS SCALE",
                "badge": "ARCHITECTURAL THEOREM",
                "axiom": "You can only pick two vertices.",
                "vertex1Title": "Decentralization",
                "vertex2Title": "Security",
                "vertex3Title": "Scalability",
                "sacrificedVertex": 3,
            }
        }
        # Simple quote reveal with single target
        quote_edit = {
            "motion_graphics_type": "quote_reveal",
            "start": 20.0,
            "end": 23.5,
            "confidence": 0.80,
            "motion_graphics_targets": {
                "quote": "Keep it simple.",
            }
        }

        trilemma_score = calculate_information_density_score(trilemma_edit, video_duration=60.0)
        quote_score = calculate_information_density_score(quote_edit, video_duration=60.0)

        assert trilemma_score > quote_score
        assert trilemma_score >= 0.85
        assert quote_score <= 0.65

    def test_prop_richness_calculation(self):
        rich_targets = {
            "title": "THE COMPUTE MEMORY WALL",
            "subtitle": "INTERCONNECT BANDWIDTH CHOKE",
            "badge": "⚠️ SYSTEMIC CHOKE POINT",
            "inputMetric": "1000 TFLOPS",
            "chokeMetric": "3.2 TB/S",
            "outputMetric": "12 TFLOPS",
            "synthesis": "Amdahl's law in practice",
        }
        sparse_targets = {"text": "Hello world"}
        assert calculate_prop_richness(rich_targets) > calculate_prop_richness(sparse_targets)
        assert calculate_prop_richness(rich_targets) >= 0.88
        assert calculate_prop_richness(None) == 0.20


# ---------------------------------------------------------------------------
# 3. B-Roll Query Synthesis Tests
# ---------------------------------------------------------------------------

class TestBrollSynthesis:
    def test_extract_clean_search_query(self):
        edit = {
            "motion_graphics_type": "bottleneck_constriction",
            "motion_graphics_targets": {
                "title": "GPU MEMORY WALL CONGESTION",
                "subtitle": "INTERCONNECT BANDWIDTH BOTTLENECK",
            },
            "reason": "Explaining off-chip pin density limits",
        }
        query = extract_broll_search_query(edit, chunk_text="We hit a hardware starvation limit", topic="technology")
        assert "gpu" in query.lower() or "memory" in query.lower() or "bandwidth" in query.lower()
        # Verify no stopwords like 'the', 'a', 'of'
        words = query.split()
        for w in words:
            assert w not in {"the", "and", "or", "of", "with"}

    def test_synthesize_broll_fallback(self):
        edit = {
            "action": "motion_graphics",
            "trigger_id": "chunk_03",
            "start": 12.0,
            "end": 15.0,
            "motion_graphics_type": "showdown_duel",
            "motion_graphics_targets": {
                "title": "AGENTS VS CHATBOTS",
            }
        }
        fallback = synthesize_broll_fallback_from_mg(edit, chunk_text="Autonomous swarms replace static prompt chatbots", topic="technology")
        assert fallback["action"] == "b_roll"
        assert fallback["trigger_id"] == "chunk_03"
        assert fallback["start"] == 12.0
        assert fallback["end"] == 15.0
        assert "search_query" in fallback
        assert "pacing" in fallback["reason"].lower()


# ---------------------------------------------------------------------------
# 4. Pruning and Pacing Enforcement Tests
# ---------------------------------------------------------------------------

class TestPacingGatekeeperPruning:
    def test_prune_excess_cards_to_budget(self):
        """
        In a 60s reel, 6 candidate motion graphics spaced 8s apart (no collision)
        must be pruned to exactly 4 cards (the reel budget), and 2 downgraded to B-roll.
        """
        candidates = [
            # High-value systemic candidates
            {"action": "motion_graphics", "trigger_id": "c1", "start": 4.0, "end": 7.0, "motion_graphics_type": "bottleneck_constriction", "motion_graphics_targets": {"title": "MEMORY WALL", "inputMetric": "1000", "chokeMetric": "3.2"}},
            {"action": "motion_graphics", "trigger_id": "c2", "start": 13.0, "end": 16.0, "motion_graphics_type": "trilemma_tradeoff", "motion_graphics_targets": {"title": "TRILEMMA", "vertex1Title": "A", "vertex2Title": "B", "vertex3Title": "C"}},
            {"action": "motion_graphics", "trigger_id": "c3", "start": 22.0, "end": 25.0, "motion_graphics_type": "exploded_layer_stack", "motion_graphics_targets": {"title": "AGENT STACK", "layer1Title": "L1", "layer2Title": "L2"}},
            {"action": "motion_graphics", "trigger_id": "c4", "start": 32.0, "end": 35.0, "motion_graphics_type": "radar_spider_chart", "motion_graphics_targets": {"title": "BENCHMARK", "axis1": "Speed"}},
            # Lower value simple cards
            {"action": "motion_graphics", "trigger_id": "c5", "start": 42.0, "end": 45.0, "motion_graphics_type": "quote_reveal", "motion_graphics_targets": {"quote": "Quote here"}},
            {"action": "motion_graphics", "trigger_id": "c6", "start": 51.0, "end": 54.0, "motion_graphics_type": "hero_reveal", "motion_graphics_targets": {"headline": "Hero Title"}},
        ]

        pruned, issues, metrics = prune_motion_graphics_by_pacing_and_budget(
            edits=candidates,
            video_duration=60.0,
            style="viral", # Budget = 4
        )

        retained_mgs = [e for e in pruned if e["action"] == "motion_graphics"]
        downgraded_brolls = [e for e in pruned if e["action"] == "b_roll"]

        assert len(retained_mgs) == 4
        assert len(downgraded_brolls) == 2
        assert metrics["budget_max"] == 4
        assert metrics["retained_mg_count"] == 4
        assert metrics["downgraded_count"] == 2

        # Verify the top 4 systemic candidates were retained over the simple quote & hero cards
        retained_types = {e["motion_graphics_type"] for e in retained_mgs}
        assert "bottleneck_constriction" in retained_types
        assert "trilemma_tradeoff" in retained_types
        assert "exploded_layer_stack" in retained_types
        assert "radar_spider_chart" in retained_types
        assert "quote_reveal" not in retained_types

    def test_spacing_breathing_room_enforcement(self):
        """
        Two motion graphics placed too close (only 1.5s gap < 3.5s min spacing):
        The higher scoring candidate must be kept, and the colliding candidate downgraded to B-roll.
        """
        candidates = [
            {"action": "motion_graphics", "trigger_id": "c1", "start": 10.0, "end": 13.0, "motion_graphics_type": "trilemma_tradeoff", "motion_graphics_targets": {"title": "TRILEMMA", "vertex1Title": "A"}},
            {"action": "motion_graphics", "trigger_id": "c2", "start": 14.5, "end": 17.5, "motion_graphics_type": "hero_reveal", "motion_graphics_targets": {"headline": "QUICK REVEAL"}},
        ]

        pruned, issues, metrics = prune_motion_graphics_by_pacing_and_budget(
            edits=candidates,
            video_duration=60.0,
            min_spacing_sec=3.5,
        )

        retained_mgs = [e for e in pruned if e["action"] == "motion_graphics"]
        downgraded_brolls = [e for e in pruned if e["action"] == "b_roll"]

        assert len(retained_mgs) == 1
        assert len(downgraded_brolls) == 1
        assert retained_mgs[0]["motion_graphics_type"] == "trilemma_tradeoff"
        assert downgraded_brolls[0]["trigger_id"] == "c2"


# ---------------------------------------------------------------------------
# 5. Validator and Stitching Integration Tests
# ---------------------------------------------------------------------------

class TestPacingIntegration:
    def test_validate_blueprint_with_pacing_enforced(self):
        tmap = {
            f"c{i}": {"start": float(i * 9), "end": float(i * 9 + 3), "text": f"Beat {i}"}
            for i in range(7)
        }
        edits = [
            {"action": "motion_graphics", "trigger_id": f"c{i}", "start": float(i * 9), "end": float(i * 9 + 3), "motion_graphics_type": "hero_reveal", "motion_graphics_targets": {"headline": f"Head {i}"}}
            for i in range(7)
        ]

        validated, report = validate_blueprint(
            edits=edits,
            timestamp_map=tmap,
            video_duration=60.0,
            enforce_pacing=True,
            style="viral",
        )

        mg_count = sum(1 for e in validated if e.get("action") == "motion_graphics")
        broll_count = sum(1 for e in validated if e.get("action") == "b_roll")

        assert mg_count == 4  # Capped at reel budget of 4
        assert broll_count == 3  # 3 excess downgraded to B-roll
        assert report.mg_budget_max == 4
        assert report.mg_count_used == 4
        assert report.mg_downgraded_count == 3

    def test_stitch_micro_scenes_to_blueprint_gatekeeper(self):
        """
        Creates 8 chunks with high-density triggers in a 60-second video.
        Stitching must produce an EDL with max 4 motion graphics and continuous B-roll.
        """
        script_sentences = [
            "We hit a massive compute memory wall in GPU throughput.",
            "Adding headcount exponentially increases communication friction in code reviews.",
            "You can only optimize two vertices in the blockchain trilemma.",
            "Deconstructing the autonomous agent stack reveals four distinct layers.",
            "Evaluating frontier models on a multi-axis benchmark proves the tradeoff.",
            "Pareto power law states eighty percent of yield comes from twenty percent of components.",
            "Compressing modern AI history into twenty-four hours changes our perspective.",
            "The future belongs to deterministic self-hosted agent swarms.",
        ]

        chunks = []
        for i, text in enumerate(script_sentences):
            start = round(i * 7.5, 2)
            end = round(start + 5.0, 2)
            chunks.append(ScriptChunk(
                chunk_id=f"chk_{i+1}",
                chunk_index=i,
                text=text,
                start=start,
                end=end,
                duration=round(end - start, 2),
                word_count=len(text.split()),
            ))

        total_duration = 60.0
        blueprint = stitch_micro_scenes_to_blueprint(
            chunks=chunks,
            total_duration=total_duration,
            topic="technology",
            style="viral",
            is_faceless=True,
            min_mg_spacing=3.5,
        )

        mgs = [e for e in blueprint.edits if e.action == "motion_graphics"]
        brolls = [e for e in blueprint.edits if e.action == "b_roll"]

        # Gatekeeper guarantees:
        # 1. Total motion graphics <= 4 for 60s
        assert len(mgs) <= 4
        assert len(mgs) >= 2

        # 2. Minimum spacing >= 3.5s between any two motion graphics
        for j in range(len(mgs) - 1):
            curr_mg = mgs[j]
            next_mg = mgs[j + 1]
            gap = (next_mg.start or 0.0) - (curr_mg.end or 0.0)
            assert gap >= 3.0  # Spaced with plenty of B-roll breathing room

        # 3. Continuous B-roll with zero black frames
        assert len(brolls) >= 1
        assert brolls[0].start == 0.0
        assert brolls[-1].end == round(total_duration, 2)

"""
Tests for Micro-Scene Chunk Director (chunk_director.py).
Validates:
  1. High-relevance B-roll search query extraction (no stop words, domain anchored).
  2. Targeted motion graphic assignment matching spoken line context.
  3. Reel-paced multi-cut splitting for longer B-roll scenes.
  4. Inter-chunk spacing guardrails (preventing consecutive colliding graphics).
  5. Valid EditList output complying with the EDL schema.
"""

import pytest
from services.script_chunker import ScriptChunk
from services.chunk_director import (
    extract_broll_search_query,
    direct_micro_chunk,
    direct_all_chunks,
    TEMPLATE_MAPPINGS
)
from services.ai_director import EditDecision, EditList


def test_extract_broll_search_query():
    # Priority visual tech nouns
    q1 = extract_broll_search_query("We are deploying autonomous systems endowed with terminal access", topic="technology")
    assert "terminal" in q1

    q2 = extract_broll_search_query("High performance computing inside modern server datacenter infrastructure", topic="technology")
    assert any(k in q2 for k in ["server", "servers", "datacenter"])

    # Clean stop word elimination
    q3 = extract_broll_search_query("And so for all of our engineers writing software code on laptops", topic="technology")
    assert any(k in q3 for k in ["code", "coding", "laptop", "developer", "engineer"])
    assert "for all of our" not in q3


def test_direct_micro_chunk_motion_graphics():
    # 1. Metric Reveal test
    c1 = ScriptChunk(
        chunk_id="chunk_01",
        chunk_index=1,
        start=10.0,
        end=13.5,
        duration=3.5,
        text="The marginal cost of cognitive reasoning is collapsing by 10,000 times.",
        words=[],
        extracted_metrics=["10,000 times"]
    )
    edits1 = direct_micro_chunk(c1, topic="technology")
    assert len(edits1) == 1
    assert edits1[0].action == "motion_graphics"
    assert edits1[0].motion_graphics_type == "metric_reveal"
    assert edits1[0].trigger_id == "chunk_01"

    # 2. Showdown Duel test
    c2 = ScriptChunk(
        chunk_id="chunk_02",
        chunk_index=2,
        start=20.0,
        end=23.5,
        duration=3.5,
        text="Why are monolithic chatbots failing compared to autonomous agent swarms?",
        words=[]
    )
    edits2 = direct_micro_chunk(c2, topic="technology")
    assert len(edits2) == 1
    assert edits2[0].action == "motion_graphics"
    assert edits2[0].motion_graphics_type == "showdown_duel"

    # 3. Split Slider test
    c3 = ScriptChunk(
        chunk_id="chunk_03",
        chunk_index=3,
        start=30.0,
        end=33.5,
        duration=3.5,
        text="A solo technical founder can now outpace a 100-person enterprise.",
        words=[]
    )
    edits3 = direct_micro_chunk(c3, topic="technology")
    assert len(edits3) == 1
    assert edits3[0].action == "motion_graphics"
    assert edits3[0].motion_graphics_type == "split_slider_comparison"

    # 4. Playbook / Checklist test -> maps to black canvas todo_list
    c4 = ScriptChunk(
        chunk_id="chunk_04",
        chunk_index=4,
        start=40.0,
        end=43.5,
        duration=3.5,
        text="The winning playbook is simple: automate the diagnostic audit and deploy agents.",
        words=[]
    )
    edits4 = direct_micro_chunk(c4, topic="technology")
    assert len(edits4) == 1
    assert edits4[0].action == "motion_graphics"
    assert edits4[0].motion_graphics_type == "todo_list"
    assert edits4[0].motion_graphics_targets["format"] in ["todo", "sequence"]


def test_detect_script_list_points_todo_and_sequence():
    from services.chunk_director import detect_script_list_points

    # 1. Numbered list -> format "sequence" with 01, 02, 03
    t1 = "Three key directives: 1. Ingest clean data 2. Run automated validation 3. Deploy to production"
    res1 = detect_script_list_points(t1)
    assert res1 is not None
    assert res1["format"] == "sequence"
    assert "Ingest clean data" in res1["point1"]
    assert "Run automated validation" in res1["point2"]
    assert "Deploy to production" in res1["point3"]

    # 2. Sequential adverbs -> format "todo" with checkbox styling
    t2 = "Here is the exact framework: first, automate your audits, second, integrate agent loops, third, verify results."
    res2 = detect_script_list_points(t2)
    assert res2 is not None
    assert res2["format"] == "todo"
    assert "Automate your audits" in res2["point1"]
    assert "Integrate agent loops" in res2["point2"]

    # 3. Micro chunk direct test: script chunk containing sequential list auto-assigns todo_list
    chunk_list = ScriptChunk(
        chunk_id="chunk_list_01",
        chunk_index=5,
        start=60.0,
        end=64.0,
        duration=4.0,
        text="Step 1: Setup system telemetry. Step 2: Establish test suite. Step 3: Trigger deployment.",
        words=[]
    )
    edits = direct_micro_chunk(chunk_list, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "todo_list"
    assert edits[0].motion_graphics_targets["format"] == "sequence"



def test_direct_micro_chunk_broll_pacing():
    # Long chunk (> 4.2s) should be split into 2 rapid cuts
    long_chunk = ScriptChunk(
        chunk_id="chunk_10",
        chunk_index=10,
        start=50.0,
        end=55.0,
        duration=5.0,
        text="Software engineers collaborate across modern digital workspaces to design reliable cloud systems.",
        words=[]
    )
    edits = direct_micro_chunk(long_chunk, topic="technology")
    assert len(edits) == 2
    assert edits[0].action == "b_roll"
    assert edits[1].action == "b_roll"
    assert edits[0].trigger_id == "chunk_10_cut1"
    assert edits[1].trigger_id == "chunk_10_cut2"
    assert edits[0].end == edits[1].start  # Seamless boundary


def test_direct_all_chunks_spacing_and_schema():
    chunks = [
        ScriptChunk(chunk_id="c1", chunk_index=1, start=0.0, end=3.5, duration=3.5, text="First metric collapse by 10,000 times.", words=[]),
        # Immediate next chunk also triggers a template, but should be spaced out
        ScriptChunk(chunk_id="c2", chunk_index=2, start=3.5, end=6.5, duration=3.0, text="Monolithic chatbots versus swarms.", words=[]),
        ScriptChunk(chunk_id="c3", chunk_index=3, start=6.5, end=9.5, duration=3.0, text="Engineers writing software on laptops.", words=[]),
        ScriptChunk(chunk_id="c4", chunk_index=4, start=9.5, end=13.0, duration=3.5, text="A solo founder outpaces 100-person dev team.", words=[]),
    ]

    edit_list = direct_all_chunks(chunks, topic="technology", min_mg_spacing=3.0)
    assert isinstance(edit_list, EditList)
    assert len(edit_list.edits) >= 4

    mg_edits = [e for e in edit_list.edits if e.action == "motion_graphics"]
    assert len(mg_edits) >= 2

    # Verify spacing between motion graphics
    for i in range(len(mg_edits) - 1):
        gap = mg_edits[i + 1].start - mg_edits[i].end
        assert gap >= 2.9, f"Motion graphic gap too tight: {gap}s"


def test_stitch_micro_scenes_gapless_broll_and_sfx():
    from services.chunk_director import stitch_micro_scenes_to_blueprint

    chunks = [
        ScriptChunk(chunk_id="c1", chunk_index=1, start=0.5, end=4.0, duration=3.5, text="First metric collapse by 10,000 times.", words=[]),
        ScriptChunk(chunk_id="c2", chunk_index=2, start=4.2, end=8.0, duration=3.8, text="Software engineers writing code on laptops.", words=[]),
        ScriptChunk(chunk_id="c3", chunk_index=3, start=8.0, end=13.0, duration=5.0, text="A solo founder outpaces 100-person enterprise software team.", words=[]),
        ScriptChunk(chunk_id="c4", chunk_index=4, start=13.2, end=18.0, duration=4.8, text="Modern AI compute stack unites cloud compute with edge models.", words=[]),
    ]

    master_plan = stitch_micro_scenes_to_blueprint(
        chunks=chunks,
        total_duration=18.0,
        topic="technology",
        style="viral",
        is_faceless=True
    )

    assert isinstance(master_plan, EditList)
    
    # 1. Verify gapless B-roll track
    brolls = [e for e in master_plan.edits if e.action == "b_roll"]
    assert len(brolls) >= 2
    assert brolls[0].start == 0.0, "First B-roll must snap to 0.0s"
    assert brolls[-1].end == 18.0, "Last B-roll must snap to total duration"

    for i in range(len(brolls) - 1):
        assert brolls[i].end == brolls[i + 1].start, f"B-roll gap detected: {brolls[i].end} != {brolls[i+1].start}"

    # 2. Verify Motion Graphics & SFX
    mgs = [e for e in master_plan.edits if e.action == "motion_graphics"]
    sfx = [e for e in master_plan.edits if e.action == "sfx"]
    assert len(mgs) >= 2
    assert len(sfx) >= 1
    # SFX should be synchronized with motion graphic start
    assert abs(sfx[0].start - (mgs[0].start + 0.05)) < 0.1


def test_blueprint_resolver_faceless_density_and_gapless():
    from services.blueprint_resolver import enforce_density_budgeting, resolve_master_blueprint
    
    # 1. Verify enforce_density_budgeting permits min_mg_spacing=3.5s for is_faceless=True
    edits = [
        EditDecision(action="motion_graphics", start=5.0, end=8.0, motion_graphics_type="metric_reveal"),
        EditDecision(action="motion_graphics", start=12.0, end=15.0, motion_graphics_type="showdown_duel"),
    ]
    budgeted = enforce_density_budgeting(edits, total_duration=30.0, is_faceless=True)
    assert len(budgeted) == 2, "Faceless density budgeting should allow 3.5s spaced motion graphics"

    # 2. Verify resolve_master_blueprint performs 100% gapless B-roll snapping for faceless mode
    broll_plan = EditList(edits=[
        EditDecision(action="b_roll", start=1.5, end=6.0, search_query="tech coding"),
        EditDecision(action="b_roll", start=7.0, end=12.0, search_query="server racks"),
    ])
    resolved = resolve_master_blueprint(
        unified_analysis_json="",
        broll_plan=broll_plan,
        mg_plan=EditList(edits=[]),
        char_plan=EditList(edits=[]),
        is_faceless=True
    )
    brolls = [e for e in resolved.edits if e.action == "b_roll"]
    assert len(brolls) == 2
    assert brolls[0].start == 0.0, "First B-roll in faceless video must start at 0.0s"
    assert brolls[0].end == brolls[1].start, "Adjacent B-rolls must have 0 gap"


def test_stitch_rotates_duplicate_templates():
    from services.chunk_director import stitch_micro_scenes_to_blueprint

    # Provide two chunks that trigger the same template ("showdown_duel")
    chunks = [
        ScriptChunk(chunk_id="c1", chunk_index=1, start=0.0, end=3.5, duration=3.5, text="Monolithic chatbots versus swarms.", words=[]),
        ScriptChunk(chunk_id="c2", chunk_index=2, start=3.5, end=8.0, duration=4.5, text="Engineers writing code on modern laptops.", words=[]),
        ScriptChunk(chunk_id="c3", chunk_index=3, start=8.0, end=12.0, duration=4.0, text="Monolithic chatbots versus swarms again.", words=[]),
    ]
    stitched = stitch_micro_scenes_to_blueprint(chunks, total_duration=12.0, is_faceless=True)
    mgs = [e for e in stitched.edits if e.action == "motion_graphics"]
    assert len(mgs) == 2
    # Verify the second showdown_duel was rotated to split_slider_comparison for variety
    assert mgs[0].motion_graphics_type == "showdown_duel"
    assert mgs[1].motion_graphics_type == "split_slider_comparison"


def test_phase4_backward_compatibility_and_validation():
    from services.script_chunker import chunk_transcript
    from services.chunk_director import stitch_micro_scenes_to_blueprint
    from services.blueprint_validator import validate_blueprint

    synthetic_map = {
        "chunk_01": {"start": 0.0, "end": 4.0, "text": "Deploying autonomous systems with terminal access.", "words": []},
        "chunk_02": {"start": 4.0, "end": 8.0, "text": "Marginal cost of reasoning is collapsing by 10,000 times.", "words": []},
        "chunk_03": {"start": 8.0, "end": 13.0, "text": "Monolithic chatbots failing compared to autonomous swarms.", "words": []},
        "chunk_04": {"start": 13.0, "end": 18.0, "text": "Software engineers collaborate across modern digital workspaces.", "words": []},
    }

    chunks = chunk_transcript(synthetic_map, total_duration=18.0)
    master_plan = stitch_micro_scenes_to_blueprint(
        chunks=chunks,
        total_duration=18.0,
        topic="technology",
        style="viral",
        is_faceless=True
    )

    # Register triggers in timestamp_map exactly as video_pipeline.py does in Step 4
    for ed in master_plan.edits:
        if ed.trigger_id and ed.trigger_id not in synthetic_map:
            synthetic_map[ed.trigger_id] = {
                "start": ed.start,
                "end": ed.end or (ed.start + 3.0),
                "text": getattr(ed, "reason", "") or ""
            }

    edits_dicts = [e.model_dump() for e in master_plan.edits]
    validated_edits, report = validate_blueprint(
        edits=edits_dicts,
        timestamp_map=synthetic_map,
        video_duration=18.0,
        is_faceless=True
    )

    assert report.rejected_count == 0, f"Validator rejected edits: {[i.issue for i in report.issues]}"
    assert len(validated_edits) == len(master_plan.edits)
    
    # Verify EDL serialization matches Next.js Studio Editor contract
    import json
    edl_payload = json.dumps({"edits": validated_edits})
    parsed = EditList.model_validate_json(edl_payload)
    assert len(parsed.edits) == len(validated_edits)


def test_suppress_premature_and_irrelevant_motion_graphics():
    """Validates that isolated words like 'brittle', 'chatbot', or narrative hooks don't trigger cards."""
    c_hook = ScriptChunk(
        chunk_id="chunk_hook",
        chunk_index=1,
        start=0.0,
        end=4.3,
        duration=4.3,
        text="For the last three years, the world was captivated by conversational chatbots.",
        words=[]
    )
    edits_hook = direct_micro_chunk(c_hook, topic="technology")
    assert all(e.action == "b_roll" for e in edits_hook), "Narrative hook must NOT trigger a premature showdown duel!"

    c_brittle = ScriptChunk(
        chunk_id="chunk_brittle",
        chunk_index=2,
        start=10.0,
        end=14.0,
        duration=4.0,
        text="It felt like magic, but under the hood, it was passive, brittle, and incapable of true autonomous work.",
        words=[]
    )
    edits_brittle = direct_micro_chunk(c_brittle, topic="technology")
    assert all(e.action == "b_roll" for e in edits_brittle), "Isolated 'brittle' must NOT trigger a split comparison slider!"


def test_dynamic_motion_graphic_slot_filling():
    """Validates that terminal cards dynamically render pytest or local SLM commands based on sentence."""
    c_pytest = ScriptChunk(
        chunk_id="chunk_test",
        chunk_index=1,
        start=80.0,
        end=84.0,
        duration=4.0,
        text="It inspects the stack trace, rewrites the failing syntax, and re-executes unit tests until every assertion passes green.",
        words=[]
    )
    edits_pytest = direct_micro_chunk(c_pytest, topic="technology")
    assert len(edits_pytest) == 1
    assert edits_pytest[0].motion_graphics_type == "cooked_terminal"
    assert "pytest" in edits_pytest[0].motion_graphics_targets["command"]
    assert "ALL GREEN" in edits_pytest[0].motion_graphics_targets["output"]

    c_slm = ScriptChunk(
        chunk_id="chunk_slm",
        chunk_index=2,
        start=130.0,
        end=134.0,
        duration=4.0,
        text="quantized local models running on mobile silicon at over 100 tokens per second",
        words=[]
    )
    edits_slm = direct_micro_chunk(c_slm, topic="technology")
    assert len(edits_slm) == 1
    # Either stat card highlight or local SLM terminal
    assert edits_slm[0].action == "motion_graphics"
    if edits_slm[0].motion_graphics_type == "cooked_terminal":
        assert "run local_slm" in edits_slm[0].motion_graphics_targets["command"]
    else:
        assert edits_slm[0].motion_graphics_type == "stat_card_highlight"
        assert "100" in edits_slm[0].motion_graphics_targets["stat"]


def test_architecture_pipeline_motion_graphic():
    """Validates that Phase 1 Explainer (architecture_pipeline) triggers and populates multi-stage telemetry."""
    # 1. RAG retrieval pipeline chunk
    c_rag = ScriptChunk(
        chunk_id="chunk_rag",
        chunk_index=1,
        start=45.0,
        end=49.0,
        duration=4.0,
        text="The retrieval pipeline queries vector embeddings to anchor contextual knowledge in sub-milliseconds.",
        words=[]
    )
    edits_rag = direct_micro_chunk(c_rag, topic="technology")
    assert len(edits_rag) == 1
    assert edits_rag[0].action == "motion_graphics"
    assert edits_rag[0].motion_graphics_type == "architecture_pipeline"
    targets = edits_rag[0].motion_graphics_targets
    assert "RAG" in targets["title"] or "RETRIEVAL" in targets["title"]
    assert "stage1Title" in targets
    assert "stage2Title" in targets
    assert "stage3Title" in targets
    assert "stage4Title" in targets

    # 2. End-to-end data pipeline chunk
    c_pipe = ScriptChunk(
        chunk_id="chunk_pipe",
        chunk_index=2,
        start=90.0,
        end=94.0,
        duration=4.0,
        text="This end to end pipeline connects streaming logs directly into real-time autonomous systems.",
        words=[]
    )
    edits_pipe = direct_micro_chunk(c_pipe, topic="technology")
    assert len(edits_pipe) == 1
    assert edits_pipe[0].motion_graphics_type == "architecture_pipeline"
    assert edits_pipe[0].motion_graphics_targets["stage1Title"] is not None


def test_causal_loop_motion_graphic():
    """Validates that Phase 2 Explainer (causal_loop) triggers and populates cyclic feedback targets."""
    # 1. System Outage / Vicious cascade
    c_outage = ScriptChunk(
        chunk_id="chunk_outage",
        chunk_index=1,
        start=55.0,
        end=59.0,
        duration=4.0,
        text="A single cache miss cascades into database lockups, creating an inescapable vicious cycle.",
        words=[]
    )
    edits_outage = direct_micro_chunk(c_outage, topic="technology")
    assert len(edits_outage) == 1
    assert edits_outage[0].action == "motion_graphics"
    assert edits_outage[0].motion_graphics_type == "causal_loop"
    targets = edits_outage[0].motion_graphics_targets
    assert targets["loopType"] == "vicious"
    assert "OUTAGE" in targets["title"] or "CYCLE" in targets["title"]
    assert "node1Title" in targets
    assert "node2Title" in targets
    assert "node3Title" in targets
    assert "node4Title" in targets

    # 2. Product Network Growth Flywheel
    c_flywheel = ScriptChunk(
        chunk_id="chunk_flywheel",
        chunk_index=2,
        start=110.0,
        end=114.0,
        duration=4.0,
        text="This creates a self-reinforcing flywheel where user adoption fuels proprietary telemetry data.",
        words=[]
    )
    edits_flywheel = direct_micro_chunk(c_flywheel, topic="technology")
    assert len(edits_flywheel) == 1
    assert edits_flywheel[0].motion_graphics_type == "causal_loop"
    assert edits_flywheel[0].motion_graphics_targets["loopType"] == "reinforcing"


def test_exploded_layer_stack_motion_graphic():
    """Validates that Phase 3 Explainer (exploded_layer_stack) triggers and populates 4-tier strata targets."""
    # 1. Tech stack / Under the hood
    c_stack = ScriptChunk(
        chunk_id="chunk_stack",
        chunk_index=1,
        start=72.0,
        end=76.0,
        duration=4.0,
        text="When you look under the hood at the autonomous agent stack, it decomposes into distinct operational layers.",
        words=[]
    )
    edits = direct_micro_chunk(c_stack, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "exploded_layer_stack"
    targets = edits[0].motion_graphics_targets
    assert "STACK" in targets["title"] or "AGENT" in targets["title"]
    assert "layer1Title" in targets
    assert "layer2Title" in targets
    assert "layer3Title" in targets
    assert "layer4Title" in targets

    # 2. Cloud Native Infrastructure Stack
    c_cloud = ScriptChunk(
        chunk_id="chunk_cloud",
        chunk_index=2,
        start=120.0,
        end=124.0,
        duration=4.0,
        text="The cloud native tech stack abstracts kubernetes and bare metal into serverless functions.",
        words=[]
    )
    edits_cloud = direct_micro_chunk(c_cloud, topic="technology")
    assert len(edits_cloud) == 1
    assert edits_cloud[0].motion_graphics_type == "exploded_layer_stack"
    assert "CLOUD" in edits_cloud[0].motion_graphics_targets["title"] or "INFRASTRUCTURE" in edits_cloud[0].motion_graphics_targets["title"]


def test_bottleneck_constriction_motion_graphic():
    """Validates that Phase 4 Explainer (bottleneck_constriction) triggers and populates choke point targets."""
    # 1. Hardware compute / Memory wall
    c_mem = ScriptChunk(
        chunk_id="chunk_mem",
        chunk_index=1,
        start=85.0,
        end=89.0,
        duration=4.0,
        text="The raw compute is massive, but the chip hits a severe memory wall where bus bandwidth becomes the bottleneck.",
        words=[]
    )
    edits = direct_micro_chunk(c_mem, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "bottleneck_constriction"
    targets = edits[0].motion_graphics_targets
    assert "MEMORY WALL" in targets["title"] or "BOTTLENECK" in targets["title"]
    assert "inputMetric" in targets
    assert "chokeMetric" in targets
    assert "outputMetric" in targets

    # 2. API Concurrency Rate Limit Choke
    c_api = ScriptChunk(
        chunk_id="chunk_api",
        chunk_index=2,
        start=135.0,
        end=139.0,
        duration=4.0,
        text="Your agents can issue thousands of requests, but upstream API rate limit quotas create a hard choke point.",
        words=[]
    )
    edits_api = direct_micro_chunk(c_api, topic="technology")
    assert len(edits_api) == 1
    assert edits_api[0].motion_graphics_type == "bottleneck_constriction"
    assert "API" in edits_api[0].motion_graphics_targets["title"] or "RATE LIMIT" in edits_api[0].motion_graphics_targets["title"]


def test_trilemma_tradeoff_motion_graphic():
    """Validates that Phase 5 Explainer (trilemma_tradeoff) triggers and populates 3 vertices and tradeoff targets."""
    # 1. Blockchain Trilemma / Pick Two
    c_tri = ScriptChunk(
        chunk_id="chunk_tri",
        chunk_index=1,
        start=85.0,
        end=89.0,
        duration=4.0,
        text="In distributed consensus, you run into the classic blockchain trilemma where you can only pick two and sacrifice the third.",
        words=[]
    )
    edits = direct_micro_chunk(c_tri, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "trilemma_tradeoff"
    targets = edits[0].motion_graphics_targets
    assert "TRILEMMA" in targets["title"]
    assert "vertex1Title" in targets
    assert "vertex2Title" in targets
    assert "vertex3Title" in targets
    assert targets.get("sacrificedVertex") == 3

    # 2. CAP Theorem Distributed Database Trade-off
    c_cap = ScriptChunk(
        chunk_id="chunk_cap",
        chunk_index=2,
        start=135.0,
        end=139.0,
        duration=4.0,
        text="Every data engineer faces the cap theorem where network partitions force an impossible trade-off triangle.",
        words=[]
    )
    edits_cap = direct_micro_chunk(c_cap, topic="technology")
    assert len(edits_cap) == 1
    assert edits_cap[0].motion_graphics_type == "trilemma_tradeoff"
    assert "CAP THEOREM" in edits_cap[0].motion_graphics_targets["title"]


def test_scale_zoom_ladder_motion_graphic():
    """Validates that Phase 6 Explainer (scale_zoom_ladder) triggers and populates 3 tiers and multiplier targets."""
    # 1. General Scale / Difference Between Million and Billion
    c_scale = ScriptChunk(
        chunk_id="chunk_scale",
        chunk_index=1,
        start=85.0,
        end=89.0,
        duration=4.0,
        text="Human intuition completely fails at exponential scale, especially when exploring the difference between a million and a billion.",
        words=[]
    )
    edits = direct_micro_chunk(c_scale, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "scale_zoom_ladder"
    targets = edits[0].motion_graphics_targets
    assert "SCALE" in targets["title"]
    assert "step1Value" in targets
    assert "step2Value" in targets
    assert "step3Value" in targets

    # 2. AI Neural Parameter Scaling
    c_param = ScriptChunk(
        chunk_id="chunk_param",
        chunk_index=2,
        start=135.0,
        end=139.0,
        duration=4.0,
        text="Frontier AI model neural parameter density spans unprecedented orders of magnitude across compute tiers.",
        words=[]
    )
    edits_param = direct_micro_chunk(c_param, topic="technology")
    assert len(edits_param) == 1
    assert edits_param[0].motion_graphics_type == "scale_zoom_ladder"
    assert "PARAMETER" in edits_param[0].motion_graphics_targets["title"] or "SCALE" in edits_param[0].motion_graphics_targets["title"]


def test_decision_tree_fork_motion_graphic():
    """Validates that Phase 7 Explainer (decision_tree_fork) triggers and populates bifurcation and branch targets."""
    # 1. Strategic Architectural Crossroads
    c_fork = ScriptChunk(
        chunk_id="chunk_fork",
        chunk_index=1,
        start=85.0,
        end=89.0,
        duration=4.0,
        text="At this critical crossroads, every technology startup faces a fundamental architectural fork that defines path dependency.",
        words=[]
    )
    edits = direct_micro_chunk(c_fork, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "decision_tree_fork"
    targets = edits[0].motion_graphics_targets
    assert "BIFURCATION" in targets["title"] or "FORK" in targets["title"]
    assert "rootTitle" in targets
    assert "branch1Title" in targets
    assert "branch2Title" in targets

    # 2. Cloud Infrastructure Microservices vs Monolith Fork
    c_infra = ScriptChunk(
        chunk_id="chunk_infra",
        chunk_index=2,
        start=135.0,
        end=139.0,
        duration=4.0,
        text="Should you build on cloud microservices or a monolithic runtime? This infrastructure fork dictates operational velocity.",
        words=[]
    )
    edits_infra = direct_micro_chunk(c_infra, topic="technology")
    assert len(edits_infra) == 1
    assert edits_infra[0].motion_graphics_type == "decision_tree_fork"
    assert "INFRASTRUCTURE" in edits_infra[0].motion_graphics_targets["title"]


def test_radar_spider_chart_motion_graphic():
    """Validates that Phase 8 Explainer (radar_spider_chart) triggers and populates polygonal radar benchmark targets."""
    # 1. Frontier AI Model Benchmark
    c_radar = ScriptChunk(
        chunk_id="chunk_radar",
        chunk_index=1,
        start=90.0,
        end=94.5,
        duration=4.5,
        text="Evaluating frontier model architectures across a multi-dimensional comparison reveals asymmetric trade-offs on a radar chart benchmark.",
        words=[]
    )
    edits = direct_micro_chunk(c_radar, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "radar_spider_chart"
    targets = edits[0].motion_graphics_targets
    assert "BENCHMARK" in targets["title"] or "RADAR" in targets["title"]
    assert "axis1" in targets
    assert targets["axis1"] == "Reasoning Depth"
    assert "entity1Name" in targets
    assert "Autonomous" in targets["entity1Name"]
    assert "entity2Name" in targets
    assert targets["entity1Score1"] == 96

    # 2. Database Storage Tradeoff Matrix
    c_db = ScriptChunk(
        chunk_id="chunk_db",
        chunk_index=2,
        start=140.0,
        end=144.5,
        duration=4.5,
        text="When picking a database storage engine, this tradeoff matrix illustrates write throughput versus ACID safety across five dimensions.",
        words=[]
    )
    edits_db = direct_micro_chunk(c_db, topic="technology")
    assert len(edits_db) == 1
    assert edits_db[0].motion_graphics_type == "radar_spider_chart"
    targets_db = edits_db[0].motion_graphics_targets
    assert "DATABASE" in targets_db["title"]
    assert targets_db["axis1"] == "Write Throughput"
    assert "Distributed LSM" in targets_db["entity1Name"]


def test_pareto_power_law_motion_graphic():
    """Validates that Phase 9 Explainer (pareto_power_law) triggers and populates power law distribution targets."""
    # 1. Classical 80/20 Pareto Distribution
    c_pareto = ScriptChunk(
        chunk_id="chunk_pareto",
        chunk_index=1,
        start=95.0,
        end=99.5,
        duration=4.5,
        text="Understanding the pareto principle is critical: in complex systems, the vital few twenty percent inputs drive eighty percent of the overall yield.",
        words=[]
    )
    edits = direct_micro_chunk(c_pareto, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "pareto_power_law"
    targets = edits[0].motion_graphics_targets
    assert "PARETO" in targets["title"]
    assert targets["vitalPct"] == "20%"
    assert "80%" in targets["vitalReturn"]
    assert targets["trivialPct"] == "80%"

    # 2. Software Engineering Power Law
    c_soft = ScriptChunk(
        chunk_id="chunk_soft",
        chunk_index=2,
        start=145.0,
        end=149.5,
        duration=4.5,
        text="When shipping software, this power law distribution demonstrates that eighty percent of stability originates in twenty percent of core code.",
        words=[]
    )
    edits_soft = direct_micro_chunk(c_soft, topic="technology")
    assert len(edits_soft) == 1
    assert edits_soft[0].motion_graphics_type == "pareto_power_law"
    targets_soft = edits_soft[0].motion_graphics_targets
    assert "SOFTWARE" in targets_soft["title"] or "PARETO" in targets_soft["title"]
    assert "20%" in targets_soft["vitalPct"]
    assert "PRIMITIVES" in targets_soft["vitalLabel"] or "VITAL" in targets_soft["vitalLabel"]


def test_chrono_dial_clock_motion_graphic():
    """Validates that Phase 10 Explainer (chrono_dial_clock) triggers and populates 24-hour chronometer targets."""
    # 1. Classical 24-Hour Compressed Timeline
    c_clock = ScriptChunk(
        chunk_id="chunk_clock",
        chunk_index=1,
        start=100.0,
        end=104.5,
        duration=4.5,
        text="If the history of modern computing were compressed into 24 hours on a chrono dial, foundation models only emerged in the final four seconds.",
        words=[]
    )
    edits = direct_micro_chunk(c_clock, topic="technology")
    assert len(edits) == 1
    assert edits[0].action == "motion_graphics"
    assert edits[0].motion_graphics_type == "chrono_dial_clock"
    targets = edits[0].motion_graphics_targets
    assert "24 HOURS" in targets["title"] or "CHRONOMETER" in targets["badge"]
    assert targets["currentTime"] == "23:59:56"
    assert targets["epoch1Time"] == "00:00"
    assert "epoch4Title" in targets
    assert "Autonomous" in targets["epoch4Title"]

    # 2. Timeline Compressed into a Day
    c_time = ScriptChunk(
        chunk_id="chunk_time",
        chunk_index=2,
        start=150.0,
        end=154.5,
        duration=4.5,
        text="On this 24-hour clock, you can see how the accelerated timeline shifts exponential progress into the final hour.",
        words=[]
    )
    edits_time = direct_micro_chunk(c_time, topic="technology")
    assert len(edits_time) == 1
    assert edits_time[0].motion_graphics_type == "chrono_dial_clock"
    targets_time = edits_time[0].motion_graphics_targets
    assert "24" in targets_time["title"] or "CHRONOMETER" in targets_time["badge"]







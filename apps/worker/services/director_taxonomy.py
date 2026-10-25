"""
director_taxonomy.py — Visual Rhetoric Taxonomy & Intent Classification Schema.

Maps narrative speech patterns to visual Remotion motion graphic archetypes.
Powers the 2-Stage AI Director:
  Stage 1: Intent Classification (Conversational vs High-Value Concept)
  Stage 2: Entity & Prop Extraction (Mapping spoken words to Remotion props)
"""

import re
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. CORE VISUAL ARCHETYPES
# ─────────────────────────────────────────────────────────────────────────────

class VisualArchetype(str, Enum):
    """The 8 core rhetorical archetypes for cinematic motion graphics."""
    SHOWDOWN_CONTRAST = "SHOWDOWN_CONTRAST"
    CONSTRAINT_CHOKE = "CONSTRAINT_CHOKE"
    MULTI_AXIS_BENCHMARK = "MULTI_AXIS_BENCHMARK"
    ASYMMETRIC_LEVERAGE = "ASYMMETRIC_LEVERAGE"
    TEMPORAL_EPOCH = "TEMPORAL_EPOCH"
    SYSTEMIC_FEEDBACK = "SYSTEMIC_FEEDBACK"
    STRUCTURAL_ANATOMY = "STRUCTURAL_ANATOMY"
    TRILEMMA_TRADEOFF = "TRILEMMA_TRADEOFF"
    NONE = "NONE"  # Conversational, transition, or pure B-roll line


class ArchetypeSpec(BaseModel):
    """Metadata specification for a visual archetype."""
    archetype: VisualArchetype
    name: str
    description: str
    rhetorical_role: str
    primary_template: str
    secondary_templates: List[str]
    keywords: List[str]
    regex_patterns: List[str]
    required_props: Set[str]
    prop_descriptions: Dict[str, str]
    default_props: Dict[str, Any]
    example_extraction: Dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# 2. ARCHETYPE DEFINITION REGISTRY
# ─────────────────────────────────────────────────────────────────────────────

ARCHETYPE_REGISTRY: Dict[VisualArchetype, ArchetypeSpec] = {
    VisualArchetype.SHOWDOWN_CONTRAST: ArchetypeSpec(
        archetype=VisualArchetype.SHOWDOWN_CONTRAST,
        name="The Showdown & Contrast",
        description="Head-to-head comparison between two opposing paradigms, entities, strategies, or metrics.",
        rhetorical_role="Forces the viewer to choose between an obsolete standard and a superior new paradigm.",
        primary_template="showdown_duel",
        secondary_templates=["split_slider_comparison", "before_after", "battle_chart"],
        keywords=[
            "versus", "vs", "compared to", "outpaces", "outperform", "crushed them",
            "old way vs new way", "active vs passive", "monolithic vs", "legacy dev vs",
            "hedge funds vs", "index fund vs", "needle vs haystack", "chatbots versus"
        ],
        regex_patterns=[
            r"\b(vs\.?|versus|compared to|outperform(ed)?|crushed)\b",
            r"\b(old paradigm|new reality|monolith(ic)? vs|legacy vs)\b"
        ],
        required_props={"title", "side1Title", "side2Title"},
        prop_descriptions={
            "title": "Main title of the contest or comparison",
            "timeframe": "Context or duration of the match (e.g., '10-YEAR CONTEST' or 'PARADIGM SHIFT')",
            "side1Title": "Name of Entity 1 (often the incumbent / legacy option)",
            "side1Sub": "Subtitle or description of Entity 1",
            "side1Fee": "Key metric or limitation of Entity 1",
            "side2Title": "Name of Entity 2 (often the modern / winning option)",
            "side2Sub": "Subtitle or description of Entity 2",
            "side2Fee": "Key metric or advantage of Entity 2",
            "wagerAmount": "Stakes or label for the showdown",
            "synthesis": "Takeaway summary sentence"
        },
        default_props={
            "title": "PARADIGM SHOWDOWN",
            "timeframe": "OLD METHOD VS MODERN ARCHITECTURE",
            "side1Title": "LEGACY APPROACH",
            "side1Sub": "High friction • Manual toil",
            "side1Fee": "High Cost Drag",
            "side2Title": "AUTONOMOUS SYSTEM",
            "side2Sub": "Deterministic • Scalable",
            "side2Fee": "10,000x Leverage",
            "wagerAmount": "CORE COMPARISON",
            "personality": "energetic"
        },
        example_extraction={
            "title": "THE $1,000,000 CHALLENGE",
            "timeframe": "10-YEAR HISTORICAL CONTEST",
            "side1Title": "TOP 5 HEDGE FUNDS",
            "side1Sub": "Active managers & high fees",
            "side1Fee": "2% Advisory Drag",
            "side2Title": "S&P 500 INDEX",
            "side2Sub": "Passive low-cost index fund",
            "side2Fee": "0.03% Expense Ratio",
            "wagerAmount": "$1,000,000 BET"
        }
    ),

    VisualArchetype.CONSTRAINT_CHOKE: ArchetypeSpec(
        archetype=VisualArchetype.CONSTRAINT_CHOKE,
        name="The Constraint & Choke Point",
        description="Visualizing throughput constriction, memory walls, PR review drag, or systemic bottlenecks.",
        rhetorical_role="Reveals why adding more inputs or resources fails when a single critical choke point starves output.",
        primary_template="bottleneck_constriction",
        secondary_templates=["urgency_dial_gauge", "funnel_analysis"],
        keywords=[
            "bottleneck", "choke point", "choked", "constriction", "congestion",
            "memory wall", "starvation", "sluggish", "pr review drag", "merge conflicts",
            "throughput collapsed", "interconnect limit", "dropped by", "restricted"
        ],
        regex_patterns=[
            r"\b(bottleneck|choke\s*point|constriction|fatal bottleneck)\b",
            r"\b(memory wall|interconnect bandwidth|communication friction)\b"
        ],
        required_props={"title", "inputMetric", "chokeMetric", "outputMetric"},
        prop_descriptions={
            "title": "Main title of the bottleneck",
            "subtitle": "Secondary explanation of why throughput is constrained",
            "badge": "Header badge (e.g., '⚠️ CRITICAL SYSTEMIC CHOKE POINT')",
            "inputLabel": "Label for incoming resource / volume",
            "inputMetric": "Value of incoming capacity (e.g. '50 DEVELOPERS' or '1,000 TFLOPS')",
            "inputDesc": "Brief description of the input",
            "chokeLabel": "Label for the choke point mechanism",
            "chokeMetric": "Value of the choke point constraint (e.g. '4.8 DAYS' or '3.2 TB/S')",
            "chokeDesc": "Description of what causes the restriction",
            "restrictionPct": "Constriction percentage (e.g. '-88%')",
            "outputLabel": "Label for realized final throughput",
            "outputMetric": "Effective output delivered (e.g. '1.2 RELEASES / MO')",
            "outputDesc": "Description of sustained output",
            "efficiency": "Realized yield ratio (e.g. '12% YIELD')",
            "synthesis": "Architectural axiom (e.g. Amdahl's Law or Brooks' Law)"
        },
        default_props={
            "title": "SYSTEMIC THROUGHPUT BOTTLENECK",
            "subtitle": "WHY CAPACITY DEGRADES UNDER CONGESTION",
            "badge": "⚠️ THROUGHPUT CHOKE POINT",
            "inputLabel": "INCOMING CAPACITY",
            "inputMetric": "100% DEMAND",
            "inputDesc": "Unconstrained resource input",
            "chokeLabel": "CHOKE POINT",
            "chokeMetric": "CRITICAL CONSTRICTION",
            "chokeDesc": "Systemic communication or queue friction",
            "restrictionPct": "-85%",
            "outputLabel": "EFFECTIVE OUTPUT",
            "outputMetric": "15% DELIVERED",
            "outputDesc": "Constrained net throughput",
            "efficiency": "15% YIELD",
            "synthesis": "System capacity is dictated entirely by the narrowest point in the execution pipeline.",
            "personality": "technical"
        },
        example_extraction={
            "title": "50-ENGINEER DEV BOTTLENECK",
            "subtitle": "WHY LARGE TEAMS HIT COMMUNICATION DRAG",
            "badge": "⚠️ SYSTEMIC CHOKE POINT",
            "inputLabel": "ENGINEERING HEADCOUNT",
            "inputMetric": "50 DEVELOPERS",
            "chokeLabel": "PR REVIEW & SPRINT TOIL",
            "chokeMetric": "CHOKE POINT: 4.8 DAYS",
            "restrictionPct": "-88%",
            "outputLabel": "EFFECTIVE CODE SHIPPED",
            "outputMetric": "1.2 RELEASES / MO",
            "efficiency": "12% YIELD",
            "synthesis": "Brooks' Law: Adding manpower to complex software exponentially increases communication friction."
        }
    ),

    VisualArchetype.MULTI_AXIS_BENCHMARK: ArchetypeSpec(
        archetype=VisualArchetype.MULTI_AXIS_BENCHMARK,
        name="Multi-Axis Capability Benchmark",
        description="5-axis polygonal radar chart benchmarking systems across nuanced performance dimensions.",
        rhetorical_role="Demonstrates holistic superiority across multiple metrics rather than a single cherry-picked stat.",
        primary_template="radar_spider_chart",
        secondary_templates=["quadrant_matrix", "spectrum_continuum"],
        keywords=[
            "benchmark", "radar", "spider chart", "5-axis", "multi-dimensional",
            "speed vs cost", "tradeoff matrix", "frontier model benchmark", "architecture benchmark",
            "evaluated across", "performance profile"
        ],
        regex_patterns=[
            r"\b(radar|benchmark|multi-dimensional|5-axis|spider chart)\b",
            r"\b(evaluate(d)? architectures?|capabilities across)\b"
        ],
        required_props={"title", "axis1", "axis2", "axis3", "axis4", "axis5", "entity1Name", "entity2Name"},
        prop_descriptions={
            "title": "Benchmark title",
            "subtitle": "Subtitle explaining the evaluation dimensions",
            "badge": "Category badge",
            "axis1": "First evaluation dimension (e.g. 'Reasoning Depth' or 'Execution Speed')",
            "axis2": "Second evaluation dimension (e.g. 'Cost Efficiency')",
            "axis3": "Third evaluation dimension (e.g. 'Deterministic Accuracy')",
            "axis4": "Fourth evaluation dimension (e.g. 'Continuous Agency')",
            "axis5": "Fifth evaluation dimension (e.g. 'Context Memory')",
            "entity1Name": "Name of winning system (e.g. 'Autonomous Swarm')",
            "entity1Score1": "Score 0-100 for Axis 1",
            "entity1Score2": "Score 0-100 for Axis 2",
            "entity1Score3": "Score 0-100 for Axis 3",
            "entity1Score4": "Score 0-100 for Axis 4",
            "entity1Score5": "Score 0-100 for Axis 5",
            "entity2Name": "Name of baseline system (e.g. 'Monolithic Model')",
            "entity2Score1": "Baseline score for Axis 1",
            "entity2Score2": "Baseline score for Axis 2",
            "entity2Score3": "Baseline score for Axis 3",
            "entity2Score4": "Baseline score for Axis 4",
            "entity2Score5": "Baseline score for Axis 5",
            "synthesis": "Key insight from the radar analysis"
        },
        default_props={
            "title": "CAPABILITY BENCHMARK",
            "subtitle": "MULTI-DIMENSIONAL PERFORMANCE MATRIX",
            "badge": "POLYGONAL RADAR BENCHMARK",
            "axis1": "Reasoning Depth",
            "axis2": "Inference Speed",
            "axis3": "Context Coherence",
            "axis4": "Cost Efficiency",
            "axis5": "Autonomous Agency",
            "entity1Name": "Modern Autonomous Swarm",
            "entity1Score1": 96, "entity1Score2": 95, "entity1Score3": 98, "entity1Score4": 94, "entity1Score5": 92,
            "entity1Badge": "AUTONOMOUS SYSTEM",
            "entity1Color": "#00E5FF",
            "entity2Name": "Legacy Monolithic Approach",
            "entity2Score1": 45, "entity2Score2": 32, "entity2Score3": 55, "entity2Score4": 28, "entity2Score5": 50,
            "entity2Badge": "MANUAL TOIL",
            "entity2Color": "#F59E0B",
            "synthesis": "Autonomous architectures unlock 10,000x cost leverage and deterministic verification.",
            "personality": "technical"
        },
        example_extraction={
            "title": "COGNITIVE ARCHITECTURE BENCHMARK",
            "subtitle": "AUTONOMOUS AGENTS VS 50-DEV TEAM",
            "axis1": "Execution Speed",
            "axis2": "Cost Efficiency",
            "axis3": "Test Verification",
            "axis4": "24/7 Agency",
            "axis5": "Context Coherence",
            "entity1Name": "Autonomous Swarm",
            "entity1Score1": 98, "entity1Score2": 96, "entity1Score3": 99, "entity1Score4": 97, "entity1Score5": 92,
            "entity2Name": "50-Person Dev Team",
            "entity2Score1": 42, "entity2Score2": 26, "entity2Score3": 65, "entity2Score4": 30, "entity2Score5": 58
        }
    ),

    VisualArchetype.ASYMMETRIC_LEVERAGE: ArchetypeSpec(
        archetype=VisualArchetype.ASYMMETRIC_LEVERAGE,
        name="The Asymmetric Power Law",
        description="80/20 asymptotic power law distribution showing how a small subset of causes drives massive systemic yield.",
        rhetorical_role="Directs the viewer's focus away from trivial toil and toward maximum leverage primitives.",
        primary_template="pareto_power_law",
        secondary_templates=["scale_zoom_ladder", "stat_card_highlight"],
        keywords=[
            "pareto", "80/20", "power law", "asymmetric leverage", "vital few",
            "trivial many", "80 percent of", "twenty percent of", "disproportionate return",
            "ultimate leverage", "marginal returns"
        ],
        regex_patterns=[
            r"\b(80/20|pareto|power\s*law|asymmetric\s*leverage)\b",
            r"\b(eighty percent.*twenty percent|vital few|trivial many)\b"
        ],
        required_props={"title", "vitalPct", "vitalLabel", "vitalReturn"},
        prop_descriptions={
            "title": "Title of the power law distribution",
            "subtitle": "Subtitle describing the leverage dynamic",
            "badge": "Header badge",
            "vitalPct": "Percentage of high-yield inputs (typically '20%')",
            "vitalLabel": "Label for the high-yield cohort (e.g. 'SYSTEM ARCHITECTS')",
            "vitalDesc": "Description of high-leverage activities",
            "vitalReturn": "Output produced by the vital few (typically '80% SYSTEM IMPACT')",
            "vitalColor": "Accent color for vital few",
            "trivialPct": "Percentage of low-yield inputs (typically '80%')",
            "trivialLabel": "Label for the long tail (e.g. 'MANUAL SYNTAX TOIL')",
            "trivialDesc": "Description of low-leverage repetitive activities",
            "trivialReturn": "Residual output from long tail (typically '20% RESIDUAL VALUE')",
            "synthesis": "Actionable takeaway on systemic leverage"
        },
        default_props={
            "title": "THE PARETO PRINCIPLE",
            "subtitle": "80/20 POWER LAW: ASYMMETRIC SYSTEMIC LEVERAGE",
            "badge": "POWER LAW DYNAMICS",
            "vitalPct": "20%",
            "vitalLabel": "THE VITAL FEW",
            "vitalDesc": "Core architectural primitives, automation harnesses & foundational models",
            "vitalReturn": "80% SYSTEM IMPACT",
            "vitalColor": "#00E5FF",
            "trivialPct": "80%",
            "trivialLabel": "THE TRIVIAL MANY",
            "trivialDesc": "Repetitive configuration toil, syntax boilerplate & manual triage",
            "trivialReturn": "20% RESIDUAL VALUE",
            "trivialColor": "#F59E0B",
            "synthesis": "In nonlinear systems, 80% of systemic yield is driven by 20% of critical architectural primitives.",
            "personality": "technical"
        },
        example_extraction={
            "title": "THE CODE LEVERAGE PRINCIPLE",
            "subtitle": "80/20 POWER LAW: ARCHITECTURE VS SYNTAX",
            "vitalPct": "20%",
            "vitalLabel": "SYSTEM ARCHITECTS",
            "vitalDesc": "Agent harness, deterministic test gates & data pipeline primitives",
            "vitalReturn": "80% ENTERPRISE OUTPUT",
            "trivialPct": "80%",
            "trivialLabel": "MANUAL SYNTAX TOIL",
            "trivialDesc": "Boilerplate code, manual PR queues & endless sprint updates",
            "trivialReturn": "20% RESIDUAL VALUE"
        }
    ),

    VisualArchetype.TEMPORAL_EPOCH: ArchetypeSpec(
        archetype=VisualArchetype.TEMPORAL_EPOCH,
        name="The 24-Hour Chronometer / Evolution",
        description="Compresses decades or centuries of technological, economic, or psychological history into intuitive timeframes.",
        rhetorical_role="Creates exponential urgency by showing how recent and disruptive the current era is compared to past history.",
        primary_template="chrono_dial_clock",
        secondary_templates=["timeline_roadmap", "step_sequence"],
        keywords=[
            "24-hour clock", "24 hour clock", "history were a clock", "final four seconds",
            "final seconds", "compressed into", "decades of history", "from 1950 to",
            "evolution over", "chronometer", "eras of computing", "epoch"
        ],
        regex_patterns=[
            r"\b(24-?hour clock|chronometer|final (few|four) seconds)\b",
            r"\b(history.*compressed into|evolution over (decades|years))\b"
        ],
        required_props={"title", "epoch1Title", "epoch2Title", "epoch3Title", "epoch4Title"},
        prop_descriptions={
            "title": "Chronometer title",
            "subtitle": "Subtitle explaining time scale compression",
            "badge": "Header badge",
            "timeframe": "Overall real-world span (e.g. '1950 — 2026 (76 Years)')",
            "currentTime": "Current dial clock time (e.g. '23:59:56')",
            "epoch1Time": "Clock time for Epoch 1 (e.g. '00:00')",
            "epoch1Title": "Title of Epoch 1",
            "epoch1Desc": "Historical description of Epoch 1",
            "epoch2Time": "Clock time for Epoch 2 (e.g. '18:00')",
            "epoch2Title": "Title of Epoch 2",
            "epoch2Desc": "Historical description of Epoch 2",
            "epoch3Time": "Clock time for Epoch 3 (e.g. '22:30')",
            "epoch3Title": "Title of Epoch 3",
            "epoch3Desc": "Historical description of Epoch 3",
            "epoch4Time": "Clock time for Epoch 4 (e.g. '23:59:56')",
            "epoch4Title": "Title of Epoch 4 (The Current Disruption)",
            "epoch4Desc": "Description of modern exponential phase",
            "synthesis": "Urgency takeaway (e.g. emergence in final 4 seconds)"
        },
        default_props={
            "title": "AI HISTORY IN 24 HOURS",
            "subtitle": "76 YEARS OF COMPUTING COMPRESSED INTO A SINGLE 24-HOUR DAY",
            "badge": "24-HOUR CHRONOMETER",
            "timeframe": "1950 — 2026 (76 Years)",
            "currentTime": "23:59:56",
            "epoch1Time": "00:00",
            "epoch1Title": "Turing Test & Symbolic Logic",
            "epoch1Desc": "1950: Vacuum tubes, punch cards and initial symbolic reasoning.",
            "epoch1Badge": "GENESIS // T=0h",
            "epoch2Time": "18:00",
            "epoch2Title": "Personal Computer & Internet",
            "epoch2Desc": "1995: PC revolution and distributed network protocols.",
            "epoch2Badge": "NETWORK // T=18h",
            "epoch3Time": "22:30",
            "epoch3Title": "Cloud & Transformer Revolution",
            "epoch3Desc": "2017: Attention Is All You Need and massive cloud compute clusters.",
            "epoch3Badge": "TRANSFORMER // T=22.5h",
            "epoch4Time": "23:59:56",
            "epoch4Title": "Autonomous Reasoning Swarms",
            "epoch4Desc": "2026: Multi-agent self-healing cognitive swarms emerge in final 4s.",
            "epoch4Badge": "EXPONENTIAL // T=23.99h",
            "accentColor": "#00E5FF",
            "activeColor": "#10B981",
            "synthesis": "If computing history were a 24-hour day, autonomous swarms only emerged in the final four seconds.",
            "personality": "technical"
        },
        example_extraction={
            "title": "COMPUTING HISTORY IN 24 HOURS",
            "subtitle": "76 YEARS COMPRESSED INTO A SINGLE DAY",
            "epoch1Title": "Turing & Mainframes",
            "epoch2Title": "Personal Computers & Web",
            "epoch3Title": "Cloud & Mobile Era",
            "epoch4Title": "Autonomous Swarms"
        }
    ),

    VisualArchetype.SYSTEMIC_FEEDBACK: ArchetypeSpec(
        archetype=VisualArchetype.SYSTEMIC_FEEDBACK,
        name="The Feedback Loop & Flywheel",
        description="Reinforcing or balancing circular causal diagram showing self-amplifying effects and compounding drift.",
        rhetorical_role="Illustrates why small triggers snowball into massive second-order and third-order consequences.",
        primary_template="causal_loop",
        secondary_templates=["wealth_flywheel", "compound_growth_curve", "compound_formula"],
        keywords=[
            "feedback loop", "reinforcing loop", "vicious cycle", "virtuous cycle",
            "flywheel", "cascading", "second-order", "compounding drift",
            "self-amplifying", "snowball effect"
        ],
        regex_patterns=[
            r"\b(feedback\s*loop|reinforcing|vicious\s*cycle|virtuous\s*cycle|flywheel)\b",
            r"\b(snowball\s*effect|cascading\s*consequences?)\b"
        ],
        required_props={"title", "node1Title", "node2Title", "node3Title", "node4Title"},
        prop_descriptions={
            "title": "Loop title",
            "subtitle": "Subtitle describing the mechanism",
            "badge": "Badge (e.g. '🔄 REINFORCING FLYWHEEL (+)')",
            "loopType": "Type of loop ('reinforcing' or 'balancing')",
            "centerLabel": "Center graphic label",
            "centerSub": "Center subtitle",
            "node1Title": "Title of Step 1 (Trigger Cause)",
            "node2Title": "Title of Step 2 (Amplification)",
            "node3Title": "Title of Step 3 (Secondary Shock)",
            "node4Title": "Title of Step 4 (Feedback Closure)",
            "synthesis": "System dynamics takeaway"
        },
        default_props={
            "title": "SYSTEMIC REINFORCING FLYWHEEL",
            "subtitle": "HOW INITIAL ACTIONS TRIGGER SELF-AMPLIFYING COMPOUNDING CYCLES",
            "badge": "🔄 REINFORCING FLYWHEEL (+)",
            "loopType": "reinforcing",
            "centerLabel": "REINFORCING LOOP",
            "centerSub": "COMPOUNDING DRIFT",
            "node1Title": "Trigger Stimulus",
            "node1Desc": "Initial intervention accelerates system velocity.",
            "node1Badge": "TRIGGER CAUSE",
            "node2Title": "Asset Appreciation",
            "node2Desc": "Expanded liquidity inflates valuations across the market.",
            "node2Badge": "AMPLIFICATION",
            "node3Title": "Secondary Feedback",
            "node3Desc": "Higher yields attract aggressive external capital.",
            "node3Badge": "SECONDARY SHOCK",
            "node4Title": "Loop Closure",
            "node4Desc": "Compounded momentum re-triggers initial growth catalysts.",
            "node4Badge": "FEEDBACK CLOSURE",
            "synthesis": "Each phase intensifies the subsequent shock, locking the system into an accelerating trajectory.",
            "personality": "technical"
        },
        example_extraction={
            "title": "THE AUTONOMOUS COMPOUNDING LOOP",
            "subtitle": "HOW SELF-HEALING REASONING SWARMS EVOLVE",
            "node1Title": "Prompt Hypothesis",
            "node2Title": "Deterministic Test Execution",
            "node3Title": "Stack Trace Inspection",
            "node4Title": "Automated Syntax Patch"
        }
    ),

    VisualArchetype.STRUCTURAL_ANATOMY: ArchetypeSpec(
        archetype=VisualArchetype.STRUCTURAL_ANATOMY,
        name="The Layer Stack & Pipeline",
        description="Isometric 4-layer stacked anatomy or modular pipeline flow detailing system components from substrate to runtime.",
        rhetorical_role="Demystifies complex black-box architectures by breaking them down into clean, visible tiers.",
        primary_template="exploded_layer_stack",
        secondary_templates=["architecture_pipeline", "hierarchy_pyramid"],
        keywords=[
            "layer stack", "architecture stack", "agent stack", "tech stack", "software stack",
            "four tiers", "hardware substrate", "context window routing", "pipeline flow",
            "anatomy of the system", "infrastructure layers", "exploded stack"
        ],
        regex_patterns=[
            r"\b(layer\s*stack|anatomy\s*of\s*the\s*system|architecture\s*stack|pipeline\s*flow|agent\s*stack)\b",
            r"\b(infrastructure\s*layers?|four\s*tiers?|exploded\s*stack)\b"
        ],
        required_props={"title", "layer1Title", "layer2Title", "layer3Title", "layer4Title"},
        prop_descriptions={
            "title": "Stack title",
            "subtitle": "Subtitle describing the tiers",
            "badge": "Header badge",
            "layer1Title": "Tier 1: Foundational Substrate (Bottom)",
            "layer1Desc": "Description of substrate layer",
            "layer1Badge": "Badge for Tier 1",
            "layer2Title": "Tier 2: Latent Core / Data Routing",
            "layer2Desc": "Description of routing layer",
            "layer2Badge": "Badge for Tier 2",
            "layer3Title": "Tier 3: Epistemic State / Memory",
            "layer3Desc": "Description of memory layer",
            "layer3Badge": "Badge for Tier 3",
            "layer4Title": "Tier 4: Runtime / Execution (Top)",
            "layer4Desc": "Description of top application tier",
            "layer4Badge": "Badge for Tier 4",
            "synthesis": "Architectural hierarchy takeaway"
        },
        default_props={
            "title": "THE AUTONOMOUS AGENT STACK",
            "subtitle": "ISOMETRIC MULTI-TIER EXECUTION PIPELINE",
            "badge": "ISOMETRIC SYSTEM ARCHITECTURE",
            "layer1Title": "Foundational Neural Weights",
            "layer1Desc": "Quantized FP8 parameter clusters bound to ultra-dense memory bandwidth.",
            "layer1Badge": "HARDWARE SUBSTRATE",
            "layer2Title": "Context Window Routing",
            "layer2Desc": "Attention routing, KV-cache compression, and speculative token draft verification.",
            "layer2Badge": "NEURAL CORE",
            "layer3Title": "Long-Term Graph Memory",
            "layer3Desc": "Hierarchical vector indexing and real-time knowledge graph traversal.",
            "layer3Badge": "EPISTEMIC STATE",
            "layer4Title": "Autonomous Tool Execution",
            "layer4Desc": "Sandboxed agent synthesis, deterministic code interpreter, and external API invocation.",
            "layer4Badge": "COGNITIVE RUNTIME",
            "synthesis": "Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below.",
            "personality": "technical"
        },
        example_extraction={
            "title": "THE MODERN AI STACK",
            "subtitle": "4-TIER COMPUTATIONAL ENGINE",
            "layer1Title": "Silicon & HBM Bandwidth",
            "layer2Title": "Base Foundation Weights",
            "layer3Title": "Context & RAG Knowledge",
            "layer4Title": "Autonomous Agent Swarms"
        }
    ),

    VisualArchetype.TRILEMMA_TRADEOFF: ArchetypeSpec(
        archetype=VisualArchetype.TRILEMMA_TRADEOFF,
        name="The Trilemma & Trade-Off Law",
        description="Triangular trade-off theorem demonstrating that optimizing two vertices inevitably sacrifices the third.",
        rhetorical_role="Educates the viewer on real-world engineering constraints where no free lunch exists.",
        primary_template="trilemma_tradeoff",
        secondary_templates=["decision_tree_fork", "pros_cons_comparison"],
        keywords=[
            "trilemma", "trade-off", "tradeoff", "impossible triangle", "pick two",
            "you can only pick two", "sacrificed", "irreversible tradeoff", "blockchain trilemma"
        ],
        regex_patterns=[
            r"\b(trilemma|impossible\s*triangle|pick\s*two|trade-?off\s*theorem)\b",
            r"\b(sacrific(e|ed|ing)\b.*(third|vertex|throughput))\b"
        ],
        required_props={"title", "vertex1Title", "vertex2Title", "vertex3Title", "sacrificedVertex"},
        prop_descriptions={
            "title": "Trilemma title",
            "subtitle": "Subtitle stating the tradeoff law",
            "badge": "Category badge",
            "axiom": "The inviolable rule or theorem",
            "vertex1Title": "Vertex 1 Title (Preserved)",
            "vertex1Desc": "Description of Vertex 1",
            "vertex2Title": "Vertex 2 Title (Preserved)",
            "vertex2Desc": "Description of Vertex 2",
            "vertex3Title": "Vertex 3 Title (Sacrificed)",
            "vertex3Desc": "Description of sacrificed dimension",
            "sacrificedVertex": "Which vertex number is sacrificed (1, 2, or 3)",
            "synthesis": "Takeaway summary on the tradeoff"
        },
        default_props={
            "title": "THE ARCHITECTURAL TRILEMMA",
            "subtitle": "YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED.",
            "badge": "ARCHITECTURAL TRADE-OFF THEOREM",
            "axiom": "Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity.",
            "vertex1Title": "Decentralization",
            "vertex1Desc": "Distributed nodes worldwide with zero central point of failure",
            "vertex1Metric": "100% PRESERVED",
            "vertex2Title": "Security",
            "vertex2Desc": "Cryptographic consensus protecting state history against attack",
            "vertex2Metric": "100% PRESERVED",
            "vertex3Title": "Scalability",
            "vertex3Desc": "Transaction throughput and low-latency settlement speed",
            "vertex3Metric": "15 TPS (SACRIFICED)",
            "sacrificedVertex": 3,
            "accentColor": "#00E5FF",
            "activeColor": "#10B981",
            "sacrificedColor": "#F43F5E",
            "synthesis": "Every distributed system must explicitly choose which fundamental constraint to sacrifice.",
            "personality": "technical"
        },
        example_extraction={
            "title": "THE SOFTWARE TRILEMMA",
            "subtitle": "SPEED VS QUALITY VS COST",
            "vertex1Title": "Development Speed",
            "vertex2Title": "Code Quality",
            "vertex3Title": "Low Cost",
            "sacrificedVertex": 3
        }
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# 3. FAST HEURISTIC CLASSIFIER (0ms Offline Mode)
# ─────────────────────────────────────────────────────────────────────────────

def classify_chunk_by_heuristics(chunk_text: str) -> Tuple[VisualArchetype, float, Optional[str]]:
    """
    Evaluates a chunk against regex patterns and keyword dictionaries.
    Returns:
        (VisualArchetype, confidence_score: 0.0 - 1.0, matched_keyword_or_pattern)
    """
    clean_text = chunk_text.lower().strip()
    
    # Check conversational / filler patterns first
    filler_patterns = [
        r"^(let that sink in|why\??|think about it|here is the truth|look closer|listen carefully)\.?$",
        r"^(ever wonder why|what happens next\??|let's dive in|the answer is simple)\.?$"
    ]
    for fp in filler_patterns:
        if re.search(fp, clean_text):
            return VisualArchetype.NONE, 0.95, "conversational_filler"

    best_archetype = VisualArchetype.NONE
    highest_score = 0.0
    best_match_info = None

    for archetype, spec in ARCHETYPE_REGISTRY.items():
        # 1. Regex check (High confidence)
        for pattern in spec.regex_patterns:
            if re.search(pattern, clean_text, re.IGNORECASE):
                return archetype, 0.92, f"regex:{pattern}"

        # 2. Keyword exact match
        for kw in spec.keywords:
            if kw in clean_text:
                score = 0.85
                if score > highest_score:
                    highest_score = score
                    best_archetype = archetype
                    best_match_info = f"keyword:{kw}"

    if highest_score >= 0.70:
        return best_archetype, highest_score, best_match_info

    return VisualArchetype.NONE, 0.20, None


# ─────────────────────────────────────────────────────────────────────────────
# 4. LLM PROMPT BUILDERS (Stage 1 & Stage 2)
# ─────────────────────────────────────────────────────────────────────────────

def build_classification_system_prompt() -> str:
    """Builds the comprehensive visual director system prompt for Stage 1."""
    archetype_summaries = []
    for arch, spec in ARCHETYPE_REGISTRY.items():
        archetype_summaries.append(
            f"- **{arch.value}** ({spec.name}): {spec.description}\n"
            f"  *Triggers*: {', '.join(spec.keywords[:6])}..."
        )
    archetypes_block = "\n".join(archetype_summaries)

    return f"""You are the Executive AI Video Director for high-retention cinematic explainer videos and reels.
Your mission is to analyze spoken script sentences and decide whether a sentence warrants a specialized Remotion Motion Graphic card or should remain as cinematic B-roll footage.

### The 8 Visual Archetypes:
{archetypes_block}
- **NONE**: Conversational filler, rhetorical questions ("Why?", "Let that sink in"), story transitions, or generic human moments. MUST use B-roll.

### Golden Director Rules:
1. Pacing Budget: Only 3 to 4 motion graphics are allowed in a 60-second video. Be selective. Only promote beats that convey heavy metrics, tradeoffs, or mental models.
2. Never assign a motion graphic to conversational lines.
3. Output strictly valid JSON conforming to the requested schema.
"""


def build_classification_user_prompt(
    chunk_text: str,
    context_before: str = "",
    context_after: str = "",
    niche: str = "tech"
) -> str:
    """Builds the user prompt for Stage 1 chunk classification."""
    return f"""Niche: {niche}
Surrounding Context:
{f"Previous: {context_before}" if context_before else ""}
Current Sentence: "{chunk_text}"
{f"Next: {context_after}" if context_after else ""}

Analyze the Current Sentence. Decide if it warrants an Explainer Motion Graphic card.
Respond with JSON:
{{
  "is_significant": boolean,
  "confidence": float (0.0 to 1.0),
  "archetype": "SHOWDOWN_CONTRAST" | "CONSTRAINT_CHOKE" | "MULTI_AXIS_BENCHMARK" | "ASYMMETRIC_LEVERAGE" | "TEMPORAL_EPOCH" | "SYSTEMIC_FEEDBACK" | "STRUCTURAL_ANATOMY" | "TRILEMMA_TRADEOFF" | "NONE",
  "reason": "Brief 1-sentence reason for this decision"
}}
"""


def build_prop_extraction_prompt(
    chunk_text: str,
    archetype: VisualArchetype,
    niche: str = "tech"
) -> str:
    """Builds the user prompt for Stage 2 dynamic prop extraction."""
    spec = ARCHETYPE_REGISTRY.get(archetype)
    if not spec:
        raise ValueError(f"Unknown archetype: {archetype}")

    prop_fields_doc = []
    for prop_name, prop_desc in spec.prop_descriptions.items():
        prop_fields_doc.append(f'  "{prop_name}": "{prop_desc}"')
    props_str = ",\n".join(prop_fields_doc)

    return f"""You are extracting visual motion graphic parameters from the spoken text.
Template ID: "{spec.primary_template}"
Archetype: "{archetype.value}" ({spec.name})
Spoken Text: "{chunk_text}"
Niche: {niche}

Extract the exact text, numbers, and labels from the spoken text to fill the template props.
Required Props Schema:
{{
{props_str}
}}

Rules:
1. Extract REAL numbers, metrics, and entity names mentioned in the text.
2. Keep labels and titles concise, high-impact, and UPPERCASE where appropriate.
3. Output strictly valid JSON with the exact prop keys.
"""


# ─────────────────────────────────────────────────────────────────────────────
# 5. SANITIZATION & FALLBACK ENFORCER
# ─────────────────────────────────────────────────────────────────────────────

def sanitize_and_fill_defaults(
    template_name: str,
    extracted_props: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Ensures all required and expected keys exist for a template.
    If the LLM missed any keys, fills them with archetype defaults.
    """
    clean_template = template_name.replace("-", "_").lower()
    
    # Locate matching archetype spec
    spec = None
    for s in ARCHETYPE_REGISTRY.values():
        if (s.primary_template.replace("-", "_") == clean_template or 
            any(sec.replace("-", "_") == clean_template for sec in s.secondary_templates)):
            spec = s
            break

    props = dict(extracted_props or {})

    if spec:
        # Fill missing required keys from default props
        for k, v in spec.default_props.items():
            if k not in props or props[k] is None or str(props[k]).strip() == "":
                props[k] = v

    return props

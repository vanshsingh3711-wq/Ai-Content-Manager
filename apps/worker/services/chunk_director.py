"""
Chunk Director — Micro-Scene Decision Engine.

Directs individual 1-2 sentence script chunks (3.0s - 5.5s) with high precision:
1. Selects targeted Remotion motion graphic templates when data, metrics, comparisons,
   processes, or code are spoken.
2. Generates laser-focused B-roll search queries directly derived from the chunk's words.
3. Produces standard EditDecision objects adhering to the EDL contract.
"""

import os
import re
import json
from typing import Any, Dict, List, Optional, Tuple
from services.ai_director import EditDecision, EditList
from services.script_chunker import ScriptChunk
from services.director_taxonomy import (
    VisualArchetype,
    ARCHETYPE_REGISTRY,
    classify_chunk_by_heuristics,
    build_classification_system_prompt,
    build_classification_user_prompt,
    build_prop_extraction_prompt,
    sanitize_and_fill_defaults,
)

# High-frequency keywords mapped to specialized visual templates with strict context gating
TEMPLATE_MAPPINGS = [
    # Metrics & Cost Collapses
    {
        "keywords": [
            "10,000 times", "10,000x", "collapsing by 10,000",
            "marginal cost of cognitive reasoning", "cost of cognitive reasoning",
            "cost of reasoning is collapsing", "multiplier", "plummet"
        ],
        "template": "metric_reveal",
        "default_targets": {"label": "COST OF REASONING", "metric": "10,000x", "delta": "-99.9% Collapse"},
        "personality": "energetic"
    },
    # Edge Speed & Stat Highlight
    {
        "keywords": [
            "over 100 tokens", "100 tokens per second", "tokens per second",
            "70% boilerplate", "70%", "zero cloud inference fees"
        ],
        "template": "stat_card_highlight",
        "default_targets": {"label": "EDGE REASONING SPEED", "stat": ">100 Tokens/Sec", "delta": "0ms Cloud Latency • Local Silicon"},
        "personality": "technical"
    },
    # Showdown / Head-to-Head Architectural Comparison (Strict: Genuine comparisons only)
    {
        "keywords": [
            "monolithic models failing", "monolithic chatbots failing", "monolithic failing",
            "monolithic vs", "monolith vs", "failing to deliver enterprise autonomy",
            "architectural showdown", "chatbots versus", "chatbot vs", "versus swarms",
            "chatbots versus swarms"
        ],
        "template": "showdown_duel",
        "default_targets": {
            "title": "ARCHITECTURAL SHOWDOWN",
            "side1Title": "MONOLITHIC CHATBOT",
            "side1Sub": "Single Forward Pass • Static Output",
            "side1Fee": "High Hallucination",
            "side2Title": "AUTONOMOUS SWARM",
            "side2Sub": "Recursive Loop • Self-Healing",
            "side2Fee": "Deterministic Execution",
            "wagerAmount": "REASONING COMPARISON",
            "timeframe": "MONOLITH VS SWARM"
        },
        "personality": "energetic"
    },
    # Closed Feedback Process Flow (Reasoning Loop)
    {
        "keywords": [
            "closed feedback cycle", "perception: ingesting", "recursive reasoning: formulating",
            "feedback cycle, perception", "feedback cycle: perception"
        ],
        "template": "step_sequence",
        "default_targets": {
            "title": "AUTONOMOUS REASONING LOOP",
            "step1": "1. Perception & System State",
            "step2": "2. Recursive Reasoning",
            "step3": "3. Tool Invocation",
            "step4": "4. Deterministic Verification"
        },
        "personality": "technical"
    },
    # Scaling Paradigm Split Comparison (50-Person vs Solo Founder)
    {
        "keywords": [
            "50-person enterprise", "fifty-person enterprise", "50-person", "100-person",
            "armies of junior engineers", "solo technical founder", "solo founder outpaces",
            "solo founder directing", "solo founder orchestrating", "solo founder",
            "sprint bloat and ticket queues"
        ],
        "template": "split_slider_comparison",
        "default_targets": {
            "title": "SCALING PARADIGM",
            "badge": "⚡ TRANSFORMATION",
            "leftTag": "LEGACY DEV TEAM",
            "leftTitle": "50-Person Enterprise",
            "leftMetric": "50 ENGINEERS",
            "leftDetail": "Sprint bloat, ticket queues",
            "leftIcon": "🏢",
            "rightTag": "AUTONOMOUS SWARM",
            "rightTitle": "Solo Technical Founder",
            "rightMetric": "1 FOUNDER",
            "rightDetail": "24/7 autonomous agents deploying software",
            "rightIcon": "⚡",
            "sliderStart": 70,
            "sliderEnd": 50,
            "synthesis": "Autonomous swarms compress 50-person output to a single founder."
        },
        "personality": "premium"
    },
    # Stepped Playbooks, Action Checklists & Todo Lists on Black Canvas
    {
        "keywords": [
            "winning playbook", "playbook is simple", "first, automate the diagnostic",
            "first: automate the diagnostic", "diagnostic friction audits", "diagnostic audits",
            "todo list", "checklist", "three steps", "four steps", "core directives",
            "execution checklist", "playbook"
        ],
        "template": "todo_list",
        "default_targets": {
            "title": "SYSTEMS ARCHITECT PLAYBOOK",
            "badge": "📋 EXECUTION CHECKLIST",
            "format": "todo",
            "point1": "Automate Diagnostic Friction Audits",
            "point2": "Deploy Scoped Autonomous Agents",
            "point3": "Anchor to Deterministic Verification Gates",
        },
        "personality": "technical"
    },
    # System Architecture, Data Flow & Ingestion Pipelines (Phase 1 Explainer)
    {
        "keywords": [
            "system architecture", "data pipeline", "ingestion pipeline", "architecture pipeline",
            "data flow", "system flow", "end to end pipeline", "end-to-end pipeline",
            "how the system works", "data processing pipeline", "microservices architecture",
            "pipeline flow", "reasoning architecture", "retrieval pipeline"
        ],
        "template": "architecture_pipeline",
        "default_targets": {
            "title": "AUTONOMOUS REASONING ARCHITECTURE",
            "subtitle": "END-TO-END DATA FLOW & VERIFICATION ENGINE",
            "badge": "⚡ SYSTEM TOPOLOGY",
            "stage1Title": "Multimodal Telemetry",
            "stage1Desc": "Parallel ingestion of streaming logs, user signals, and system metrics.",
            "stage1Badge": "INGEST",
            "stage1Metric": "100K EVT/S",
            "stage2Title": "Vector Knowledge Core",
            "stage2Desc": "Dense hybrid retrieval anchoring contextual relevance with sub-millisecond lookups.",
            "stage2Badge": "EMBED & RAG",
            "stage2Metric": "4.2ms LATENCY",
            "stage3Title": "Recursive Agent Loop",
            "stage3Desc": "Autonomous multi-hop hypothesis testing and self-correcting tool execution.",
            "stage3Badge": "REASONING",
            "stage3Metric": "99.4% RELIABILITY",
            "stage4Title": "Deterministic Gate",
            "stage4Desc": "Zero-regression assertion barrier validating compliance prior to production release.",
            "stage4Badge": "VERIFY",
            "stage4Metric": "100% AUDIT PASS",
        },
        "personality": "technical"
    },
    # Causal Domino Cycles & Feedback Loops (Phase 2 Explainer)
    {
        "keywords": [
            "feedback loop", "vicious cycle", "death spiral", "flywheel", "cascading failure",
            "domino effect", "chain reaction", "reinforcing loop", "vicious spiral",
            "causal loop", "second order consequences", "second-order consequences",
            "cascading consequences", "compounding feedback"
        ],
        "template": "causal_loop",
        "default_targets": {
            "title": "THE SYSTEMIC FEEDBACK LOOP",
            "subtitle": "HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES",
            "badge": "🔄 REINFORCING FLYWHEEL (+)",
            "loopType": "reinforcing",
            "centerLabel": "REINFORCING LOOP",
            "centerSub": "COMPOUNDING DRIFT",
            "synthesis": "Each phase intensifies the subsequent shock, locking the architecture into an accelerating trajectory.",
            "node1Title": "Aggressive Capital Injection",
            "node1Desc": "Unprecedented stimulus liquidity floods market sectors.",
            "node1Badge": "TRIGGER CAUSE",
            "node1Metric": "+$5.2T EXPANSION",
            "node2Title": "Asset Price Inflation",
            "node2Desc": "Equities and real estate valuations decouple from fundamentals.",
            "node2Badge": "AMPLIFICATION",
            "node2Metric": "+48% RUN-UP",
            "node3Title": "Aggressive Rate Hikes",
            "node3Desc": "Central banks overtighten into overleveraged balance sheets.",
            "node3Badge": "SECONDARY SHOCK",
            "node3Metric": "+525 BPS SURGE",
            "node4Title": "Cascading Liquidity Crunch",
            "node4Desc": "Forced deleveraging triggers emergency bailout demands.",
            "node4Badge": "FEEDBACK CLOSURE",
            "node4Metric": "CYCLE RE-IGNITED",
        },
        "personality": "technical"
    },
    # Exploded Isometric Strata & Tech Stacks (Phase 3 Explainer)
    {
        "keywords": [
            "autonomous agent stack", "agent stack", "architecture stack", "tech stack",
            "technology stack", "software stack", "compute stack architecture",
            "infrastructure stack", "layers of the stack", "layer stack", "four layers",
            "operational layers", "distinct layers", "isometric stack", "exploded view",
            "deconstructed stack", "multi-layer architecture", "foundation layer",
            "protocol layer", "strata", "anatomy of the system"
        ],
        "template": "exploded_layer_stack",
        "default_targets": {
            "title": "THE AUTONOMOUS AGENT STACK",
            "subtitle": "DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE",
            "badge": "ISOMETRIC SYSTEM ARCHITECTURE",
            "synthesis": "Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below.",
            "layer1Title": "Foundational Neural Weights",
            "layer1Desc": "Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth.",
            "layer1Badge": "HARDWARE SUBSTRATE",
            "layer1Metric": "4.8 TB/S BANDWIDTH",
            "layer2Title": "Context Window Orchestration",
            "layer2Desc": "Attention routing, KV-cache compression, and speculative token draft verification.",
            "layer2Badge": "NEURAL LATENT CORE",
            "layer2Metric": "128K TOKENS / SEC",
            "layer3Title": "Long-Term Memory & Graph RAG",
            "layer3Desc": "Hierarchical vector indexing and real-time knowledge graph traversal.",
            "layer3Badge": "EPISTEMIC STATE",
            "layer3Metric": "1.2M EMBEDDINGS",
            "layer4Title": "Autonomous Tool Execution",
            "layer4Desc": "Sandboxed agent synthesis, deterministic code interpreter, and external API invocation.",
            "layer4Badge": "COGNITIVE RUNTIME",
            "layer4Metric": "< 150ms LATENCY",
        },
        "personality": "technical"
    },
    # Bottleneck Constriction & Choke Points (Phase 4 Explainer)
    {
        "keywords": [
            "bottleneck", "choke point", "chokepoint", "memory wall", "bandwidth bottleneck",
            "throughput limit", "gpu starvation", "starvation", "throttled", "constriction",
            "congestion wall", "rate limit wall", "interconnect bottleneck", "bus bottleneck"
        ],
        "template": "bottleneck_constriction",
        "default_targets": {
            "title": "THE COMPUTE MEMORY WALL",
            "subtitle": "WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH",
            "badge": "THROUGHPUT CAPACITY FUNNEL",
            "inputLabel": "INCOMING CAPACITY",
            "inputMetric": "1,000 TFLOPS",
            "inputDesc": "Peak GPU arithmetic core saturation",
            "chokeLabel": "HBM INTERCONNECT BANDWIDTH",
            "chokeMetric": "CHOKE POINT: 3.2 TB/S",
            "chokeDesc": "Off-chip pin density & memory bus limit",
            "restrictionPct": "-98.8%",
            "outputLabel": "EFFECTIVE OUTPUT",
            "outputMetric": "12 TFLOPS",
            "outputDesc": "Sustained throughput under starvation",
            "efficiency": "1.2% YIELD",
            "synthesis": "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units.",
        },
        "personality": "technical"
    },
    # Trilemma & Three-Way Trade-off Theorems (Phase 5 Explainer)
    {
        "keywords": [
            "trilemma", "blockchain trilemma", "impossible triangle", "trade-off triangle",
            "tradeoff triangle", "pick two", "choose two", "compromise between three",
            "cap theorem", "three-way trade-off", "three-way tradeoff"
        ],
        "template": "trilemma_tradeoff",
        "default_targets": {
            "title": "THE BLOCKCHAIN TRILEMMA",
            "subtitle": "YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED.",
            "badge": "ARCHITECTURAL TRADE-OFF THEOREM",
            "axiom": "Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity.",
            "vertex1Title": "Decentralization",
            "vertex1Desc": "Distributed nodes worldwide with zero central point of failure",
            "vertex1Metric": "100% PRESERVED",
            "vertex2Title": "Security",
            "vertex2Desc": "Cryptographic proof-of-work consensus protecting state history",
            "vertex2Metric": "100% PRESERVED",
            "vertex3Title": "Scalability",
            "vertex3Desc": "High transaction throughput and low latency confirmation",
            "vertex3Metric": "15 TPS (SACRIFICED)",
            "sacrificedVertex": 3,
        },
        "personality": "technical"
    },
    # Scale & Magnitude Zoom Ladder (Phase 6 Explainer)
    {
        "keywords": [
            "scale zoom", "orders of magnitude", "magnitude ladder", "millions vs billions",
            "million vs billion", "exponential scale", "the difference between a million",
            "difference between a million and a billion", "unfathomable scale", "orders of scale", "zoom ladder"
        ],
        "template": "scale_zoom_ladder",
        "default_targets": {
            "title": "THE ILLUSION OF SCALE",
            "subtitle": "HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION",
            "badge": "EXPONENTIAL MAGNITUDE LADDER",
            "synthesis": "The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale.",
            "step1Value": "$1 MILLION",
            "step1Label": "11.5 DAYS",
            "step1Desc": "1 Million seconds elapsed in real time",
            "step1Metric": "1x (BASE UNIT)",
            "step2Value": "$1 BILLION",
            "step2Label": "31.7 YEARS",
            "step2Desc": "1 Billion seconds elapsed (entire career)",
            "step2Metric": "1,000x MULTIPLIER",
            "step3Value": "$1 TRILLION",
            "step3Label": "31,700 YEARS",
            "step3Desc": "1 Trillion seconds (before recorded civilization)",
            "step3Metric": "1,000,000x MONOLITH",
        },
        "personality": "technical"
    },
    # Decision Tree Fork & Dialectical Branches (Phase 7 Explainer)
    {
        "keywords": [
            "decision tree", "decision fork", "fork in the road", "bifurcation point",
            "branching paths", "two divergent paths", "architectural fork", "architecture fork",
            "infrastructure fork", "strategic fork", "strategic bifurcation",
            "crossroads", "path dependency"
        ],
        "template": "decision_tree_fork",
        "default_targets": {
            "title": "THE ARCHITECTURAL BIFURCATION",
            "subtitle": "HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES",
            "badge": "BIFURCATION DECISION FORK",
            "synthesis": "Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves.",
            "rootTitle": "FOUNDATION MODEL ARCHITECTURE",
            "rootDesc": "Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure.",
            "rootBadge": "DECISION FORK // T=0",
            "branch1Title": "Path A: Proprietary Closed API",
            "branch1Desc": "Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints.",
            "branch1Badge": "WALLED GARDEN",
            "branch1Metric": "HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY",
            "branch1Color": "#F43F5E",
            "branch2Title": "Path B: Open-Weights Swarm",
            "branch2Desc": "Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale.",
            "branch2Badge": "AUTONOMOUS SWARM",
            "branch2Metric": "INFINITE SCALING // 100% OWNED INFRASTRUCTURE",
            "branch2Color": "#10B981",
        },
        "personality": "technical"
    },
    {
        "keywords": [
            "radar chart", "spider chart", "radar spider", "multidimensional comparison",
            "multi-dimensional comparison", "benchmark polygon", "tradeoff matrix",
            "trade-off matrix", "evaluated across", "strengths and weaknesses",
            "performance benchmark", "radar benchmark", "frontier model benchmark",
            "asymmetric tradeoffs", "asymmetric trade-offs"
        ],
        "template": "radar_spider_chart",
        "default_targets": {
            "title": "FRONTIER MODEL BENCHMARK",
            "subtitle": "MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX",
            "badge": "POLYGONAL RADAR BENCHMARK",
            "synthesis": "Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy.",
            "axis1": "Reasoning Depth",
            "axis2": "Inference Speed",
            "axis3": "Context Coherence",
            "axis4": "Cost Efficiency",
            "axis5": "Autonomous Agency",
            "entity1Name": "Autonomous Agent System",
            "entity1Score1": 96,
            "entity1Score2": 72,
            "entity1Score3": 98,
            "entity1Score4": 86,
            "entity1Score5": 94,
            "entity1Badge": "STATEFUL SWARM",
            "entity1Color": "#00E5FF",
            "entity2Name": "Monolithic Base LLM",
            "entity2Score1": 68,
            "entity2Score2": 94,
            "entity2Score3": 70,
            "entity2Score4": 64,
            "entity2Score5": 52,
            "entity2Badge": "ZERO-SHOT PROMPT",
            "entity2Color": "#F59E0B",
            "accentColor": "#00E5FF",
        },
        "personality": "technical"
    },
    {
        "keywords": [
            "pareto", "pareto principle", "80/20", "80 20", "80-20", "power law",
            "power-law", "power law distribution", "asymptotic distribution",
            "long tail", "fat tail", "the vital few", "vital 20", "trivial 80",
            "asymmetric leverage", "exponential distribution"
        ],
        "template": "pareto_power_law",
        "default_targets": {
            "title": "THE PARETO PRINCIPLE",
            "subtitle": "80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE",
            "badge": "POWER LAW DYNAMICS",
            "synthesis": "In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives.",
            "vitalPct": "20%",
            "vitalLabel": "THE VITAL FEW",
            "vitalDesc": "Core architectural primitives, foundational models & automated CI/CD pipelines",
            "vitalReturn": "80% SYSTEM IMPACT",
            "vitalColor": "#00E5FF",
            "trivialPct": "80%",
            "trivialLabel": "THE TRIVIAL MANY (LONG TAIL)",
            "trivialDesc": "Marginal feature edge-cases, manual configuration toil & vanity optimizations",
            "trivialReturn": "20% RESIDUAL VALUE",
            "trivialColor": "#F59E0B",
            "accentColor": "#00E5FF",
        },
        "personality": "technical"
    },
    {
        "keywords": [
            "chrono dial", "24-hour clock", "in 24 hours", "if the universe were 24 hours",
            "compressed into 24 hours", "compressed into a day", "accelerated timeline",
            "temporal compression", "history in 24 hours", "timeline compressed",
            "24 hour clock", "time compression", "compressed timeline", "final four seconds",
            "final 4 seconds", "compressed to 24 hours"
        ],
        "template": "chrono_dial_clock",
        "default_targets": {
            "title": "AI HISTORY IN 24 HOURS",
            "subtitle": "1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER",
            "badge": "24-HOUR CHRONOMETER",
            "synthesis": "If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds.",
            "currentTime": "23:59:56",
            "timeframe": "1950 — 2026 (76 Years)",
            "epoch1Time": "00:00",
            "epoch1Title": "Turing Test & Perceptron",
            "epoch1Desc": "1950: Foundational symbolic AI logic, Turing computability thesis, and initial artificial neurons.",
            "epoch1Badge": "GENESIS // T=0h",
            "epoch2Time": "18:30",
            "epoch2Title": "Deep Learning Resurgence",
            "epoch2Desc": "2012: AlexNet & GPU-accelerated backpropagation prove deep convolutional nets crush legacy heuristics.",
            "epoch2Badge": "CONVOLUTION // T=18.5h",
            "epoch3Time": "22:45",
            "epoch3Title": "Attention & Transformer Core",
            "epoch3Desc": "2017: Attention Is All You Need shifts the computational paradigm to massively parallel matrix self-attention.",
            "epoch3Badge": "TRANSFORMER // T=22.7h",
            "epoch4Time": "23:59:56",
            "epoch4Title": "Autonomous Reasoning Swarms",
            "epoch4Desc": "2026: Multi-agent autonomous swarms, self-healing code loops, and stateful recursive inference.",
            "epoch4Badge": "EXPONENTIAL // T=23.99h",
            "accentColor": "#00E5FF",
            "activeColor": "#10B981",
        },
        "personality": "technical"
    },
    # Stacks & Architecture Hierarchies
    {
        "keywords": [
            "mixture of experts", "modern ai compute stack", "expensive cloud datacenter",
            "compute stack is bifurcating", "compute stack"
        ],
        "template": "hierarchy_pyramid",
        "default_targets": {
            "title": "THE MODERN AI COMPUTE STACK",
            "subtitle": "DISTRIBUTED COGNITIVE INFRASTRUCTURE",
            "tier1Title": "1. GLOBAL HYPERSCALE CLOUD",
            "tier1Subtitle": "Massive foundational model training",
            "tier1Pct": "LAYER 01",
            "tier2Title": "2. SPECIALIZED RECURSIVE AGENTS",
            "tier2Subtitle": "Autonomous verification loops",
            "tier2Pct": "LAYER 02",
            "tier3Title": "3. ON-DEVICE EDGE SLMS",
            "tier3Subtitle": "Zero cloud inference fees",
            "tier3Pct": "LAYER 03",
            "synthesis": "Unified architecture from cloud hyperscale to local silicon."
        },
        "personality": "premium"
    },
    # Terminal & Code Execution
    {
        "keywords": [
            "re-executes unit tests", "unit tests until every assertion", "rewrites the failing syntax",
            "terminal access", "tool execution loops", "sub-10 billion", "sub-ten-billion",
            "quantized local", "mobile silicon"
        ],
        "template": "cooked_terminal",
        "default_targets": {
            "command": "deploy agent --memory=vector --tools=bash,git",
            "output": "[AGENT INIT] Terminal mounted. Execution loop active."
        },
        "personality": "technical"
    },
    # Quote / Key Takeaways
    {
        "keywords": [
            "stop doing the manual toil", "architect the system that does the work",
            "the winners will be the systems architects", "individuals who master cognitive leverage",
            "master cognitive leverage"
        ],
        "template": "quote_reveal",
        "default_targets": {
            "quote": "Stop doing the manual toil. Architect the system that does the work for you.",
            "author": "Autonomous Architecture"
        },
        "personality": "premium"
    }
]



def extract_broll_search_query(text: str, topic: str = "technology") -> str:
    """
    Extracts high-relevance stock footage search keywords directly from the chunk text.
    Uses semantic concept matching to produce 2-4 clean visual keywords for Pexels.
    """
    clean = re.sub(r'[^\w\s]', ' ', text).lower()
    words = clean.split()

    # Domain visual concept map: matches spoken phrases to high-quality stock video queries
    semantic_visual_rules = [
        (["chatbot", "chatbots", "conversational"], "ai chatbot interface screen"),
        (["token", "tokens", "predict", "predicted"], "digital text streaming screen"),
        (["magic", "event horizon", "future"], "futuristic digital technology lights"),
        (["agent", "agents", "agentic", "swarm", "swarms"], "autonomous network nodes technology"),
        (["reason", "reasoning", "cognitive"], "digital neural network brain"),
        (["terminal", "cli", "shell", "bash"], "terminal command line monitor"),
        (["write", "writing", "code", "coding", "software"], "developer coding on laptop screen"),
        (["test", "testing", "deploy", "deploying"], "software deployment server cloud"),
        (["boilerplate", "debugging", "refactor"], "computer screen programming code"),
        (["engineer", "engineers", "dev team"], "collaborative software engineering team"),
        (["solo", "founder", "architect"], "focused tech founder working laptop"),
        (["cloud", "hyperscale", "infrastructure"], "modern datacenter server racks glowing"),
        (["edge", "slm", "small language model", "local"], "microchip silicon processor close up"),
        (["quantization", "silicon", "hardware"], "computer circuit board microchip glowing"),
        (["audit", "gates", "verification", "deterministic"], "cyber security analytics dashboard"),
        (["output", "compound", "scale", "scaling"], "high tech digital speed lights"),
        (["paradigm", "shift", "earthquake", "economic"], "digital technological transformation network"),
        (["winner", "winners", "decade"], "futuristic high tech vision digital horizon"),
        (["tool", "tools", "wait", "prompt", "prompts"], "software engineer working on computer"),
        (["diminishing", "wall", "exorbitant"], "complex computer server processing data"),
        (["ticket", "tickets", "sprint", "queue", "manual"], "software engineering office workflow"),
        (["enterprise", "fifty-person", "50-person", "fortune", "company"], "modern corporate technology office glass building"),
        (["sovereignty", "security", "privacy", "zero cloud"], "cyber data security network shield"),
        (["monolithic", "parameter", "parameters", "hallucination", "hallucinations"], "artificial intelligence neural network glowing"),
        (["assertion", "assertions", "passes", "green", "stack trace"], "computer code terminal screen matrix"),
    ]

    for keywords, query in semantic_visual_rules:
        if any(k in clean for k in keywords):
            return query

    # Fallback keyword filter eliminating non-visual and temporal words
    stop_words = {
        "the", "and", "for", "that", "this", "with", "from", "you", "are",
        "was", "were", "have", "has", "had", "they", "their", "what", "when",
        "where", "who", "which", "will", "would", "could", "should", "your",
        "about", "into", "over", "after", "before", "between", "under", "again",
        "there", "then", "than", "here", "just", "like", "more", "most", "some",
        "very", "been", "being", "does", "doing", "did", "out", "off", "all",
        "any", "both", "each", "few", "more", "other", "such", "only", "own",
        "same", "too", "can", "now", "we", "is", "it", "our", "us",
        # Temporal & non-visual words
        "last", "three", "years", "today", "longer", "building", "crossed",
        "asked", "question", "true", "world", "under", "hood", "felt",
        "incapable", "come", "came", "make", "made", "every", "simple"
    }

    filtered = [w for w in words if w not in stop_words and len(w) > 2]

    if filtered:
        candidate = " ".join(filtered[:2])
        return f"{candidate} {topic}"

    return f"modern {topic} workspace"


def detect_script_list_points(text: str) -> Optional[Dict[str, Any]]:
    """
    Analyzes script text to see if it describes a sequential list, checklist, or set of points.
    Returns structured todo_list targets (title, badge, format, points) if 2 or more points are found.
    """
    text_clean = text.strip()
    text_lower = text_clean.lower()

    # Pattern A: Numbered items (e.g. "1. Ingest Video 2. AI Auto-Edit 3. 4K Export" or "Step 1: ... Step 2: ...")
    marker = r'(?:\([1-4]\)|[1-4]\.|step\s*[1-4]:?|rule\s*[1-4]:?)'
    pat_num = rf'(?:^|[\s\.\,\;]){marker}\s*(.*?)(?=(?:\s+{marker}|[\n;]|$))'
    num_matches = re.findall(pat_num, text_clean, re.IGNORECASE)
    if len(num_matches) >= 2:
        pts = []
        for m in num_matches:
            first_clause = re.split(r'[\.\n;]', m)[0].strip()
            first_clause = re.sub(r'[\.\,\;]+$', '', first_clause).strip()
            if len(first_clause) >= 3:
                pts.append(first_clause)
        if len(pts) >= 2:
            targets = {
                "title": "KEY DIRECTIVES",
                "badge": "⚡ SEQUENCE",
                "format": "sequence",
            }
            for i, p in enumerate(pts[:4], 1):
                targets[f"point{i}"] = p
            return targets

    # Pattern B: Sequential words (First, Second, Third, Finally)
    seq_patterns = [
        r'(?:first|1st|firstly)[,:\s]+(.*?)(?=(?:second|2nd|secondly|then|third|finally|\.|$))',
        r'(?:second|2nd|secondly)[,:\s]+(.*?)(?=(?:third|3rd|thirdly|then|finally|\.|$))',
        r'(?:third|3rd|thirdly)[,:\s]+(.*?)(?=(?:fourth|4th|finally|\.|$))',
        r'(?:fourth|4th|finally)[,:\s]+(.*?)(?=(?:\.|$))',
    ]
    extracted = []
    for pat in seq_patterns:
        m = re.search(pat, text_lower, re.IGNORECASE)
        if m and len(m.group(1).strip()) > 4:
            clean_item = m.group(1).strip().capitalize()
            clean_item = re.sub(r'[\.\,\;]+$', '', clean_item)
            if len(clean_item) > 3:
                extracted.append(clean_item)

    if len(extracted) >= 2:
        targets = {
            "title": "EXECUTION DIRECTIVES",
            "badge": "📋 ACTION CHECKLIST",
            "format": "todo",
        }
        for i, p in enumerate(extracted[:4], 1):
            targets[f"point{i}"] = p
        return targets

    # Pattern C: Common script playbook markers
    if any(k in text_lower for k in ["playbook", "checklist", "three rules", "steps to", "three things"]):
        if "diagnostic" in text_lower and "agents" in text_lower:
            return {
                "title": "SYSTEMS ARCHITECT PLAYBOOK",
                "badge": "📋 EXECUTION CHECKLIST",
                "format": "todo",
                "point1": "Automate Diagnostic Friction Audits",
                "point2": "Deploy Scoped Autonomous Agents",
                "point3": "Anchor to Deterministic Verification Gates",
            }

    return None


def build_dynamic_motion_graphic_targets(
    mg_type: str,
    chunk: ScriptChunk,
    default_targets: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Dynamically fills Remotion card props directly from the active spoken micro-scene text.
    Eliminates static, repetitive card text.
    """
    targets = dict(default_targets)
    text_clean = chunk.text.strip()
    text_lower = text_clean.lower()

    if mg_type == "cooked_terminal":
        if any(k in text_lower for k in ["unit test", "syntax error", "stack trace", "passes green", "assertion"]):
            targets["command"] = "pytest tests/test_agent.py -v"
            targets["output"] = "FAIL: SyntaxError in line 42 -> Auto-patching...\nRE-TEST: 14/14 unit tests PASSED (ALL GREEN)"
        elif any(k in text_lower for k in ["tokens per second", "silicon", "locally", "quantiz", "laptop", "sub-10", "edge"]):
            targets["command"] = "run local_slm --quantize 4bit --stream"
            targets["output"] = "Engine ready. Streaming at 114 tokens/sec.\nCloud latency: 0ms. Local VRAM: 3.2 GB."
        else:
            targets["command"] = "deploy agent --memory=vector --tools=bash,git"
            targets["output"] = "[AGENT INIT] Terminal mounted. Persistent memory active.\nAutonomous execution loop started."

    elif mg_type == "stat_card_highlight":
        if any(k in text_lower for k in ["tokens", "token", "speed", "latency"]):
            targets["label"] = "EDGE REASONING SPEED"
            targets["stat"] = ">100 Tokens/Sec"
            targets["delta"] = "0ms Cloud Latency • Local Silicon"
        elif "70%" in text_lower or "boilerplate" in text_lower:
            targets["label"] = "DEVELOPER TIME"
            targets["stat"] = "70% Boilerplate"
            targets["delta"] = "Automated Away"

    elif mg_type == "quote_reveal":
        if "stop doing" in text_lower or "manual toil" in text_lower:
            targets["quote"] = "Stop doing the manual toil. Architect the system that does the work for you."
            targets["author"] = "Autonomous Architecture"
        elif "systems architect" in text_lower or "cognitive leverage" in text_lower:
            targets["quote"] = "The winners will be the systems architects who master cognitive leverage."
            targets["author"] = "Systems Architect Thesis"
        elif len(text_clean) > 10:
            clean_q = text_clean.rstrip(".\"")
            targets["quote"] = clean_q if len(clean_q) <= 85 else clean_q[:82] + "..."
            targets["author"] = "Key Thesis"

    elif mg_type == "metric_reveal":
        if chunk.extracted_metrics:
            targets["metric"] = chunk.extracted_metrics[0]
        targets["label"] = "COST OF REASONING"
        targets["delta"] = "-99.9% Collapse"

    elif mg_type == "tactile_checklist_stamp":
        targets["title"] = "SYSTEMS ARCHITECT PLAYBOOK"
        targets["badge"] = "📋 EXECUTION GATES"
        targets["item1Text"] = "1. Automate Diagnostic Friction Audits"
        targets["item2Text"] = "2. Deploy Scoped Autonomous Agents"
        targets["item3Text"] = "3. Anchor to Verification Gates"
        targets["verdictText"] = "VERDICT: 10X COGNITIVE LEVERAGE"

    elif mg_type == "todo_list":
        list_detected = detect_script_list_points(chunk.text)
        if list_detected:
            targets.update(list_detected)
        else:
            if any(k in text_lower for k in ["playbook", "diagnostic", "friction", "gate"]):
                targets["title"] = "SYSTEMS ARCHITECT PLAYBOOK"
                targets["badge"] = "📋 EXECUTION CHECKLIST"
                targets["format"] = "todo"
                targets["point1"] = "Automate Diagnostic Friction Audits"
                targets["point2"] = "Deploy Scoped Autonomous Agents"
                targets["point3"] = "Anchor to Deterministic Verification Gates"
            elif any(k in text_lower for k in ["loop", "perception", "reasoning", "tool", "verification"]):
                targets["title"] = "AUTONOMOUS REASONING LOOP"
                targets["badge"] = "⚡ SEQUENCE"
                targets["format"] = "sequence"
                targets["point1"] = "Perception & System State Ingestion"
                targets["point2"] = "Recursive Hypothesis Formulation"
                targets["point3"] = "Deterministic Verification Loop"
            else:
                targets["title"] = targets.get("title") or "CORE ACTION DIRECTIVES"
                targets["badge"] = targets.get("badge") or "📋 SYSTEM CHECKLIST"
                targets["format"] = targets.get("format") or "todo"
                targets["point1"] = targets.get("point1") or "Establish Autonomous Baseline"
                targets["point2"] = targets.get("point2") or "Deploy Scoped System Agents"
                targets["point3"] = targets.get("point3") or "Verify Deterministic Output"

    elif mg_type == "architecture_pipeline":
        if any(k in text_lower for k in ["rag", "vector", "retrieval", "search", "embedding"]):
            targets["title"] = "HYBRID RAG RETRIEVAL PIPELINE"
            targets["subtitle"] = "HIGH-DIMENSIONAL CONTEXT RETRIEVAL"
            targets["badge"] = "⚡ PIPELINE TOPOLOGY"
            targets["stage1Title"] = "Multimodal Ingestion"
            targets["stage1Desc"] = "Streaming document chunking & tokenization"
            targets["stage1Badge"] = "INGEST"
            targets["stage1Metric"] = "10K DOCS/S"
            targets["stage2Title"] = "Dense Vector Embedding"
            targets["stage2Desc"] = "High-dimensional neural semantic mapping"
            targets["stage2Badge"] = "EMBED"
            targets["stage2Metric"] = "1536 DIMS"
            targets["stage3Title"] = "Approximate Nearest Neighbor"
            targets["stage3Desc"] = "HNSW graph search with cosine reranking"
            targets["stage3Badge"] = "RETRIEVE"
            targets["stage3Metric"] = "2.1ms LOOKUP"
            targets["stage4Title"] = "Context Window Grounding"
            targets["stage4Desc"] = "Fact-verified synthesis anchor"
            targets["stage4Badge"] = "SYNTHESIZE"
            targets["stage4Metric"] = "100% RECALL"
        elif any(k in text_lower for k in ["agent", "tool", "autonomous", "reasoning", "swarm"]):
            targets["title"] = "AUTONOMOUS AGENT EXECUTION PIPELINE"
            targets["subtitle"] = "PERCEPTION, HYPOTHESIS & TOOL EXECUTION"
            targets["badge"] = "⚡ AGENT ARCHITECTURE"
            targets["stage1Title"] = "System State Ingestion"
            targets["stage1Desc"] = "Real-time terminal, API, and codebase telemetry"
            targets["stage1Badge"] = "PERCEIVE"
            targets["stage1Metric"] = "LIVE TELEMETRY"
            targets["stage2Title"] = "Recursive Planning"
            targets["stage2Desc"] = "Multi-step hypothesis formulation and branching"
            targets["stage2Badge"] = "PLAN"
            targets["stage2Metric"] = "CHAIN-OF-THOUGHT"
            targets["stage3Title"] = "Sandboxed Tool Call"
            targets["stage3Desc"] = "Executing Bash, Git, and compiler test suites"
            targets["stage3Badge"] = "EXECUTE"
            targets["stage3Metric"] = "SANDBOX MOUNT"
            targets["stage4Title"] = "Assertion Gate"
            targets["stage4Desc"] = "Automated verification & unit test validation"
            targets["stage4Badge"] = "VERIFY"
            targets["stage4Metric"] = "ALL GREEN PASS"
        else:
            targets["title"] = targets.get("title") or "CORE SYSTEM PIPELINE"
            targets["subtitle"] = targets.get("subtitle") or "MODULAR DATA FLOW ARCHITECTURE"
            targets["badge"] = targets.get("badge") or "⚡ DATA PIPELINE"
            targets["stage1Title"] = targets.get("stage1Title") or "Streaming Ingestion"
            targets["stage1Desc"] = targets.get("stage1Desc") or "Parallel data capture and schema validation"
            targets["stage1Badge"] = targets.get("stage1Badge") or "INGEST"
            targets["stage1Metric"] = targets.get("stage1Metric") or "ACTIVE"
            targets["stage2Title"] = targets.get("stage2Title") or "Transformation Core"
            targets["stage2Desc"] = targets.get("stage2Desc") or "High-throughput real-time stream transformation"
            targets["stage2Badge"] = targets.get("stage2Badge") or "TRANSFORM"
            targets["stage2Metric"] = targets.get("stage2Metric") or "STEADY"
            targets["stage3Title"] = targets.get("stage3Title") or "Cognitive Reasoning"
            targets["stage3Desc"] = targets.get("stage3Desc") or "Autonomous processing and optimization"
            targets["stage3Badge"] = targets.get("stage3Badge") or "PROCESS"
            targets["stage3Metric"] = targets.get("stage3Metric") or "OPTIMIZED"
            targets["stage4Title"] = targets.get("stage4Title") or "Deterministic Release"
            targets["stage4Desc"] = targets.get("stage4Desc") or "Automated compliance and production deployment"
            targets["stage4Badge"] = targets.get("stage4Badge") or "DEPLOY"
            targets["stage4Metric"] = targets.get("stage4Metric") or "100% RELIABLE"

    elif mg_type == "causal_loop":
        if any(k in text_lower for k in ["outage", "cascade", "crash", "failure", "bug", "latency", "miss"]):
            targets["title"] = "SYSTEM OUTAGE CASCADE"
            targets["subtitle"] = "HOW MICRO-FAILURES AMPLIFY INTO FULL-SCALE OUTAGES"
            targets["badge"] = "⚠️ CASCADING FAILURE (-)"
            targets["loopType"] = "vicious"
            targets["centerLabel"] = "VICIOUS CYCLE"
            targets["centerSub"] = "CASCADING FAILURE"
            targets["synthesis"] = "Cache saturation cascades downstream, locking servers into unrecoverable failure."
            targets["node1Title"] = "Sudden Traffic Surge"
            targets["node1Desc"] = "Unexpected query volume overwhelms edge proxies."
            targets["node1Badge"] = "TRIGGER EVENT"
            targets["node1Metric"] = "10X TRAFFIC"
            targets["node2Title"] = "Cache Miss Saturation"
            targets["node2Desc"] = "Redis cluster memory exhausts, dropping 90% of reads."
            targets["node2Badge"] = "AMPLIFICATION"
            targets["node2Metric"] = "92% MISS RATE"
            targets["node3Title"] = "Database Thread Starvation"
            targets["node3Desc"] = "Relational connection pools lock up with backlog queues."
            targets["node3Badge"] = "CORE CRUNCH"
            targets["node3Metric"] = "100% CPU LOCK"
            targets["node4Title"] = "Global Timeout Cascades"
            targets["node4Desc"] = "Client retries trigger recursive overload loops."
            targets["node4Badge"] = "LOCK-IN"
            targets["node4Metric"] = "TOTAL OUTAGE"
        elif any(k in text_lower for k in ["growth", "flywheel", "adoption", "network", "moat"]):
            targets["title"] = "THE NETWORK GROWTH FLYWHEEL"
            targets["subtitle"] = "HOW COMPOUNDING USER SIGNALS BUILD PRODUCT MOATS"
            targets["badge"] = "🔄 REINFORCING FLYWHEEL (+)"
            targets["loopType"] = "reinforcing"
            targets["centerLabel"] = "REINFORCING LOOP"
            targets["centerSub"] = "COMPOUNDING DRIFT"
            targets["synthesis"] = "Each incremental user expands the ecosystem, compounding defensible data moats."
            targets["node1Title"] = "Superior Developer UX"
            targets["node1Desc"] = "Zero-friction onboarding drives viral engineer adoption."
            targets["node1Badge"] = "INITIAL HOOK"
            targets["node1Metric"] = "3X CONVERSION"
            targets["node2Title"] = "Exponential User Activity"
            targets["node2Desc"] = "Millions of daily workflows run through the platform."
            targets["node2Badge"] = "SCALE PHASE"
            targets["node2Metric"] = "+140% DAU/MAU"
            targets["node3Title"] = "Dense Vector Telemetry"
            targets["node3Desc"] = "Proprietary execution data trains domain-specialized models."
            targets["node3Badge"] = "DATA ACCRUAL"
            targets["node3Metric"] = "BILLIONS OF TOKENS"
            targets["node4Title"] = "Unbeatable Product Moat"
            targets["node4Desc"] = "System intelligence outpaces legacy closed software."
            targets["node4Badge"] = "MOAT COMPOUND"
            targets["node4Metric"] = "10X LEVERAGE"
        else:
            targets["title"] = targets.get("title") or "THE SYSTEMIC FEEDBACK LOOP"
            targets["subtitle"] = targets.get("subtitle") or "HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES"
            targets["badge"] = targets.get("badge") or "🔄 REINFORCING FLYWHEEL (+)"
            targets["loopType"] = targets.get("loopType") or "reinforcing"
            targets["centerLabel"] = targets.get("centerLabel") or "REINFORCING LOOP"
            targets["centerSub"] = targets.get("centerSub") or "COMPOUNDING DRIFT"
            targets["synthesis"] = targets.get("synthesis") or "Each phase intensifies the subsequent shock, locking the architecture into an accelerating trajectory."
            targets["node1Title"] = targets.get("node1Title") or "Initial System Disturbance"
            targets["node1Desc"] = targets.get("node1Desc") or "Catalyst trigger destabilizes the operational baseline."
            targets["node1Badge"] = targets.get("node1Badge") or "TRIGGER CAUSE"
            targets["node1Metric"] = targets.get("node1Metric") or "CATALYST"
            targets["node2Title"] = targets.get("node2Title") or "Secondary Amplification"
            targets["node2Desc"] = targets.get("node2Desc") or "Systemic friction accelerates across dependent layers."
            targets["node2Badge"] = targets.get("node2Badge") or "AMPLIFY"
            targets["node2Metric"] = targets.get("node2Metric") or "+45% SPREAD"
            targets["node3Title"] = targets.get("node3Title") or "Critical Stress Point"
            targets["node3Desc"] = targets.get("node3Desc") or "Core infrastructure hits peak saturation tolerance."
            targets["node3Badge"] = targets.get("node3Badge") or "STRESS"
            targets["node3Metric"] = targets.get("node3Metric") or "SATURATION"
            targets["node4Title"] = targets.get("node4Title") or "Feedback Loop Closure"
            targets["node4Desc"] = targets.get("node4Desc") or "Cascading feedback loops back to re-ignite phase one."
            targets["node4Badge"] = targets.get("node4Badge") or "FEEDBACK"
            targets["node4Metric"] = targets.get("node4Metric") or "CYCLE LOCKED"

    elif mg_type == "exploded_layer_stack":
        if any(k in text_lower for k in ["cloud", "serverless", "devops", "kubernetes", "backend"]):
            targets["title"] = "THE CLOUD NATIVE INFRASTRUCTURE STACK"
            targets["subtitle"] = "DECONSTRUCTED DISTRIBUTED COMPUTE RUNTIME"
            targets["badge"] = "INFRASTRUCTURE DECONSTRUCTION"
            targets["synthesis"] = "Modern serverless platforms abstract lower kernel primitives into high-velocity developer APIs."
            targets["layer1Title"] = "Bare Metal Silicon Substrate"
            targets["layer1Desc"] = "High-density multi-core compute nodes and NVMe storage clusters."
            targets["layer1Badge"] = "PHYSICAL SUBSTRATE"
            targets["layer1Metric"] = "100 GBPS FABRIC"
            targets["layer2Title"] = "Container Orchestration Mesh"
            targets["layer2Desc"] = "Kubernetes control plane, eBPF telemetry, and zero-trust service mesh."
            targets["layer2Badge"] = "CONTROL PLANE"
            targets["layer2Metric"] = "SUB-MS LATENCY"
            targets["layer3Title"] = "Unified Data & Cache Layer"
            targets["layer3Desc"] = "Distributed vector indices and low-latency in-memory state stores."
            targets["layer3Badge"] = "STATEFABRIC"
            targets["layer3Metric"] = "99.999% SLA"
            targets["layer4Title"] = "Edge Serverless Ingress"
            targets["layer4Desc"] = "Autonomous edge workers routing requests within 5ms of end users."
            targets["layer4Badge"] = "EDGE RUNTIME"
            targets["layer4Metric"] = "< 5ms POP"
        else:
            targets["title"] = targets.get("title") or "THE AUTONOMOUS AGENT STACK"
            targets["subtitle"] = targets.get("subtitle") or "DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE"
            targets["badge"] = targets.get("badge") or "ISOMETRIC SYSTEM ARCHITECTURE"
            targets["synthesis"] = targets.get("synthesis") or "Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below."
            targets["layer1Title"] = targets.get("layer1Title") or "Foundational Neural Weights"
            targets["layer1Desc"] = targets.get("layer1Desc") or "Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth."
            targets["layer1Badge"] = targets.get("layer1Badge") or "HARDWARE SUBSTRATE"
            targets["layer1Metric"] = targets.get("layer1Metric") or "4.8 TB/S BANDWIDTH"
            targets["layer2Title"] = targets.get("layer2Title") or "Context Window Orchestration"
            targets["layer2Desc"] = targets.get("layer2Desc") or "Attention routing, KV-cache compression, and speculative token draft verification."
            targets["layer2Badge"] = targets.get("layer2Badge") or "NEURAL LATENT CORE"
            targets["layer2Metric"] = targets.get("layer2Metric") or "128K TOKENS / SEC"
            targets["layer3Title"] = targets.get("layer3Title") or "Long-Term Memory & Graph RAG"
            targets["layer3Desc"] = targets.get("layer3Desc") or "Hierarchical vector indexing and real-time knowledge graph traversal."
            targets["layer3Badge"] = targets.get("layer3Badge") or "EPISTEMIC STATE"
            targets["layer3Metric"] = targets.get("layer3Metric") or "1.2M EMBEDDINGS"
            targets["layer4Title"] = targets.get("layer4Title") or "Autonomous Tool Execution"
            targets["layer4Desc"] = targets.get("layer4Desc") or "Sandboxed agent synthesis, deterministic code interpreter, and external API invocation."
            targets["layer4Badge"] = targets.get("layer4Badge") or "COGNITIVE RUNTIME"
            targets["layer4Metric"] = targets.get("layer4Metric") or "< 150ms LATENCY"

    elif mg_type == "bottleneck_constriction":
        if any(k in text_lower for k in ["api", "rate limit", "token", "request", "server"]):
            targets["title"] = "THE API CONCURRENCY BOTTLENECK"
            targets["subtitle"] = "HOW UPSTREAM RATE LIMITS STALL DISTRIBUTED AGENTS"
            targets["badge"] = "CONCURRENCY FUNNEL"
            targets["inputLabel"] = "SWARM INGESTION DEMAND"
            targets["inputMetric"] = "10,000 REQ/SEC"
            targets["inputDesc"] = "Parallel agent tool executions and web scraping runs"
            targets["chokeLabel"] = "UPSTREAM MODEL RATE LIMIT"
            targets["chokeMetric"] = "CHOKE POINT: 150 REQ/SEC"
            targets["chokeDesc"] = "HTTP 429 Too Many Requests edge throttling"
            targets["restrictionPct"] = "-98.5%"
            targets["outputLabel"] = "REALIZED THROUGHPUT"
            targets["outputMetric"] = "142 REQ/SEC"
            targets["outputDesc"] = "Effective execution pace after exponential backoff"
            targets["efficiency"] = "1.5% YIELD"
            targets["synthesis"] = "Unbounded agent concurrency collapses into queue timeouts when upstream API quotas act as hard bottlenecks."
        else:
            targets["title"] = targets.get("title") or "THE COMPUTE MEMORY WALL"
            targets["subtitle"] = targets.get("subtitle") or "WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH"
            targets["badge"] = targets.get("badge") or "THROUGHPUT CAPACITY FUNNEL"
            targets["inputLabel"] = targets.get("inputLabel") or "INCOMING CAPACITY"
            targets["inputMetric"] = targets.get("inputMetric") or "1,000 TFLOPS"
            targets["inputDesc"] = targets.get("inputDesc") or "Peak GPU arithmetic core saturation"
            targets["chokeLabel"] = targets.get("chokeLabel") or "HBM INTERCONNECT BANDWIDTH"
            targets["chokeMetric"] = targets.get("chokeMetric") or "CHOKE POINT: 3.2 TB/S"
            targets["chokeDesc"] = targets.get("chokeDesc") or "Off-chip pin density & memory bus limit"
            targets["restrictionPct"] = targets.get("restrictionPct") or "-98.8%"
            targets["outputLabel"] = targets.get("outputLabel") or "EFFECTIVE OUTPUT"
            targets["outputMetric"] = targets.get("outputMetric") or "12 TFLOPS"
            targets["outputDesc"] = targets.get("outputDesc") or "Sustained throughput under starvation"
            targets["efficiency"] = targets.get("efficiency") or "1.2% YIELD"
            targets["synthesis"] = targets.get("synthesis") or "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units."

    elif mg_type == "trilemma_tradeoff":
        if any(k in text_lower for k in ["cap theorem", "database", "data store", "consistency"]):
            targets["title"] = "THE CAP THEOREM TRILEMMA"
            targets["subtitle"] = "A DISTRIBUTED DATA STORE CAN ONLY GUARANTEE TWO AT ONCE"
            targets["badge"] = "BREWER'S DISTRIBUTED THEOREM"
            targets["axiom"] = "Under network partition, you must choose between immediate consistency and total availability."
            targets["vertex1Title"] = "Consistency"
            targets["vertex1Desc"] = "Every read receives the most recent write or an explicit error"
            targets["vertex1Metric"] = "STRICT (PRESERVED)"
            targets["vertex2Title"] = "Partition Tolerance"
            targets["vertex2Desc"] = "System continues to function despite dropped or delayed network packets"
            targets["vertex2Metric"] = "HARDENED (PRESERVED)"
            targets["vertex3Title"] = "Availability"
            targets["vertex3Desc"] = "Every non-failing node returns a non-error response for every request"
            targets["vertex3Metric"] = "DEGRADED (SACRIFICED)"
            targets["sacrificedVertex"] = 3
        else:
            targets["title"] = targets.get("title") or "THE BLOCKCHAIN TRILEMMA"
            targets["subtitle"] = targets.get("subtitle") or "YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED."
            targets["badge"] = targets.get("badge") or "ARCHITECTURAL TRADE-OFF THEOREM"
            targets["axiom"] = targets.get("axiom") or "Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity."
            targets["vertex1Title"] = targets.get("vertex1Title") or "Decentralization"
            targets["vertex1Desc"] = targets.get("vertex1Desc") or "Distributed nodes worldwide with zero central point of failure"
            targets["vertex1Metric"] = targets.get("vertex1Metric") or "100% PRESERVED"
            targets["vertex2Title"] = targets.get("vertex2Title") or "Security"
            targets["vertex2Desc"] = targets.get("vertex2Desc") or "Cryptographic proof-of-work consensus protecting state history"
            targets["vertex2Metric"] = targets.get("vertex2Metric") or "100% PRESERVED"
            targets["vertex3Title"] = targets.get("vertex3Title") or "Scalability"
            targets["vertex3Desc"] = targets.get("vertex3Desc") or "High transaction throughput and low latency confirmation"
            targets["vertex3Metric"] = targets.get("vertex3Metric") or "15 TPS (SACRIFICED)"
            targets["sacrificedVertex"] = targets.get("sacrificedVertex") or 3

    elif mg_type == "scale_zoom_ladder":
        if any(k in text_lower for k in ["parameter", "token", "neural", "weights", "model"]):
            targets["title"] = "AI PARAMETER MAGNITUDE"
            targets["subtitle"] = "HOW NEURAL WEIGHT DENSITY HAS SURGED EXPONENTIALLY"
            targets["badge"] = "EXPONENTIAL PARAMETER ZOOM"
            targets["synthesis"] = "Modern frontier models hold more parameters than human cerebral cortex synapses."
            targets["step1Value"] = "7 BILLION"
            targets["step1Label"] = "EDGE ON-DEVICE"
            targets["step1Desc"] = "Runs locally on smartphone silicon"
            targets["step1Metric"] = "1x (BASE WEIGHT)"
            targets["step2Value"] = "70 BILLION"
            targets["step2Label"] = "DATACENTER WORKHORSE"
            targets["step2Desc"] = "Enterprise reasoning & structured agent flows"
            targets["step2Metric"] = "10x MULTIPLIER"
            targets["step3Value"] = "1.8 TRILLION"
            targets["step3Label"] = "FRONTIER MOE CLUSTER"
            targets["step3Desc"] = "Hyperscale cluster sparse mixture-of-experts"
            targets["step3Metric"] = "250x MULTIPLIER"
        else:
            targets["title"] = targets.get("title") or "THE ILLUSION OF SCALE"
            targets["subtitle"] = targets.get("subtitle") or "HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION"
            targets["badge"] = targets.get("badge") or "EXPONENTIAL MAGNITUDE LADDER"
            targets["synthesis"] = targets.get("synthesis") or "The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale."
            targets["step1Value"] = targets.get("step1Value") or "$1 MILLION"
            targets["step1Label"] = targets.get("step1Label") or "11.5 DAYS"
            targets["step1Desc"] = targets.get("step1Desc") or "1 Million seconds elapsed in real time"
            targets["step1Metric"] = targets.get("step1Metric") or "1x (BASE UNIT)"
            targets["step2Value"] = targets.get("step2Value") or "$1 BILLION"
            targets["step2Label"] = targets.get("step2Label") or "31.7 YEARS"
            targets["step2Desc"] = targets.get("step2Desc") or "1 Billion seconds elapsed (entire career)"
            targets["step2Metric"] = targets.get("step2Metric") or "1,000x MULTIPLIER"
            targets["step3Value"] = targets.get("step3Value") or "$1 TRILLION"
            targets["step3Label"] = targets.get("step3Label") or "31,700 YEARS"
            targets["step3Desc"] = targets.get("step3Desc") or "1 Trillion seconds (before recorded civilization)"
            targets["step3Metric"] = targets.get("step3Metric") or "1,000,000x MONOLITH"

    elif mg_type == "decision_tree_fork":
        if any(k in text_lower for k in ["cloud", "monolith", "microservice", "infrastructure"]):
            targets["title"] = "INFRASTRUCTURE BIFURCATION"
            targets["subtitle"] = "MONOLITHIC RUNTIME VS DISTRIBUTED EVENT-DRIVEN MICROSERVICES"
            targets["badge"] = "INFRASTRUCTURE FORK"
            targets["synthesis"] = "Premature distributed complexity costs more than monolithic debt."
            targets["rootTitle"] = "SYSTEM DEPLOYMENT BASE"
            targets["rootDesc"] = "Initial architecture baseline decision at venture inception"
            targets["rootBadge"] = "FORK T=0"
            targets["branch1Title"] = "Path A: Premature Microservices"
            targets["branch1Desc"] = "Complex distributed tracing, network latency overhead, high operational toil"
            targets["branch1Badge"] = "HIGH FRICTION"
            targets["branch1Metric"] = "5x DEPLOYMENT OVERHEAD // HARD NETWORK LATENCY"
            targets["branch1Color"] = "#F43F5E"
            targets["branch2Title"] = "Path B: Modular Monolith"
            targets["branch2Desc"] = "Single deployment target, sub-millisecond in-process calls, rapid MVP iteration"
            targets["branch2Badge"] = "RAPID VELOCITY"
            targets["branch2Metric"] = "10x SPEED // ZERO DISTRIBUTED TAX"
            targets["branch2Color"] = "#10B981"
        else:
            targets["title"] = targets.get("title") or "THE ARCHITECTURAL BIFURCATION"
            targets["subtitle"] = targets.get("subtitle") or "HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES"
            targets["badge"] = targets.get("badge") or "BIFURCATION DECISION FORK"
            targets["synthesis"] = targets.get("synthesis") or "Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves."
            targets["rootTitle"] = targets.get("rootTitle") or "FOUNDATION MODEL ARCHITECTURE"
            targets["rootDesc"] = targets.get("rootDesc") or "Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure."
            targets["rootBadge"] = targets.get("rootBadge") or "DECISION FORK // T=0"
            targets["branch1Title"] = targets.get("branch1Title") or "Path A: Proprietary Closed API"
            targets["branch1Desc"] = targets.get("branch1Desc") or "Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints."
            targets["branch1Badge"] = targets.get("branch1Badge") or "WALLED GARDEN"
            targets["branch1Metric"] = targets.get("branch1Metric") or "HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY"
            targets["branch1Color"] = targets.get("branch1Color") or "#F43F5E"
            targets["branch2Title"] = targets.get("branch2Title") or "Path B: Open-Weights Swarm"
            targets["branch2Desc"] = targets.get("branch2Desc") or "Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale."
            targets["branch2Badge"] = targets.get("branch2Badge") or "AUTONOMOUS SWARM"
            targets["branch2Metric"] = targets.get("branch2Metric") or "INFINITE SCALING // 100% OWNED INFRASTRUCTURE"
            targets["branch2Color"] = targets.get("branch2Color") or "#10B981"

    elif mg_type == "radar_spider_chart":
        if any(k in text_lower for k in ["database", "storage", "sql", "rdbms", "nosql"]):
            targets["title"] = "DATABASE TRADEOFF MATRIX"
            targets["subtitle"] = "DISTRIBUTED LSM STORAGE VS TRADITIONAL RELATIONAL RDBMS"
            targets["badge"] = "POLYGONAL BENCHMARK"
            targets["synthesis"] = "No storage system optimizes all dimensions: throughput requires consistency compromises."
            targets["axis1"] = "Write Throughput"
            targets["axis2"] = "Read Latency"
            targets["axis3"] = "ACID Safety"
            targets["axis4"] = "Horizontal Scale"
            targets["axis5"] = "Cost Per GB"
            targets["entity1Name"] = "Distributed LSM Engine"
            targets["entity1Score1"] = 98
            targets["entity1Score2"] = 70
            targets["entity1Score3"] = 80
            targets["entity1Score4"] = 96
            targets["entity1Score5"] = 90
            targets["entity1Badge"] = "HIGH SCALE"
            targets["entity1Color"] = "#00E5FF"
            targets["entity2Name"] = "Monolithic SQL"
            targets["entity2Score1"] = 62
            targets["entity2Score2"] = 95
            targets["entity2Score3"] = 98
            targets["entity2Score4"] = 55
            targets["entity2Score5"] = 65
            targets["entity2Badge"] = "ACID CORE"
            targets["entity2Color"] = "#F59E0B"
        else:
            targets["title"] = targets.get("title") or "FRONTIER MODEL BENCHMARK"
            targets["subtitle"] = targets.get("subtitle") or "MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX"
            targets["badge"] = targets.get("badge") or "POLYGONAL RADAR BENCHMARK"
            targets["synthesis"] = targets.get("synthesis") or "Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy."
            targets["axis1"] = targets.get("axis1") or "Reasoning Depth"
            targets["axis2"] = targets.get("axis2") or "Inference Speed"
            targets["axis3"] = targets.get("axis3") or "Context Coherence"
            targets["axis4"] = targets.get("axis4") or "Cost Efficiency"
            targets["axis5"] = targets.get("axis5") or "Autonomous Agency"
            targets["entity1Name"] = targets.get("entity1Name") or "Autonomous Agent System"
            targets["entity1Score1"] = targets.get("entity1Score1", 96)
            targets["entity1Score2"] = targets.get("entity1Score2", 72)
            targets["entity1Score3"] = targets.get("entity1Score3", 98)
            targets["entity1Score4"] = targets.get("entity1Score4", 86)
            targets["entity1Score5"] = targets.get("entity1Score5", 94)
            targets["entity1Badge"] = targets.get("entity1Badge") or "STATEFUL SWARM"
            targets["entity1Color"] = targets.get("entity1Color") or "#00E5FF"
            targets["entity2Name"] = targets.get("entity2Name") or "Monolithic Base LLM"
            targets["entity2Score1"] = targets.get("entity2Score1", 68)
            targets["entity2Score2"] = targets.get("entity2Score2", 94)
            targets["entity2Score3"] = targets.get("entity2Score3", 70)
            targets["entity2Score4"] = targets.get("entity2Score4", 64)
            targets["entity2Score5"] = targets.get("entity2Score5", 52)
            targets["entity2Badge"] = targets.get("entity2Badge") or "ZERO-SHOT PROMPT"
            targets["entity2Color"] = targets.get("entity2Color") or "#F59E0B"
            targets["accentColor"] = targets.get("accentColor") or "#00E5FF"

    elif mg_type == "pareto_power_law":
        if any(k in text_lower for k in ["code", "software", "bug", "feature", "engineering"]):
            targets["title"] = "SOFTWARE PARETO DISTRIBUTION"
            targets["subtitle"] = "20% OF CORE ARCHITECTURE YIELDS 80% OF RUNTIME VALUE"
            targets["badge"] = "ENGINEERING LEVERAGE"
            targets["synthesis"] = "Stop micro-optimizing the long tail: 80% of systemic stability comes from 20% of core primitives."
            targets["vitalPct"] = "20%"
            targets["vitalLabel"] = "THE VITAL PRIMITIVES"
            targets["vitalDesc"] = "Type systems, deterministic testing & automated CI/CD deployment gates"
            targets["vitalReturn"] = "80% SYSTEM STABILITY"
            targets["vitalColor"] = "#00E5FF"
            targets["trivialPct"] = "80%"
            targets["trivialLabel"] = "THE TRIVIAL MANY"
            targets["trivialDesc"] = "Manual config tweaks, cosmetic refactors & premature edge-case branches"
            targets["trivialReturn"] = "20% MARGINAL IMPACT"
            targets["trivialColor"] = "#F59E0B"
        else:
            targets["title"] = targets.get("title") or "THE PARETO PRINCIPLE"
            targets["subtitle"] = targets.get("subtitle") or "80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE"
            targets["badge"] = targets.get("badge") or "POWER LAW DYNAMICS"
            targets["synthesis"] = targets.get("synthesis") or "In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives."
            targets["vitalPct"] = targets.get("vitalPct") or "20%"
            targets["vitalLabel"] = targets.get("vitalLabel") or "THE VITAL FEW"
            targets["vitalDesc"] = targets.get("vitalDesc") or "Core architectural primitives, foundational models & automated CI/CD pipelines"
            targets["vitalReturn"] = targets.get("vitalReturn") or "80% SYSTEM IMPACT"
            targets["vitalColor"] = targets.get("vitalColor") or "#00E5FF"
            targets["trivialPct"] = targets.get("trivialPct") or "80%"
            targets["trivialLabel"] = targets.get("trivialLabel") or "THE TRIVIAL MANY (LONG TAIL)"
            targets["trivialDesc"] = targets.get("trivialDesc") or "Marginal feature edge-cases, manual configuration toil & vanity optimizations"
            targets["trivialReturn"] = targets.get("trivialReturn") or "20% RESIDUAL VALUE"
            targets["trivialColor"] = targets.get("trivialColor") or "#F59E0B"
            targets["accentColor"] = targets.get("accentColor") or "#00E5FF"

    elif mg_type == "chrono_dial_clock":
        targets["title"] = targets.get("title") or "AI HISTORY IN 24 HOURS"
        targets["subtitle"] = targets.get("subtitle") or "1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER"
        targets["badge"] = targets.get("badge") or "24-HOUR CHRONOMETER"
        targets["synthesis"] = targets.get("synthesis") or "If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds."
        targets["currentTime"] = targets.get("currentTime") or "23:59:56"
        targets["timeframe"] = targets.get("timeframe") or "1950 — 2026 (76 Years)"
        targets["epoch1Time"] = targets.get("epoch1Time") or "00:00"
        targets["epoch1Title"] = targets.get("epoch1Title") or "Turing Test & Perceptron"
        targets["epoch1Desc"] = targets.get("epoch1Desc") or "1950: Foundational symbolic AI logic, Turing computability thesis, and initial artificial neurons."
        targets["epoch1Badge"] = targets.get("epoch1Badge") or "GENESIS // T=0h"
        targets["epoch2Time"] = targets.get("epoch2Time") or "18:30"
        targets["epoch2Title"] = targets.get("epoch2Title") or "Deep Learning Resurgence"
        targets["epoch2Desc"] = targets.get("epoch2Desc") or "2012: AlexNet & GPU-accelerated backpropagation prove deep convolutional nets crush legacy heuristics."
        targets["epoch2Badge"] = targets.get("epoch2Badge") or "CONVOLUTION // T=18.5h"
        targets["epoch3Time"] = targets.get("epoch3Time") or "22:45"
        targets["epoch3Title"] = targets.get("epoch3Title") or "Attention & Transformer Core"
        targets["epoch3Desc"] = targets.get("epoch3Desc") or "2017: Attention Is All You Need shifts the computational paradigm to massively parallel matrix self-attention."
        targets["epoch3Badge"] = targets.get("epoch3Badge") or "TRANSFORMER // T=22.7h"
        targets["epoch4Time"] = targets.get("epoch4Time") or "23:59:56"
        targets["epoch4Title"] = targets.get("epoch4Title") or "Autonomous Reasoning Swarms"
        targets["epoch4Desc"] = targets.get("epoch4Desc") or "2026: Multi-agent autonomous swarms, self-healing code loops, and stateful recursive inference."
        targets["epoch4Badge"] = targets.get("epoch4Badge") or "EXPONENTIAL // T=23.99h"
        targets["accentColor"] = targets.get("accentColor") or "#00E5FF"
        targets["activeColor"] = targets.get("activeColor") or "#10B981"

    elif mg_type == "hero_reveal":
        if any(k in text_lower for k in ["founder", "50-person", "swarm", "solo", "orchestrated"]):
            targets["label"] = "COGNITIVE LEVERAGE"
            targets["headline"] = "1 Founder = 50-Person Output"
            targets["supporting"] = "Orchestrated swarms replace legacy engineering queues."
        elif any(k in text_lower for k in ["toil", "manual", "architect", "work for you"]):
            targets["label"] = "SYSTEMS ARCHITECT THESIS"
            targets["headline"] = "Stop Doing Manual Toil"
            targets["supporting"] = "Architect the system that does the work for you."
        else:
            targets["label"] = targets.get("badge") or targets.get("tag") or "PARADIGM SHIFT"
            targets["headline"] = targets.get("title") or (text_clean if len(text_clean) <= 45 else text_clean[:42] + "...")
            targets["supporting"] = targets.get("synthesis") or "Autonomous compute compounding execution."

    return targets


def call_director_llm(system_prompt: str, user_prompt: str, timeout: float = 8.0) -> Optional[Dict[str, Any]]:
    """
    Calls configured LLM provider (DeepSeek, OpenAI, Mistral) to return structured JSON.
    Returns parsed dictionary on success, or None on failure/offline.
    """
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if not deepseek_key and not openai_key:
        return None

    try:
        from openai import OpenAI
        if deepseek_key:
            client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com/v1", timeout=timeout)
            model = "deepseek-chat"
        else:
            client = OpenAI(api_key=openai_key, timeout=timeout)
            model = "gpt-4o-mini"

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=800
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"  [ChunkDirector:LLM_FALLBACK] LLM call bypassed ({e})")
        return None


def resolve_archetype_for_chunk(
    chunk: ScriptChunk,
    context_before: str = "",
    context_after: str = "",
    topic: str = "technology",
    use_llm: bool = False
) -> Tuple[VisualArchetype, float, Optional[str], Optional[Dict[str, Any]], str]:
    """
    Evaluates a ScriptChunk through the 2-Stage Visual Taxonomy:
      Stage 1: Intent & Significance Classification (LLM with Heuristic fallback)
      Stage 2: Entity & Dynamic Prop Extraction (LLM with Slot-filling & Default fallback)

    Returns:
      (archetype, confidence, primary_template, dynamic_props, reason)
    """
    # 1. Stage 1: Intent Classification via LLM (if enabled)
    classification = None
    if use_llm:
        sys_p = build_classification_system_prompt()
        user_p = build_classification_user_prompt(chunk.text, context_before, context_after, niche=topic)
        classification = call_director_llm(sys_p, user_p, timeout=6.0)

    if classification and isinstance(classification, dict):
        is_sig = classification.get("is_significant", False)
        arch_str = str(classification.get("archetype", "NONE")).upper().strip()
        conf = float(classification.get("confidence", 0.9))
        reason = classification.get("reason", "LLM Intent Classification")

        if is_sig and arch_str in VisualArchetype.__members__ and arch_str != "NONE":
            archetype = VisualArchetype[arch_str]
            spec = ARCHETYPE_REGISTRY[archetype]
            tmpl = spec.primary_template

            # Stage 2: Dynamic Prop Extraction via LLM
            ext_props = None
            if use_llm:
                prop_p = build_prop_extraction_prompt(chunk.text, archetype, niche=topic)
                ext_props = call_director_llm("You are an accurate visual data extractor. Output valid JSON.", prop_p, timeout=6.0)

            # Sanitize and fill defaults
            sanitized = sanitize_and_fill_defaults(tmpl, ext_props or {})
            return archetype, conf, tmpl, sanitized, reason
        elif not is_sig or arch_str == "NONE":
            return VisualArchetype.NONE, conf, None, None, reason

    # 2. Stage 1 Heuristic Fallback (0ms 100% reliable)
    arch, conf, match_info = classify_chunk_by_heuristics(chunk.text)
    if arch != VisualArchetype.NONE and conf >= 0.70:
        spec = ARCHETYPE_REGISTRY[arch]
        tmpl = spec.primary_template
        # Extract slot-filled dynamic props from chunk
        slot_targets = build_dynamic_motion_graphic_targets(tmpl, chunk, spec.default_props)
        sanitized = sanitize_and_fill_defaults(tmpl, slot_targets)
        return arch, conf, tmpl, sanitized, f"Heuristic Match: {match_info}"

    return VisualArchetype.NONE, 0.2, None, None, "Conversational / B-roll line"


def direct_micro_chunk(
    chunk: ScriptChunk,
    topic: str = "technology",
    style: str = "viral",
    allow_motion_graphic: bool = True,
    context_before: str = "",
    context_after: str = "",
    use_llm: bool = False,
) -> List[EditDecision]:
    """
    Directs a single ScriptChunk.
    Determines whether a motion graphic or B-roll should be applied,
    and returns 1-2 EditDecision objects.
    """
    decisions: List[EditDecision] = []
    chunk_text_lower = chunk.text.lower()
    c_start = chunk.start
    c_end = chunk.end
    c_dur = chunk.duration
    selected_mg = None
    if allow_motion_graphic:
        # 1. First check explicit template mappings (high precision exact keywords)
        for mapping in TEMPLATE_MAPPINGS:
            if any(k in chunk_text_lower for k in mapping["keywords"]):
                selected_mg = mapping
                break

        # 2. Priority check: Does the chunk explicitly contain a list of points?
        if not selected_mg:
            detected_list = detect_script_list_points(chunk.text)
            if detected_list:
                selected_mg = {
                    "template": "todo_list",
                    "default_targets": detected_list,
                    "personality": "technical",
                    "keywords": ["list_points_detected"]
                }

        # 3. Dynamic evaluation through the Visual Rhetoric Taxonomy (LLM + Semantic Archetypes)
        if not selected_mg:
            arch, conf, tmpl, dynamic_props, reason = resolve_archetype_for_chunk(
                chunk=chunk,
                context_before=context_before,
                context_after=context_after,
                topic=topic,
                use_llm=use_llm
            )

            if arch != VisualArchetype.NONE and tmpl:
                hold_dur = min(3.5, max(2.5, c_dur))
                mg_end = round(min(c_end, c_start + hold_dur), 2)
                spec = ARCHETYPE_REGISTRY.get(arch)
                personality = spec.default_props.get("personality", "technical") if spec else "technical"

                decisions.append(
                    EditDecision(
                        action="motion_graphics",
                        trigger_id=chunk.chunk_id,
                        start=c_start,
                        end=mg_end,
                        motion_graphics_type=tmpl,
                        motion_graphics_targets=dynamic_props,
                        motion_graphics_personality=personality,
                        reason=f"Taxonomy [{arch.value}]: {reason}",
                        layer="front"
                    )
                )
                return decisions

    if selected_mg:
        # Motion Graphic decision with dynamic slot-filled props
        mg_type = selected_mg["template"]
        targets = build_dynamic_motion_graphic_targets(
            mg_type=mg_type,
            chunk=chunk,
            default_targets=selected_mg["default_targets"]
        )

        hold_dur = min(3.5, max(2.5, c_dur))
        mg_end = round(min(c_end, c_start + hold_dur), 2)

        decisions.append(
            EditDecision(
                action="motion_graphics",
                trigger_id=chunk.chunk_id,
                start=c_start,
                end=mg_end,
                motion_graphics_type=mg_type,
                motion_graphics_targets=targets,
                motion_graphics_personality=selected_mg["personality"],
                reason=f"Precision micro-directing: detected '{selected_mg['keywords'][0]}' in '{chunk.chunk_id}'",
                layer="front"
            )
        )

    else:
        # Contextual B-Roll decision
        search_query = extract_broll_search_query(chunk.text, topic=topic)

        # High-retention pacing: If chunk > 4.2s, split into 2 rapid B-roll cuts
        if c_dur > 4.2:
            mid = round(c_start + (c_dur / 2.0), 2)
            # Cut 1
            decisions.append(
                EditDecision(
                    action="b_roll",
                    trigger_id=f"{chunk.chunk_id}_cut1",
                    start=c_start,
                    end=mid,
                    search_query=search_query,
                    reason=f"Micro-scene rapid cut 1/2 for '{chunk.chunk_id}'",
                    transition="crossfade"
                )
            )
            # Cut 2 with secondary keyword variation
            if "close up" in search_query:
                secondary_query = search_query.replace("close up", "macro detail").strip()
            else:
                secondary_query = f"{search_query} close up"
            decisions.append(
                EditDecision(
                    action="b_roll",
                    trigger_id=f"{chunk.chunk_id}_cut2",
                    start=mid,
                    end=c_end,
                    search_query=secondary_query,
                    reason=f"Micro-scene rapid cut 2/2 for '{chunk.chunk_id}'",
                    transition="crossfade"
                )
            )
        else:
            decisions.append(
                EditDecision(
                    action="b_roll",
                    trigger_id=chunk.chunk_id,
                    start=c_start,
                    end=c_end,
                    search_query=search_query,
                    reason=f"Contextual B-roll matching: '{search_query}' for '{chunk.chunk_id}'",
                    transition="fade"
                )
            )

    return decisions


def direct_all_chunks(
    chunks: List[ScriptChunk],
    topic: str = "technology",
    style: str = "viral",
    min_mg_spacing: float = 3.0,
    use_llm: bool = False,
) -> EditList:
    """
    Directs all micro-chunks in sequence.
    Enforces spacing guardrails so motion graphic cards don't collide or play back-to-back
    without visual breathing room.
    """
    all_edits: List[EditDecision] = []
    last_mg_end = -999.0

    for idx, chunk in enumerate(chunks):
        # Check if enough time has elapsed since previous motion graphic
        can_use_mg = (chunk.start - last_mg_end >= min_mg_spacing)
        context_before = chunks[idx - 1].text if idx > 0 else ""
        context_after = chunks[idx + 1].text if idx < len(chunks) - 1 else ""

        chunk_edits = direct_micro_chunk(
            chunk=chunk,
            topic=topic,
            style=style,
            allow_motion_graphic=can_use_mg,
            context_before=context_before,
            context_after=context_after,
            use_llm=use_llm,
        )

        for edit in chunk_edits:
            all_edits.append(edit)
            if edit.action == "motion_graphics":
                last_mg_end = edit.end or (edit.start + 3.0)

    all_edits.sort(key=lambda e: (e.start if e.start is not None else 0.0))
    return EditList(edits=all_edits)


def stitch_micro_scenes_to_blueprint(
    chunks: List[ScriptChunk],
    total_duration: float,
    topic: str = "technology",
    style: str = "viral",
    is_faceless: bool = True,
    min_mg_spacing: float = 3.5,
    use_llm: bool = False,
) -> EditList:
    """
    Stitches directed micro-scenes into a production-ready Master Edit Decision List (EDL).

    Guarantees:
      1. Gapless B-roll snapping: 0 black frames across the entire runtime for faceless videos.
      2. Motion graphic breathing room: >= min_mg_spacing (3.5s) between cards.
      3. Automatic audio SFX synchronization: attaches punchy cues to visual entries.
      4. Cinematic transitions: inserted at major narrative progression marks.
    """
    # 1. Direct all individual micro-chunks
    raw_plan = direct_all_chunks(chunks, topic=topic, style=style, min_mg_spacing=min_mg_spacing, use_llm=use_llm)

    # 1b. Enforce Phase 3 Pacing & Budget Gatekeeper
    from services.pacing_gatekeeper import prune_motion_graphics_by_pacing_and_budget
    timestamp_map = {c.chunk_id: {"start": c.start, "end": c.end, "text": c.text} for c in chunks}
    pacing_edits, _, _ = prune_motion_graphics_by_pacing_and_budget(
        edits=[e.model_dump() for e in raw_plan.edits],
        timestamp_map=timestamp_map,
        video_duration=total_duration,
        min_spacing_sec=min_mg_spacing,
        style=style,
        topic=topic,
        downgrade_to_broll=True,
    )
    allowed_fields = set(EditDecision.model_fields.keys())
    validated_raw_edits = [
        EditDecision(**{k: v for k, v in e.items() if k in allowed_fields})
        for e in pacing_edits
    ]

    brolls = [e for e in validated_raw_edits if e.action == "b_roll"]
    mgs = [e for e in validated_raw_edits if e.action == "motion_graphics"]

    final_edits: List[EditDecision] = []

    # 2. Seamless B-roll snapping for continuous visual canvas
    if is_faceless and brolls:
        brolls.sort(key=lambda x: (x.start if x.start is not None else 0.0))
        brolls[0].start = 0.0

        for i in range(len(brolls) - 1):
            curr_b = brolls[i]
            next_b = brolls[i + 1]
            if curr_b.end is not None and next_b.start is not None:
                # Extend or trim so they meet seamlessly with zero gap
                curr_b.end = round(next_b.start, 2)

        # Snap last B-roll to the end of the video
        brolls[-1].end = round(total_duration, 2)

        # Remove micro-cuts (< 1.2s) by merging into preceding cut
        cleaned_brolls: List[EditDecision] = []
        for b in brolls:
            dur = (b.end or 0.0) - (b.start or 0.0)
            if dur < 1.2 and cleaned_brolls:
                cleaned_brolls[-1].end = b.end
            else:
                cleaned_brolls.append(b)
        brolls = cleaned_brolls

    final_edits.extend(brolls)

    # 3. Motion graphics refinement and template variety
    chunk_lookup = {c.chunk_id: c for c in chunks}
    last_mg_type = None
    cleaned_mgs: List[EditDecision] = []
    for mg in mgs:
        # Guarantee 2.5s - 3.5s punchy hold duration
        hold = min(3.5, max(2.5, (mg.end or 0.0) - (mg.start or 0.0)))
        mg.end = round((mg.start or 0.0) + hold, 2)

        # Variety check: rotate template if identical to immediately preceding graphic
        if last_mg_type and mg.motion_graphics_type == last_mg_type:
            if mg.motion_graphics_type == "showdown_duel":
                mg.motion_graphics_type = "split_slider_comparison"
            elif mg.motion_graphics_type == "metric_reveal":
                mg.motion_graphics_type = "stat_card_highlight"
            else:
                mg.motion_graphics_type = "hero_reveal"

            # Re-build dynamic targets for the newly rotated template
            assoc_chunk = chunk_lookup.get(mg.trigger_id)
            if assoc_chunk:
                mg.motion_graphics_targets = build_dynamic_motion_graphic_targets(
                    mg_type=mg.motion_graphics_type,
                    chunk=assoc_chunk,
                    default_targets=dict(mg.motion_graphics_targets or {})
                )

        # Ensure hero_reveal always has proper headline, label, and supporting keys
        if mg.motion_graphics_type == "hero_reveal":
            targets = dict(mg.motion_graphics_targets or {})
            if "headline" not in targets or not targets["headline"]:
                targets["headline"] = targets.get("title") or targets.get("quote") or targets.get("leftTitle") or "The Autonomous Shift"
            if "label" not in targets or not targets["label"]:
                raw_badge = targets.get("badge") or targets.get("tag") or targets.get("author") or "COGNITIVE LEVERAGE"
                targets["label"] = raw_badge.replace("⚡", "").replace("📋", "").strip()
            if "supporting" not in targets:
                targets["supporting"] = targets.get("synthesis") or targets.get("subtitle") or targets.get("rightDetail") or ""
            mg.motion_graphics_targets = targets

        # Ensure todo_list always has proper title, badge, format, and point keys
        if mg.motion_graphics_type == "todo_list":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "SYSTEMS ARCHITECT PLAYBOOK"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "📋 EXECUTION CHECKLIST"
            if "format" not in targets or not targets["format"]:
                targets["format"] = "todo"
            if "point1" not in targets or not targets["point1"]:
                targets["point1"] = targets.get("item1Text") or targets.get("step1") or "Automate Diagnostic Friction Audits"
            if "point2" not in targets or not targets["point2"]:
                targets["point2"] = targets.get("item2Text") or targets.get("step2") or "Deploy Scoped Autonomous Agents"
            if "point3" not in targets or not targets["point3"]:
                targets["point3"] = targets.get("item3Text") or targets.get("step3") or "Anchor to Deterministic Verification Gates"
            mg.motion_graphics_targets = targets

        # Ensure architecture_pipeline always has proper title, subtitle, and stage keys
        if mg.motion_graphics_type == "architecture_pipeline":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "AUTONOMOUS REASONING ARCHITECTURE"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "END-TO-END DATA FLOW & VERIFICATION ENGINE"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "⚡ SYSTEM ARCHITECTURE"
            if "stage1Title" not in targets or not targets["stage1Title"]:
                targets["stage1Title"] = targets.get("step1") or targets.get("point1") or "Multimodal Telemetry"
            if "stage1Desc" not in targets:
                targets["stage1Desc"] = "Parallel streaming ingestion"
            if "stage2Title" not in targets or not targets["stage2Title"]:
                targets["stage2Title"] = targets.get("step2") or targets.get("point2") or "Vector Knowledge Core"
            if "stage3Title" not in targets or not targets["stage3Title"]:
                targets["stage3Title"] = targets.get("step3") or targets.get("point3") or "Recursive Agent Loop"
            if "stage4Title" not in targets or not targets["stage4Title"]:
                targets["stage4Title"] = targets.get("step4") or targets.get("point4") or "Deterministic Gate"
            mg.motion_graphics_targets = targets

        # Ensure causal_loop always has proper title, loopType, and node keys
        if mg.motion_graphics_type == "causal_loop":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE SYSTEMIC FEEDBACK LOOP"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "🔄 REINFORCING FLYWHEEL (+)"
            if "node1Title" not in targets or not targets["node1Title"]:
                targets["node1Title"] = targets.get("step1") or targets.get("point1") or "Aggressive Capital Injection"
            if "node1Desc" not in targets:
                targets["node1Desc"] = "Initial stimulus trigger"
            if "node2Title" not in targets or not targets["node2Title"]:
                targets["node2Title"] = targets.get("step2") or targets.get("point2") or "Asset Price Inflation"
            if "node3Title" not in targets or not targets["node3Title"]:
                targets["node3Title"] = targets.get("step3") or targets.get("point3") or "Aggressive Rate Hikes"
            if "node4Title" not in targets or not targets["node4Title"]:
                targets["node4Title"] = targets.get("step4") or targets.get("point4") or "Cascading Liquidity Crunch"
            mg.motion_graphics_targets = targets

        # Ensure exploded_layer_stack always has proper title, subtitle, and layer keys
        if mg.motion_graphics_type == "exploded_layer_stack":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE AUTONOMOUS AGENT STACK"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "ISOMETRIC SYSTEM ARCHITECTURE"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below."
            if "layer1Title" not in targets or not targets["layer1Title"]:
                targets["layer1Title"] = targets.get("step1") or targets.get("point1") or "Foundational Neural Weights"
            if "layer1Desc" not in targets:
                targets["layer1Desc"] = "Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth."
            if "layer2Title" not in targets or not targets["layer2Title"]:
                targets["layer2Title"] = targets.get("step2") or targets.get("point2") or "Context Window Orchestration"
            if "layer3Title" not in targets or not targets["layer3Title"]:
                targets["layer3Title"] = targets.get("step3") or targets.get("point3") or "Long-Term Memory & Graph RAG"
            if "layer4Title" not in targets or not targets["layer4Title"]:
                targets["layer4Title"] = targets.get("step4") or targets.get("point4") or "Autonomous Tool Execution"
            mg.motion_graphics_targets = targets

        # Ensure bottleneck_constriction always has proper title, inputMetric, and chokeMetric keys
        if mg.motion_graphics_type == "bottleneck_constriction":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE COMPUTE MEMORY WALL"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "THROUGHPUT CAPACITY FUNNEL"
            if "inputLabel" not in targets or not targets["inputLabel"]:
                targets["inputLabel"] = "INCOMING CAPACITY"
            if "inputMetric" not in targets or not targets["inputMetric"]:
                targets["inputMetric"] = "1,000 TFLOPS"
            if "chokeLabel" not in targets or not targets["chokeLabel"]:
                targets["chokeLabel"] = "HBM INTERCONNECT BANDWIDTH"
            if "chokeMetric" not in targets or not targets["chokeMetric"]:
                targets["chokeMetric"] = "CHOKE POINT: 3.2 TB/S"
            if "outputLabel" not in targets or not targets["outputLabel"]:
                targets["outputLabel"] = "EFFECTIVE OUTPUT"
            if "outputMetric" not in targets or not targets["outputMetric"]:
                targets["outputMetric"] = "12 TFLOPS"
            if "efficiency" not in targets or not targets["efficiency"]:
                targets["efficiency"] = "1.2% YIELD"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units."
            mg.motion_graphics_targets = targets

        # Ensure trilemma_tradeoff always has proper vertex titles
        if mg.motion_graphics_type == "trilemma_tradeoff":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE BLOCKCHAIN TRILEMMA"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED."
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "ARCHITECTURAL TRADE-OFF THEOREM"
            if "axiom" not in targets or not targets["axiom"]:
                targets["axiom"] = "Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity."
            if "vertex1Title" not in targets or not targets["vertex1Title"]:
                targets["vertex1Title"] = targets.get("step1") or targets.get("point1") or "Decentralization"
            if "vertex1Desc" not in targets or not targets["vertex1Desc"]:
                targets["vertex1Desc"] = "Distributed nodes worldwide with zero central point of failure"
            if "vertex2Title" not in targets or not targets["vertex2Title"]:
                targets["vertex2Title"] = targets.get("step2") or targets.get("point2") or "Security"
            if "vertex2Desc" not in targets or not targets["vertex2Desc"]:
                targets["vertex2Desc"] = "Cryptographic proof-of-work consensus protecting state history"
            if "vertex3Title" not in targets or not targets["vertex3Title"]:
                targets["vertex3Title"] = targets.get("step3") or targets.get("point3") or "Scalability"
            if "vertex3Desc" not in targets or not targets["vertex3Desc"]:
                targets["vertex3Desc"] = "High transaction throughput and low latency confirmation"
            if "sacrificedVertex" not in targets:
                targets["sacrificedVertex"] = 3
            mg.motion_graphics_targets = targets

        # Ensure scale_zoom_ladder always has proper 3-step value and multiplier targets
        if mg.motion_graphics_type == "scale_zoom_ladder":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE ILLUSION OF SCALE"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "EXPONENTIAL MAGNITUDE LADDER"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale."
            if "step1Value" not in targets or not targets["step1Value"]:
                targets["step1Value"] = targets.get("step1") or targets.get("point1") or "$1 MILLION"
            if "step1Label" not in targets or not targets["step1Label"]:
                targets["step1Label"] = "11.5 DAYS"
            if "step1Desc" not in targets or not targets["step1Desc"]:
                targets["step1Desc"] = "1 Million seconds elapsed in real time"
            if "step1Metric" not in targets or not targets["step1Metric"]:
                targets["step1Metric"] = "1x (BASE UNIT)"
            if "step2Value" not in targets or not targets["step2Value"]:
                targets["step2Value"] = targets.get("step2") or targets.get("point2") or "$1 BILLION"
            if "step2Label" not in targets or not targets["step2Label"]:
                targets["step2Label"] = "31.7 YEARS"
            if "step2Desc" not in targets or not targets["step2Desc"]:
                targets["step2Desc"] = "1 Billion seconds elapsed (entire career)"
            if "step2Metric" not in targets or not targets["step2Metric"]:
                targets["step2Metric"] = "1,000x MULTIPLIER"
            if "step3Value" not in targets or not targets["step3Value"]:
                targets["step3Value"] = targets.get("step3") or targets.get("point3") or "$1 TRILLION"
            if "step3Label" not in targets or not targets["step3Label"]:
                targets["step3Label"] = "31,700 YEARS"
            if "step3Desc" not in targets or not targets["step3Desc"]:
                targets["step3Desc"] = "1 Trillion seconds (before recorded civilization)"
            if "step3Metric" not in targets or not targets["step3Metric"]:
                targets["step3Metric"] = "1,000,000x MONOLITH"
            mg.motion_graphics_targets = targets

        # Ensure decision_tree_fork always has root and both branch targets
        if mg.motion_graphics_type == "decision_tree_fork":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE ARCHITECTURAL BIFURCATION"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "BIFURCATION DECISION FORK"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves."
            if "rootTitle" not in targets or not targets["rootTitle"]:
                targets["rootTitle"] = targets.get("point1") or targets.get("step1") or "FOUNDATION MODEL ARCHITECTURE"
            if "rootDesc" not in targets or not targets["rootDesc"]:
                targets["rootDesc"] = "Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure."
            if "rootBadge" not in targets or not targets["rootBadge"]:
                targets["rootBadge"] = "DECISION FORK // T=0"
            if "branch1Title" not in targets or not targets["branch1Title"]:
                targets["branch1Title"] = targets.get("point2") or targets.get("step2") or "Path A: Proprietary Closed API"
            if "branch1Desc" not in targets or not targets["branch1Desc"]:
                targets["branch1Desc"] = "Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints."
            if "branch1Badge" not in targets or not targets["branch1Badge"]:
                targets["branch1Badge"] = "WALLED GARDEN"
            if "branch1Metric" not in targets or not targets["branch1Metric"]:
                targets["branch1Metric"] = "HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY"
            if "branch2Title" not in targets or not targets["branch2Title"]:
                targets["branch2Title"] = targets.get("point3") or targets.get("step3") or "Path B: Open-Weights Swarm"
            if "branch2Desc" not in targets or not targets["branch2Desc"]:
                targets["branch2Desc"] = "Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale."
            if "branch2Badge" not in targets or not targets["branch2Badge"]:
                targets["branch2Badge"] = "AUTONOMOUS SWARM"
            if "branch2Metric" not in targets or not targets["branch2Metric"]:
                targets["branch2Metric"] = "INFINITE SCALING // 100% OWNED INFRASTRUCTURE"
            mg.motion_graphics_targets = targets

        # Ensure radar_spider_chart always has axes and entity benchmarks
        if mg.motion_graphics_type == "radar_spider_chart":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "FRONTIER MODEL BENCHMARK"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "POLYGONAL RADAR BENCHMARK"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy."
            if "axis1" not in targets or not targets["axis1"]:
                targets["axis1"] = targets.get("point1") or targets.get("step1") or "Reasoning Depth"
            if "axis2" not in targets or not targets["axis2"]:
                targets["axis2"] = targets.get("point2") or targets.get("step2") or "Inference Speed"
            if "axis3" not in targets or not targets["axis3"]:
                targets["axis3"] = targets.get("point3") or targets.get("step3") or "Context Coherence"
            if "axis4" not in targets or not targets["axis4"]:
                targets["axis4"] = targets.get("point4") or targets.get("step4") or "Cost Efficiency"
            if "axis5" not in targets or not targets["axis5"]:
                targets["axis5"] = "Autonomous Agency"
            if "entity1Name" not in targets or not targets["entity1Name"]:
                targets["entity1Name"] = "Autonomous Agent System"
            if "entity2Name" not in targets or not targets["entity2Name"]:
                targets["entity2Name"] = "Monolithic Base LLM"
            mg.motion_graphics_targets = targets

        # Ensure pareto_power_law always has vital and trivial long tail breakdown
        if mg.motion_graphics_type == "pareto_power_law":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "THE PARETO PRINCIPLE"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "POWER LAW DYNAMICS"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives."
            if "vitalPct" not in targets or not targets["vitalPct"]:
                targets["vitalPct"] = "20%"
            if "vitalLabel" not in targets or not targets["vitalLabel"]:
                targets["vitalLabel"] = targets.get("point1") or targets.get("step1") or "THE VITAL FEW"
            if "vitalDesc" not in targets or not targets["vitalDesc"]:
                targets["vitalDesc"] = "Core architectural primitives, foundational models & automated CI/CD pipelines"
            if "vitalReturn" not in targets or not targets["vitalReturn"]:
                targets["vitalReturn"] = "80% SYSTEM IMPACT"
            if "trivialPct" not in targets or not targets["trivialPct"]:
                targets["trivialPct"] = "80%"
            if "trivialLabel" not in targets or not targets["trivialLabel"]:
                targets["trivialLabel"] = targets.get("point2") or targets.get("step2") or "THE TRIVIAL MANY (LONG TAIL)"
            if "trivialDesc" not in targets or not targets["trivialDesc"]:
                targets["trivialDesc"] = "Marginal feature edge-cases, manual configuration toil & vanity optimizations"
            if "trivialReturn" not in targets or not targets["trivialReturn"]:
                targets["trivialReturn"] = "20% RESIDUAL VALUE"
            mg.motion_graphics_targets = targets

        # Ensure chrono_dial_clock always has chronometer epochs
        if mg.motion_graphics_type == "chrono_dial_clock":
            targets = dict(mg.motion_graphics_targets or {})
            if "title" not in targets or not targets["title"]:
                targets["title"] = "AI HISTORY IN 24 HOURS"
            if "subtitle" not in targets or not targets["subtitle"]:
                targets["subtitle"] = "1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER"
            if "badge" not in targets or not targets["badge"]:
                targets["badge"] = "24-HOUR CHRONOMETER"
            if "synthesis" not in targets or not targets["synthesis"]:
                targets["synthesis"] = "If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds."
            if "currentTime" not in targets or not targets["currentTime"]:
                targets["currentTime"] = "23:59:56"
            if "timeframe" not in targets or not targets["timeframe"]:
                targets["timeframe"] = "1950 — 2026 (76 Years)"
            if "epoch1Title" not in targets or not targets["epoch1Title"]:
                targets["epoch1Title"] = targets.get("point1") or targets.get("step1") or "Turing Test & Perceptron"
            if "epoch1Time" not in targets or not targets["epoch1Time"]:
                targets["epoch1Time"] = "00:00"
            if "epoch2Title" not in targets or not targets["epoch2Title"]:
                targets["epoch2Title"] = targets.get("point2") or targets.get("step2") or "Deep Learning Resurgence"
            if "epoch2Time" not in targets or not targets["epoch2Time"]:
                targets["epoch2Time"] = "18:30"
            if "epoch3Title" not in targets or not targets["epoch3Title"]:
                targets["epoch3Title"] = targets.get("point3") or targets.get("step3") or "Attention & Transformer Core"
            if "epoch3Time" not in targets or not targets["epoch3Time"]:
                targets["epoch3Time"] = "22:45"
            if "epoch4Title" not in targets or not targets["epoch4Title"]:
                targets["epoch4Title"] = targets.get("point4") or targets.get("step4") or "Autonomous Reasoning Swarms"
            if "epoch4Time" not in targets or not targets["epoch4Time"]:
                targets["epoch4Time"] = "23:59:56"
            mg.motion_graphics_targets = targets

        last_mg_type = mg.motion_graphics_type
        cleaned_mgs.append(mg)

    final_edits.extend(cleaned_mgs)

    # 4. Synchronized Audio SFX placement
    last_sfx_time = -999.0
    sfx_idx = 0
    sfx_sounds = ["whoosh-in", "pop", "ding", "impact"]

    for mg in cleaned_mgs:
        sfx_start = round((mg.start or 0.0) + 0.05, 2)
        if sfx_start - last_sfx_time >= 2.0 and sfx_start < total_duration - 0.5:
            sound = sfx_sounds[sfx_idx % len(sfx_sounds)]
            final_edits.append(
                EditDecision(
                    action="sfx",
                    trigger_id=f"sfx_mg_{sfx_idx+1}",
                    start=sfx_start,
                    end=round(sfx_start + 0.5, 2),
                    sound_effect=sound,
                    reason=f"Impact audio cue ({sound}) emphasizing motion graphic entry",
                )
            )
            last_sfx_time = sfx_start
            sfx_idx += 1

    # 5. Cinematic Transitions at scene shift marks (every ~35-45s)
    if total_duration >= 30.0:
        trans_intervals = [35.0, 75.0, 115.0, 155.0]
        for idx, t in enumerate(trans_intervals, 1):
            if t < total_duration - 5.0:
                trans_type = "whip_pan" if (idx % 2 == 1) else "crossfade"
                final_edits.append(
                    EditDecision(
                        action="transition",
                        trigger_id=f"trans_scene_{idx}",
                        start=round(t, 2),
                        end=round(t + 0.5, 2),
                        transition=trans_type,
                        reason=f"Cinematic {trans_type} transition dividing narrative acts",
                    )
                )

    # Sort all edits chronologically
    final_edits.sort(key=lambda e: (e.start if e.start is not None else 0.0))
    return EditList(edits=final_edits)


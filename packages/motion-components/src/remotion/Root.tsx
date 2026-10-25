import React from 'react';
import { Composition } from 'remotion';
import { HeroReveal } from './compositions/HeroReveal';
import { MetricReveal } from './compositions/MetricReveal';
import { QuoteReveal } from './compositions/QuoteReveal';
import { StepSequence } from './compositions/StepSequence';
import { BeforeAfter } from './compositions/BeforeAfter';
import { ChartReveal } from './compositions/ChartReveal';
import { IconReveal } from './compositions/IconReveal';
import { CodeReveal } from './compositions/CodeReveal';
import { StatCardHighlight } from './compositions/StatCardHighlight';
import { BrowserWalkthrough } from './compositions/BrowserWalkthrough';
import { VSCodeTyping } from './compositions/VSCodeTyping';
import { KineticText } from './compositions/KineticText';
import { CookedMotionCard } from './compositions/CookedMotionCard';
import { AppScreenUpload } from './compositions/AppScreenUpload';
import { ShapeElement } from './compositions/ShapeElement';
import { EffectOverlay } from './compositions/EffectOverlay';
import { ShowdownDuel } from './compositions/ShowdownDuel';
import { BattleChart } from './compositions/BattleChart';
import { WallStreetFailureHook } from './compositions/WallStreetFailureHook';
import { CompoundFormula } from './compositions/CompoundFormula';
import { SpotlightCone } from './compositions/SpotlightCone';
import { PerceptionGauge } from './compositions/PerceptionGauge';
import { BrainNeuralScan } from './compositions/BrainNeuralScan';
import { CognitiveDialogue } from './compositions/CognitiveDialogue';
import { NewspaperHighlighter } from './compositions/NewspaperHighlighter';
import { MagnifyingGlassZoom } from './compositions/MagnifyingGlassZoom';
import { UrgencyDialGauge } from './compositions/UrgencyDialGauge';
import { MindMapNodeWeb } from './compositions/MindMapNodeWeb';
import { TimelineRoadmap } from './compositions/TimelineRoadmap';
import { HierarchyPyramid } from './compositions/HierarchyPyramid';
import { TactileChecklistStamp } from './compositions/TactileChecklistStamp';
import { SplitSliderComparison } from './compositions/SplitSliderComparison';
import { CandlestickHUD } from './compositions/CandlestickHUD';
import { CompoundGrowthCurve } from './compositions/CompoundGrowthCurve';
import { PortfolioDonut } from './compositions/PortfolioDonut';
import { InflationCashBurn } from './compositions/InflationCashBurn';
import { BankingNotification } from './compositions/BankingNotification';
import { BudgetWaterfall } from './compositions/BudgetWaterfall';
import { DebtPayoffTracker } from './compositions/DebtPayoffTracker';
import { ROIBalanceScale } from './compositions/ROIBalanceScale';
import { WealthFlywheel } from './compositions/WealthFlywheel';
import { VennDiagram } from './compositions/VennDiagram';
import { FunnelAnalysis } from './compositions/FunnelAnalysis';
import { HorizontalProcessFlow } from './compositions/HorizontalProcessFlow';
import { FeatureCalloutPointer } from './compositions/FeatureCalloutPointer';
import { QuadrantMatrix } from './compositions/QuadrantMatrix';
import { SpectrumContinuum } from './compositions/SpectrumContinuum';
import { IcebergModel } from './compositions/IcebergModel';
import { ProsConsComparison } from './compositions/ProsConsComparison';
import { TodoList } from './compositions/TodoList';
import { ArchitecturePipeline } from './compositions/ArchitecturePipeline';
import { CausalLoop } from './compositions/CausalLoop';
import { ExplodedLayerStack } from './compositions/ExplodedLayerStack';
import { BottleneckConstriction } from './compositions/BottleneckConstriction';
import { TrilemmaTradeoff } from './compositions/TrilemmaTradeoff';
import { ScaleZoomLadder } from './compositions/ScaleZoomLadder';
import { DecisionTreeFork } from './compositions/DecisionTreeFork';
import { RadarSpiderChart } from './compositions/RadarSpiderChart';
import { ParetoPowerLaw } from './compositions/ParetoPowerLaw';
import { ChronoDialClock } from './compositions/ChronoDialClock';

// Remotion Root — all compositions registered here
// Python calls: npx remotion render src/remotion/Root.tsx <ID> --props='{}' out.mov

const FPS = 30;
const W = 1080;
const H = 1920;

const getMeta = ({ props }: { props: any }) => {
  const d = Number(props?.durationInFrames);
  return {
    durationInFrames: !isNaN(d) && d > 0 ? d : 150,
  };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="chrono-dial-clock" component={ChronoDialClock as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'AI HISTORY IN 24 HOURS',
        subtitle: '1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER',
        badge: '24-HOUR CHRONOMETER',
        synthesis: 'If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds.',
        currentTime: '23:59:56',
        timeframe: '1950 — 2026 (76 Years)',
        epoch1Time: '00:00',
        epoch1Title: 'Turing Test & Perceptron',
        epoch1Desc: '1950: Foundational symbolic AI logic, Turing computability thesis, and initial artificial neurons.',
        epoch1Badge: 'GENESIS // T=0h',
        epoch2Time: '18:30',
        epoch2Title: 'Deep Learning Resurgence',
        epoch2Desc: '2012: AlexNet & GPU-accelerated backpropagation prove deep convolutional nets crush legacy heuristics.',
        epoch2Badge: 'CONVOLUTION // T=18.5h',
        epoch3Time: '22:45',
        epoch3Title: 'Attention & Transformer Core',
        epoch3Desc: '2017: Attention Is All You Need shifts the computational paradigm to massively parallel matrix self-attention.',
        epoch3Badge: 'TRANSFORMER // T=22.7h',
        epoch4Time: '23:59:56',
        epoch4Title: 'Autonomous Reasoning Swarms',
        epoch4Desc: '2026: Multi-agent autonomous swarms, self-healing code loops, and stateful recursive inference.',
        epoch4Badge: 'EXPONENTIAL // T=23.99h',
        accentColor: '#00E5FF',
        activeColor: '#10B981',
        personality: 'technical',
      }} />
    <Composition id="pareto-power-law" component={ParetoPowerLaw as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE PARETO PRINCIPLE',
        subtitle: '80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE',
        badge: 'POWER LAW DYNAMICS',
        synthesis: 'In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives.',
        vitalPct: '20%',
        vitalLabel: 'THE VITAL FEW',
        vitalDesc: 'Core architectural primitives, foundational models & automated CI/CD pipelines',
        vitalReturn: '80% SYSTEM IMPACT',
        vitalColor: '#00E5FF',
        trivialPct: '80%',
        trivialLabel: 'THE TRIVIAL MANY (LONG TAIL)',
        trivialDesc: 'Marginal feature edge-cases, manual configuration toil & vanity optimizations',
        trivialReturn: '20% RESIDUAL VALUE',
        trivialColor: '#F59E0B',
        accentColor: '#00E5FF',
        personality: 'technical',
      }} />
    <Composition id="radar-spider-chart" component={RadarSpiderChart as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'FRONTIER MODEL BENCHMARK',
        subtitle: 'MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX',
        badge: 'POLYGONAL RADAR BENCHMARK',
        synthesis: 'Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy.',
        axis1: 'Reasoning Depth',
        axis2: 'Inference Speed',
        axis3: 'Context Coherence',
        axis4: 'Cost Efficiency',
        axis5: 'Autonomous Agency',
        entity1Name: 'Autonomous Agent System',
        entity1Score1: 96,
        entity1Score2: 72,
        entity1Score3: 98,
        entity1Score4: 86,
        entity1Score5: 94,
        entity1Badge: 'STATEFUL SWARM',
        entity1Color: '#00E5FF',
        entity2Name: 'Monolithic Base LLM',
        entity2Score1: 68,
        entity2Score2: 94,
        entity2Score3: 70,
        entity2Score4: 64,
        entity2Score5: 52,
        entity2Badge: 'ZERO-SHOT PROMPT',
        entity2Color: '#F59E0B',
        accentColor: '#00E5FF',
        personality: 'technical',
      }} />
    <Composition id="decision-tree-fork" component={DecisionTreeFork as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE ARCHITECTURAL BIFURCATION',
        subtitle: 'HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES',
        badge: 'BIFURCATION DECISION FORK',
        synthesis: 'Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves.',
        rootTitle: 'FOUNDATION MODEL ARCHITECTURE',
        rootDesc: 'Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure.',
        rootBadge: 'DECISION FORK // T=0',
        branch1Title: 'Path A: Proprietary Closed API',
        branch1Desc: 'Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints.',
        branch1Badge: 'WALLED GARDEN',
        branch1Metric: 'HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY',
        branch1Color: '#F43F5E',
        branch2Title: 'Path B: Open-Weights Swarm',
        branch2Desc: 'Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale.',
        branch2Badge: 'AUTONOMOUS SWARM',
        branch2Metric: 'INFINITE SCALING // 100% OWNED INFRASTRUCTURE',
        branch2Color: '#10B981',
        accentColor: '#00E5FF',
        personality: 'technical',
      }} />
    <Composition id="scale-zoom-ladder" component={ScaleZoomLadder as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE ILLUSION OF SCALE',
        subtitle: 'HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION',
        badge: 'EXPONENTIAL MAGNITUDE LADDER',
        synthesis: 'The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale.',
        step1Value: '$1 MILLION',
        step1Label: '11.5 DAYS',
        step1Desc: '1 Million seconds elapsed in real time',
        step1Metric: '1x (BASE UNIT)',
        step2Value: '$1 BILLION',
        step2Label: '31.7 YEARS',
        step2Desc: '1 Billion seconds elapsed (entire career)',
        step2Metric: '1,000x MULTIPLIER',
        step3Value: '$1 TRILLION',
        step3Label: '31,700 YEARS',
        step3Desc: '1 Trillion seconds (before recorded civilization)',
        step3Metric: '1,000,000x MONOLITH',
        accentColor: '#00E5FF',
        step1Color: '#38BDF8',
        step2Color: '#818CF8',
        step3Color: '#F43F5E',
        personality: 'technical',
      }} />
    <Composition id="trilemma-tradeoff" component={TrilemmaTradeoff as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE BLOCKCHAIN TRILEMMA',
        subtitle: 'YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED.',
        badge: 'ARCHITECTURAL TRADE-OFF THEOREM',
        axiom: 'Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity.',
        vertex1Title: 'Decentralization',
        vertex1Desc: 'Distributed nodes worldwide with zero central point of failure',
        vertex1Metric: '100% PRESERVED',
        vertex2Title: 'Security',
        vertex2Desc: 'Cryptographic proof-of-work consensus protecting state history',
        vertex2Metric: '100% PRESERVED',
        vertex3Title: 'Scalability',
        vertex3Desc: 'High transaction throughput and low latency confirmation',
        vertex3Metric: '15 TPS (SACRIFICED)',
        sacrificedVertex: 3,
        accentColor: '#00E5FF',
        activeColor: '#10B981',
        sacrificedColor: '#F43F5E',
        personality: 'technical',
      }} />
    <Composition id="bottleneck-constriction" component={BottleneckConstriction as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE COMPUTE MEMORY WALL',
        subtitle: 'WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH',
        badge: 'THROUGHPUT CAPACITY FUNNEL',
        inputLabel: 'INCOMING CAPACITY',
        inputMetric: '1,000 TFLOPS',
        inputDesc: 'Peak GPU arithmetic core saturation',
        chokeLabel: 'HBM INTERCONNECT BANDWIDTH',
        chokeMetric: 'CHOKE POINT: 3.2 TB/S',
        chokeDesc: 'Off-chip pin density & memory bus limit',
        restrictionPct: '-98.8%',
        outputLabel: 'EFFECTIVE OUTPUT',
        outputMetric: '12 TFLOPS',
        outputDesc: 'Sustained throughput under starvation',
        efficiency: '1.2% YIELD',
        synthesis: "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units.",
        personality: 'technical',
      }} />
    <Composition id="exploded-layer-stack" component={ExplodedLayerStack as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE AUTONOMOUS AGENT STACK',
        subtitle: 'DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE',
        badge: 'ISOMETRIC SYSTEM ARCHITECTURE',
        synthesis: 'Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below.',
        layer1Title: 'Foundational Neural Weights',
        layer1Desc: 'Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth.',
        layer1Badge: 'HARDWARE SUBSTRATE',
        layer1Metric: '4.8 TB/S BANDWIDTH',
        layer2Title: 'Context Window Orchestration',
        layer2Desc: 'Attention routing, KV-cache compression, and speculative token draft verification.',
        layer2Badge: 'NEURAL LATENT CORE',
        layer2Metric: '128K TOKENS / SEC',
        layer3Title: 'Long-Term Memory & Graph RAG',
        layer3Desc: 'Hierarchical vector indexing and real-time knowledge graph traversal.',
        layer3Badge: 'EPISTEMIC STATE',
        layer3Metric: '1.2M EMBEDDINGS',
        layer4Title: 'Autonomous Tool Execution',
        layer4Desc: 'Sandboxed agent synthesis, deterministic code interpreter, and external API invocation.',
        layer4Badge: 'COGNITIVE RUNTIME',
        layer4Metric: '< 150ms LATENCY',
        personality: 'technical',
      }} />
    <Composition id="causal-loop" component={CausalLoop as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE SYSTEMIC FEEDBACK LOOP',
        subtitle: 'HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES',
        badge: '🔄 REINFORCING FLYWHEEL (+)',
        loopType: 'reinforcing',
        centerLabel: 'REINFORCING LOOP',
        centerSub: 'COMPOUNDING DRIFT',
        synthesis: 'Each phase intensifies the subsequent shock, locking the architecture into an accelerating trajectory.',
        node1Title: 'Aggressive Capital Injection',
        node1Desc: 'Unprecedented stimulus liquidity floods market sectors.',
        node1Badge: 'TRIGGER CAUSE',
        node1Metric: '+$5.2T EXPANSION',
        node2Title: 'Asset Price Inflation',
        node2Desc: 'Equities and real estate valuations decouple from fundamentals.',
        node2Badge: 'AMPLIFICATION',
        node2Metric: '+48% RUN-UP',
        node3Title: 'Aggressive Rate Hikes',
        node3Desc: 'Central banks overtighten into overleveraged balance sheets.',
        node3Badge: 'SECONDARY SHOCK',
        node3Metric: '+525 BPS SURGE',
        node4Title: 'Cascading Liquidity Crunch',
        node4Desc: 'Forced deleveraging triggers emergency bailout demands.',
        node4Badge: 'FEEDBACK CLOSURE',
        node4Metric: 'CYCLE RE-IGNITED',
        personality: 'technical',
      }} />
    <Composition id="architecture-pipeline" component={ArchitecturePipeline as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'AUTONOMOUS REASONING ARCHITECTURE',
        subtitle: 'END-TO-END DATA FLOW & VERIFICATION ENGINE',
        badge: '⚡ SYSTEM ARCHITECTURE',
        stage1Title: 'Multimodal Telemetry',
        stage1Desc: 'Parallel ingestion of streaming logs, user signals, and system metrics.',
        stage1Badge: 'INGEST',
        stage1Metric: '100K EVT/S',
        stage2Title: 'Vector Knowledge Core',
        stage2Desc: 'Dense hybrid retrieval anchoring contextual relevance with sub-millisecond lookups.',
        stage2Badge: 'EMBED & RAG',
        stage2Metric: '4.2ms LATENCY',
        stage3Title: 'Recursive Agent Loop',
        stage3Desc: 'Autonomous multi-hop hypothesis testing and self-correcting tool execution.',
        stage3Badge: 'REASONING',
        stage3Metric: '99.4% RELIABILITY',
        stage4Title: 'Deterministic Gate',
        stage4Desc: 'Zero-regression assertion barrier validating compliance prior to production release.',
        stage4Badge: 'VERIFY',
        stage4Metric: '100% AUDIT PASS',
        personality: 'technical',
      }} />
    <Composition id="todo-list" component={TodoList as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'EXECUTION DIRECTIVES',
        badge: '📋 ACTION PROTOCOL',
        format: 'todo',
        point1: 'Automate Diagnostic Friction Audits',
        point2: 'Deploy Scoped Autonomous Agents',
        point3: 'Anchor to Deterministic Verification Gates',
        personality: 'technical'
      }} />
    <Composition id="hero-reveal" component={HeroReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'PARADIGM SHIFT', headline: 'Autonomous Architecture', supporting: 'Orchestrated swarms compound output.', personality: 'premium' }} />
    <Composition id="animated-counter" component={(props: any) => <CookedMotionCard type="likes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'SUBSCRIBERS', from: 0, to: 50000 }} />
    <Composition id="animated-kpi" component={MetricReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'MRR Growth', metric: '$48,500', delta: '+32%', personality: 'energetic' }} />
    <Composition id="metric-reveal" component={MetricReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'REVENUE', metric: '$4.2M', delta: '+127%', personality: 'energetic' }} />
    <Composition id="quote-reveal" component={QuoteReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ quote: 'Quote here', author: 'Author', personality: 'premium' }} />
    <Composition id="step-sequence" component={StepSequence as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'HOW IT WORKS', step1: 'Step 1', step2: 'Step 2', step3: 'Step 3', personality: 'energetic' }} />
    <Composition id="before-after" component={BeforeAfter as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ beforeLabel: 'BEFORE', before: 'Old', afterLabel: 'AFTER', after: 'New', personality: 'energetic' }} />
    <Composition id="chart-reveal" component={ChartReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'GROWTH', dataPoint1: '2023: $1M', dataPoint2: '2024: $4M', personality: 'technical' }} />
    <Composition id="showdown-duel" component={ShowdownDuel as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE $1,000,000 SHOWDOWN', wagerAmount: '$1,000,000 WAGER', timeframe: '10-YEAR CONTEST • 2007 ➔ 2017' }} />
    <Composition id="battle-chart" component={BattleChart as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: '10-YEAR RESULTS: THE VERDICT', subtitle: 'BUFFETT $1,000,000 CHALLENGE', sp500Return: 126, hedgeReturn: 36 }} />
    <Composition id="wall-street-failure-hook" component={WallStreetFailureHook as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ headline: 'WALL STREET FAILURE RATE', failureRate: 92 }} />
    <Composition id="compound-formula" component={CompoundFormula as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE 3-STEP WINNING FORMULA', autoAmount: '$500 / Month' }} />
    {/* High-Converting Finance Motion Graphics Pack */}
    <Composition id="candlestick-hud" component={CandlestickHUD as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ symbol: 'BTC / USD', timeframe: '4H BREAKOUT • HIGH VOLUME', startingPrice: 48250, endingPrice: 64180, percentageGain: '+32.8%', trend: 'bullish' }} />
    <Composition id="compound-growth-curve" component={CompoundGrowthCurve as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE EXPONENTIAL SNOWBALL EFFECT', monthlyDeposit: '$500 / Month', annualRate: '10% S&P 500 Historical', terminalCompound: 1130240, terminalCash: 180000 }} />
    <Composition id="portfolio-donut" component={PortfolioDonut as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE ALL-WEATHER ASSET ALLOCATION', totalValuation: 250000, subtitle: 'RAY DALIO & BOGLEHEAD DIVERSIFICATION BLUEPRINT' }} />
    <Composition id="inflation-cash-burn" component={InflationCashBurn as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ initialCapital: 10000, timeframeYears: 10, averageInflation: '7.2% / Year', terminalValue: 4980, lossPercentage: '-50.2%' }} />
    <Composition id="banking-notification" component={BankingNotification as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ headline: 'Direct Deposit Received', source: 'VOO Quarterly Dividend Payout • Vanguard', depositAmount: 4250, newNetWorth: 89450 }} />
    <Composition id="budget-waterfall" component={BudgetWaterfall as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ monthlyIncome: '$5,000 Net Income', needsAmount: '$2,500 (Rent, Food, Health)', wantsAmount: '$1,500 (Dining, Trips, Tech)', investAmount: '$1,000 (Index Funds & Wealth)' }} />
    <Composition id="debt-payoff-tracker" component={DebtPayoffTracker as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE DEBT AVALANCHE ACCELERATOR', strategy: 'MATHEMATICAL HIGHEST-APR DESTROYER', totalDebt: '$35,400 TOTAL DEBT', freedCashflow: '+$650 / MONTH FREED CAPITAL' }} />
    <Composition id="roi-balance-scale" component={ROIBalanceScale as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ leftName: 'New Financed SUV', leftCost: '-$850 / Month Payment', leftValue: '$14,000 (10 Yr Resale)', rightName: 'S&P 500 Index Fund', rightCost: '+$850 / Month Invested', rightValue: '$184,200 (10 Yr Compounded)' }} />
    <Composition id="wealth-flywheel" component={WealthFlywheel as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ mode: 'wealth', title: 'THE EXPONENTIAL WEALTH FLYWHEEL' }} />
    {/* Universal Explainer & Educational Motion Graphics Pack */}
    <Composition id="venn-diagram" component={VennDiagram as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE SWEET SPOT', subtitle: 'WHERE PASSION MEETS PROFIT & MASTERY', centerLabel: 'IKIGAI' }} />
    <Composition id="funnel-analysis" component={FunnelAnalysis as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'CONVERSION DROP-OFF', subtitle: 'HIGH-TICKET CLIENT PIPELINE' }} />
    <Composition id="horizontal-process-flow" component={HorizontalProcessFlow as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'HOW IT WORKS: 4-STEP BLUEPRINT', subtitle: 'FROM ZERO TO SCALED AUTOMATION', activeStep: 3 }} />
    <Composition id="feature-callout-pointer" component={FeatureCalloutPointer as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ headline: 'RETINAL HUD DISPLAY', category: 'HARDWARE ARCHITECTURE' }} />
    <Composition id="quadrant-matrix" component={QuadrantMatrix as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'EISENHOWER DECISION MATRIX', subtitle: 'URGENCY VS IMPORTANCE FRAMEWORK', activeQuadrant: 2 }} />
    <Composition id="spectrum-continuum" component={SpectrumContinuum as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE ARCHITECTURE SPECTRUM', subtitle: 'FINDING THE PRAGMATIC ENGINEERING BALANCE', currentValue: 68 }} />
    <Composition id="iceberg-model" component={IcebergModel as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE ICEBERG ILLUSION', subtitle: 'WHAT SUCCESS ACTUALLY DEMANDS' }} />
    <Composition id="pros-cons-comparison" component={ProsConsComparison as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'FRAMEWORK DUEL: NEXT.JS VS VITE', subtitle: 'MAKING THE PRODUCTION ARCHITECTURE DECISION' }} />

    {/* Universal Educational & Cognitive Motion Graphics Pack */}
    <Composition id="spotlight-cone" component={SpotlightCone as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ headline: 'THE SPOTLIGHT EFFECT', subtext: 'Convinced everyone is judging your every move?' }} />
    <Composition id="perception-gauge" component={PerceptionGauge as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'CORNELL SPOTLIGHT STUDY', perceivedValue: 54, actualValue: 18 }} />
    <Composition id="brain-neural-scan" component={BrainNeuralScan as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE SOLOMON PARADOX', cortexTitle: 'ADVISING A FRIEND', amygdalaTitle: 'ADVISING YOURSELF' }} />
    <Composition id="cognitive-dialogue" component={CognitiveDialogue as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'THE ILLEISM MENTAL HACK', firstPersonText: '"Why am I so overwhelmed?!"', thirdPersonText: '"Why is Alex stressed?"' }} />
    {/* Universal Phase 1: Newspaper & Document Highlighter */}
    <Composition id="newspaper-highlighter" component={NewspaperHighlighter as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        outlet: 'INVESTIGATIVE DISPATCH',
        edition: 'SPECIAL REPORT • VOL. XLVIII',
        date: 'OCTOBER 2024',
        headline: 'CRITICAL EVIDENCE REVEALED IN LEAKED DOCUMENTS',
        preText: 'According to findings compiled across hundreds of case studies, ',
        highlightText: 'the standard method failed in 92% of observed scenarios.',
        postText: ' Further analysis confirms the alternative protocol produced exponential compound advantages.',
        markerColor: '#FDE047',
        stamp: 'VERIFIED REPORT',
        badge: 'DOCUMENT ARCHIVE'
      }} />
    {/* Universal Phase 2: Magnifying Glass & Detail Callout */}
    <Composition id="magnifying-glass-zoom" component={MagnifyingGlassZoom as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'FORENSIC CONTRACT AUDIT',
        badge: '🔬 OPTICAL INSPECTION',
        backgroundSnippet: 'Clause 14.3: The standard service tier shall remain operative unless otherwise modified by auxiliary management schedules outlined in supplementary appendix B.',
        zoomTarget: '14.3: HIDDEN 2.4% COMPOUND FEE',
        calloutTitle: 'FINE PRINT DETECTED',
        calloutDetail: 'This hidden clause quietly drained over $380,000 in compounding returns over a 20-year horizon.'
      }} />
    {/* Universal Phase 3: Urgency / Risk Dial Gauge */}
    <Composition id="urgency-dial-gauge" component={UrgencyDialGauge as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'SYSTEMIC RISK VELOCITY',
        badge: '⚠️ CRITICAL TELEMETRY',
        value: 94,
        unit: '%',
        zoneLabel: 'MAXIMUM HAZARD ZONE',
        subtext: 'Telemetry indicates risk has entered the red saturation zone where cascading failures become statistically imminent.'
      }} />
    {/* Universal Phase 4: Mind Map & Concept Node Web */}
    <Composition id="mind-map-node-web" component={MindMapNodeWeb as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'SYNAPTIC ARCHITECTURE MAP',
        badge: '🧠 CONCEPT BREAKDOWN',
        centerTitle: 'RETENTION ENGINE',
        centerIcon: '⚡',
        node1Title: 'Curiosity Gap Hook',
        node1Desc: 'Subconscious intrigue trigger',
        node1Icon: '🎯',
        node2Title: 'Dynamic Pacing Loops',
        node2Desc: 'Visual rhythm shift every 2.5s',
        node2Icon: '🔄',
        node3Title: 'High-Value Payoff',
        node3Desc: 'Unfiltered actionable insight',
        node3Icon: '💎'
      }} />
    {/* Universal Phase 5: Timeline Roadmap & Milestone Pathway */}
    <Composition id="timeline-roadmap" component={TimelineRoadmap as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: '30-DAY RETENTION EXECUTION ROADMAP',
        badge: '🚀 MILESTONE SEQUENCE',
        step1Phase: 'PHASE 01',
        step1Title: 'Curiosity Gap Architecture',
        step1Desc: 'Engineered subconscious intrigue loops eliminate initial 3-second drop-off.',
        step1Icon: '🎯',
        step1Badge: 'COMPLETED ✓',
        step2Phase: 'PHASE 02',
        step2Title: 'Dynamic Velocity Modulation',
        step2Desc: 'Visual and cognitive pacing shifts every 2.5s to maintain neuro-arousal.',
        step2Icon: '⚡',
        step2Badge: 'ACTIVE EXECUTION',
        step3Phase: 'PHASE 03',
        step3Title: 'High-Value Compounding Payoff',
        step3Desc: 'Unfiltered actionable insight locks in viewer loyalty and triggers viral shares.',
        step3Icon: '🏆',
        step3Badge: 'TARGET DESTINATION',
        synthesis: 'SYSTEM PROGRESS: Sequential compounding drives exponential audience retention.',
        currentStep: 3
      }} />
    {/* Universal Phase 6: Hierarchy Pyramid & Foundation Architecture */}
    <Composition id="hierarchy-pyramid" component={HierarchyPyramid as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE RETENTION MASTERY PYRAMID',
        badge: '🔺 HIERARCHY ARCHITECTURE',
        tier1Title: 'Structural Value Thesis',
        tier1Subtitle: '80% of audience retention is determined by solving an acute curiosity gap.',
        tier1Pct: '80% FOUNDATION',
        tier1Icon: '🧱',
        tier2Title: 'Velocity Pacing Loops',
        tier2Subtitle: 'Dynamic visual pattern interrupts every 2.5s sustain subconscious arousal.',
        tier2Pct: '19% LEVERAGE',
        tier2Icon: '⚡',
        tier3Title: 'Compounding Viral Climax',
        tier3Subtitle: 'The top 1% memorable payoff that guarantees saves, shares, and algorithmic lift.',
        tier3Pct: '1% PINNACLE',
        tier3Icon: '👑',
        synthesis: 'SYSTEM HIERARCHY: Mastery at the apex is impossible without absolute base stability.'
      }} />
    {/* Universal Phase 7: Tactile Checklist & Decision Matrix */}
    <Composition id="tactile-checklist-stamp" component={TactileChecklistStamp as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'NICHE VIABILITY AUDIT MATRIX',
        badge: '📋 DECISION MATRIX',
        item1Text: 'High Organic Search Volume',
        item1Detail: '5.4M monthly search queries verified across algorithmic search graphs.',
        item1Status: 'pass',
        item2Text: 'Zero Capital Barrier to Entry',
        item2Detail: 'Requires $45,000 upfront specialized production equipment & studio lease.',
        item2Status: 'fail',
        item3Text: 'Compounding Replay Retention',
        item3Detail: 'High subconscious curiosity gap delivers above 85% average completion rate.',
        item3Status: 'pass',
        verdictText: 'CRITICAL BOTTLENECK: CAPITAL BARRIER INVALIDATES MODEL',
        verdictStatus: 'warning',
        synthesis: 'AUDIT RESULT: 1 critical structural failure invalidates all other positive signals.'
      }} />
    {/* Universal Phase 8: Split Slider Comparison & Transformation Wipe */}
    <Composition id="split-slider-comparison" component={SplitSliderComparison as any} durationInFrames={75} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        title: 'THE SYSTEMIC EFFICIENCY LEAP',
        badge: '⚖️ BEFORE VS AFTER TRANSFORMATION',
        leftTag: 'MANUAL PROCESS',
        leftTitle: 'Traditional Agency Grind',
        leftMetric: '18.5 HOURS',
        leftDetail: 'Manual keyframing, timeline cut bloat, asset hunting, and high human fatigue.',
        leftIcon: '⏳',
        rightTag: 'AI PIPELINE ENGINE',
        rightTitle: 'Autonomous Production Loop',
        rightMetric: '4.2 MINUTES',
        rightDetail: 'Algorithmic storyboarding, Remotion rendering, automated B-roll, and instant audio ducking.',
        rightIcon: '⚡',
        sliderStart: 75,
        sliderEnd: 50,
        synthesis: 'TRANSFORMATION: Autonomous AI pipeline unlocks 260x production velocity with zero retention loss.'
      }} />
    <Composition id="icon-reveal" component={IconReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ concept: '⚡', label: 'SPEED', personality: 'energetic' }} />
    <Composition id="code-reveal" component={CodeReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ language: 'python', code: 'print("hello")', personality: 'technical' }} />
    <Composition id="stat-card-highlight" component={StatCardHighlight as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'USERS', stat: '2.4M', delta: '+340%', personality: 'energetic' }} />
    <Composition id="browser-walkthrough" component={BrowserWalkthrough as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ url: 'https://example.com', tabTitle: 'Demo', highlightText: 'Key feature', personality: 'technical' }} />
    <Composition id="vscode-code-typing" component={VSCodeTyping as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'TERMINAL', activeFile: 'main.py', code: 'python main.py', language: 'bash', personality: 'technical' }} />
    <Composition id="kinetic-text" component={KineticText as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ text: 'THIS IS THE HOOK', personality: 'energetic' }} />
    <Composition id="app-screen-upload" component={AppScreenUpload as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'VIDEO UPLOAD', appName: 'Video Studio Pro', fileName: 'upload_video.mp4', fileSize: '48.2 MB', fileType: 'MP4 Video', progress: 100, status: 'Upload Complete', personality: 'technical' }} />

    {/* Broadcast & Creator Motion Graphics */}
    <Composition id="lower-third" component={(props: any) => <HeroReveal label={props.handle || '@speaker'} headline={props.name || 'Speaker Name'} supporting={props.title || 'Special Guest'} personality="premium" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ name: 'Alex Rivera', title: 'Lead Architect', handle: '@alex' }} />
    <Composition id="subscribe-badge" component={(props: any) => <CookedMotionCard type="likes" props={{ label: props.channelName || 'Subscribers', count: props.subCount || '1.25M' }} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ channelName: 'Creator Studio', subCount: '1.25M' }} />
    <Composition id="countdown-timer" component={(props: any) => <CookedMotionCard type="progress" props={{ label: props.label || 'TIME REMAINING', to: 100 }} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ seconds: 5, label: 'TIME REMAINING' }} />
    <Composition id="timer" component={(props: any) => <CookedMotionCard type="progress" props={{ label: props.label || 'TIME REMAINING', to: 100 }} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ seconds: 5, label: 'TIME REMAINING' }} />
    <Composition id="countdown" component={(props: any) => <CookedMotionCard type="progress" props={{ label: props.label || 'TIME REMAINING', to: 100 }} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ seconds: 5, label: 'TIME REMAINING' }} />
    <Composition id="review-card" component={(props: any) => <QuoteReveal quote={props.review || 'Incredible experience!'} author={props.author || 'Verified User'} personality="premium" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ author: 'Sarah J.', review: 'Saved our team 20+ hrs a week!' }} />
    <Composition id="review" component={(props: any) => <QuoteReveal quote={props.review || 'Incredible experience!'} author={props.author || 'Verified User'} personality="premium" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ author: 'Sarah J.', review: 'Saved our team 20+ hrs a week!' }} />
    <Composition id="social-handles" component={(props: any) => <HeroReveal label="FOLLOW US" headline={props.handle || '@contentmaster'} supporting={props.actionText || 'Follow for tips'} personality="energetic" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ handle: '@contentmaster', actionText: 'Follow for tips' }} />

    {/* Animated Arrow Callout */}
    <Composition id="animated-arrow" component={(props: any) => <ShapeElement shapeType="arrow" fillColor={props.fillColor || '#eab308'} strokeColor={props.strokeColor || '#facc15'} label={props.label || 'Look Here'} direction={props.direction || 'down'} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Look Here' }} />

    {/* Pop Up Badge */}
    <Composition id="pop-up-badge" component={(props: any) => <HeroReveal label="⚡ HIGHLIGHT" headline={props.text || props.label || 'FEATURED'} supporting={props.subtext || 'KEY MOMENT'} personality="energetic" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ text: 'FEATURED' }} />
    <Composition id="badge" component={(props: any) => <HeroReveal label="⚡ HIGHLIGHT" headline={props.text || props.label || 'FEATURED'} supporting={props.subtext || 'KEY MOMENT'} personality="energetic" />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ text: 'FEATURED' }} />

    {/* Cooked Motion Templates */}
    <Composition id="cooked-card" component={CookedMotionCard as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{
        type: 'likes',
        props: { label: 'Subscribers', from: 0, to: 100000 },
        box: [8, 15, 84, 45],
        motion: 'snappy'
      }} />
    <Composition id="cooked-likes" component={(props: any) => <CookedMotionCard type="likes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Metric', from: 0, to: 100000 }} />
    <Composition id="cooked-terminal" component={(props: any) => <CookedMotionCard type="terminal" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ command: 'npm start', output: 'Server running on port 3000' }} />
    <Composition id="cooked-social-post" component={(props: any) => <CookedMotionCard type="social_post" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ name: 'Creator', handle: '@creator', text: 'This changed everything.', highlight: 'everything' }} />
    <Composition id="social-post" component={(props: any) => <CookedMotionCard type="social_post" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ name: 'Creator', handle: '@creator', text: 'This changed everything.', highlight: 'everything' }} />
    <Composition id="tweet" component={(props: any) => <CookedMotionCard type="social_post" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ name: 'Creator', handle: '@creator', text: 'This changed everything.', highlight: 'everything' }} />
    <Composition id="cooked-chat" component={(props: any) => <CookedMotionCard type="chat" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ messages: [{ from: 'them', text: 'Hey, how did you edit this?' }, { from: 'me', text: 'With AI Content Manager!' }] }} />
    <Composition id="cooked-notes" component={(props: any) => <CookedMotionCard type="notes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'Key Takeaways', items: ['Step 1: Record take', 'Step 2: AI edits', 'Step 3: Publish'] }} />
    <Composition id="notes-checklist" component={(props: any) => <CookedMotionCard type="notes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'Key Takeaways', items: ['Step 1: Record take', 'Step 2: AI edits', 'Step 3: Publish'] }} />
    <Composition id="checklist" component={(props: any) => <CookedMotionCard type="notes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'Key Takeaways', items: ['Step 1: Record take', 'Step 2: AI edits', 'Step 3: Publish'] }} />
    <Composition id="cooked-progress" component={(props: any) => <CookedMotionCard type="progress" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Render Progress', progress: 85 }} />
    <Composition id="progress-bar" component={(props: any) => <CookedMotionCard type="progress" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Render Progress', progress: 85 }} />
    <Composition id="completion-progress" component={(props: any) => <CookedMotionCard type="progress" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Render Progress', progress: 85 }} />
    <Composition id="cooked-toasts" component={(props: any) => <CookedMotionCard type="toasts" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'New Notification', message: 'Video rendered successfully!' }} />
    <Composition id="cooked-flow" component={(props: any) => <CookedMotionCard type="flow" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ nodes: [{ label: 'Input' }, { label: 'AI Process' }, { label: 'Output' }] }} />

    {/* Vector Shapes Pack */}
    <Composition id="shape" component={ShapeElement as any} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ shapeType: 'rectangle', fillColor: '#0284c7', strokeColor: '#38bdf8', strokeWidth: 2, width: 240, height: 120 }} />
    <Composition id="shape-element" component={ShapeElement as any} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ shapeType: 'rectangle', fillColor: '#0284c7', strokeColor: '#38bdf8', strokeWidth: 2, width: 240, height: 120 }} />

    {/* Visual Effects Pack */}
    <Composition id="effect-overlay" component={EffectOverlay as any} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ effectType: 'rgb_glitch', intensity: 80 }} />
  </>
);

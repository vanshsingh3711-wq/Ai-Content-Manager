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
    <Composition id="hero-reveal" component={HeroReveal as any} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'LABEL', headline: 'Headline', supporting: 'Detail', personality: 'premium' }} />
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

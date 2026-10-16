import React from 'react';
import { Composition, registerRoot } from 'remotion';
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

// Remotion Root — all compositions registered here
// Python calls: npx remotion render src/remotion/Root.tsx <ID> --props='{}' out.mov

const FPS = 30;
const W = 1080;
const H = 1920;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="hero-reveal" component={HeroReveal} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ label: 'LABEL', headline: 'Headline', supporting: 'Detail', personality: 'premium' }} />
    <Composition id="metric-reveal" component={MetricReveal} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ label: 'REVENUE', metric: '$4.2M', delta: '+127%', personality: 'energetic' }} />
    <Composition id="quote-reveal" component={QuoteReveal} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ quote: 'Quote here', author: 'Author', personality: 'premium' }} />
    <Composition id="step-sequence" component={StepSequence} durationInFrames={120} fps={FPS} width={W} height={H}
      defaultProps={{ title: 'HOW IT WORKS', step1: 'Step 1', step2: 'Step 2', step3: 'Step 3', personality: 'energetic' }} />
    <Composition id="before-after" component={BeforeAfter} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ beforeLabel: 'BEFORE', before: 'Old', afterLabel: 'AFTER', after: 'New', personality: 'energetic' }} />
    <Composition id="chart-reveal" component={ChartReveal} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ title: 'GROWTH', dataPoint1: '2023: $1M', dataPoint2: '2024: $4M', personality: 'technical' }} />
    <Composition id="icon-reveal" component={IconReveal} durationInFrames={75} fps={FPS} width={W} height={H}
      defaultProps={{ concept: '⚡', label: 'SPEED', personality: 'energetic' }} />
    <Composition id="code-reveal" component={CodeReveal} durationInFrames={120} fps={FPS} width={W} height={H}
      defaultProps={{ language: 'python', code: 'print("hello")', personality: 'technical' }} />
    <Composition id="stat-card-highlight" component={StatCardHighlight} durationInFrames={90} fps={FPS} width={W} height={H}
      defaultProps={{ label: 'USERS', stat: '2.4M', delta: '+340%', personality: 'energetic' }} />
    <Composition id="browser-walkthrough" component={BrowserWalkthrough} durationInFrames={120} fps={FPS} width={W} height={H}
      defaultProps={{ url: 'https://example.com', tabTitle: 'Demo', highlightText: 'Key feature', personality: 'technical' }} />
    <Composition id="vscode-code-typing" component={VSCodeTyping} durationInFrames={120} fps={FPS} width={W} height={H}
      defaultProps={{ title: 'TERMINAL', activeFile: 'main.py', code: 'python main.py', language: 'bash', personality: 'technical' }} />
    <Composition id="kinetic-text" component={KineticText} durationInFrames={75} fps={FPS} width={W} height={H}
      defaultProps={{ text: 'THIS IS THE HOOK', personality: 'energetic' }} />
  </>
);

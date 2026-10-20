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
    <Composition id="hero-reveal" component={HeroReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'LABEL', headline: 'Headline', supporting: 'Detail', personality: 'premium' }} />
    <Composition id="metric-reveal" component={MetricReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'REVENUE', metric: '$4.2M', delta: '+127%', personality: 'energetic' }} />
    <Composition id="quote-reveal" component={QuoteReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ quote: 'Quote here', author: 'Author', personality: 'premium' }} />
    <Composition id="step-sequence" component={StepSequence} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'HOW IT WORKS', step1: 'Step 1', step2: 'Step 2', step3: 'Step 3', personality: 'energetic' }} />
    <Composition id="before-after" component={BeforeAfter} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ beforeLabel: 'BEFORE', before: 'Old', afterLabel: 'AFTER', after: 'New', personality: 'energetic' }} />
    <Composition id="chart-reveal" component={ChartReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'GROWTH', dataPoint1: '2023: $1M', dataPoint2: '2024: $4M', personality: 'technical' }} />
    <Composition id="icon-reveal" component={IconReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ concept: '⚡', label: 'SPEED', personality: 'energetic' }} />
    <Composition id="code-reveal" component={CodeReveal} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ language: 'python', code: 'print("hello")', personality: 'technical' }} />
    <Composition id="stat-card-highlight" component={StatCardHighlight} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ label: 'USERS', stat: '2.4M', delta: '+340%', personality: 'energetic' }} />
    <Composition id="browser-walkthrough" component={BrowserWalkthrough} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ url: 'https://example.com', tabTitle: 'Demo', highlightText: 'Key feature', personality: 'technical' }} />
    <Composition id="vscode-code-typing" component={VSCodeTyping} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'TERMINAL', activeFile: 'main.py', code: 'python main.py', language: 'bash', personality: 'technical' }} />
    <Composition id="kinetic-text" component={KineticText} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ text: 'THIS IS THE HOOK', personality: 'energetic' }} />
    <Composition id="app-screen-upload" component={AppScreenUpload} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'VIDEO UPLOAD', appName: 'Video Studio Pro', fileName: 'upload_video.mp4', fileSize: '48.2 MB', fileType: 'MP4 Video', progress: 100, status: 'Upload Complete', personality: 'technical' }} />
    <Composition id="app_screen_upload" component={AppScreenUpload} durationInFrames={150} fps={FPS} width={W} height={H}
      calculateMetadata={getMeta}
      defaultProps={{ title: 'VIDEO UPLOAD', appName: 'Video Studio Pro', fileName: 'upload_video.mp4', fileSize: '48.2 MB', fileType: 'MP4 Video', progress: 100, status: 'Upload Complete', personality: 'technical' }} />

    {/* Cooked Motion Templates */}
    <Composition id="cooked-card" component={CookedMotionCard} durationInFrames={150} fps={FPS} width={W} height={H}
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
    <Composition id="cooked-chat" component={(props: any) => <CookedMotionCard type="chat" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ messages: [{ from: 'them', text: 'Hey, how did you edit this?' }, { from: 'me', text: 'With AI Content Manager!' }] }} />
    <Composition id="cooked-notes" component={(props: any) => <CookedMotionCard type="notes" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'Key Takeaways', items: ['Step 1: Record take', 'Step 2: AI edits', 'Step 3: Publish'] }} />
    <Composition id="cooked-progress" component={(props: any) => <CookedMotionCard type="progress" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ label: 'Render Progress', progress: 85 }} />
    <Composition id="cooked-toasts" component={(props: any) => <CookedMotionCard type="toasts" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ title: 'New Notification', message: 'Video rendered successfully!' }} />
    <Composition id="cooked-flow" component={(props: any) => <CookedMotionCard type="flow" props={props} />} durationInFrames={150} fps={FPS} width={W} height={H} calculateMetadata={getMeta} defaultProps={{ nodes: [{ label: 'Input' }, { label: 'AI Process' }, { label: 'Output' }] }} />
  </>
);

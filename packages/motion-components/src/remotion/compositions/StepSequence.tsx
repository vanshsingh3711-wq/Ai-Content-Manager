import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props { title: string; step1: string; step2: string; step3: string; step4?: string; personality?: string; }

const Step: React.FC<{ n: number; text: string; delay: number }> = ({ n, text, delay }) => (
  <div style={{ ...useFadeUp(delay), display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 32 }}>
    <div style={{ minWidth: 52, height: 52, borderRadius: '50%', background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 22, color: '#fff', flexShrink: 0 }}>
      {n}
    </div>
    <div style={{ fontFamily: FONT.display, fontSize: 38, fontWeight: 600, color: COLORS.text, lineHeight: 1.35, paddingTop: 8 }}>
      {text}
    </div>
  </div>
);

export const StepSequence: React.FC<Props> = ({ title, step1, step2, step3, step4 }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);
  const steps = [step1, step2, step3, step4].filter(Boolean) as string[];

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '60px 56px', ...exit }}>
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 20, letterSpacing: 5, color: COLORS.accent, textTransform: 'uppercase', marginBottom: 36 }}>
          {title}
        </div>
        {steps.map((s, i) => <Step key={i} n={i + 1} text={s} delay={8 + i * 10} />)}
      </div>
    </AbsoluteFill>
  );
};

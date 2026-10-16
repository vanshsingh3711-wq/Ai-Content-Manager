import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props {
  label: string;
  headline: string;
  supporting: string;
  personality?: string;
}

export const HeroReveal: React.FC<Props> = ({ label, headline, supporting }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '72px 60px', ...exit }}>
        {/* Label */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: COLORS.accent, textTransform: 'uppercase', marginBottom: 24 }}>
          {label}
        </div>
        {/* Purple accent bar */}
        <div style={{ ...useFadeUp(4), width: 64, height: 4, background: COLORS.accent, borderRadius: 2, marginBottom: 32 }} />
        {/* Headline */}
        <div style={{ ...useFadeUp(8), fontFamily: FONT.display, fontWeight: 800, fontSize: 72, lineHeight: 1.1, color: COLORS.text, marginBottom: 32 }}>
          {headline}
        </div>
        {/* Supporting */}
        <div style={{ ...useFadeUp(18), fontFamily: FONT.display, fontSize: 34, color: COLORS.muted, lineHeight: 1.4 }}>
          {supporting}
        </div>
      </div>
    </AbsoluteFill>
  );
};

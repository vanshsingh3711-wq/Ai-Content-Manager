import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props {
  label: string;
  headline: string;
  supporting: string;
  personality?: string;
  colorTheme?: string;
  accentColor?: string;
}

export const HeroReveal: React.FC<Props> = ({ label, headline, supporting, colorTheme, accentColor }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  const themeAccent = accentColor || (
    colorTheme === 'blue' || colorTheme === 'cyan' ? '#38bdf8' :
    colorTheme === 'emerald' || colorTheme === 'green' ? '#34d399' :
    colorTheme === 'amber' || colorTheme === 'yellow' ? '#f59e0b' :
    colorTheme === 'rose' || colorTheme === 'red' ? '#f43f5e' :
    COLORS.accent
  );

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '72px 60px', ...exit }}>
        {/* Label */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: themeAccent, textTransform: 'uppercase', marginBottom: 24 }}>
          {label}
        </div>
        {/* Accent bar */}
        <div style={{ ...useFadeUp(4), width: 64, height: 4, background: themeAccent, borderRadius: 2, marginBottom: 32 }} />
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

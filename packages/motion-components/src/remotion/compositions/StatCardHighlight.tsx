import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, useFadeUp, useScaleIn, useExitFade } from '../shared';

interface Props { label: string; stat: string; delta?: string; context?: string; personality?: string; }

export const StatCardHighlight: React.FC<Props> = ({ label, stat, delta, context }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);
  const isPositive = delta && !delta.startsWith('-');

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: '100%', ...exit }}>
        {/* KPI card with glow border */}
        <div style={{ background: 'rgba(10,10,20,0.85)', border: `2px solid ${COLORS.accent}`, borderRadius: 36, padding: '64px 56px', boxShadow: `0 0 80px ${COLORS.accentGlow}, inset 0 0 40px rgba(124,58,237,0.08)` }}>
          <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 20, letterSpacing: 5, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 24 }}>
            {label}
          </div>
          {/* Giant number */}
          <div style={{ ...useScaleIn(6), fontFamily: FONT.display, fontWeight: 900, fontSize: 128, color: COLORS.text, lineHeight: 1, marginBottom: 24 }}>
            {stat}
          </div>
          {delta && (
            <div style={{ ...useFadeUp(20), display: 'inline-flex', alignItems: 'center', gap: 10, background: isPositive ? COLORS.greenBg : 'rgba(239,68,68,0.15)', color: isPositive ? COLORS.green : COLORS.red, borderRadius: 100, padding: '14px 32px', fontSize: 30, fontWeight: 700, fontFamily: FONT.display }}>
              {isPositive ? '↑' : '↓'} {delta}
            </div>
          )}
          {context && (
            <div style={{ ...useFadeUp(28), fontFamily: FONT.display, fontSize: 30, color: COLORS.muted, marginTop: 28 }}>
              {context}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

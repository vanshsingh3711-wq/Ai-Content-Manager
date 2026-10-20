import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, glassStyle, useScaleIn, useFadeUp, useExitFade } from '../shared';

interface Props { concept: string; label: string; sublabel?: string; personality?: string; }

export const IconReveal: React.FC<Props> = ({ concept, label, sublabel }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '80px 60px', textAlign: 'center', ...exit }}>
        {/* Big icon / emoji */}
        <div style={{ ...useScaleIn(0), fontSize: 140, marginBottom: 40, lineHeight: 1 }}>
          {concept}
        </div>
        {/* Label */}
        <div style={{ ...useFadeUp(12), fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: COLORS.text, letterSpacing: -1 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ ...useFadeUp(22), fontFamily: FONT.display, fontSize: 34, color: COLORS.muted, marginTop: 20 }}>
            {sublabel}
          </div>
        )}
        {/* Glow dot */}
        <div style={{ ...useFadeUp(8), width: 8, height: 8, background: COLORS.accent, borderRadius: '50%', margin: '32px auto 0', boxShadow: `0 0 24px 8px ${COLORS.accentGlow}` }} />
      </div>
    </AbsoluteFill>
  );
};

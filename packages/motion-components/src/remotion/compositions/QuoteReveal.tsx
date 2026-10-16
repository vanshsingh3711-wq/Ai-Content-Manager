import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props { quote: string; author?: string; personality?: string; }

export const QuoteReveal: React.FC<Props> = ({ quote, author }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '72px 60px', ...exit }}>
        {/* Quote mark */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.display, fontSize: 140, lineHeight: 0.6, color: COLORS.accent, marginBottom: 24, fontWeight: 900 }}>
          "
        </div>
        {/* Quote text */}
        <div style={{ ...useFadeUp(6), fontFamily: FONT.display, fontSize: 48, fontWeight: 600, color: COLORS.text, lineHeight: 1.45, marginBottom: 40, fontStyle: 'italic' }}>
          {quote}
        </div>
        {/* Author */}
        {author && (
          <div style={{ ...useFadeUp(18), display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 48, height: 3, background: COLORS.accent, borderRadius: 2 }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: 3, color: COLORS.accent, textTransform: 'uppercase' }}>
              {author}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props { quote: string; author?: string; personality?: string; }

export const QuoteReveal: React.FC<Props> = ({ quote, author }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);

  const displayQuote = quote || 'The winners will be the systems architects who master cognitive leverage.';
  const quoteLen = displayQuote.length;
  const quoteStart = 8;
  const quoteDuration = Math.min(38, Math.max(18, Math.round(quoteLen * 0.65)));
  const quoteProgress = Math.min(1, Math.max(0, (frame - quoteStart) / quoteDuration));
  const visibleQuoteCount = Math.floor(quoteProgress * quoteLen);
  const typedQuote = displayQuote.slice(0, visibleQuoteCount);
  const remainingQuote = displayQuote.slice(visibleQuoteCount);
  const isTyping = frame >= quoteStart && visibleQuoteCount < quoteLen;

  const doneFrames = frame - (quoteStart + quoteDuration);
  const showCursor =
    isTyping ||
    (frame < quoteStart && Math.floor(frame / 5) % 2 === 0) ||
    (visibleQuoteCount >= quoteLen && doneFrames >= 0 && doneFrames < 20 && Math.floor(frame / 5) % 2 === 0);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '72px 60px', ...exit }}>
        {/* Quote mark */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.display, fontSize: 140, lineHeight: 0.6, color: COLORS.accent, marginBottom: 24, fontWeight: 900 }}>
          "
        </div>
        {/* Quote text with typewriter */}
        <div style={{ fontFamily: FONT.display, fontSize: 48, fontWeight: 600, color: COLORS.text, lineHeight: 1.45, marginBottom: 40, fontStyle: 'italic', position: 'relative' }}>
          <span>{typedQuote}</span>
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: '0.85em',
                backgroundColor: COLORS.accent,
                marginLeft: 4,
                verticalAlign: '-0.05em',
                borderRadius: 2,
                boxShadow: `0 0 10px ${COLORS.accent}`,
              }}
            />
          )}
          <span style={{ opacity: 0, userSelect: 'none' }}>{remainingQuote}</span>
        </div>
        {/* Author */}
        {author && (
          <div style={{ ...useFadeUp(20), display: 'flex', alignItems: 'center', gap: 18 }}>
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

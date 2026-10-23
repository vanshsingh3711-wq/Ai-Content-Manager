import React from 'react';
import { AbsoluteFill, useVideoConfig, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, useExitFade } from '../shared';

interface Props { text?: string; headline?: string; personality?: string; }

export const KineticText: React.FC<Props> = (props) => {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);
  const text = props.text || props.headline || 'THIS IS THE HOOK';
  const words = text.split(' ');

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, ...exit }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 18px', justifyContent: 'center' }}>
        {words.map((word, i) => {
          const delay = i * 5;
          const progress = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
          const isLast = i === words.length - 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT.display,
                fontWeight: 900,
                fontSize: words.length <= 3 ? 110 : 80,
                lineHeight: 1.15,
                color: isLast ? COLORS.accent : COLORS.text,
                opacity: Math.min(1, progress),
                transform: `translateY(${(1 - progress) * 60}px)`,
                display: 'inline-block',
                letterSpacing: -2,
                textShadow: isLast ? `0 0 60px ${COLORS.accentGlow}` : undefined,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props { title: string; dataPoint1: string; dataPoint2: string; dataPoint3?: string; personality?: string; }

const Bar: React.FC<{ label: string; value: number; delay: number; max: number }> = ({ label, value, delay, max }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const width = (value / max) * 100 * progress;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 20, color: COLORS.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ width: `${width}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.accent}, #a78bfa)`, borderRadius: 10, transition: 'width 0.1s' }} />
        </div>
      </div>
    </div>
  );
};

export const ChartReveal: React.FC<Props> = ({ title, dataPoint1, dataPoint2, dataPoint3 }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);
  const points = [dataPoint1, dataPoint2, dataPoint3].filter(Boolean) as string[];

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '64px 56px', ...exit }}>
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 20, letterSpacing: 5, color: COLORS.accent, textTransform: 'uppercase', marginBottom: 40 }}>
          {title}
        </div>
        {points.map((p, i) => (
          <Bar key={i} label={p.split(':')[0] || p} value={(i + 1) * 30} max={points.length * 30} delay={8 + i * 12} />
        ))}
        <div style={{ ...useFadeUp(40), fontFamily: FONT.display, fontSize: 44, fontWeight: 800, color: COLORS.text, marginTop: 24 }}>
          {points[points.length - 1]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

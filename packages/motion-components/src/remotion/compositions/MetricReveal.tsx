import React from 'react';
import { AbsoluteFill, useVideoConfig, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props {
  label?: string;
  title?: string;
  metric?: string;
  value?: string;
  delta?: string;
  change?: string;
  personality?: string;
}

export const MetricReveal: React.FC<Props> = (props) => {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);

  const label = props.label || props.title || 'KEY METRIC';
  const metric = props.metric || props.value || '100';
  const delta = props.delta || props.change;

  const deltaIsPositive = delta && (delta.startsWith('+') || (!delta.startsWith('-') && delta !== '0'));
  const deltaColor = deltaIsPositive ? COLORS.green : COLORS.red;
  // Animated number scale punch
  const scaleProg = spring({ frame: frame - 10, fps, config: { damping: 10, mass: 0.5, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '64px 60px', ...exit }}>
        {/* Label */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 20, letterSpacing: 5, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 32 }}>
          {label}
        </div>
        {/* Big Metric */}
        <div style={{ ...useFadeUp(8), fontFamily: FONT.display, fontWeight: 900, fontSize: 120, color: COLORS.text, lineHeight: 1, transform: `scale(${0.85 + scaleProg * 0.15})`, transformOrigin: 'left center' }}>
          {metric}
        </div>
        {/* Delta badge */}
        {delta && (
          <div style={{ ...useFadeUp(20), display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: deltaIsPositive ? COLORS.greenBg : 'rgba(239,68,68,0.15)', color: deltaColor, borderRadius: 100, padding: '12px 28px', fontSize: 28, fontWeight: 700, fontFamily: FONT.display }}>
            {deltaIsPositive ? '▲' : '▼'} {delta}
          </div>
        )}
        {/* Glow underline */}
        <div style={{ ...useFadeUp(12), width: '100%', height: 3, background: `linear-gradient(90deg, ${COLORS.accent}, transparent)`, borderRadius: 2, marginTop: 36 }} />
      </div>
    </AbsoluteFill>
  );
};

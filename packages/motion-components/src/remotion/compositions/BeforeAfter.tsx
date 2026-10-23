import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, useFadeUp, useExitFade } from '../shared';

interface Props {
  beforeLabel?: string;
  before?: string;
  beforeText?: string;
  afterLabel?: string;
  after?: string;
  afterText?: string;
  personality?: string;
}

export const BeforeAfter: React.FC<Props> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  const beforeLabel = props.beforeLabel || 'BEFORE';
  const before = props.before || props.beforeText || 'Old method';
  const afterLabel = props.afterLabel || 'AFTER';
  const after = props.after || props.afterText || 'New method';

  const cardBase: React.CSSProperties = { borderRadius: 28, padding: '48px 44px', width: '100%' };

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48, gap: 24, ...exit }}>
      {/* BEFORE */}
      <div style={{ ...useFadeUp(0), ...cardBase, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: 5, color: COLORS.red, marginBottom: 20, textTransform: 'uppercase' }}>
          ✕ {beforeLabel}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 42, fontWeight: 700, color: COLORS.text, lineHeight: 1.35 }}>
          {before}
        </div>
      </div>
      {/* Arrow */}
      <div style={{ ...useFadeUp(12), textAlign: 'center', fontSize: 48, color: COLORS.accent }}>↓</div>
      {/* AFTER */}
      <div style={{ ...useFadeUp(18), ...cardBase, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: 5, color: COLORS.green, marginBottom: 20, textTransform: 'uppercase' }}>
          ✓ {afterLabel}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 42, fontWeight: 700, color: COLORS.text, lineHeight: 1.35 }}>
          {after}
        </div>
      </div>
    </AbsoluteFill>
  );
};

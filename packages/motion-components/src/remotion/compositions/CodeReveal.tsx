import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, useFadeUp, useExitFade } from '../shared';

interface Props { code: string; language?: string; highlight?: string; personality?: string; }

export const CodeReveal: React.FC<Props> = ({ code, language = 'python', highlight }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);
  const lines = code.split('\n');
  // Typewriter: reveal one line every 6 frames
  const visibleLines = Math.min(lines.length, Math.floor((frame - 8) / 6) + 1);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, ...exit }}>
      <div style={{ width: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
        {/* Titlebar */}
        <div style={{ background: '#1e1e2e', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ fontFamily: FONT.mono, fontSize: 18, color: 'rgba(255,255,255,0.4)', marginLeft: 12 }}>
            {language} — code.py
          </span>
        </div>
        {/* Code area */}
        <div style={{ background: '#13131f', padding: '32px 36px', minHeight: 300 }}>
          {lines.slice(0, visibleLines).map((line, i) => (
            <div key={i} style={{ fontFamily: FONT.mono, fontSize: 32, color: i === visibleLines - 1 ? COLORS.accent : 'rgba(255,255,255,0.85)', lineHeight: 1.7, whiteSpace: 'pre' }}>
              <span style={{ color: 'rgba(255,255,255,0.2)', marginRight: 24, userSelect: 'none' }}>{(i + 1).toString().padStart(2, ' ')}</span>
              {line}
              {i === visibleLines - 1 && <span style={{ display: 'inline-block', width: 3, height: 32, background: COLORS.accent, marginLeft: 4, animation: 'none', opacity: frame % 30 < 15 ? 1 : 0 }} />}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

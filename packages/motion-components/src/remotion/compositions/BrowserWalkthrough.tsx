import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { COLORS, FONT, useFadeUp, useExitFade } from '../shared';

interface Props { url: string; tabTitle: string; highlightText?: string; screenshotUrl?: string; personality?: string; }

export const BrowserWalkthrough: React.FC<Props> = ({ url, tabTitle, highlightText }) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, ...exit }}>
      <div style={{ width: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}>
        {/* Chrome-style top bar */}
        <div style={{ background: '#292a2d', padding: '14px 20px' }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['#ff5f57','#febc2e','#28c840'].map((c,i)=>(
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* URL bar */}
          <div style={{ background: '#1e1e1e', borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, color: COLORS.green }}>🔒</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>{url}</span>
          </div>
        </div>
        {/* Page content area */}
        <div style={{ background: '#0f0f0f', minHeight: 600, padding: '48px 48px' }}>
          <div style={{ ...useFadeUp(4), fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: COLORS.text, marginBottom: 20 }}>
            {tabTitle}
          </div>
          {/* Fake content blocks */}
          {[1,2,3].map(i => (
            <div key={i} style={{ ...useFadeUp(4 + i * 8), height: 24, background: `rgba(255,255,255,${0.08 - i * 0.02})`, borderRadius: 6, marginBottom: 16, width: `${90 - i * 12}%` }} />
          ))}
          {/* Highlight pill */}
          {highlightText && (
            <div style={{ ...useFadeUp(28), marginTop: 32, display: 'inline-block', background: 'rgba(124,58,237,0.25)', border: `2px solid ${COLORS.accent}`, borderRadius: 12, padding: '16px 28px', fontFamily: FONT.display, fontSize: 30, color: COLORS.text }}>
              👆 {highlightText}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Img } from 'remotion';
import { COLORS, FONT, useFadeUp, useExitFade, glassStyle } from '../shared';

export interface BrowserWalkthroughProps {
  url: string;
  tabTitle: string;
  highlightText?: string;
  screenshotUrl?: string;
  personality?: string;
}

export const BrowserWalkthrough: React.FC<BrowserWalkthroughProps> = ({
  url,
  tabTitle,
  highlightText,
  screenshotUrl,
}) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);

  const scrollY = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [0, -200],
    { extrapolateRight: 'clamp' }
  );
  const cursorProgress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 70px rgba(14,165,233,0.25)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
        }}
      >
        {/* Chrome-style top bar */}
        <div
          style={{
            background: 'rgba(25, 30, 40, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Traffic lights & Tab title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: c,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginLeft: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 420,
                }}
              >
                {tabTitle}
              </span>
            </div>

            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '4px 14px',
                borderRadius: 100,
              }}
            >
              LIVE WEB
            </span>
          </div>

          {/* URL bar */}
          <div
            style={{
              background: 'rgba(15, 20, 28, 0.9)',
              borderRadius: 10,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontSize: 16, color: COLORS.green }}>🔒</span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 18,
                color: 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {url}
            </span>
          </div>
        </div>

        {/* Viewport Content Area */}
        <div
          style={{
            background: '#090d16',
            minHeight: 460,
            maxHeight: 640,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {screenshotUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              <Img
                src={screenshotUrl}
                alt={tabTitle}
                style={{
                  width: '100%',
                  transform: `translateY(${scrollY}px)`,
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
              {/* Simulated active browsing cursor */}
              <div
                style={{
                  position: 'absolute',
                  top: `${Math.min(78, 22 + cursorProgress * 50)}%`,
                  left: `${Math.min(80, 24 + Math.sin(cursorProgress * Math.PI) * 36)}%`,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', padding: '48px 48px' }}>
              <div
                style={{
                  ...useFadeUp(4),
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 48,
                  color: COLORS.text,
                  marginBottom: 20,
                }}
              >
                {tabTitle}
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    ...useFadeUp(4 + i * 8),
                    height: 22,
                    background: `rgba(255,255,255,${0.08 - i * 0.02})`,
                    borderRadius: 6,
                    marginBottom: 16,
                    width: `${90 - i * 12}%`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Floating Highlight Pill */}
          {highlightText && (
            <div
              style={{
                ...useFadeUp(20),
                position: 'absolute',
                bottom: 28,
                left: 28,
                right: 28,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(15, 18, 28, 0.92)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${COLORS.accent}`,
                borderRadius: 14,
                padding: '14px 24px',
                fontFamily: FONT.display,
                fontSize: 22,
                color: COLORS.text,
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(124,58,237,0.4)',
              }}
            >
              <span>👆</span>
              <span style={{ fontWeight: 700, color: '#d8b4fe' }}>{highlightText}</span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

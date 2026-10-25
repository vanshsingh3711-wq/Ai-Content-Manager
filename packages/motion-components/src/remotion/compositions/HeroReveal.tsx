import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade } from '../shared';

interface Props {
  label?: string;
  headline?: string;
  supporting?: string;
  title?: string;
  quote?: string;
  text?: string;
  badge?: string;
  tag?: string;
  author?: string;
  synthesis?: string;
  subtitle?: string;
  leftTitle?: string;
  rightTitle?: string;
  personality?: string;
  colorTheme?: string;
  accentColor?: string;
  [key: string]: any;
}

export const HeroReveal: React.FC<Props> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);

  const rawLabel = props.label && props.label !== 'LABEL' ? props.label : '';
  const displayLabel = rawLabel || props.badge || props.tag || props.author || 'COGNITIVE LEVERAGE';

  const rawHeadline = props.headline && props.headline !== 'Headline' ? props.headline : '';
  const displayHeadline = rawHeadline || props.title || props.quote || props.text || props.leftTitle || 'The Autonomous Shift';

  const rawSupporting = props.supporting && props.supporting !== 'Detail' ? props.supporting : '';
  const displaySupporting = rawSupporting || props.synthesis || props.subtitle || props.rightDetail || '';

  const themeAccent = props.accentColor || (
    props.colorTheme === 'blue' || props.colorTheme === 'cyan' ? '#38bdf8' :
    props.colorTheme === 'emerald' || props.colorTheme === 'green' ? '#34d399' :
    props.colorTheme === 'amber' || props.colorTheme === 'yellow' ? '#f59e0b' :
    props.colorTheme === 'rose' || props.colorTheme === 'red' ? '#f43f5e' :
    COLORS.accent
  );

  // --- Typewriter Timing Calculations ---
  // Headline starts typing at frame 8
  const headlineStart = 8;
  const headlineLen = displayHeadline.length;
  const headlineDuration = Math.min(32, Math.max(16, Math.round(headlineLen * 0.75)));
  const headlineProgress = Math.min(1, Math.max(0, (frame - headlineStart) / headlineDuration));
  const visibleHeadlineCount = Math.floor(headlineProgress * headlineLen);
  const typedHeadline = displayHeadline.slice(0, visibleHeadlineCount);
  const remainingHeadline = displayHeadline.slice(visibleHeadlineCount);
  const isTypingHeadline = frame >= headlineStart && visibleHeadlineCount < headlineLen;

  // Supporting text starts 4 frames after headline completes
  const supportingStart = headlineStart + headlineDuration + 4;
  const supportingLen = displaySupporting.length;
  const supportingDuration = Math.min(36, Math.max(18, Math.round(supportingLen * 0.65)));
  const supportingProgress = Math.min(1, Math.max(0, (frame - supportingStart) / supportingDuration));
  const visibleSupportingCount = Math.floor(supportingProgress * supportingLen);
  const typedSupporting = displaySupporting.slice(0, visibleSupportingCount);
  const remainingSupporting = displaySupporting.slice(visibleSupportingCount);
  const isTypingSupporting = frame >= supportingStart && visibleSupportingCount < supportingLen;

  // Cursor states
  const showHeadlineCursor =
    isTypingHeadline ||
    (frame < headlineStart && Math.floor(frame / 5) % 2 === 0) ||
    (frame >= headlineStart + headlineDuration && frame < supportingStart && Math.floor(frame / 4) % 2 === 0);

  const doneFrames = frame - (supportingStart + supportingDuration);
  const showSupportingCursor =
    isTypingSupporting ||
    (visibleSupportingCount >= supportingLen && doneFrames >= 0 && doneFrames < 20 && Math.floor(frame / 5) % 2 === 0);

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ ...glassStyle, width: '100%', padding: '72px 60px', ...exit }}>
        {/* Label */}
        <div style={{ ...useFadeUp(0), fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: themeAccent, textTransform: 'uppercase', marginBottom: 24 }}>
          {displayLabel}
        </div>
        {/* Accent bar */}
        <div style={{ ...useFadeUp(4), width: 64, height: 4, background: themeAccent, borderRadius: 2, marginBottom: 32 }} />
        {/* Headline with Typewriter & Blinking Cursor */}
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, lineHeight: 1.15, color: COLORS.text, marginBottom: 32, position: 'relative' }}>
          <span>{typedHeadline}</span>
          {showHeadlineCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: '0.85em',
                backgroundColor: themeAccent,
                marginLeft: 4,
                verticalAlign: '-0.05em',
                borderRadius: 2,
                boxShadow: `0 0 14px ${themeAccent}`,
              }}
            />
          )}
          <span style={{ opacity: 0, userSelect: 'none' }}>{remainingHeadline}</span>
        </div>
        {/* Supporting with Typewriter & Blinking Cursor */}
        {displaySupporting ? (
          <div style={{ fontFamily: FONT.display, fontSize: 34, color: COLORS.muted, lineHeight: 1.4, position: 'relative' }}>
            <span>{typedSupporting}</span>
            {showSupportingCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 4,
                  height: '0.85em',
                  backgroundColor: themeAccent,
                  marginLeft: 4,
                  verticalAlign: '-0.05em',
                  borderRadius: 2,
                  boxShadow: `0 0 10px ${themeAccent}`,
                }}
              />
            )}
            <span style={{ opacity: 0, userSelect: 'none' }}>{remainingSupporting}</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

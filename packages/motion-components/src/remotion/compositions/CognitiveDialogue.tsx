import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  badge?: string;
  firstPersonText?: string;
  firstPersonLabel?: string;
  thirdPersonText?: string;
  thirdPersonLabel?: string;
  bottomCallout?: string;
  personality?: string;
}

export const CognitiveDialogue: React.FC<Props> = ({
  title = 'THE ILLEISM MENTAL HACK',
  badge = '🧠 COGNITIVE DISTANCING',
  firstPersonText = '"Why am I so overwhelmed?!"',
  firstPersonLabel = '1ST PERSON: TRAPPED IN EGO (AMYGDALA SPIRAL)',
  thirdPersonText = '"Why is Alex stressed, and what is his next move?"',
  thirdPersonLabel = '3RD PERSON: OBJECTIVE OBSERVER (EXECUTIVE FUNCTION)',
  bottomCallout = 'STEPPING OUTSIDE YOUR EGO DISSOLVES PANIC',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const headerSpring = spring({ frame, fps, config: { damping: 12, mass: 0.5, stiffness: 200 } });
  const card1Spring = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const arrowSpring = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 10, mass: 0.5, stiffness: 220 } });
  const card2Spring = spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const bottomSpring = spring({ frame: Math.max(0, frame - 38), fps, config: { damping: 9, mass: 0.4, stiffness: 240 } });

  // Shake on first person panic
  const panicShake = frame < 30 ? Math.sin(frame * 2.5) * 2 : 0;
  const pulse = Math.sin((frame / fps) * 6) * 0.04 + 1.0;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 24px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '34px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(8, 10, 18, 0.95)',
          border: '1.5px solid rgba(6, 182, 212, 0.35)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.9), 0 0 60px rgba(6, 182, 212, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)})`,
            opacity: headerSpring,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
              color: '#000000',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 3,
              padding: '6px 20px',
              borderRadius: 16,
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.8)',
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 32,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1.5,
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* 1st Person Panic Bubble (Red / Ego Trap) */}
        <div
          style={{
            transform: `translateX(${(1 - card1Spring) * -40 + panicShake}px)`,
            opacity: card1Spring,
            width: '100%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(127, 29, 29, 0.28) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: 22,
            padding: '20px 24px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: 13,
                fontWeight: 900,
                color: '#F87171',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              ❌ {firstPersonLabel}
            </span>
            <span style={{ fontSize: 24 }}>🤯</span>
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 26,
              fontWeight: 900,
              color: '#FECACA',
              fontStyle: 'italic',
              textShadow: '0 0 15px rgba(239, 68, 68, 0.7)',
            }}
          >
            {firstPersonText}
          </div>
        </div>

        {/* Downward Transform Arrow */}
        <div
          style={{
            transform: `scale(${Math.min(1, arrowSpring)})`,
            opacity: arrowSpring,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 20px',
            borderRadius: 16,
          }}
        >
          <span style={{ fontSize: 20 }}>⬇️</span>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: 800,
              color: '#38BDF8',
              letterSpacing: 1.5,
            }}
          >
            SHIFT PERSPECTIVE TO 3RD PERSON
          </span>
          <span style={{ fontSize: 20 }}>⬇️</span>
        </div>

        {/* 3rd Person Detachment Bubble (Cyan / Calm Clarity) */}
        <div
          style={{
            transform: `translateX(${(1 - card2Spring) * 40}px)`,
            opacity: card2Spring,
            width: '100%',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(16, 185, 129, 0.28) 100%)',
            border: '2px solid rgba(6, 182, 212, 0.7)',
            borderRadius: 22,
            padding: '20px 24px',
            boxShadow: '0 0 35px rgba(6, 182, 212, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                fontFamily: FONT.display,
                fontSize: 13,
                fontWeight: 900,
                color: '#67E8F9',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              ✅ {thirdPersonLabel}
            </span>
            <span style={{ fontSize: 24 }}>🧠</span>
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 26,
              fontWeight: 900,
              color: '#A5F3FC',
              fontStyle: 'italic',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
              transform: `scale(${card2Spring > 0.9 ? pulse : 1})`,
            }}
          >
            {thirdPersonText}
          </div>
        </div>

        {/* Bottom Cognitive Distance Victory Callout */}
        {bottomSpring > 0.05 && (
          <div
            style={{
              transform: `scale(${Math.min(1, bottomSpring)})`,
              opacity: Math.min(1, bottomSpring * 2),
              width: '100%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.8)',
              borderRadius: 16,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.45)',
            }}
          >
            <span style={{ fontSize: 22 }}>⚡</span>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 18,
                fontWeight: 900,
                color: '#6EE7B7',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {bottomCallout}
            </div>
            <span style={{ fontSize: 22 }}>⚡</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

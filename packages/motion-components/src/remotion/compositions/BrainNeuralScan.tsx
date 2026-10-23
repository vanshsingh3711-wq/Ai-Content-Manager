import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  badge?: string;
  cortexTitle?: string;
  cortexSub?: string;
  amygdalaTitle?: string;
  amygdalaSub?: string;
  verdictBadge?: string;
  verdictSub?: string;
  personality?: string;
}

export const BrainNeuralScan: React.FC<Props> = ({
  title = 'THE SOLOMON PARADOX',
  badge = '🧠 NEUROSCIENCE OF BIAS',
  cortexTitle = 'ADVISING A FRIEND',
  cortexSub = 'Prefrontal Cortex: Pure Logic & Perspective',
  amygdalaTitle = 'ADVISING YOURSELF',
  amygdalaSub = 'Amygdala Hijack: Cortisol & Emotional Blindness',
  verdictBadge = '⚡ EMOTIONAL HIJACK OVERPOWERS LOGIC ⚡',
  verdictSub = 'You easily solve other people’s problems because your amygdala is quiet.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const headerSpring = spring({ frame, fps, config: { damping: 12, mass: 0.5, stiffness: 200 } });
  const brainSpring = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12, mass: 0.7, stiffness: 150 } });
  const cardSpring = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const verdictSpring = spring({ frame: Math.max(0, frame - 32), fps, config: { damping: 9, mass: 0.4, stiffness: 240 } });

  // Amygdala stress pulse
  const stressPulse = Math.sin((frame / fps) * 10) * 0.15 + 1.0;
  const stressGlow = Math.sin((frame / fps) * 8) * 20 + 40;

  // Cool logic pulse
  const logicPulse = Math.sin((frame / fps) * 4) * 0.05 + 1.0;

  // Neural dash line animation
  const dashOffset = (frame * 3) % 40;

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
          border: '1.5px solid rgba(239, 68, 68, 0.35)',
          boxShadow: `0 30px 100px rgba(0,0,0,0.9), 0 0 ${stressGlow}px rgba(239, 68, 68, 0.25)`,
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
              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
              color: '#FFFFFF',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 3,
              padding: '6px 20px',
              borderRadius: 16,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)',
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 34,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 2,
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* Anatomical Brain Vector Visualization */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 380,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${Math.min(1, brainSpring)})`,
            opacity: brainSpring,
          }}
        >
          <svg viewBox="0 0 600 360" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <radialGradient id="amygdalaAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#DC2626" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="logicAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#0891B2" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Brain Silhouette Outline */}
            <path
              d="M 160 260 C 130 250 100 210 110 160 C 120 110 160 80 230 70 C 300 60 380 65 440 100 C 500 135 520 180 500 230 C 480 280 430 300 370 295 C 330 290 310 320 270 320 C 230 320 180 290 160 260 Z"
              fill="rgba(15, 23, 42, 0.75)"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="3"
            />

            {/* Neural Brain Folds */}
            <path
              d="M 180 160 Q 220 140 260 170 T 360 160 T 450 180"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <path
              d="M 210 110 Q 270 90 330 120 T 430 120"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <path
              d="M 200 220 Q 260 240 320 210 T 420 240"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Neural Transmission Line connecting Logic to Amygdala */}
            <line
              x1="220" y1="140"
              x2="350" y2="210"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeDasharray="8 6"
              strokeDashoffset={-dashOffset}
              style={{ filter: 'drop-shadow(0 0 8px #F59E0B)' }}
            />

            {/* PREFRONTAL CORTEX (Cool Blue Zone - Front/Left) */}
            <g transform={`translate(210, 140) scale(${logicPulse})`}>
              <circle cx="0" cy="0" r="42" fill="url(#logicAura)" />
              <circle cx="0" cy="0" r="14" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 10px #06B6D4)' }} />
              <text x="0" y="5" textAnchor="middle" fill="#0E7490" fontSize="11" fontWeight="900" fontFamily={FONT.mono}>
                LOGIC
              </text>
            </g>

            {/* AMYGDALA CORE (Pulsing Red Zone - Deep Limbic Core) */}
            <g transform={`translate(350, 210) scale(${stressPulse})`}>
              <circle cx="0" cy="0" r="54" fill="url(#amygdalaAura)" />
              <circle cx="0" cy="0" r="18" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 15px #EF4444)' }} />
              <text x="0" y="5" textAnchor="middle" fill="#991B1B" fontSize="11" fontWeight="900" fontFamily={FONT.mono}>
                ALERT!
              </text>
            </g>
          </svg>
        </div>

        {/* Dual Cognitive Cards (Friend vs Self) */}
        <div
          style={{
            transform: `scale(${Math.min(1, cardSpring)})`,
            opacity: cardSpring,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* Side 1: Advising Friend (Calm Blue) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(8, 145, 178, 0.25) 100%)',
              border: '2px solid rgba(6, 182, 212, 0.6)',
              borderRadius: 18,
              padding: '16px 18px',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>🧠</span>
              <div style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 900, color: '#67E8F9' }}>
                {cortexTitle}
              </div>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
              {cortexSub}
            </div>
          </div>

          {/* Side 2: Advising Yourself (Stress Red) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.28) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.65)',
              borderRadius: 18,
              padding: '16px 18px',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 900, color: '#FCA5A5' }}>
                {amygdalaTitle}
              </div>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
              {amygdalaSub}
            </div>
          </div>
        </div>

        {/* Verdict Banner */}
        {verdictSpring > 0.05 && (
          <div
            style={{
              transform: `scale(${Math.min(1, verdictSpring)})`,
              opacity: Math.min(1, verdictSpring * 2),
              width: '100%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.32) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.8)',
              borderRadius: 16,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.45)',
            }}
          >
            <span style={{ fontSize: 22 }}>⚡</span>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#FCD34D',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {verdictBadge}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {verdictSub}
              </div>
            </div>
            <span style={{ fontSize: 22 }}>⚡</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

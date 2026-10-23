import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  prosTitle?: string;
  prosList?: string[];
  consTitle?: string;
  consList?: string[];
  verdictBadge?: string;
}

export const ProsConsComparison: React.FC<Props> = ({
  title = 'FRAMEWORK DUEL: NEXT.JS VS VITE',
  subtitle = 'MAKING THE PRODUCTION ARCHITECTURE DECISION',
  prosTitle = 'KEY ADVANTAGES',
  prosList = [
    'Built-in SSR, ISR & Perfect SEO',
    'Edge Network Caching out of the box',
    'Massive Enterprise Ecosystem & Vercel DX',
  ],
  consTitle = 'TRADE-OFFS & RISKS',
  consList = [
    'Serverless Cold Starts on Dynamic Lambdas',
    'Vendor Lock-in Risk with Hosting Primitives',
    'Complex Caching & Revalidation Mental Model',
  ],
  verdictBadge = 'VERDICT: SSR HYBRID WINS FOR SCALE & SEO',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const prosSpring = spring({ frame: frame - 12, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const consSpring = spring({ frame: frame - 20, fps, config: { damping: 13, mass: 0.8, stiffness: 120 } });
  const verdictSpring = spring({ frame: frame - 34, fps, config: { damping: 10, mass: 0.5, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '110px 48px',
        opacity: exit.opacity,
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(239,68,68,0.1) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Container */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${(1 - headerSpring) * -30}px)`,
          opacity: headerSpring,
          marginBottom: 44,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 14px #10B981',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: '#10B981' }}>
            TRADE-OFF EVALUATION
          </span>
        </div>

        <h1
          style={{
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: -1.5,
            margin: '0 0 12px 0',
            textShadow: '0 4px 24px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h1>

        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', fontWeight: 500, margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Twin Columns Container (Pros vs Cons) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 450px)',
          gap: 24,
          width: 924,
        }}
      >
        {/* Left Column: Pros (Emerald Green) */}
        <div
          style={{
            ...glassStyle,
            padding: '36px 32px',
            borderRadius: 28,
            border: '2px solid rgba(16,185,129,0.5)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.95) 100%)',
            boxShadow: '0 16px 48px rgba(16,185,129,0.2)',
            opacity: prosSpring,
            transform: `translateX(${(1 - prosSpring) * -40}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(16,185,129,0.25)',
                border: '1px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#10B981',
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#34D399', margin: 0, letterSpacing: 1 }}>
              {prosTitle}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {prosList.map((pro, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 20px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ color: '#10B981', fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>✓</span>
                <span style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 600, lineHeight: 1.4 }}>
                  {pro}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Cons (Rose Crimson) */}
        <div
          style={{
            ...glassStyle,
            padding: '36px 32px',
            borderRadius: 28,
            border: '2px solid rgba(239,68,68,0.5)',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(15,23,42,0.95) 100%)',
            boxShadow: '0 16px 48px rgba(239,68,68,0.2)',
            opacity: consSpring,
            transform: `translateX(${(1 - consSpring) * 40}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(239,68,68,0.25)',
                border: '1px solid #EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#EF4444',
                fontWeight: 900,
              }}
            >
              ✕
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#F87171', margin: 0, letterSpacing: 1 }}>
              {consTitle}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {consList.map((con, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 20px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ color: '#EF4444', fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>✕</span>
                <span style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 600, lineHeight: 1.4 }}>
                  {con}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Final Verdict Badge */}
      <div
        style={{
          marginTop: 'auto',
          padding: '24px 44px',
          borderRadius: 28,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(15,15,22,0.95) 100%)',
          border: '2px solid #F59E0B',
          boxShadow: '0 0 50px rgba(245,158,11,0.35)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 924,
          width: '100%',
          opacity: verdictSpring,
          transform: `scale(${0.85 + verdictSpring * 0.15}) translateY(${(1 - verdictSpring) * 20}px)`,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: '#F59E0B', marginBottom: 4 }}>
          ★ EXECUTIVE CONCLUSION ★
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0.5 }}>
          {verdictBadge}
        </div>
      </div>
    </AbsoluteFill>
  );
};

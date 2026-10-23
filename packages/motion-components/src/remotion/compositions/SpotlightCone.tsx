import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  headline?: string;
  subtext?: string;
  badge?: string;
  egoPercent?: number;
  tagline?: string;
  personality?: string;
}

export const SpotlightCone: React.FC<Props> = ({
  headline = 'THE SPOTLIGHT EFFECT',
  subtext = 'Convinced everyone is judging your every move?',
  badge = '🧠 COGNITIVE BIAS',
  egoPercent = 85,
  tagline = 'REALITY: NOBODY IS WATCHING',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const beamSpring = spring({ frame, fps, config: { damping: 12, mass: 0.5, stiffness: 180 } });
  const avatarSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 10, mass: 0.6, stiffness: 200 } });
  const badgeSpring = spring({ frame: Math.max(0, frame - 16), fps, config: { damping: 12, mass: 0.5, stiffness: 220 } });
  const truthStampSpring = spring({ frame: Math.max(0, frame - 38), fps, config: { damping: 9, mass: 0.4, stiffness: 240 } });

  // Flickering / breathing spotlight beam
  const beamOpacity = interpolate(beamSpring, [0, 1], [0, 0.95]);
  const beamPulse = Math.sin((frame / fps) * 6) * 0.04 + 0.96;
  const beamWidth = interpolate(beamSpring, [0, 1], [40, 520]);

  // Floating anxiety thought bubbles
  const thoughtY = Math.sin((frame / fps) * 4) * 8;
  const thoughtOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
          height: 980,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(8, 10, 18, 0.94)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.9), 0 0 80px rgba(245, 158, 11, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            transform: `scale(${Math.min(1, badgeSpring)})`,
            opacity: badgeSpring,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#000000',
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 3,
              padding: '6px 22px',
              borderRadius: 16,
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.8)',
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
              textShadow: '0 0 25px rgba(255, 255, 255, 0.4)',
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              maxWidth: 700,
            }}
          >
            {subtext}
          </div>
        </div>

        {/* Center: The Stage Spotlight Cone Visual */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 520,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Overhead Stage Light Fixture */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: 90,
              height: 24,
              borderRadius: '12px 12px 4px 4px',
              background: 'linear-gradient(180deg, #4B5563 0%, #1F2937 100%)',
              border: '2px solid #F59E0B',
              boxShadow: '0 0 25px #F59E0B',
              zIndex: 5,
            }}
          />

          {/* Volumetric SVG Spotlight Cone Beam */}
          <svg
            style={{
              position: 'absolute',
              top: 18,
              width: '100%',
              height: 480,
              overflow: 'visible',
              opacity: beamOpacity * beamPulse,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <linearGradient id="spotlightBeam" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="90%" stopColor="#F59E0B" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              <radialGradient id="stageFloor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </radialGradient>
            </defs>

            {/* Expanding Triangular Light Cone */}
            <polygon
              points={`480,0 520,0 ${500 + beamWidth / 2},440 ${500 - beamWidth / 2},440`}
              fill="url(#spotlightBeam)"
            />

            {/* Glowing Floor Contact Oval */}
            <ellipse
              cx="500"
              cy="440"
              rx={beamWidth / 2}
              ry="36"
              fill="url(#stageFloor)"
            />
          </svg>

          {/* Isolated Anxious Character in the Center of the Beam */}
          <div
            style={{
              position: 'absolute',
              bottom: 45,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${avatarSpring})`,
              opacity: avatarSpring,
              zIndex: 6,
            }}
          >
            {/* Person Head + Body Silhouette */}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)',
                boxShadow: '0 0 35px #F59E0B, inset 0 0 10px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}
            >
              😰
            </div>
            <div
              style={{
                width: 100,
                height: 120,
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: '32px 32px 12px 12px',
                border: '2px solid rgba(245, 158, 11, 0.6)',
                marginTop: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#FCD34D',
                  letterSpacing: 1,
                  textAlign: 'center',
                  padding: '0 8px',
                }}
              >
                YOU
              </span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                (Trapped in Ego)
              </span>
            </div>
          </div>

          {/* Left Anxiety Whispers */}
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 140,
              transform: `translateY(${thoughtY}px)`,
              opacity: thoughtOpacity,
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 16,
              padding: '12px 18px',
              maxWidth: 240,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: 900, color: '#F87171' }}>
              💭 "Did everyone see that?!"
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              Overthinking awkward moment
            </div>
          </div>

          {/* Right Anxiety Whispers */}
          <div
            style={{
              position: 'absolute',
              right: 40,
              top: 180,
              transform: `translateY(${-thoughtY}px)`,
              opacity: thoughtOpacity,
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 16,
              padding: '12px 18px',
              maxWidth: 250,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: 900, color: '#F87171' }}>
              👁️ "They're all judging me!"
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              Spotlight distortion: {egoPercent}%
            </div>
          </div>
        </div>

        {/* Slamming Truth Stamp: REALITY CHECK */}
        {truthStampSpring > 0.05 && (
          <div
            style={{
              transform: `scale(${Math.min(1, truthStampSpring)}) rotate(-1deg)`,
              opacity: Math.min(1, truthStampSpring * 2),
              width: '100%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
              border: '2px solid #10B981',
              borderRadius: 18,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 28 }}>💡</span>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#6EE7B7',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {tagline}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                Everyone else is too trapped in their own head to notice you.
              </div>
            </div>
            <span style={{ fontSize: 28 }}>💡</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  subtitle?: string;
  surfaceTitle?: string;
  surfaceItems?: string[];
  underwaterTitle?: string;
  underwaterItems?: string[];
}

export const IcebergModel: React.FC<Props> = ({
  title = 'THE ICEBERG ILLUSION',
  subtitle = 'WHAT SUCCESS ACTUALLY DEMANDS',
  surfaceTitle = 'WHAT PEOPLE SEE (10%)',
  surfaceItems = ['Viral Traction', 'High Net Worth', 'Public Praise', 'Overnight Success'],
  underwaterTitle = 'WHAT LIES BENEATH (90%)',
  underwaterItems = [
    '5 Years of Zero Recognition',
    'Hundreds of Unanswered Pitch Mails',
    '7 Critical Product Pivots',
    'Overcoming Imposter Syndrome',
    'Relentless Unseen Discipline',
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width = 1080, height = 1920 } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);
  const scale = Math.min(width / 1080, height / 1920);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const surfaceSpring = spring({ frame: frame - 10, fps, config: { damping: 13, mass: 0.7, stiffness: 130 } });
  const waterSpring = spring({ frame: frame - 18, fps, config: { damping: 14, mass: 0.8, stiffness: 110 } });
  const deepSpring = spring({ frame: frame - 28, fps, config: { damping: 12, mass: 0.6, stiffness: 140 } });

  // Floating gentle bobbing motion
  const bobbing = Math.sin(frame * 0.08) * 8;
  const waveShift = (frame * 1.5) % 100;

  // Waterline Y coordinate (W=1080, H=1920)
  const WATERLINE_Y = 680;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: exit.opacity,
      }}
    >
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          fontFamily: FONT.display,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '110px 48px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
      {/* Underwater Deep Abyss Ambient Lighting */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: WATERLINE_Y,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(6,182,212,0.18) 0%, rgba(2,132,199,0.15) 30%, rgba(15,23,42,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Container */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${(1 - headerSpring) * -30}px)`,
          opacity: headerSpring,
          marginBottom: 30,
          zIndex: 20,
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
            border: '1px solid rgba(56,189,248,0.4)',
            backdropFilter: 'blur(20px)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#38BDF8',
              boxShadow: '0 0 14px #38BDF8',
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: '#38BDF8' }}>
            DEPTH ARCHITECTURE
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

      {/* Surface Water Line Divider with Wave SVG */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: WATERLINE_Y - 14,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          zIndex: 15,
          opacity: waterSpring,
        }}
      >
        <svg width="1080" height="36" viewBox="0 0 1080 36" fill="none">
          <path
            d="M0 18 Q 135 6, 270 18 T 540 18 T 810 18 T 1080 18"
            stroke="#38BDF8"
            strokeWidth="3.5"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 12px #38BDF8)' }}
          />
        </svg>

        {/* Water Surface Tag */}
        <div
          style={{
            position: 'absolute',
            right: 48,
            top: -24,
            padding: '4px 14px',
            borderRadius: 8,
            background: 'rgba(56,189,248,0.2)',
            border: '1px solid rgba(56,189,248,0.5)',
            fontSize: 12,
            fontFamily: FONT.mono,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: '#38BDF8',
          }}
        >
          SURFACE HORIZON
        </div>
      </div>

      {/* Above-Water Section (10% - Surface) */}
      <div
        style={{
          width: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 10,
          marginBottom: 50,
          zIndex: 10,
          opacity: surfaceSpring,
          transform: `translateY(${bobbing}px)`,
        }}
      >
        <div
          style={{
            ...glassStyle,
            width: '100%',
            padding: '24px 32px',
            borderRadius: 24,
            border: '2px solid rgba(56,189,248,0.5)',
            background: 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(15,23,42,0.9) 100%)',
            boxShadow: '0 8px 32px rgba(56,189,248,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, color: '#38BDF8' }}>
              ▲ {surfaceTitle}
            </span>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(56,189,248,0.25)',
                fontSize: 14,
                fontWeight: 900,
                color: '#FFFFFF',
              }}
            >
              VISIBLE OUTPUT
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {surfaceItems.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 18px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                ✨ {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Underwater Section (90% - Foundations) */}
      <div
        style={{
          width: 900,
          zIndex: 10,
          marginTop: 20,
          opacity: deepSpring,
          transform: `translateY(${(1 - deepSpring) * 30}px)`,
        }}
      >
        <div
          style={{
            ...glassStyle,
            width: '100%',
            padding: '32px 36px',
            borderRadius: 28,
            border: '2px solid rgba(2,132,199,0.4)',
            background: 'linear-gradient(135deg, rgba(2,132,199,0.25) 0%, rgba(3,7,18,0.96) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(2,132,199,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#38BDF8' }}>
              ▼ {underwaterTitle}
            </span>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.5)',
                fontSize: 14,
                fontWeight: 900,
                color: '#F87171',
              }}
            >
              THE HIDDEN WORK
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {underwaterItems.map((item, i) => {
              const itemSpring = spring({
                frame: frame - 28 - i * 6,
                fps,
                config: { damping: 13, mass: 0.6, stiffness: 140 },
              });

              return (
                <div
                  key={i}
                  style={{
                    padding: '16px 22px',
                    borderRadius: 16,
                    backgroundColor: 'rgba(15,23,42,0.8)',
                    border: '1px solid rgba(56,189,248,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    opacity: itemSpring,
                    transform: `translateX(${(1 - itemSpring) * 30}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: 'rgba(56,189,248,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 900,
                      color: '#38BDF8',
                    }}
                  >
                    0{i + 1}
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Takeaway Insight */}
      <div
        style={{
          marginTop: 'auto',
          padding: '18px 36px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 900,
          opacity: deepSpring,
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          ⚓ You cannot produce the 10% tip without building the massive 90% foundation.
        </span>
      </div>
      </div>
    </AbsoluteFill>
  );
};

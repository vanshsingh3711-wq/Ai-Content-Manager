import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

export interface MagnifyingGlassZoomProps {
  title?: string;
  badge?: string;
  backgroundSnippet?: string;
  zoomTarget?: string;
  calloutTitle?: string;
  calloutDetail?: string;
  personality?: string;
}

export const MagnifyingGlassZoom: React.FC<MagnifyingGlassZoomProps> = ({
  title = 'FORENSIC CONTRACT AUDIT',
  badge = '🔬 OPTICAL FORENSIC ZOOM',
  backgroundSnippet = 'Clause 14.3: The standard service tier shall remain operative unless otherwise modified by auxiliary management schedules outlined in supplementary appendix B.',
  zoomTarget = 'HIDDEN 2.4% COMPOUND FEE',
  calloutTitle = 'FINE PRINT EXPOSED',
  calloutDetail = 'This hidden clause quietly drained over $380,000 in compounding wealth over a 20-year horizon.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });
  const lensMoveSpring = spring({ frame: frame - 8, fps, config: { damping: 12, mass: 0.6, stiffness: 170 } });
  const calloutSpring = spring({ frame: frame - 26, fps, config: { damping: 10, mass: 0.5, stiffness: 220 } });

  // Leader line draw animation (frames 18 to 32)
  const lineProgress = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Floating lens coordinates
  const lensX = interpolate(lensMoveSpring, [0, 1], [-60, 0]);
  const lensY = interpolate(lensMoveSpring, [0, 1], [30, 0]);

  // Subtle breathing pulse for lens light
  const lensPulse = Math.sin((frame / fps) * 6) * 0.04 + 1;
  const cyanGlow = Math.sin((frame / fps) * 5) * 15 + 30;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 28px',
        ...exit,
      }}
    >
      {/* Background container card */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          background: 'rgba(8, 14, 28, 0.95)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${cyanGlow}px rgba(56, 189, 248, 0.22)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#38BDF8',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>●</span> {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 3,
              color: '#E2E8F0',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Middle Stage: Document Under Inspection */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(2, 6, 23, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '36px 36px',
            minHeight: 380,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Faint context lines simulating fine-print contract paragraphs */}
          <div
            style={{
              fontFamily: '"Georgia", serif',
              fontSize: 22,
              lineHeight: 1.85,
              color: 'rgba(226, 232, 240, 0.28)',
              letterSpacing: 0.2,
              filter: 'blur(0.4px)',
            }}
          >
            <p style={{ margin: '0 0 16px 0' }}>{backgroundSnippet}</p>
            <p style={{ margin: '0 0 16px 0', opacity: 0.22 }}>
              Subject to Section 18.1 regulatory provisions, all third-party administrative deductions continue unabated without discretionary reassessment.
            </p>
            <p style={{ margin: 0, opacity: 0.15 }}>
              Failure to notify corporate counsel within thirty (30) business days constitutes irrevocable forfeiture of reimbursement privileges.
            </p>
          </div>

          {/* Optical Magnifying Glass Mechanism */}
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '42%',
              transform: `translate(-50%, -50%) translate(${lensX}px, ${lensY}px) scale(${lensPulse})`,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            {/* Magnifying Glass Bezel & Rim */}
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(2, 6, 23, 0.98) 85%)',
                border: '7px solid #CBD5E1',
                boxShadow: `
                  0 0 0 3px rgba(15, 23, 42, 0.95),
                  0 0 50px rgba(56, 189, 248, 0.5),
                  inset 0 0 40px rgba(56, 189, 248, 0.45),
                  0 30px 70px rgba(0, 0, 0, 0.85)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(1px)',
              }}
            >
              {/* Lens Optical Reflection Sheen */}
              <div
                style={{
                  position: 'absolute',
                  top: '-25%',
                  left: '-25%',
                  width: '150%',
                  height: '150%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.03) 40%, transparent 60%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />

              {/* HUD Targeting Reticle Rings */}
              <div
                style={{
                  position: 'absolute',
                  width: '88%',
                  height: '88%',
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(56, 189, 248, 0.5)',
                  pointerEvents: 'none',
                }}
              />

              {/* Magnified High-Resolution Target Text Inside Lens */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '0 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2.5,
                    color: '#38BDF8',
                    background: 'rgba(56, 189, 248, 0.18)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '3px 12px',
                    borderRadius: 4,
                  }}
                >
                  TARGET ANOMALY
                </div>
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 30,
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: '#FFFFFF',
                    textShadow: '0 0 25px rgba(56, 189, 248, 0.9), 0 2px 4px rgba(0,0,0,0.9)',
                    letterSpacing: -0.5,
                  }}
                >
                  {zoomTarget}
                </div>
              </div>
            </div>

            {/* Magnifier Neck Joint & Metallic Handle */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                right: -8,
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Metallic joint neck */}
              <div
                style={{
                  width: 14,
                  height: 18,
                  background: 'linear-gradient(90deg, #64748B, #F1F5F9, #334155)',
                  borderRadius: 2,
                }}
              />
              {/* Main grip handle */}
              <div
                style={{
                  width: 24,
                  height: 110,
                  background: 'linear-gradient(90deg, #334155 0%, #94A3B8 35%, #F8FAFC 65%, #1E293B 100%)',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            </div>
          </div>

          {/* SVG Animated Connecting Leader Line to Callout Card */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          >
            <path
              d="M 520 220 L 640 280 L 780 280"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3.5"
              strokeDasharray="300"
              strokeDashoffset={(1 - lineProgress) * 300}
              filter="drop-shadow(0 0 8px #38BDF8)"
            />
            {lineProgress > 0.05 && (
              <circle cx="520" cy="220" r="5" fill="#38BDF8" filter="drop-shadow(0 0 10px #38BDF8)" />
            )}
          </svg>
        </div>

        {/* Floating Callout Takeaway Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1.5px solid rgba(56, 189, 248, 0.45)',
            borderRadius: 16,
            padding: '24px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 20px 45px rgba(0,0,0,0.75), 0 0 30px rgba(56, 189, 248, 0.15)',
            transform: `scale(${Math.max(0, calloutSpring)}) translateY(${(1 - calloutSpring) * 25}px)`,
            opacity: Math.min(1, calloutSpring * 2),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontFamily: FONT.mono,
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 2,
                padding: '4px 12px',
                borderRadius: 6,
                textTransform: 'uppercase',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
              }}
            >
              ⚠️ {calloutTitle}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 14,
                color: '#94A3B8',
                letterSpacing: 1.5,
              }}
            >
              MAGNIFIED FORENSIC TAKEAWAY
            </span>
          </div>

          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1.45,
              color: '#F8FAFC',
              letterSpacing: 0.1,
            }}
          >
            {calloutDetail}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

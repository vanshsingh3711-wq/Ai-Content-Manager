import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  leftName?: string;
  leftCost?: string;
  leftValue?: string;
  rightName?: string;
  rightCost?: string;
  rightValue?: string;
  title?: string;
}

export const ROIBalanceScale: React.FC<Props> = ({
  leftName = 'New Financed SUV',
  leftCost = '-$850 / Month Payment',
  leftValue = '$14,000 (10 Yr Resale)',
  rightName = 'S&P 500 Index Fund',
  rightCost = '+$850 / Month Invested',
  rightValue = '$184,200 (10 Yr Compounded)',
  title = 'THE WEALTH WEIGHING SCALE',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const scaleSpring = spring({ frame: frame - 12, fps, config: { damping: 10, mass: 0.8, stiffness: 90 } });
  const slamSpring = spring({ frame: frame - 24, fps, config: { damping: 8, mass: 0.5, stiffness: 180 } });

  // Scale tilt angle (Right side heavy = tilts down to right, e.g. +14 deg)
  const tiltDeg = interpolate(slamSpring, [0, 1], [0, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 30px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(8, 12, 22, 0.94)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.20)',
          fontFamily: FONT.display,
        }}
      >
        {/* Header */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -16}px)`,
            opacity: headerSpring,
            width: '100%',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 18,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(250, 204, 21, 0.15)',
              border: '1px solid rgba(250, 204, 21, 0.35)',
              color: '#FACC15',
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 6,
              letterSpacing: '0.08em',
              fontFamily: FONT.mono,
              marginBottom: 8,
            }}
          >
            OPPORTUNITY COST ARBITRAGE
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {title}
          </div>
        </div>

        {/* Mechanical Balance Beam SVG & Trays */}
        <div
          style={{
            width: '100%',
            height: 280,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: scaleSpring,
          }}
        >
          {/* Fulcrum Stand */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              width: 0,
              height: 0,
              borderLeft: '24px solid transparent',
              borderRight: '24px solid transparent',
              borderBottom: '90px solid #475569',
              zIndex: 1,
            }}
          />

          {/* Rotating Beam */}
          <div
            style={{
              position: 'absolute',
              top: 130,
              width: '84%',
              height: 12,
              background: '#94A3B8',
              borderRadius: 6,
              transform: `rotate(${tiltDeg}deg)`,
              transformOrigin: 'center center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              transition: 'transform 0.1s ease-out',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            {/* Center Pivot Pin */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#F8FAFC',
                border: '3px solid #0F172A',
              }}
            />

            {/* Left Pan (Liability - Rises up) */}
            <div
              style={{
                position: 'absolute',
                left: -10,
                top: 12,
                transform: `rotate(${-tiltDeg}deg)`,
                width: 320,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.40)',
                borderRadius: 16,
                padding: '16px 20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', fontFamily: FONT.mono }}>
                DEPRECIATING LIABILITY
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
                {leftName}
              </div>
              <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4, fontFamily: FONT.mono }}>
                {leftCost}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', marginTop: 8, fontFamily: FONT.mono }}>
                {leftValue}
              </div>
            </div>

            {/* Right Pan (Compounding Asset - Slams Down) */}
            <div
              style={{
                position: 'absolute',
                right: -10,
                top: 12,
                transform: `rotate(${-tiltDeg}deg)`,
                width: 320,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10B981',
                borderRadius: 16,
                padding: '16px 20px',
                boxShadow: '0 0 35px rgba(16, 185, 129, 0.35)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, color: '#34D399', fontFamily: FONT.mono }}>
                COMPOUNDING WEALTH
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
                {rightName}
              </div>
              <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4, fontFamily: FONT.mono }}>
                {rightCost}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981', marginTop: 8, fontFamily: FONT.mono }}>
                {rightValue}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Delta Verdict */}
        <div
          style={{
            width: '100%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 14,
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: slamSpring,
          }}
        >
          <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
            Opportunity Cost Delta: Choosing the S&P 500 generates a 13.1x wealth multiplier.
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', fontFamily: FONT.mono }}>
            +$170,200 NET ALPHA
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

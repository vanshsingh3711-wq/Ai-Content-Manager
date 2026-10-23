import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  initialCapital?: number;
  timeframeYears?: number;
  averageInflation?: string;
  terminalValue?: number;
  lossPercentage?: string;
}

export const InflationCashBurn: React.FC<Props> = ({
  initialCapital = 10000,
  timeframeYears = 10,
  averageInflation = '7.2% / Year',
  terminalValue = 4980,
  lossPercentage = '-50.2%',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 150 } });
  const decaySpring = spring({ frame: frame - 12, fps, config: { damping: 14, mass: 0.9, stiffness: 90 } });
  const stampSpring = spring({ frame: frame - 28, fps, config: { damping: 8, mass: 0.4, stiffness: 220 } });

  // Interpolated decaying value
  const currentValue = Math.round(
    interpolate(decaySpring, [0, 1], [initialCapital, terminalValue], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const burnProgress = Math.min(1, decaySpring);
  const emberPulse = Math.sin((frame / fps) * 8) * 0.15 + 0.85;

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
          padding: '42px 38px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(18, 10, 12, 0.94)',
          border: '1.5px solid rgba(239, 68, 68, 0.25)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(239, 68, 68, 0.25)',
          fontFamily: FONT.display,
        }}
      >
        {/* Header Warning Bar */}
        <div
          style={{
            transform: `scale(${Math.min(1, headerSpring)}) translateY(${(1 - headerSpring) * -16}px)`,
            opacity: headerSpring,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.20)',
                  border: '1px solid rgba(239, 68, 68, 0.50)',
                  color: '#EF4444',
                  fontSize: 12,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.08em',
                  fontFamily: FONT.mono,
                }}
              >
                ⚠️ PURCHASING POWER EROSION
              </span>
              <span style={{ fontSize: 13, color: '#CBD5E1', fontFamily: FONT.mono, fontWeight: 700 }}>
                {averageInflation} INFLATION
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', marginTop: 6 }}>
              THE SILENT CASH TAX
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
              Real Purchasing Power Left
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: '#EF4444',
                fontFamily: FONT.mono,
                letterSpacing: '-0.02em',
                textShadow: '0 0 24px rgba(239, 68, 68, 0.65)',
              }}
            >
              ${currentValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 3D Dollar Bill Stack with Ember Glow */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '24px 0',
          }}
        >
          {/* Bill Visualizer Container */}
          <div
            style={{
              position: 'relative',
              width: 540,
              height: 220,
              background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
              border: '2px solid rgba(52, 211, 153, 0.4)',
              borderRadius: 20,
              padding: '24px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Dollar Bill Border Patterns */}
            <div
              style={{
                position: 'absolute',
                inset: 8,
                border: '1px dashed rgba(255, 255, 255, 0.25)',
                borderRadius: 14,
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#34D399', fontFamily: FONT.mono }}>
                $10,000
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#A7F3D0', letterSpacing: '0.1em' }}>
                FEDERAL RESERVE NOTE
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#34D399', fontFamily: FONT.mono }}>
                $10,000
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#ECFDF5', letterSpacing: '0.04em' }}>
                CASH HELD IN ZERO-INTEREST SAVINGS
              </div>
              <div style={{ fontSize: 13, color: '#A7F3D0', marginTop: 4 }}>
                Time Decay: {timeframeYears} Years of Compounding Purchasing Power Loss
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6EE7B7', fontWeight: 700 }}>
              <span>SERIES 2016</span>
              <span>100% UNPROTECTED CAPITAL</span>
              <span>GUARANTEED DEPRECIATION</span>
            </div>

            {/* Ember Singe / Burn Overlay (Expanding from right to left) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: `${burnProgress * 65}%`,
                background: 'linear-gradient(to left, rgba(0,0,0,0.96) 0%, rgba(20,5,5,0.85) 60%, rgba(239,68,68,0.3) 100%)',
                borderLeft: `3px solid rgba(249, 115, 22, ${emberPulse})`,
                boxShadow: `inset 0 0 30px rgba(239, 68, 68, 0.7), -10px 0 20px rgba(249, 115, 22, ${emberPulse})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {burnProgress > 0.4 && (
                <div style={{ textAlign: 'center', transform: 'rotate(-6deg)' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#EF4444', textShadow: '0 0 16px rgba(239,68,68,1)' }}>
                    🔥 BURN RATE
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FDE047', fontFamily: FONT.mono }}>
                    {lossPercentage} DESTROYED
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Distress Rubber Stamp */}
          {stampSpring > 0.1 && (
            <div
              style={{
                position: 'absolute',
                transform: `rotate(-12deg) scale(${Math.min(1, stampSpring)})`,
                opacity: stampSpring,
                border: '4px solid #DC2626',
                borderRadius: 14,
                padding: '12px 28px',
                background: 'rgba(220, 38, 38, 0.20)',
                color: '#DC2626',
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '0.12em',
                fontFamily: FONT.mono,
                textShadow: '0 0 20px rgba(220, 38, 38, 0.8)',
                boxShadow: '0 0 40px rgba(220, 38, 38, 0.5)',
              }}
            >
              INFLATION SLAUGHTER
            </div>
          )}
        </div>

        {/* Footer Real Takeaway */}
        <div
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.30)',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>
            Keeping money in a 0.05% bank account is not "safe". It is a mathematically guaranteed wealth bleed.
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#EF4444', fontFamily: FONT.mono, whiteSpace: 'nowrap' }}>
            50% REAL LOSS
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

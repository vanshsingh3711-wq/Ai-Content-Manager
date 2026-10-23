import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

interface Props {
  title?: string;
  step1Title?: string;
  step1Sub?: string;
  step1Badge?: string;
  step1Icon?: string;
  step2Title?: string;
  step2Sub?: string;
  step2Badge?: string;
  step2Icon?: string;
  step3Title?: string;
  step3Sub?: string;
  step3Prefix?: string;
  step3Suffix?: string;
  step3Icon?: string;
  autoAmount?: string;
  compoundTotal?: number;
  bottomBanner?: string;
  bannerIcon?: string;
  personality?: string;
}

export const CompoundFormula: React.FC<Props> = ({
  title = 'THE 3-STEP WINNING FORMULA',
  step1Title = '1. AUTOMATE YOUR INVESTING',
  step1Sub = 'Recurring 1st of Month • Zero Manual Intervention',
  step1Badge,
  step1Icon = '🔄',
  step2Title = '2. IGNORE THE DAILY NOISE',
  step2Sub = 'Mute Financial News • Eliminate Panic Selling',
  step2Badge = '🚨 Market Panic',
  step2Icon = '🔕',
  step3Title = '3. COMPOUND GROWTH',
  step3Sub = 'Exponential Hockey-Stick Wealth Curve',
  step3Prefix = '$',
  step3Suffix = '',
  step3Icon = '📈',
  autoAmount = '$500 / Month',
  compoundTotal = 1450000,
  bottomBanner = 'BUY THE HAYSTACK • WIN LONG TERM',
  bannerIcon = '🌾',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  // Staggered step entrance springs for rapid 3.7s reveal
  const step1Spring = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 14, mass: 0.6, stiffness: 200 } });
  const step2Spring = spring({ frame: Math.max(0, frame - 24), fps, config: { damping: 14, mass: 0.6, stiffness: 200 } });
  const step3Spring = spring({ frame: Math.max(0, frame - 46), fps, config: { damping: 12, mass: 0.7, stiffness: 180 } });

  // Exponential compounding counter ($10k -> $1.45M)
  const compoundProgress = interpolate(frame, [48, 82], [10000, compoundTotal], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentCompound = Math.round(compoundProgress).toLocaleString('en-US');

  // Curve draw progress for SVG exponential line (normalized 100 -> 0)
  const curveDraw = interpolate(frame, [48, 82], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = Math.sin((frame / fps) * 8) * 0.05 + 1;

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 26px',
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '38px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(10, 12, 22, 0.92)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 60px rgba(16, 185, 129, 0.25)',
        }}
      >
        {/* Header Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#FFFFFF',
            fontFamily: FONT.display,
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 3,
            padding: '6px 22px',
            borderRadius: 16,
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
            textTransform: 'uppercase',
          }}
        >
          🏆 {title}
        </div>

        {/* STEP 1: AUTOMATE YOUR INVESTING */}
        <div
          style={{
            width: '100%',
            transform: `translateX(${(1 - step1Spring) * -40}px)`,
            opacity: step1Spring,
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.16) 0%, rgba(30, 58, 138, 0.25) 100%)',
            border: '1.5px solid rgba(59, 130, 246, 0.5)',
            borderRadius: 18,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>{step1Icon}</span>
            <div>
              <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: '#60A5FA' }}>
                {step1Title}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {step1Sub}
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid #3B82F6',
              color: '#93C5FD',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 15,
              padding: '6px 14px',
              borderRadius: 12,
            }}
          >
            {step1Badge || autoAmount}
          </div>
        </div>

        {/* STEP 2: IGNORE THE DAILY NOISE */}
        <div
          style={{
            width: '100%',
            transform: `translateX(${(1 - step2Spring) * 40}px)`,
            opacity: step2Spring,
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(127, 29, 29, 0.22) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            borderRadius: 18,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>{step2Icon}</span>
            <div>
              <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: '#F87171' }}>
                {step2Title}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {step2Sub}
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid #EF4444',
              color: '#FECACA',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 13,
              padding: '6px 14px',
              borderRadius: 12,
              textDecoration: 'line-through',
            }}
          >
            {step2Badge}
          </div>
        </div>

        {/* STEP 3: LET COMPOUND GROWTH DO THE REST */}
        <div
          style={{
            width: '100%',
            transform: `scale(${Math.min(1, step3Spring)})`,
            opacity: step3Spring,
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 78, 59, 0.32) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.65)',
            borderRadius: 22,
            padding: '20px 22px',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{step3Icon}</span>
              <div>
                <div style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 900, color: '#34D399' }}>
                  {step3Title}
                </div>
                <div style={{ fontFamily: FONT.mono, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {step3Sub}
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 32,
                fontWeight: 900,
                color: '#10B981',
                textShadow: '0 0 25px rgba(16, 185, 129, 0.9)',
                transform: `scale(${frame > 82 ? pulse : 1})`,
              }}
            >
              {step3Prefix}{currentCompound}{step3Suffix}
            </div>
          </div>

          {/* SVG Exponential Growth Curve Line */}
          <div style={{ width: '100%', height: 70, position: 'relative' }}>
            <svg viewBox="0 0 300 70" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="curveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="70%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>
              </defs>
              {/* Baseline Grid */}
              <line x1="0" y1="65" x2="300" y2="65" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* Exponential Curve */}
              <path
                d="M 10 62 Q 120 60 180 40 T 290 8"
                fill="none"
                stroke="url(#curveGrad)"
                strokeWidth="4"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={curveDraw}
                strokeLinecap="round"
              />
              {/* Climbing Dot at Head */}
              <circle
                cx="290"
                cy="8"
                r="6"
                fill="#FFFFFF"
                opacity={frame > 82 ? 1 : 0}
                style={{ filter: 'drop-shadow(0 0 8px #10B981)' }}
              />
            </svg>
          </div>
        </div>

        {/* Bottom Victory Banner */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.6)',
            borderRadius: 16,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>{bannerIcon}</span>
          <span
            style={{
              fontFamily: FONT.display,
              fontSize: 18,
              fontWeight: 900,
              color: '#FCD34D',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {bottomBanner}
          </span>
          <span style={{ fontSize: 22 }}>{bannerIcon}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

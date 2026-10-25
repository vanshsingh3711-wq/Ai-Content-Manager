import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface ChronoDialClockProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  synthesis?: string;
  currentTime?: string;
  timeframe?: string;
  epoch1Time?: string;
  epoch1Title?: string;
  epoch1Desc?: string;
  epoch1Badge?: string;
  epoch2Time?: string;
  epoch2Title?: string;
  epoch2Desc?: string;
  epoch2Badge?: string;
  epoch3Time?: string;
  epoch3Title?: string;
  epoch3Desc?: string;
  epoch3Badge?: string;
  epoch4Time?: string;
  epoch4Title?: string;
  epoch4Desc?: string;
  epoch4Badge?: string;
  accentColor?: string;
  activeColor?: string;
  [key: string]: any;
}

export const ChronoDialClock: React.FC<ChronoDialClockProps> = ({
  title = 'AI HISTORY IN 24 HOURS',
  subtitle = '1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER',
  badge = '24-HOUR CHRONOMETER',
  synthesis = 'If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds.',
  currentTime = '23:59:56',
  timeframe = '1950 — 2026 (76 Years)',
  epoch1Time = '00:00',
  epoch1Title = 'Turing Test & Perceptron',
  epoch1Desc = '1950: Foundational symbolic AI logic, Turing computability thesis, and initial artificial neurons.',
  epoch1Badge = 'GENESIS // T=0h',
  epoch2Time = '18:30',
  epoch2Title = 'Deep Learning Resurgence',
  epoch2Desc = '2012: AlexNet & GPU-accelerated backpropagation prove deep convolutional nets crush legacy heuristics.',
  epoch2Badge = 'CONVOLUTION // T=18.5h',
  epoch3Time = '22:45',
  epoch3Title = 'Attention & Transformer Core',
  epoch3Desc = '2017: Attention Is All You Need shifts the computational paradigm to massively parallel matrix self-attention.',
  epoch3Badge = 'TRANSFORMER // T=22.7h',
  epoch4Time = '23:59:56',
  epoch4Title = 'Autonomous Reasoning Swarms',
  epoch4Desc = '2026: Multi-agent autonomous swarms, self-healing code loops, and stateful recursive inference.',
  epoch4Badge = 'EXPONENTIAL // T=23.99h',
  accentColor = '#00E5FF',
  activeColor = '#10B981',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitOpacity = useExitFade(frame, durationInFrames, 15);

  // Global container entrance
  const containerEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  // Dial rotation / hand sweep spring (frame 10-60)
  const clockSweep = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.1 },
  });

  // Pulse oscillation for the final epoch alert
  const pulse = Math.sin((frame / 30) * Math.PI * 2) * 0.5 + 0.5;

  // Chronometer Dial geometry (SVG viewBox: 0 0 680 680)
  const cx = 340;
  const cy = 340;
  const rOuter = 270;
  const rDial = 240;
  const rInner = 190;

  // Clock Hand angle sweep: 0 to 359.8 degrees
  const handAngleDeg = interpolate(clockSweep, [0, 1], [-90, 269.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const handAngleRad = (handAngleDeg * Math.PI) / 180;

  // Staggered epochs cards springs (frames 20, 32, 44, 56)
  const e1Spring = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 16, stiffness: 90 } });
  const e2Spring = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 16, stiffness: 90 } });
  const e3Spring = spring({ frame: Math.max(0, frame - 42), fps, config: { damping: 16, stiffness: 90 } });
  const e4Spring = spring({ frame: Math.max(0, frame - 54), fps, config: { damping: 14, stiffness: 95, mass: 0.8 } });

  // Compute angle helper for an epoch (H, M) -> degrees
  const getEpochAngleDeg = (h: number, m: number) => {
    const fraction = (h + m / 60) / 24;
    return -90 + fraction * 360;
  };

  const ep1Angle = getEpochAngleDeg(0, 0);     // -90 deg (12 o'clock)
  const ep2Angle = getEpochAngleDeg(18, 30);   // 187.5 deg
  const ep3Angle = getEpochAngleDeg(22, 45);   // 251.25 deg
  const ep4Angle = getEpochAngleDeg(23, 59.9); // 269.85 deg (just left of 12 o'clock)

  const getCoord = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * radius,
      y: cy + Math.sin(rad) * radius,
    };
  };

  // Generate 24 major hour ticks and 72 minor ticks
  const hourTicks = Array.from({ length: 24 }).map((_, i) => {
    const deg = -90 + (i / 24) * 360;
    const p1 = getCoord(deg, rOuter);
    const p2 = getCoord(deg, rOuter - 14);
    const pLabel = getCoord(deg, rOuter - 28);
    return { deg, p1, p2, pLabel, hour: i.toString().padStart(2, '0') };
  });

  const minorTicks = Array.from({ length: 72 }).map((_, i) => {
    const deg = -90 + (i / 72) * 360;
    const p1 = getCoord(deg, rOuter);
    const p2 = getCoord(deg, rOuter - 7);
    return { deg, p1, p2 };
  });

  // Sweep Arc path from 0 to handAngleDeg
  const sweepArcD = (() => {
    const startAngle = -90;
    const currentAngle = Math.min(269.8, handAngleDeg);
    const radStart = (startAngle * Math.PI) / 180;
    const radEnd = (currentAngle * Math.PI) / 180;
    const xStart = cx + Math.cos(radStart) * rDial;
    const yStart = cy + Math.sin(radStart) * rDial;
    const xEnd = cx + Math.cos(radEnd) * rDial;
    const yEnd = cy + Math.sin(radEnd) * rDial;
    const largeArc = (currentAngle - startAngle) > 180 ? 1 : 0;
    return `M ${xStart} ${yStart} A ${rDial} ${rDial} 0 ${largeArc} 1 ${xEnd} ${yEnd}`;
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.display,
        color: '#FFFFFF',
        opacity: exitOpacity,
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          left: 120,
          top: 140,
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 600,
          right: 120,
          top: 220,
          background: `radial-gradient(circle, ${activeColor}12 0%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container Card */}
      <div
        style={{
          width: 1780,
          height: 980,
          borderRadius: 28,
          backgroundColor: 'rgba(8, 10, 15, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: `0 0 80px rgba(0, 0, 0, 0.9), 0 0 45px ${accentColor}12, inset 0 1px 2px rgba(255, 255, 255, 0.15)`,
          display: 'flex',
          flexDirection: 'column',
          padding: '38px 46px',
          boxSizing: 'border-box',
          position: 'relative',
          opacity: containerEntrance,
          transform: `scale(${interpolate(containerEntrance, [0, 1], [0.96, 1])})`,
        }}
      >
        {/* Top Glowing Edge Filament */}
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: 80,
            right: 80,
            height: 2,
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 14px ${accentColor}`,
          }}
        />

        {/* ── HEADER ROW ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  borderRadius: 999,
                  backgroundColor: `${accentColor}15`,
                  border: `1px solid ${accentColor}40`,
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: accentColor,
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}`,
                  }}
                />
                <span>{badge}</span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  color: 'rgba(255, 255, 255, 0.45)',
                  letterSpacing: '0.08em',
                }}
              >
                // TEMPORAL COMPRESSION RATIO: 1 HOUR = 3.16 YEARS
              </span>
            </div>

            <h1
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: 0,
                color: '#FFFFFF',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 13,
                fontFamily: FONT.mono,
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '5px 0 0 0',
                letterSpacing: '0.08em',
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Top-Right Digital Chronometer HUD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                padding: '10px 20px',
                borderRadius: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span style={{ fontSize: 9, fontFamily: FONT.mono, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.1em' }}>
                ACCELERATED TIMELINE
              </span>
              <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
                {timeframe}
              </span>
            </div>

            <div
              style={{
                padding: '10px 22px',
                borderRadius: 14,
                backgroundColor: `${activeColor}15`,
                border: `1.5px solid ${activeColor}50`,
                boxShadow: `0 0 25px ${activeColor}25`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span style={{ fontSize: 9, fontFamily: FONT.mono, color: activeColor, fontWeight: 900, letterSpacing: '0.1em' }}>
                CURRENT DIAL TIME
              </span>
              <span style={{ fontSize: 24, fontFamily: FONT.mono, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em', marginTop: 1 }}>
                {currentTime}
              </span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT (24-HOUR CHRONOMETER + MILESTONE CARDS) ── */}
        <div style={{ display: 'flex', flex: 1, gap: 36, minHeight: 0 }}>
          {/* LEFT: Precision Circular Chronometer Watch Face */}
          <div
            style={{
              flex: '1.05',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              padding: 10,
            }}
          >
            {/* SVG 24-Hour Watch Face */}
            <svg
              viewBox="0 0 680 680"
              style={{ width: '100%', height: '100%', maxWidth: 660, maxHeight: 660 }}
            >
              <defs>
                {/* Dial Center Glow */}
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                  <stop offset="70%" stopColor={accentColor} stopOpacity={0.03} />
                  <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                </radialGradient>

                {/* Sweep Arc Glow */}
                <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={accentColor} />
                  <stop offset="75%" stopColor={activeColor} />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>

              {/* Ambient Dial Center Radial Glow */}
              <circle cx={cx} cy={cy} r={rDial} fill="url(#centerGlow)" />

              {/* Outer Housing Rings */}
              <circle cx={cx} cy={cy} r={rOuter + 14} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r={rDial} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

              {/* Minor Sub-Minute Ticks */}
              {minorTicks.map((t, idx) => (
                <line
                  key={`minor-${idx}`}
                  x1={t.p1.x}
                  y1={t.p1.y}
                  x2={t.p2.x}
                  y2={t.p2.y}
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth="1"
                />
              ))}

              {/* Major 24-Hour Ticks & Numerals */}
              {hourTicks.map((t, idx) => (
                <g key={`hour-${idx}`}>
                  <line
                    x1={t.p1.x}
                    y1={t.p1.y}
                    x2={t.p2.x}
                    y2={t.p2.y}
                    stroke={idx % 6 === 0 ? accentColor : 'rgba(255, 255, 255, 0.4)'}
                    strokeWidth={idx % 6 === 0 ? 2.5 : 1.5}
                  />
                  {idx % 3 === 0 && (
                    <text
                      x={t.pLabel.x}
                      y={t.pLabel.y + 4}
                      fill={idx % 6 === 0 ? accentColor : 'rgba(255, 255, 255, 0.6)'}
                      fontSize={idx % 6 === 0 ? '12' : '10'}
                      fontFamily={FONT.mono}
                      fontWeight={idx % 6 === 0 ? '900' : 'bold'}
                      textAnchor="middle"
                    >
                      {t.hour}
                    </text>
                  )}
                </g>
              ))}

              {/* Swept Elapsed Chronometer Arc */}
              {clockSweep > 0.01 && (
                <path
                  d={sweepArcD}
                  fill="none"
                  stroke="url(#arcGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 10px rgba(0, 229, 255, 0.7))"
                />
              )}

              {/* Epoch Milestone Nodes on Perimeter */}
              {/* Epoch 1 (00:00 / 1950) */}
              {(() => {
                const pos = getCoord(ep1Angle, rDial);
                return (
                  <g opacity={e1Spring}>
                    <circle cx={pos.x} cy={pos.y} r="6" fill="#00E5FF" filter="drop-shadow(0 0 8px #00E5FF)" />
                    <circle cx={pos.x} cy={pos.y} r="2.5" fill="#FFFFFF" />
                  </g>
                );
              })()}

              {/* Epoch 2 (18:30 / 2012) */}
              {(() => {
                const pos = getCoord(ep2Angle, rDial);
                return (
                  <g opacity={e2Spring}>
                    <circle cx={pos.x} cy={pos.y} r="6" fill="#38BDF8" filter="drop-shadow(0 0 8px #38BDF8)" />
                    <circle cx={pos.x} cy={pos.y} r="2.5" fill="#FFFFFF" />
                  </g>
                );
              })()}

              {/* Epoch 3 (22:45 / 2017) */}
              {(() => {
                const pos = getCoord(ep3Angle, rDial);
                return (
                  <g opacity={e3Spring}>
                    <circle cx={pos.x} cy={pos.y} r="6" fill="#F59E0B" filter="drop-shadow(0 0 8px #F59E0B)" />
                    <circle cx={pos.x} cy={pos.y} r="2.5" fill="#FFFFFF" />
                  </g>
                );
              })()}

              {/* Epoch 4 (23:59 / 2026 - CLIMAX EXPONENTIAL NODE) */}
              {(() => {
                const pos = getCoord(ep4Angle, rDial);
                return (
                  <g opacity={e4Spring}>
                    <circle cx={pos.x} cy={pos.y} r={8 + pulse * 4} fill="none" stroke={activeColor} strokeWidth="2" opacity={1 - pulse * 0.5} />
                    <circle cx={pos.x} cy={pos.y} r="7" fill={activeColor} filter={`drop-shadow(0 0 12px ${activeColor})`} />
                    <circle cx={pos.x} cy={pos.y} r="3" fill="#FFFFFF" />
                  </g>
                );
              })()}

              {/* Rotating Chronograph Hand Needle */}
              <g>
                {/* Needle Tail Counterweight */}
                <line
                  x1={cx - Math.cos(handAngleRad) * 35}
                  y1={cy - Math.sin(handAngleRad) * 35}
                  x2={cx + Math.cos(handAngleRad) * (rDial + 8)}
                  y2={cy + Math.sin(handAngleRad) * (rDial + 8)}
                  stroke={activeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter={`drop-shadow(0 0 10px ${activeColor})`}
                />
                {/* High-Tech Diamond Tip on Hand */}
                <circle
                  cx={cx + Math.cos(handAngleRad) * (rDial + 8)}
                  cy={cy + Math.sin(handAngleRad) * (rDial + 8)}
                  r="4"
                  fill="#FFFFFF"
                  filter={`drop-shadow(0 0 8px ${activeColor})`}
                />
              </g>

              {/* Center Multi-Layer Hub */}
              <circle cx={cx} cy={cy} r="18" fill="#080A0F" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="10" fill={accentColor} filter={`drop-shadow(0 0 10px ${accentColor})`} />
              <circle cx={cx} cy={cy} r="4" fill="#FFFFFF" />

              {/* Dial Center Callout Pill */}
              <g opacity={e4Spring}>
                <rect
                  x={cx - 110}
                  y={cy + 55}
                  width="220"
                  height="42"
                  rx="10"
                  fill="rgba(0, 0, 0, 0.75)"
                  stroke={`${activeColor}40`}
                  strokeWidth="1"
                />
                <text
                  x={cx}
                  y={cy + 74}
                  fill={activeColor}
                  fontSize="10"
                  fontFamily={FONT.mono}
                  fontWeight="900"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  FINAL 4 SECONDS OF 24H
                </text>
                <text
                  x={cx}
                  y={cy + 88}
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize="9"
                  fontFamily={FONT.mono}
                  textAnchor="middle"
                >
                  Generative Foundation Swarms
                </text>
              </g>
            </svg>
          </div>

          {/* RIGHT: 4 Chronological Milestone Epoch Cards */}
          <div
            style={{
              flex: '1.15',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              position: 'relative',
            }}
          >
            {/* Connecting Vertical Timeline Guide Rail */}
            <div
              style={{
                position: 'absolute',
                left: 28,
                top: 40,
                bottom: 40,
                width: 2,
                background: 'linear-gradient(to bottom, #00E5FF, #38BDF8, #F59E0B, #10B981)',
                opacity: 0.35,
              }}
            />

            {/* Epoch 1: 1950 (00:00) */}
            <div
              style={{
                padding: '16px 22px 16px 48px',
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                opacity: e1Spring,
                transform: `translateX(${interpolate(e1Spring, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 22,
                  top: 22,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#00E5FF',
                  boxShadow: '0 0 10px #00E5FF',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontFamily: FONT.mono, fontWeight: 900, color: '#00E5FF', letterSpacing: '0.08em' }}>
                  {epoch1Badge}
                </span>
                <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: '#00E5FF' }}>
                  {epoch1Time}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 4px 0', color: '#FFFFFF' }}>
                {epoch1Title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                {epoch1Desc}
              </p>
            </div>

            {/* Epoch 2: 2012 (18:30) */}
            <div
              style={{
                padding: '16px 22px 16px 48px',
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                opacity: e2Spring,
                transform: `translateX(${interpolate(e2Spring, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 22,
                  top: 22,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#38BDF8',
                  boxShadow: '0 0 10px #38BDF8',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontFamily: FONT.mono, fontWeight: 900, color: '#38BDF8', letterSpacing: '0.08em' }}>
                  {epoch2Badge}
                </span>
                <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: '#38BDF8' }}>
                  {epoch2Time}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 4px 0', color: '#FFFFFF' }}>
                {epoch2Title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                {epoch2Desc}
              </p>
            </div>

            {/* Epoch 3: 2017 (22:45) */}
            <div
              style={{
                padding: '16px 22px 16px 48px',
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                opacity: e3Spring,
                transform: `translateX(${interpolate(e3Spring, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 22,
                  top: 22,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  boxShadow: '0 0 10px #F59E0B',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontFamily: FONT.mono, fontWeight: 900, color: '#F59E0B', letterSpacing: '0.08em' }}>
                  {epoch3Badge}
                </span>
                <span style={{ fontSize: 13, fontFamily: FONT.mono, fontWeight: 900, color: '#F59E0B' }}>
                  {epoch3Time}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 4px 0', color: '#FFFFFF' }}>
                {epoch3Title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4 }}>
                {epoch3Desc}
              </p>
            </div>

            {/* Epoch 4: 2026 (23:59:56 - EXPONENTIAL CLIMAX) */}
            <div
              style={{
                padding: '18px 24px 18px 48px',
                borderRadius: 18,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: `1.5px solid ${activeColor}`,
                boxShadow: `0 0 35px ${activeColor}20`,
                position: 'relative',
                opacity: e4Spring,
                transform: `translateX(${interpolate(e4Spring, [0, 1], [30, 0])}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 20,
                  top: 22,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: activeColor,
                  boxShadow: `0 0 14px ${activeColor}`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: FONT.mono,
                    fontWeight: 900,
                    color: activeColor,
                    backgroundColor: `${activeColor}20`,
                    padding: '3px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.08em',
                  }}
                >
                  {epoch4Badge}
                </span>
                <span style={{ fontSize: 14, fontFamily: FONT.mono, fontWeight: 900, color: activeColor }}>
                  {epoch4Time} (T-4 SECONDS)
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: '3px 0 4px 0', color: '#FFFFFF' }}>
                {epoch4Title}
              </h3>
              <p style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.45 }}>
                {epoch4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* ── FOOTER LAW OF TEMPORAL COMPRESSION ── */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 22px',
            borderRadius: 14,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              fontSize: 10,
              fontFamily: FONT.mono,
              fontWeight: 900,
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            TEMPORAL LAW
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: FONT.mono,
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

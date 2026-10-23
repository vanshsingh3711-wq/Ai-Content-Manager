import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

export interface TimelineRoadmapProps {
  title?: string;
  badge?: string;
  step1Phase?: string;
  step1Title?: string;
  step1Desc?: string;
  step1Icon?: string;
  step1Badge?: string;
  step2Phase?: string;
  step2Title?: string;
  step2Desc?: string;
  step2Icon?: string;
  step2Badge?: string;
  step3Phase?: string;
  step3Title?: string;
  step3Desc?: string;
  step3Icon?: string;
  step3Badge?: string;
  synthesis?: string;
  currentStep?: number;
}

export const TimelineRoadmap: React.FC<TimelineRoadmapProps> = ({
  title = '30-DAY RETENTION EXECUTION ROADMAP',
  badge = '🚀 MILESTONE SEQUENCE',
  step1Phase = 'PHASE 01',
  step1Title = 'Curiosity Gap Architecture',
  step1Desc = 'Engineered subconscious intrigue loops eliminate initial 3-second drop-off.',
  step1Icon = '🎯',
  step1Badge = 'COMPLETED ✓',
  step2Phase = 'PHASE 02',
  step2Title = 'Dynamic Velocity Modulation',
  step2Desc = 'Visual and cognitive pacing shifts every 2.5s to maintain neuro-arousal.',
  step2Icon = '⚡',
  step2Badge = 'ACTIVE EXECUTION',
  step3Phase = 'PHASE 03',
  step3Title = 'High-Value Compounding Payoff',
  step3Desc = 'Unfiltered actionable insight locks in viewer loyalty and triggers viral shares.',
  step3Icon = '🏆',
  step3Badge = 'TARGET DESTINATION',
  synthesis = 'SYSTEM PROGRESS: Sequential compounding drives exponential audience retention.',
  currentStep = 3,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Entrance spring for main card
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });

  // Progressive timeline progression: laser spine descends down the track
  // Total spine travel distance = 600px (from node 1 at Y=0 to node 3 at Y=600)
  const maxTravel = currentStep === 1 ? 0 : currentStep === 2 ? 300 : 600;
  const spineProgress = interpolate(frame, [10, 48], [0, maxTravel], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Percentage counter rolling up
  const targetPct = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
  const pctCounter = Math.round(
    interpolate(frame, [12, 50], [0, targetPct], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  // Milestone 1 activation
  const m1Spring = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.5, stiffness: 220 } });
  const m1Active = frame >= 12;

  // Milestone 2 activation
  const m2Spring = spring({ frame: frame - 28, fps, config: { damping: 12, mass: 0.5, stiffness: 220 } });
  const m2Active = frame >= 28 && currentStep >= 2;

  // Milestone 3 activation
  const m3Spring = spring({ frame: frame - 44, fps, config: { damping: 12, mass: 0.5, stiffness: 220 } });
  const m3Active = frame >= 44 && currentStep >= 3;

  // Subtle breathing pulse for active head
  const pulse = Math.sin((frame / fps) * 6) * 0.05 + 1;
  const cyanGlow = Math.sin((frame / fps) * 5) * 12 + 28;

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
      {/* Container Card */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '38px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          background: 'rgba(10, 15, 30, 0.96)',
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.15) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          border: '1.5px solid rgba(14, 165, 233, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${cyanGlow}px rgba(14, 165, 233, 0.20)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Track Badge */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(2, 132, 199, 0.15))',
              border: '1px solid rgba(14, 165, 233, 0.55)',
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
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.25)',
            }}
          >
            <span>●</span> {badge}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 2.5,
                color: '#E2E8F0',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </span>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 12,
                padding: '4px 12px',
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 900,
                color: '#38BDF8',
              }}
            >
              {pctCounter}%
            </div>
          </div>
        </div>

        {/* Timeline Canvas Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 720,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {/* Vertical Spine Column (Left) */}
          <div
            style={{
              position: 'relative',
              width: 80,
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* Background Spine Rail */}
            <div
              style={{
                position: 'absolute',
                top: 55,
                bottom: 65,
                width: 4,
                background: 'rgba(255, 255, 255, 0.10)',
                borderRadius: 2,
              }}
            />

            {/* Glowing Active Neon Laser Spine */}
            <div
              style={{
                position: 'absolute',
                top: 55,
                width: 4,
                height: spineProgress,
                background: 'linear-gradient(180deg, #38BDF8 0%, #818CF8 50%, #10B981 100%)',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.85), 0 0 24px rgba(16, 185, 129, 0.5)',
                borderRadius: 2,
              }}
            />

            {/* Traveling Laser Tracer Head */}
            {spineProgress > 0 && spineProgress < 600 && (
              <div
                style={{
                  position: 'absolute',
                  top: 55 + spineProgress - 7,
                  left: '50%',
                  transform: `translateX(-50%) scale(${pulse})`,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 0 16px #38BDF8, 0 0 30px #38BDF8',
                  zIndex: 20,
                }}
              />
            )}

            {/* Milestone Node 1 (Y = 55) */}
            <div
              style={{
                position: 'absolute',
                top: 55,
                left: 40,
                width: 60,
                height: 2,
                background: m1Active
                  ? 'linear-gradient(90deg, #38BDF8, rgba(56, 189, 248, 0.15))'
                  : 'rgba(255, 255, 255, 0.08)',
                zIndex: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 55,
                left: '50%',
                transform: `translate(-50%, -50%) scale(${Math.max(0, m1Spring)})`,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: m1Active
                  ? 'linear-gradient(135deg, #0284C7, #0369A1)'
                  : 'rgba(30, 41, 59, 0.9)',
                border: `3px solid ${m1Active ? '#38BDF8' : 'rgba(148, 163, 184, 0.3)'}`,
                boxShadow: m1Active ? '0 0 25px rgba(56, 189, 248, 0.75)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                zIndex: 10,
                transition: 'all 0.2s ease-out',
              }}
            >
              {step1Icon}
            </div>

            {/* Milestone Node 2 (Y = 355) */}
            <div
              style={{
                position: 'absolute',
                top: 355,
                left: 40,
                width: 60,
                height: 2,
                background: m2Active
                  ? 'linear-gradient(90deg, #818CF8, rgba(129, 140, 248, 0.15))'
                  : 'rgba(255, 255, 255, 0.08)',
                zIndex: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 355,
                left: '50%',
                transform: `translate(-50%, -50%) scale(${Math.max(0, m2Spring)})`,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: m2Active
                  ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                  : 'rgba(30, 41, 59, 0.9)',
                border: `3px solid ${m2Active ? '#818CF8' : 'rgba(148, 163, 184, 0.3)'}`,
                boxShadow: m2Active ? '0 0 25px rgba(129, 140, 248, 0.75)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                zIndex: 10,
                transition: 'all 0.2s ease-out',
              }}
            >
              {step2Icon}
            </div>

            {/* Milestone Node 3 (Y = 655) */}
            <div
              style={{
                position: 'absolute',
                top: 655,
                left: 40,
                width: 60,
                height: 2,
                background: m3Active
                  ? 'linear-gradient(90deg, #10B981, rgba(16, 185, 129, 0.15))'
                  : 'rgba(255, 255, 255, 0.08)',
                zIndex: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 655,
                left: '50%',
                transform: `translate(-50%, -50%) scale(${Math.max(0, m3Spring)})`,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: m3Active
                  ? 'linear-gradient(135deg, #059669, #047857)'
                  : 'rgba(30, 41, 59, 0.9)',
                border: `3px solid ${m3Active ? '#10B981' : 'rgba(148, 163, 184, 0.3)'}`,
                boxShadow: m3Active ? '0 0 25px rgba(16, 185, 129, 0.75)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                zIndex: 10,
                transition: 'all 0.2s ease-out',
              }}
            >
              {step3Icon}
            </div>
          </div>

          {/* Cards Column (Right) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingLeft: 20,
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                transform: `translateX(${(1 - m1Spring) * 35}px) scale(${Math.max(0, m1Spring)})`,
                opacity: Math.min(1, m1Spring * 2),
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
                border: `1.5px solid ${m1Active ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 18,
                padding: '20px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: m1Active
                  ? '0 12px 35px rgba(0,0,0,0.65), 0 0 20px rgba(56, 189, 248, 0.15)'
                  : '0 8px 20px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#38BDF8', letterSpacing: 2 }}>
                  {step1Phase}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 10,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                  }}
                >
                  {step1Badge}
                </span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>
                {step1Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.4 }}>
                {step1Desc}
              </span>
            </div>

            {/* Card 2 */}
            <div
              style={{
                transform: `translateX(${(1 - m2Spring) * 35}px) scale(${Math.max(0, m2Spring)})`,
                opacity: Math.min(1, m2Spring * 2),
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
                border: `1.5px solid ${m2Active ? 'rgba(129, 140, 248, 0.55)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 18,
                padding: '20px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: m2Active
                  ? '0 12px 35px rgba(0,0,0,0.65), 0 0 20px rgba(129, 140, 248, 0.15)'
                  : '0 8px 20px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#818CF8', letterSpacing: 2 }}>
                  {step2Phase}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 10,
                    background: 'rgba(129, 140, 248, 0.15)',
                    color: '#818CF8',
                    border: '1px solid rgba(129, 140, 248, 0.4)',
                  }}
                >
                  {step2Badge}
                </span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>
                {step2Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.4 }}>
                {step2Desc}
              </span>
            </div>

            {/* Card 3 */}
            <div
              style={{
                transform: `translateX(${(1 - m3Spring) * 35}px) scale(${Math.max(0, m3Spring)})`,
                opacity: Math.min(1, m3Spring * 2),
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
                border: `1.5px solid ${m3Active ? 'rgba(16, 185, 129, 0.55)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 18,
                padding: '20px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: m3Active
                  ? '0 12px 35px rgba(0,0,0,0.65), 0 0 20px rgba(16, 185, 129, 0.15)'
                  : '0 8px 20px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#10B981', letterSpacing: 2 }}>
                  {step3Phase}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {step3Badge}
                </span>
              </div>
              <span style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>
                {step3Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.4 }}>
                {step3Desc}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Takeaway Synthesis Bar */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#38BDF8', letterSpacing: 2 }}>
            SYSTEM SYNTHESIS:
          </span>
          <span style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 600, color: '#CBD5E1' }}>
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

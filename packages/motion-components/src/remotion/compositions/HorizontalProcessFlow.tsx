import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

interface StepItem {
  num: number;
  title: string;
  desc: string;
  tag: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  activeStep?: number;
  steps?: StepItem[];
}

const DEFAULT_STEPS: StepItem[] = [
  { num: 1, title: 'Audit & Diagnose', desc: 'Identify critical workflow bottlenecks and revenue leaks', tag: 'PHASE 01' },
  { num: 2, title: 'Architect System', desc: 'Engineer custom AI automations and database pipelines', tag: 'PHASE 02' },
  { num: 3, title: 'Deploy Live', desc: 'Zero downtime rollout with automated regression suites', tag: 'ACTIVE NOW' },
  { num: 4, title: 'Scale & Compound', desc: '10x client capacity without adding overhead headcount', tag: 'PHASE 04' },
];

export const HorizontalProcessFlow: React.FC<Props> = ({
  title = 'HOW IT WORKS: 4-STEP BLUEPRINT',
  subtitle = 'FROM ZERO TO SCALED AUTOMATION',
  activeStep = 3,
  steps = DEFAULT_STEPS,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 14);

  const headerSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 140 } });
  const footerSpring = spring({ frame: frame - 44, fps, config: { damping: 12, mass: 0.6, stiffness: 160 } });

  // Breathing pulse on active node
  const pulseScale = 1 + Math.sin(frame * 0.15) * 0.05;

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
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 820,
          height: 820,
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)',
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
          marginBottom: 36,
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
            border: '1px solid rgba(14,165,233,0.4)',
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
            EXECUTION PIPELINE
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

      {/* Process Pipeline Track with Nodes */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          width: '100%',
          maxWidth: 920,
          position: 'relative',
        }}
      >
        {/* Vertical glowing connector line behind cards */}
        <div
          style={{
            position: 'absolute',
            left: 54,
            top: 40,
            bottom: 40,
            width: 4,
            background: 'linear-gradient(to bottom, #38BDF8, #818CF8 50%, #C084FC 80%, rgba(255,255,255,0.1))',
            boxShadow: '0 0 16px rgba(56,189,248,0.5)',
            zIndex: 0,
          }}
        />

        {steps.map((st, i) => {
          const stepSpring = spring({
            frame: frame - 10 - i * 8,
            fps,
            config: { damping: 13, mass: 0.7, stiffness: 130 },
          });

          const isActive = st.num === activeStep;
          const isDone = st.num < activeStep;

          const accentColor = isActive
            ? '#38BDF8'
            : isDone
            ? '#10B981'
            : 'rgba(255,255,255,0.3)';

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: stepSpring,
                transform: `translateX(${(1 - stepSpring) * 40}px)`,
                zIndex: 10,
              }}
            >
              {/* Step Number Circle */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? '#0284C7'
                    : isDone
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(15,15,22,0.9)',
                  border: `3px solid ${accentColor}`,
                  boxShadow: isActive ? `0 0 30px ${accentColor}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 900,
                  color: isActive ? '#FFFFFF' : accentColor,
                  flexShrink: 0,
                  transform: isActive ? `scale(${pulseScale})` : 'none',
                  transition: 'transform 0.1s ease',
                }}
              >
                {isDone ? '✓' : st.num}
              </div>

              {/* Step Card */}
              <div
                style={{
                  ...glassStyle,
                  flex: 1,
                  padding: '24px 32px',
                  borderRadius: 24,
                  border: isActive
                    ? '2px solid #38BDF8'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(2,132,199,0.25) 0%, rgba(15,15,22,0.95) 100%)'
                    : 'rgba(15,15,22,0.85)',
                  boxShadow: isActive ? '0 12px 40px rgba(2,132,199,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        backgroundColor: `${accentColor}25`,
                        border: `1px solid ${accentColor}60`,
                        fontSize: 13,
                        fontWeight: 800,
                        color: accentColor,
                        letterSpacing: 1.5,
                      }}
                    >
                      {st.tag}
                    </span>
                    <h3 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                      {st.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>
                    {st.desc}
                  </p>
                </div>

                {/* Right Status Indicator */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: isActive ? '#38BDF8' : isDone ? '#10B981' : 'rgba(255,255,255,0.4)',
                      letterSpacing: 1,
                    }}
                  >
                    {isActive ? '● IN PROGRESS' : isDone ? 'COMPLETED' : 'UPCOMING'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Completion Milestone */}
      <div
        style={{
          marginTop: 'auto',
          padding: '18px 36px',
          borderRadius: 24,
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          maxWidth: 860,
          opacity: footerSpring,
          transform: `translateY(${(1 - footerSpring) * 20}px)`,
        }}
      >
        <span style={{ fontSize: 20, color: '#34D399', fontWeight: 700 }}>
          ⚡ Fully automated pipeline eliminates 90% of manual execution hours.
        </span>
      </div>
    </AbsoluteFill>
  );
};

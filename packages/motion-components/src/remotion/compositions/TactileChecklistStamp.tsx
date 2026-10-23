import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, glassStyle, useExitFade } from '../shared';

export interface TactileChecklistStampProps {
  title?: string;
  badge?: string;
  item1Text?: string;
  item1Detail?: string;
  item1Status?: 'pass' | 'fail';
  item2Text?: string;
  item2Detail?: string;
  item2Status?: 'pass' | 'fail';
  item3Text?: string;
  item3Detail?: string;
  item3Status?: 'pass' | 'fail';
  verdictText?: string;
  verdictStatus?: 'pass' | 'fail' | 'warning';
  synthesis?: string;
}

export const TactileChecklistStamp: React.FC<TactileChecklistStampProps> = ({
  title = 'NICHE VIABILITY AUDIT MATRIX',
  badge = '📋 DECISION MATRIX',
  item1Text = 'High Organic Search Volume',
  item1Detail = '5.4M monthly search queries verified across algorithmic search graphs.',
  item1Status = 'pass',
  item2Text = 'Zero Capital Barrier to Entry',
  item2Detail = 'Requires $45,000 upfront specialized production equipment & studio lease.',
  item2Status = 'fail',
  item3Text = 'Compounding Replay Retention',
  item3Detail = 'High subconscious curiosity gap delivers above 85% average completion rate.',
  item3Status = 'pass',
  verdictText = 'CRITICAL BOTTLENECK: CAPITAL BARRIER INVALIDATES MODEL',
  verdictStatus = 'warning',
  synthesis = 'AUDIT RESULT: 1 critical structural failure invalidates all other positive signals.',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Entrance spring for main card container
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });

  // Rows entrance springs
  const row1Spring = spring({ frame: frame - 6, fps, config: { damping: 13, mass: 0.6, stiffness: 190 } });
  const row2Spring = spring({ frame: frame - 18, fps, config: { damping: 13, mass: 0.6, stiffness: 190 } });
  const row3Spring = spring({ frame: frame - 30, fps, config: { damping: 13, mass: 0.6, stiffness: 190 } });

  // Rubber stamp impact springs (high stiffness, low damping for violent tactile slap)
  const stamp1Spring = spring({ frame: frame - 16, fps, config: { damping: 10, mass: 0.4, stiffness: 280 } });
  const stamp2Spring = spring({ frame: frame - 32, fps, config: { damping: 10, mass: 0.4, stiffness: 280 } });
  const stamp3Spring = spring({ frame: frame - 46, fps, config: { damping: 10, mass: 0.4, stiffness: 280 } });

  // Bottom verdict entrance
  const verdictSpring = spring({ frame: frame - 54, fps, config: { damping: 11, mass: 0.5, stiffness: 210 } });

  // Stamp shockwave ring animations
  const ring1 = interpolate(frame - 16, [0, 12], [0, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring1Op = interpolate(frame - 16, [0, 12], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const ring2 = interpolate(frame - 32, [0, 12], [0, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring2Op = interpolate(frame - 32, [0, 12], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const ring3 = interpolate(frame - 46, [0, 12], [0, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring3Op = interpolate(frame - 46, [0, 12], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Ambient breathing glow
  const amberGlow = Math.sin((frame / fps) * 5) * 12 + 25;

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
          gap: 20,
          background: 'rgba(10, 14, 28, 0.96)',
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${amberGlow}px rgba(245, 158, 11, 0.18)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Tag */}
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
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              color: '#FDE047',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            <span>●</span> {badge}
          </div>

          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 2.5,
              color: '#F8FAFC',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* 3 Checklist Evaluation Rows */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Row 1 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.90), rgba(15, 23, 42, 0.96))',
              border: '1.5px solid rgba(255, 255, 255, 0.10)',
              borderRadius: 18,
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: `translateX(${(1 - row1Spring) * 30}px) scale(${Math.max(0, row1Spring)})`,
              opacity: Math.min(1, row1Spring * 2),
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: '68%' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  fontWeight: 900,
                  color: '#94A3B8',
                  flexShrink: 0,
                }}
              >
                01
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
                  {item1Text}
                </span>
                <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.3 }}>
                  {item1Detail}
                </span>
              </div>
            </div>

            {/* Stamp 1 */}
            <div style={{ position: 'relative', flexShrink: 0, minWidth: 160, display: 'flex', justifyContent: 'flex-end' }}>
              {frame >= 16 && (
                <>
                  {/* Shockwave ring */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 40,
                      transform: 'translate(50%, -50%)',
                      width: 120 + ring1,
                      height: 40 + ring1,
                      border: `2px solid ${item1Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      borderRadius: 12,
                      opacity: ring1Op,
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Rubber Stamp Badge */}
                  <div
                    style={{
                      transform: `rotate(-6deg) scale(${1 + (1 - stamp1Spring) * 1.5})`,
                      opacity: Math.min(1, stamp1Spring * 3),
                      border: `3px solid ${item1Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      background: item1Status === 'pass' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      boxShadow: `0 0 20px ${item1Status === 'pass' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}, inset 0 0 10px ${item1Status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: 10,
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: FONT.mono,
                      fontSize: 16,
                      fontWeight: 900,
                      letterSpacing: 2,
                      color: item1Status === 'pass' ? '#34D399' : '#F87171',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>{item1Status === 'pass' ? 'PASSED ✓' : 'FAILED ✗'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.90), rgba(15, 23, 42, 0.96))',
              border: '1.5px solid rgba(255, 255, 255, 0.10)',
              borderRadius: 18,
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: `translateX(${(1 - row2Spring) * 30}px) scale(${Math.max(0, row2Spring)})`,
              opacity: Math.min(1, row2Spring * 2),
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: '68%' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  fontWeight: 900,
                  color: '#94A3B8',
                  flexShrink: 0,
                }}
              >
                02
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
                  {item2Text}
                </span>
                <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.3 }}>
                  {item2Detail}
                </span>
              </div>
            </div>

            {/* Stamp 2 */}
            <div style={{ position: 'relative', flexShrink: 0, minWidth: 160, display: 'flex', justifyContent: 'flex-end' }}>
              {frame >= 32 && (
                <>
                  {/* Shockwave ring */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 40,
                      transform: 'translate(50%, -50%)',
                      width: 120 + ring2,
                      height: 40 + ring2,
                      border: `2px solid ${item2Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      borderRadius: 12,
                      opacity: ring2Op,
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Rubber Stamp Badge */}
                  <div
                    style={{
                      transform: `rotate(5deg) scale(${1 + (1 - stamp2Spring) * 1.5})`,
                      opacity: Math.min(1, stamp2Spring * 3),
                      border: `3px solid ${item2Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      background: item2Status === 'pass' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      boxShadow: `0 0 20px ${item2Status === 'pass' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}, inset 0 0 10px ${item2Status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: 10,
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: FONT.mono,
                      fontSize: 16,
                      fontWeight: 900,
                      letterSpacing: 2,
                      color: item2Status === 'pass' ? '#34D399' : '#F87171',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>{item2Status === 'pass' ? 'PASSED ✓' : 'FAILED ✗'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 3 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.90), rgba(15, 23, 42, 0.96))',
              border: '1.5px solid rgba(255, 255, 255, 0.10)',
              borderRadius: 18,
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: `translateX(${(1 - row3Spring) * 30}px) scale(${Math.max(0, row3Spring)})`,
              opacity: Math.min(1, row3Spring * 2),
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: '68%' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 15,
                  fontWeight: 900,
                  color: '#94A3B8',
                  flexShrink: 0,
                }}
              >
                03
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
                  {item3Text}
                </span>
                <span style={{ fontFamily: FONT.display, fontSize: 14, color: '#94A3B8', lineHeight: 1.3 }}>
                  {item3Detail}
                </span>
              </div>
            </div>

            {/* Stamp 3 */}
            <div style={{ position: 'relative', flexShrink: 0, minWidth: 160, display: 'flex', justifyContent: 'flex-end' }}>
              {frame >= 46 && (
                <>
                  {/* Shockwave ring */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 40,
                      transform: 'translate(50%, -50%)',
                      width: 120 + ring3,
                      height: 40 + ring3,
                      border: `2px solid ${item3Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      borderRadius: 12,
                      opacity: ring3Op,
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Rubber Stamp Badge */}
                  <div
                    style={{
                      transform: `rotate(-4deg) scale(${1 + (1 - stamp3Spring) * 1.5})`,
                      opacity: Math.min(1, stamp3Spring * 3),
                      border: `3px solid ${item3Status === 'pass' ? '#10B981' : '#EF4444'}`,
                      background: item3Status === 'pass' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      boxShadow: `0 0 20px ${item3Status === 'pass' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}, inset 0 0 10px ${item3Status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: 10,
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: FONT.mono,
                      fontSize: 16,
                      fontWeight: 900,
                      letterSpacing: 2,
                      color: item3Status === 'pass' ? '#34D399' : '#F87171',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>{item3Status === 'pass' ? 'PASSED ✓' : 'FAILED ✗'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Verdict Decision Box */}
        <div
          style={{
            width: '100%',
            transform: `scale(${Math.max(0, verdictSpring)}) translateY(${(1 - verdictSpring) * 20}px)`,
            opacity: Math.min(1, verdictSpring * 2),
            background:
              verdictStatus === 'warning'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.20), rgba(217, 119, 6, 0.10))'
                : verdictStatus === 'fail'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.20), rgba(185, 28, 28, 0.10))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.20), rgba(5, 150, 105, 0.10))',
            border: `1.5px solid ${
              verdictStatus === 'warning'
                ? 'rgba(245, 158, 11, 0.55)'
                : verdictStatus === 'fail'
                ? 'rgba(239, 68, 68, 0.55)'
                : 'rgba(16, 185, 129, 0.55)'
            }`,
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: `0 0 25px ${
              verdictStatus === 'warning'
                ? 'rgba(245, 158, 11, 0.25)'
                : verdictStatus === 'fail'
                ? 'rgba(239, 68, 68, 0.25)'
                : 'rgba(16, 185, 129, 0.25)'
            }`,
          }}
        >
          <span style={{ fontSize: 20 }}>
            {verdictStatus === 'warning' ? '⚠️' : verdictStatus === 'fail' ? '❌' : '🚀'}
          </span>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: 1.5,
              color: verdictStatus === 'warning' ? '#FDE047' : verdictStatus === 'fail' ? '#FCA5A5' : '#6EE7B7',
            }}
          >
            {verdictText}
          </span>
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
          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#FDE047', letterSpacing: 2 }}>
            SYSTEM SYNTHESIS:
          </span>
          <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 600, color: '#CBD5E1' }}>
            {synthesis}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { COLORS, FONT, glassStyle, useExitFade } from '../shared';

export interface MindMapNodeWebProps {
  title?: string;
  badge?: string;
  centerTitle?: string;
  centerIcon?: string;
  node1Title?: string;
  node1Desc?: string;
  node1Icon?: string;
  node2Title?: string;
  node2Desc?: string;
  node2Icon?: string;
  node3Title?: string;
  node3Desc?: string;
  node3Icon?: string;
  personality?: string;
}

export const MindMapNodeWeb: React.FC<MindMapNodeWebProps> = ({
  title = 'SYNAPTIC ARCHITECTURE MAP',
  badge = '🧠 CONCEPT BREAKDOWN',
  centerTitle = 'RETENTION ENGINE',
  centerIcon = '⚡',
  node1Title = 'Curiosity Gap Hook',
  node1Desc = 'Subconscious intrigue trigger',
  node1Icon = '🎯',
  node2Title = 'Dynamic Pacing Loops',
  node2Desc = 'Visual rhythm shift every 2.5s',
  node2Icon = '🔄',
  node3Title = 'High-Value Payoff',
  node3Desc = 'Unfiltered actionable insight',
  node3Icon = '💎',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Springs
  const enterSpring = spring({ frame, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });
  const centerSpring = spring({ frame: frame - 6, fps, config: { damping: 11, mass: 0.6, stiffness: 200 } });
  const node1Spring = spring({ frame: frame - 16, fps, config: { damping: 11, mass: 0.5, stiffness: 210 } });
  const node2Spring = spring({ frame: frame - 22, fps, config: { damping: 11, mass: 0.5, stiffness: 210 } });
  const node3Spring = spring({ frame: frame - 28, fps, config: { damping: 11, mass: 0.5, stiffness: 210 } });

  // Conduit line drawing progress
  const conduit1Progress = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const conduit2Progress = interpolate(frame, [16, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const conduit3Progress = interpolate(frame, [22, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Breathing electric nucleus pulse
  const pulse = Math.sin((frame / fps) * 6) * 0.04 + 1;
  const purpleGlow = Math.sin((frame / fps) * 5) * 15 + 35;

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
      {/* Background card container */}
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 960,
          padding: '42px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(10, 12, 26, 0.95)',
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          border: '1.5px solid rgba(139, 92, 246, 0.35)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 ${purpleGlow}px rgba(139, 92, 246, 0.22)`,
          transform: `scale(${Math.min(1, enterSpring)}) translateY(${(1 - enterSpring) * 40}px)`,
          opacity: enterSpring,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header & Badge */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(124, 58, 237, 0.16))',
              border: '1px solid rgba(139, 92, 246, 0.55)',
              color: '#C4B5FD',
              fontFamily: FONT.mono,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 2.5,
              padding: '6px 16px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
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
              color: '#F1F5F9',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Mind Map Canvas Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 620,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated SVG Bezier Synaptic Conduits */}
          <svg
            viewBox="0 0 880 620"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <defs>
              <linearGradient id="branch1Grad" x1="440" y1="260" x2="200" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="branch2Grad" x1="440" y1="260" x2="680" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="branch3Grad" x1="440" y1="300" x2="440" y2="495" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Conduit 1 (Center -> Node 1 Top-Left) */}
            <path
              d="M 440 260 C 370 200, 240 180, 200 120"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="8"
              opacity={conduit1Progress * 0.25}
              filter="blur(4px)"
            />
            <path
              d="M 440 260 C 370 200, 240 180, 200 120"
              fill="none"
              stroke="url(#branch1Grad)"
              strokeWidth="4"
              strokeDasharray="360"
              strokeDashoffset={(1 - conduit1Progress) * 360}
              filter="drop-shadow(0 0 8px rgba(56, 189, 248, 0.75))"
            />
            {conduit1Progress > 0.05 && (
              <circle cx="200" cy="120" r="6" fill="#38BDF8" filter="drop-shadow(0 0 12px #38BDF8)" />
            )}

            {/* Conduit 2 (Center -> Node 2 Top-Right) */}
            <path
              d="M 440 260 C 510 200, 640 180, 680 120"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="8"
              opacity={conduit2Progress * 0.25}
              filter="blur(4px)"
            />
            <path
              d="M 440 260 C 510 200, 640 180, 680 120"
              fill="none"
              stroke="url(#branch2Grad)"
              strokeWidth="4"
              strokeDasharray="360"
              strokeDashoffset={(1 - conduit2Progress) * 360}
              filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.75))"
            />
            {conduit2Progress > 0.05 && (
              <circle cx="680" cy="120" r="6" fill="#F59E0B" filter="drop-shadow(0 0 12px #F59E0B)" />
            )}

            {/* Conduit 3 (Center -> Node 3 Bottom) */}
            <line
              x1="440"
              y1="300"
              x2="440"
              y2="495"
              stroke="#10B981"
              strokeWidth="8"
              opacity={conduit3Progress * 0.25}
              filter="blur(4px)"
            />
            <line
              x1="440"
              y1="300"
              x2="440"
              y2={300 + conduit3Progress * 195}
              stroke="url(#branch3Grad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.75))"
            />
            {conduit3Progress > 0.05 && (
              <circle cx="440" cy="495" r="6" fill="#10B981" filter="drop-shadow(0 0 12px #10B981)" />
            )}

            {/* Flowing Synaptic Data Packets */}
            {conduit1Progress >= 0.95 && (
              <circle
                cx={440 + (200 - 440) * (((frame * 0.035) % 1))}
                cy={260 + (120 - 260) * Math.pow(((frame * 0.035) % 1), 0.75)}
                r="4.5"
                fill="#38BDF8"
                filter="drop-shadow(0 0 10px #38BDF8)"
              />
            )}
            {conduit2Progress >= 0.95 && (
              <circle
                cx={440 + (680 - 440) * (((frame * 0.035) % 1))}
                cy={260 + (120 - 260) * Math.pow(((frame * 0.035) % 1), 0.75)}
                r="4.5"
                fill="#F59E0B"
                filter="drop-shadow(0 0 10px #F59E0B)"
              />
            )}
            {conduit3Progress >= 0.95 && (
              <circle
                cx="440"
                cy={300 + 195 * (((frame * 0.035) % 1))}
                r="4.5"
                fill="#10B981"
                filter="drop-shadow(0 0 10px #10B981)"
              />
            )}
          </svg>

          {/* Central Nucleus Node */}
          <div
            style={{
              position: 'absolute',
              top: 260,
              left: '50%',
              transform: `translate(-50%, -50%) scale(${Math.max(0, centerSpring * pulse)})`,
              opacity: centerSpring,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(76, 29, 149, 0.98))',
              border: '2px solid rgba(196, 181, 253, 0.65)',
              borderRadius: 24,
              padding: '18px 36px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: `0 0 50px rgba(124, 58, 237, 0.8), 0 15px 35px rgba(0,0,0,0.85)`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.4)',
              }}
            >
              {centerIcon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 900, color: '#C4B5FD', letterSpacing: 2 }}>
                CORE NUCLEUS
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.5 }}>
                {centerTitle}
              </span>
            </div>
          </div>

          {/* Satellite Node 1 (Top-Left) */}
          <div
            style={{
              position: 'absolute',
              top: 30,
              left: 20,
              width: 380,
              transform: `scale(${Math.max(0, node1Spring)}) translateY(${(1 - node1Spring) * 20}px)`,
              opacity: Math.min(1, node1Spring * 2),
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.98))',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              borderRadius: 16,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 12px 30px rgba(0,0,0,0.7), 0 0 20px rgba(56, 189, 248, 0.15)',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {node1Icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
                {node1Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.3 }}>
                {node1Desc}
              </span>
            </div>
          </div>

          {/* Satellite Node 2 (Top-Right) */}
          <div
            style={{
              position: 'absolute',
              top: 30,
              right: 20,
              width: 380,
              transform: `scale(${Math.max(0, node2Spring)}) translateY(${(1 - node2Spring) * 20}px)`,
              opacity: Math.min(1, node2Spring * 2),
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.98))',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: 16,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 12px 30px rgba(0,0,0,0.7), 0 0 20px rgba(245, 158, 11, 0.15)',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {node2Icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
                {node2Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.3 }}>
                {node2Desc}
              </span>
            </div>
          </div>

          {/* Satellite Node 3 (Bottom Center) */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: `translateX(-50%) scale(${Math.max(0, node3Spring)}) translateY(${(1 - node3Spring) * 20}px)`,
              opacity: Math.min(1, node3Spring * 2),
              width: 480,
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.98))',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              borderRadius: 16,
              padding: '18px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 12px 30px rgba(0,0,0,0.7), 0 0 25px rgba(16, 185, 129, 0.15)',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {node3Icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 21, fontWeight: 800, color: '#F8FAFC' }}>
                {node3Title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 15, color: '#94A3B8', lineHeight: 1.3 }}>
                {node3Desc}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Takeaway Synthesis Bar */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 900, color: '#8B5CF6', letterSpacing: 2 }}>
            SYSTEM SYNTHESIS:
          </span>
          <span style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: 600, color: '#CBD5E1' }}>
            All 3 nodes converge synchronously to drive compounding audience retention.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

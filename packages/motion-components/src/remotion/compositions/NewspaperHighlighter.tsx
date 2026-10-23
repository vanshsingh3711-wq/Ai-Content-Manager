import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, spring, useCurrentFrame } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface NewspaperHighlighterProps {
  outlet?: string;
  edition?: string;
  date?: string;
  headline?: string;
  preText?: string;
  highlightText?: string;
  postText?: string;
  markerColor?: string;
  stamp?: string;
  badge?: string;
  personality?: string;
}

export const NewspaperHighlighter: React.FC<NewspaperHighlighterProps> = ({
  outlet = 'INVESTIGATIVE DISPATCH',
  edition = 'SPECIAL REPORT • VOL. XLVIII',
  date = 'OCTOBER 2024',
  headline = 'CRITICAL EVIDENCE REVEALED IN LEAKED DOCUMENTS',
  preText = 'According to findings compiled across hundreds of case studies, ',
  highlightText = 'the standard method failed in 92% of observed scenarios.',
  postText = ' Further analysis confirms the alternative protocol produced exponential compound advantages.',
  markerColor = '#FDE047', // Neon yellow highlighter
  stamp = 'VERIFIED REPORT',
  badge = 'DOCUMENT ARCHIVE',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames, 12);

  // Entrance spring for newspaper clipping
  const paperEnter = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 160 },
  });

  // Paper float subtle tilt
  const paperTilt = interpolate(frame, [0, 45, 90], [-2, -0.5, -1.8], {
    extrapolateRight: 'clamp',
  });

  // Highlighter draw progress (frames 12 to 38)
  const highlightProgress = interpolate(frame, [12, 38], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Rubber stamp slam (frame 36)
  const stampSpring = spring({
    frame: frame - 36,
    fps,
    config: { damping: 9, mass: 0.5, stiffness: 240 },
  });

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
      {/* Background radial spotlight glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 1100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253, 224, 71, 0.10) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Newspaper Paper Clipping Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          backgroundColor: '#F5EFEB',
          backgroundImage: `
            radial-gradient(#E5DBC5 1.2px, transparent 1.2px),
            linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,230,212,0.92) 100%)
          `,
          backgroundSize: '16px 16px, 100% 100%',
          borderRadius: 14,
          padding: '44px 48px',
          boxShadow: `
            0 40px 90px rgba(0, 0, 0, 0.85),
            0 12px 30px rgba(0, 0, 0, 0.55),
            inset 0 0 90px rgba(180, 150, 105, 0.25),
            inset 0 0 0 1.5px rgba(80, 60, 40, 0.22)
          `,
          transform: `scale(${Math.min(1, paperEnter)}) translateY(${(1 - paperEnter) * 50}px) rotate(${paperTilt}deg)`,
          opacity: paperEnter,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* Paper Fold Crease Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '48%',
            borderBottom: '1px solid rgba(140, 120, 90, 0.24)',
            boxShadow: '0 2px 4px rgba(160, 140, 110, 0.12)',
            pointerEvents: 'none',
          }}
        />

        {/* Vintage Top Utility Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2.5px solid #1C1917',
            paddingBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2.5,
              color: '#44403C',
              textTransform: 'uppercase',
            }}
          >
            {edition}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#1C1917',
              color: '#F5EFEB',
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 2,
              padding: '4px 14px',
              borderRadius: 4,
            }}
          >
            <span>●</span> {badge}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#44403C',
            }}
          >
            {date}
          </div>
        </div>

        {/* Publication Masthead */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 4,
            paddingBottom: 10,
            borderBottom: '1.5px solid #292524',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: '"Georgia", "Times New Roman", "Playfair Display", serif',
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: 3,
              color: '#1C1917',
              textTransform: 'uppercase',
              lineHeight: 1.05,
              textShadow: '0 1px 1px rgba(0,0,0,0.2)',
            }}
          >
            {outlet}
          </h1>
        </div>

        {/* Breaking News Headline */}
        <div style={{ textAlign: 'left', marginTop: 2 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Georgia", "Times New Roman", serif',
              fontSize: 36,
              fontWeight: 800,
              color: '#0C0A09',
              lineHeight: 1.25,
              letterSpacing: -0.5,
            }}
          >
            {headline}
          </h2>
        </div>

        {/* Double divider rule */}
        <div
          style={{
            width: '100%',
            height: 3,
            borderTop: '2px solid #1C1917',
            borderBottom: '1px solid #78716C',
          }}
        />

        {/* Body Text with Multi-line Compatible Animated Highlighter Stroke */}
        <div
          style={{
            position: 'relative',
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 29,
            lineHeight: 1.65,
            color: '#292524',
            letterSpacing: 0.1,
          }}
        >
          <span>{preText}</span>

          {/* Multi-line box-decoration-break clone highlighter */}
          <span
            style={{
              fontWeight: 900,
              color: '#0C0A09',
              background: `linear-gradient(90deg, ${markerColor} 0%, ${markerColor} ${highlightProgress}%, transparent ${highlightProgress}%)`,
              WebkitBoxDecorationBreak: 'clone',
              boxDecorationBreak: 'clone' as any,
              padding: '4px 8px',
              borderRadius: 4,
              boxShadow: highlightProgress > 5 ? `0 0 16px ${markerColor}66` : 'none',
              filter: 'drop-shadow(0 1px 2px rgba(234, 179, 8, 0.3))',
            }}
          >
            {highlightText}
          </span>

          <span>{postText}</span>
        </div>

        {/* Bottom Vintage Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #78716C',
            paddingTop: 16,
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Vintage barcode simulation */}
            <div
              style={{
                display: 'flex',
                gap: 2,
                height: 20,
                alignItems: 'flex-end',
                opacity: 0.6,
              }}
            >
              {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                <div key={idx} style={{ width: w * 1.5, height: '100%', background: '#1C1917' }} />
              ))}
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 13,
                color: '#78716C',
                letterSpacing: 1.5,
              }}
            >
              PAGE A-1 • SECTION 1 OF 3 • CLASSIFIED ARCHIVE
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: 700,
              color: '#44403C',
              letterSpacing: 2,
            }}
          >
            DOC REF #8092-B
          </div>
        </div>

        {/* Animated Rubber Stamp */}
        {stamp && (
          <div
            style={{
              position: 'absolute',
              right: 48,
              bottom: 34,
              border: '4.5px solid #DC2626',
              borderRadius: 8,
              padding: '12px 28px',
              fontFamily: FONT.mono,
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 4,
              color: '#DC2626',
              textTransform: 'uppercase',
              transform: `scale(${Math.max(0, stampSpring)}) rotate(-10deg)`,
              opacity: Math.min(1, stampSpring * 2),
              boxShadow: '0 0 25px rgba(220, 38, 38, 0.4), inset 0 0 10px rgba(220, 38, 38, 0.25)',
              backgroundColor: 'rgba(254, 226, 226, 0.35)',
              zIndex: 10,
              pointerEvents: 'none',
              filter: 'contrast(120%)',
            }}
          >
            ★ {stamp} ★
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

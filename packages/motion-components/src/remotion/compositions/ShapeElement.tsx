import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { useFadeUp, useExitFade } from '../shared';

export interface ShapeProps {
  shapeType?: 'rectangle' | 'rounded_rect' | 'circle' | 'line' | 'arrow' | 'speech_bubble' | 'divider' | 'star' | 'badge';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  radius?: number;
  cornerRadius?: number;
  opacity?: number;
  lineLength?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  direction?: 'right' | 'down' | 'left' | 'up';
  text?: string;
  textColor?: string;
  accentColor?: string;
}

export const ShapeElement: React.FC<ShapeProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const exit = useExitFade(durationInFrames);
  const intro = useFadeUp(0);

  const {
    shapeType = 'rectangle',
    fillColor = '#0284c7',
    strokeColor = '#38bdf8',
    strokeWidth = 2,
    width = 240,
    height = 120,
    radius = 70,
    cornerRadius = 16,
    opacity = 90,
    lineLength = 260,
    lineStyle = 'solid',
    label,
    direction = 'right',
    text = 'Sample Text',
    textColor = '#ffffff',
    accentColor = '#a855f7',
  } = props;

  const totalOpacity = (opacity / 100);

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ ...intro, ...exit, opacity: totalOpacity * (intro.opacity as number) * (exit.opacity as number) }}>
        {/* RECTANGLE */}
        {shapeType === 'rectangle' && (
          <div
            style={{
              width,
              height,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: `0 0 24px ${strokeColor}44`,
            }}
          />
        )}

        {/* ROUNDED RECTANGLE */}
        {shapeType === 'rounded_rect' && (
          <div
            style={{
              width,
              height,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: cornerRadius,
              boxShadow: `0 0 24px ${strokeColor}44`,
            }}
          />
        )}

        {/* CIRCLE */}
        {shapeType === 'circle' && (
          <div
            style={{
              width: radius * 2,
              height: radius * 2,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: '50%',
              boxShadow: `0 0 24px ${strokeColor}44`,
            }}
          />
        )}

        {/* ACCENT LINE */}
        {shapeType === 'line' && (
          <div
            style={{
              width: lineLength,
              height: 0,
              borderTop: `${strokeWidth}px ${lineStyle} ${strokeColor}`,
              boxShadow: `0 0 16px ${strokeColor}88`,
            }}
          />
        )}

        {/* CALLOUT ARROW */}
        {shapeType === 'arrow' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {label && (
              <span
                style={{
                  background: fillColor,
                  color: '#ffffff',
                  border: `${strokeWidth}px solid ${strokeColor}`,
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: 20,
                  fontFamily: 'sans-serif',
                }}
              >
                {label}
              </span>
            )}
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{
                transform:
                  direction === 'down' ? 'rotate(90deg)' :
                  direction === 'left' ? 'rotate(180deg)' :
                  direction === 'up' ? 'rotate(-90deg)' : 'none',
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* SPEECH BUBBLE */}
        {shapeType === 'speech_bubble' && (
          <div
            style={{
              position: 'relative',
              background: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: 16,
              padding: '16px 24px',
              color: textColor,
              fontFamily: 'sans-serif',
              fontWeight: 700,
              fontSize: 22,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
              maxWidth: 320,
            }}
          >
            {text}
            <div
              style={{
                position: 'absolute',
                bottom: -12,
                left: 24,
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: `12px solid ${strokeColor}`,
              }}
            />
          </div>
        )}

        {/* SECTION DIVIDER */}
        {shapeType === 'divider' && (
          <div style={{ display: 'flex', alignItems: 'center', width: 340, gap: 12 }}>
            <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, transparent, ${strokeColor})` }} />
            <div style={{ width: 10, height: 10, transform: 'rotate(45deg)', background: accentColor }} />
            <div style={{ flex: 1, height: 2, background: `linear-gradient(to left, transparent, ${strokeColor})` }} />
          </div>
        )}

        {/* STAR STICKER */}
        {shapeType === 'star' && (
          <div style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.8))' }}>
            <svg
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        )}

        {/* BADGE PILL */}
        {shapeType === 'badge' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 9999,
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              boxShadow: `0 0 30px ${strokeColor}88`,
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 22,
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <span>⚡</span>
            <span>{text || 'BREAKING'}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

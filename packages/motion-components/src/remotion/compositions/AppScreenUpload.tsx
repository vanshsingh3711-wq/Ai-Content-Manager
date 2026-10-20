import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS, FONT, glassStyle, useFadeUp, useExitFade, useScaleIn } from '../shared';

export interface AppScreenUploadProps {
  title?: string;
  appName?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  progress?: number;
  status?: string;
  personality?: string;
}

export const AppScreenUpload: React.FC<AppScreenUploadProps> = ({
  title = 'VIDEO UPLOAD',
  appName = 'Video Studio Pro',
  fileName = 'upload_video.mp4',
  fileSize = '48.2 MB',
  fileType = 'MP4 Video',
  progress = 100,
  status = 'Upload Complete',
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);
  const entrance = useScaleIn(0);

  // Upload progress animation over 65% of the duration
  const startFrame = 10;
  const uploadDuration = Math.max(20, Math.floor(durationInFrames * 0.65));
  const endFrame = startFrame + uploadDuration;

  const targetProgress = typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : 100;
  const currentProgress = Math.round(
    interpolate(frame, [startFrame, endFrame], [0, targetProgress], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const isComplete = currentProgress >= 100;

  // Spring punch when upload finishes
  const completeSpring = spring({
    frame: frame - endFrame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 180 },
  });

  const checkmarkScale = isComplete ? Math.min(1.2, 0.8 + completeSpring * 0.4) : 1;

  // Breathing pulse for upload icon when in-progress
  const pulseScale = isComplete ? 1 : 1 + Math.sin((frame / fps) * Math.PI * 3) * 0.06;

  const statusText = isComplete ? status : 'Uploading to cloud...';

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        ...exit,
      }}
    >
      <div
        style={{
          ...glassStyle,
          width: '100%',
          maxWidth: 920,
          padding: '44px 48px',
          boxShadow: isComplete
            ? '0 30px 100px rgba(0,0,0,0.8), 0 0 70px rgba(16, 185, 129, 0.25)'
            : '0 30px 100px rgba(0,0,0,0.8), 0 0 70px rgba(14, 165, 233, 0.25)',
          border: isComplete
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid rgba(56, 189, 248, 0.35)',
          ...entrance,
        }}
      >
        {/* macOS App Header */}
        <div
          style={{
            ...useFadeUp(2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: 22,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: color,
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 22,
                fontWeight: 700,
                color: '#e2e8f0',
                marginLeft: 10,
                letterSpacing: 0.5,
              }}
            >
              {appName}
            </span>
          </div>

          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 16,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 3,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '6px 16px',
              borderRadius: 100,
            }}
          >
            {title}
          </span>
        </div>

        {/* Drag & Drop Dashed Dropzone */}
        <div
          style={{
            ...useFadeUp(6),
            border: isComplete
              ? '2px dashed rgba(16, 185, 129, 0.4)'
              : '2px dashed rgba(56, 189, 248, 0.4)',
            borderRadius: 24,
            padding: '36px 32px',
            background: isComplete ? 'rgba(16, 185, 129, 0.03)' : 'rgba(14, 165, 233, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            transition: 'border-color 0.3s ease',
          }}
        >
          {/* File Badge & Upload Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Animated Icon Badge */}
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.18)',
                border: isComplete
                  ? '2px solid rgba(16, 185, 129, 0.6)'
                  : '2px solid rgba(56, 189, 248, 0.5)',
                color: isComplete ? '#34d399' : '#38bdf8',
                transform: `scale(${isComplete ? checkmarkScale : pulseScale})`,
                boxShadow: isComplete
                  ? '0 0 25px rgba(16, 185, 129, 0.4)'
                  : '0 0 25px rgba(56, 189, 248, 0.4)',
              }}
            >
              {isComplete ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M5 13l4 4L19 7"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* File Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: -0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                  fontFamily: FONT.mono,
                  fontSize: 18,
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <span>{fileType}</span>
                <span>•</span>
                <span>{fileSize}</span>
                <span>•</span>
                <span style={{ color: '#38bdf8' }}>4K 60fps</span>
              </div>
            </div>

            {/* Animated Percentage Badge */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 34,
                fontWeight: 800,
                color: isComplete ? '#34d399' : '#38bdf8',
                letterSpacing: -1,
                minWidth: 100,
                textAlign: 'right',
              }}
            >
              {currentProgress}%
            </div>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div
            style={{
              width: '100%',
              height: 18,
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${currentProgress}%`,
                height: '100%',
                borderRadius: 999,
                background: isComplete
                  ? 'linear-gradient(90deg, #059669, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)',
                boxShadow: isComplete
                  ? '0 0 20px rgba(16, 185, 129, 0.7)'
                  : '0 0 20px rgba(56, 189, 248, 0.6)',
                transition: 'width 0.05s linear',
              }}
            />
          </div>

          {/* Footer Status & Verification Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: FONT.mono,
              fontSize: 18,
            }}
          >
            <span
              style={{
                color: isComplete ? '#34d399' : 'rgba(255, 255, 255, 0.65)',
                fontWeight: isComplete ? 700 : 500,
                letterSpacing: 0.5,
              }}
            >
              {statusText}
            </span>

            {isComplete && (
              <span
                style={{
                  ...useFadeUp(startFrame + uploadDuration),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  padding: '6px 18px',
                  borderRadius: 100,
                }}
              >
                READY
              </span>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

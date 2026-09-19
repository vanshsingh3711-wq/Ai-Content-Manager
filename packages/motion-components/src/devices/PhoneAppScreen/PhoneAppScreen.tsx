import React from 'react';
import { PhoneAppScreenProps } from './PhoneAppScreen.types';
import { interpolate } from './PhoneAppScreen.utils';

export const PhoneAppScreen: React.FC<PhoneAppScreenProps> = ({
  children,
  width = '100%',
  height = '100%',
  header,
  statusBar = { visible: true },
  navigationBar = { visible: false },
  animation = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    enter = 'fade',
    durationInFrames = 30,
    delayInFrames = 0,
  } = animation;

  const {
    background = '#ffffff',
    headerBackground = '#ffffff',
    textColor = '#111827',
    secondaryTextColor = '#6b7280',
  } = style;

  const startFrame = delayInFrames;
  const endFrame = delayInFrames + durationInFrames;

  let opacity = 1;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  if (enter === 'fade') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
  } else if (enter === 'scale') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    scale = interpolate(currentFrame, [startFrame, endFrame], [0.95, 1]);
  } else if (enter === 'slideUp') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    translateY = interpolate(currentFrame, [startFrame, endFrame], [50, 0]);
  } else if (enter === 'slideLeft') {
    opacity = interpolate(currentFrame, [startFrame, endFrame], [0, 1]);
    translateX = interpolate(currentFrame, [startFrame, endFrame], [50, 0]);
  }

  return (
    <div
      data-testid="phone-app-screen"
      style={{
        width,
        height,
        backgroundColor: background,
        display: 'flex',
        flexDirection: 'column',
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: 'center center',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Optional Status Bar Spacer (leaves room for the phone notch) */}
      {statusBar.visible && (
        <div style={{ height: 32, backgroundColor: headerBackground, flexShrink: 0 }} data-testid="status-bar" />
      )}

      {/* Header */}
      {header && (
        <div
          data-testid="app-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: headerBackground,
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}
        >
          {header.showBackButton && (
            <div data-testid="back-button" style={{ marginRight: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {header.title && (
              <span style={{ fontSize: '18px', fontWeight: 600, color: textColor, fontFamily: 'sans-serif', lineHeight: 1.2 }} data-testid="header-title">
                {header.title}
              </span>
            )}
            {header.subtitle && (
              <span style={{ fontSize: '13px', color: secondaryTextColor, fontFamily: 'sans-serif', marginTop: '2px' }} data-testid="header-subtitle">
                {header.subtitle}
              </span>
            )}
          </div>

          {header.showMenuButton && (
            <div data-testid="menu-button" style={{ marginLeft: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div
        data-testid="app-content"
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {children}
      </div>

      {/* Optional Navigation Bar */}
      {navigationBar.visible && (
        <div
          data-testid="nav-bar"
          style={{
            height: 64,
            backgroundColor: headerBackground,
            borderTop: '1px solid #f3f4f6',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingBottom: 16, // Safe area for home indicator
          }}
        >
          {/* Generic placeholder nav icons */}
          <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#e5e7eb' }} />
          <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#e5e7eb' }} />
          <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#e5e7eb' }} />
        </div>
      )}
    </div>
  );
};

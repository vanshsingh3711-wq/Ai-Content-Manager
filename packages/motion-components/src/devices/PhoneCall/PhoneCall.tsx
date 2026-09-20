import React from 'react';
import { PhoneCallProps } from './PhoneCall.types';
import { interpolate } from './PhoneCall.utils';

export const PhoneCall: React.FC<PhoneCallProps> = ({
  contactName = 'Unknown Contact',
  contactSubtitle = 'Mobile',
  status,
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30,
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    callingDurationInFrames = 60,
    connectedDurationInFrames = 120,
    endDurationInFrames = 30, // Unused specifically, but conceptually part of timeline
  } = animation;

  const {
    backgroundColor = '#111827', // dark default
    textColor = '#ffffff',
    secondaryTextColor = '#9ca3af',
    accentColor = '#2563eb',
    avatarColor = '#4b5563',
    endCallColor = '#ef4444',
  } = style;

  // Determine State
  const connectedStart = startDelayInFrames + callingDurationInFrames;
  const endStart = connectedStart + connectedDurationInFrames;

  let derivedStatus: 'calling' | 'connected' | 'ended' = 'calling';
  
  if (currentFrame >= endStart) {
    derivedStatus = 'ended';
  } else if (currentFrame >= connectedStart) {
    derivedStatus = 'connected';
  } else {
    derivedStatus = 'calling';
  }

  const finalStatus = status || derivedStatus;

  // Timer Calculation
  const timerFrames = finalStatus === 'connected' 
    ? (status ? currentFrame : Math.max(0, currentFrame - connectedStart)) 
    : 0;
    
  const totalSeconds = Math.floor(timerFrames / fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calling Animation (Ringing Pulse)
  // Cycle every 60 frames (2 seconds at 30fps)
  const cycle = currentFrame % (fps * 2);
  let ringScale = 1;
  let ringOpacity = 0.5;
  if (cycle < fps * 1.5) {
    ringScale = interpolate(cycle, [0, fps * 1.5], [1, 1.5]);
    ringOpacity = interpolate(cycle, [0, fps * 1.5], [0.5, 0]);
  } else {
    ringScale = 1.5;
    ringOpacity = 0;
  }
  
  // Status Text
  let statusText = 'Calling...';
  if (finalStatus === 'connected') statusText = timeString;
  if (finalStatus === 'ended') statusText = 'Call Ended';
  if (finalStatus === 'missed') statusText = 'Missed Call';

  return (
    <div
      data-testid="phone-call"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px 48px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        position: 'relative'
      }}
    >
      {/* Avatar Section */}
      <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 24 }}>
        {finalStatus === 'calling' && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              backgroundColor: accentColor,
              opacity: ringOpacity,
              transform: `scale(${ringScale})`,
            }}
          />
        )}
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%',
            backgroundColor: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 40,
            zIndex: 1
          }}
        >
          {contactName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Contact Info */}
      <div style={{ fontSize: 32, fontWeight: 300, color: textColor, marginBottom: 8, textAlign: 'center' }} data-testid="contact-name">
        {contactName}
      </div>
      <div style={{ fontSize: 16, color: secondaryTextColor, marginBottom: 4 }} data-testid="contact-subtitle">
        {contactSubtitle}
      </div>
      <div style={{ fontSize: 18, color: textColor, marginTop: 8 }} data-testid="call-status">
        {statusText}
      </div>

      {/* Controls Grid */}
      {finalStatus !== 'ended' && finalStatus !== 'missed' && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 32, width: '100%', alignItems: 'center' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px 32px' }}>
            <ControlIcon icon="mute" label="mute" textColor={textColor} backgroundColor="rgba(255,255,255,0.1)" />
            <ControlIcon icon="keypad" label="keypad" textColor={textColor} backgroundColor="rgba(255,255,255,0.1)" />
            <ControlIcon icon="speaker" label="speaker" textColor={textColor} backgroundColor="rgba(255,255,255,0.1)" />
          </div>

          <div 
            data-testid="end-call-btn"
            style={{ 
              width: 72, height: 72, borderRadius: 36, backgroundColor: endCallColor, 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            </svg>
          </div>
        </div>
      )}

      {/* Missed/Ended Layout adjustment */}
      {(finalStatus === 'ended' || finalStatus === 'missed') && (
        <div style={{ marginTop: 'auto', paddingBottom: 48 }}>
           <div 
            style={{ 
              width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.1)", 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const ControlIcon = ({ icon, label, textColor, backgroundColor }: { icon: string, label: string, textColor: string, backgroundColor: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon === 'mute' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      )}
      {icon === 'keypad' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <circle cx="15.5" cy="8.5" r="1.5"></circle>
          <circle cx="8.5" cy="15.5" r="1.5"></circle>
          <circle cx="15.5" cy="15.5" r="1.5"></circle>
        </svg>
      )}
      {icon === 'speaker' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      )}
    </div>
    <span style={{ color: textColor, fontSize: 14 }}>{label}</span>
  </div>
);

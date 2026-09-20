import React, { useRef, useEffect, useState } from 'react';
import { PhonePaymentProps } from './PhonePayment.types';
import { PhoneTap } from '../PhoneTap';
import { interpolate } from './PhonePayment.utils';

export const PhonePayment: React.FC<PhonePaymentProps> = ({
  amount,
  currency = '$',
  recipient = 'Recipient',
  status = 'success',
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30, // For API consistency
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    idleDurationInFrames = 30,
    tapDurationInFrames = 30,
    processingDurationInFrames = 60,
  } = animation;

  const {
    backgroundColor = 'transparent',
    textColor = '#111827',
    accentColor = '#3b82f6', // blue
    successColor = '#10b981', // green
    errorColor = '#ef4444', // red
  } = style;

  const tapStart = startDelayInFrames + idleDurationInFrames;
  const processingStart = tapStart + tapDurationInFrames;
  const resultStart = processingStart + processingDurationInFrames;

  let phase: 'idle' | 'tap' | 'processing' | 'result' = 'idle';
  if (currentFrame >= resultStart) {
    phase = 'result';
  } else if (currentFrame >= processingStart) {
    phase = 'processing';
  } else if (currentFrame >= tapStart) {
    phase = 'tap';
  }

  // To perfectly position the PhoneTap, we need its x/y coordinates.
  // We can calculate this dynamically using a ref if we were purely in DOM,
  // but for deterministic React rendering, we'll assume a centered layout and calculate manually.
  // Let's assume a generic layout structure.
  
  // Button scale animation during tap
  let buttonScale = 1;
  if (phase === 'tap') {
    const midTap = tapStart + tapDurationInFrames / 2;
    if (currentFrame < midTap) {
      buttonScale = interpolate(currentFrame, [tapStart, midTap], [1, 0.95]);
    } else {
      buttonScale = interpolate(currentFrame, [midTap, processingStart], [0.95, 1]);
    }
  }

  // Processing spinner animation (deterministic rotation based on frame)
  const spinnerRotation = (currentFrame * 8) % 360; 

  // Result animation
  const resultOpacity = phase === 'result' ? interpolate(currentFrame, [resultStart, resultStart + 15], [0, 1]) : 0;
  const resultScale = phase === 'result' ? interpolate(currentFrame, [resultStart, resultStart + 15], [0.8, 1]) : 0.8;

  const isSuccess = status === 'success';
  const resultColor = isSuccess ? successColor : errorColor;

  return (
    <div
      data-testid="phone-payment"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Title */}
      <div style={{ fontSize: '18px', color: textColor, opacity: 0.6, marginBottom: '24px', fontWeight: 500 }}>
        Payment Details
      </div>

      {/* Recipient */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
         <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>{recipient.charAt(0).toUpperCase()}</span>
         </div>
         <div style={{ fontSize: 20, fontWeight: 600, color: textColor }} data-testid="recipient-name">
           {recipient}
         </div>
         <div style={{ fontSize: 14, color: textColor, opacity: 0.5, marginTop: 4 }}>
           To {recipient}
         </div>
      </div>

      {/* Amount */}
      <div style={{ fontSize: 48, fontWeight: 800, color: textColor, marginBottom: '48px', display: 'flex', alignItems: 'flex-start' }} data-testid="payment-amount">
        <span style={{ fontSize: 24, marginTop: 8, marginRight: 4 }}>{currency}</span>
        {amount}
      </div>

      {/* Action Area (Bottom) */}
      <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
        
        {/* State: Idle / Tap */}
        {(phase === 'idle' || phase === 'tap') && (
          <div 
            data-testid="pay-button"
            style={{ 
              width: '100%', 
              height: 56, 
              backgroundColor: accentColor, 
              borderRadius: 28, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 600,
              transform: `scale(${buttonScale})`,
            }}
          >
            Pay Now
          </div>
        )}

        {/* State: Processing */}
        {phase === 'processing' && (
          <div 
            data-testid="processing-state"
            style={{ 
              width: '100%', 
              height: 56, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: textColor,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" style={{ transform: `rotate(${spinnerRotation}deg)`, marginRight: 12 }}>
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
            </svg>
            Processing...
          </div>
        )}

        {/* State: Result */}
        {phase === 'result' && (
          <div 
            data-testid="result-state"
            style={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              opacity: resultOpacity,
              transform: `scale(${resultScale})`,
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: resultColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {isSuccess ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </div>
            <div style={{ color: textColor, fontSize: 18, fontWeight: 600 }}>
              {isSuccess ? 'Payment Successful' : 'Payment Failed'}
            </div>
          </div>
        )}

        {/* The Tap Animation Overlay */}
        {/* We absolutely position it in the center of the action area */}
        <PhoneTap 
          x={'50%' as unknown as number} 
          y={'50%' as unknown as number}
          size={80}
          animation={{ type: 'tap', durationInFrames: tapDurationInFrames, delayInFrames: tapStart }}
          currentFrame={currentFrame}
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        />
      </div>
    </div>
  );
};

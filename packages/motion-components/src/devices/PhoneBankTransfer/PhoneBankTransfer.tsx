import React from 'react';
import { PhoneBankTransferProps } from './PhoneBankTransfer.types';
import { PhoneTap } from '../PhoneTap';
import { interpolate } from './PhoneBankTransfer.utils';

export const PhoneBankTransfer: React.FC<PhoneBankTransferProps> = ({
  amount,
  currency = '$',
  recipient = 'Recipient',
  senderAccount = '•••• 0000',
  status = 'success',
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30,
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
    accentColor = '#2563eb', // slightly different blue for bank
    successColor = '#059669', // slightly different green
    errorColor = '#dc2626', // slightly different red
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

  // Processing spinner animation
  const spinnerRotation = (currentFrame * 8) % 360; 

  // Result animation
  const resultOpacity = phase === 'result' ? interpolate(currentFrame, [resultStart, resultStart + 15], [0, 1]) : 0;
  const resultScale = phase === 'result' ? interpolate(currentFrame, [resultStart, resultStart + 15], [0.8, 1]) : 0.8;

  const isSuccess = status === 'success';
  const resultColor = isSuccess ? successColor : errorColor;

  return (
    <div
      data-testid="phone-bank-transfer"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 700, color: textColor, marginBottom: '32px' }}>
        Bank
      </div>

      {/* From Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 4 }}>From</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, opacity: 0.8 }}>
             <rect x="2" y="5" width="20" height="14" rx="2" />
             <path d="M2 10h20" />
          </svg>
          <span data-testid="sender-account">{senderAccount}</span>
        </div>
      </div>

      {/* To Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 4 }}>To</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            {recipient.charAt(0).toUpperCase()}
          </div>
          <span data-testid="recipient-name">{recipient}</span>
        </div>
      </div>

      {/* Amount Section */}
      <div style={{ marginBottom: '48px', paddingTop: '24px', borderTop: `1px solid ${textColor}20` }}>
        <div style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 8 }}>Amount</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: textColor }} data-testid="transfer-amount">
          {currency}{amount}
        </div>
      </div>

      {/* Action Area (Bottom) */}
      <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
        
        {/* State: Idle / Tap */}
        {(phase === 'idle' || phase === 'tap') && (
          <div 
            data-testid="transfer-button"
            style={{ 
              width: '100%', 
              height: 56, 
              backgroundColor: accentColor, 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: 18,
              fontWeight: 600,
              transform: `scale(${buttonScale})`,
            }}
          >
            Transfer
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
            Processing transfer...
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
            <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: resultColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              {isSuccess ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </div>
            <div style={{ color: textColor, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {isSuccess ? 'Transfer Successful' : 'Transfer Failed'}
            </div>
            {isSuccess && (
              <div style={{ color: textColor, fontSize: 14, opacity: 0.6 }}>
                {currency}{amount} sent
              </div>
            )}
            {!isSuccess && (
              <div style={{ color: textColor, fontSize: 14, opacity: 0.6 }}>
                Please try again
              </div>
            )}
          </div>
        )}

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

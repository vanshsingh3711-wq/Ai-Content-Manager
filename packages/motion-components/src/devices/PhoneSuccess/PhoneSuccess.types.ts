import React from 'react';

export interface PhoneSuccessAnimation {
  startDelayInFrames?: number;
  durationInFrames?: number;
  iconDurationInFrames?: number;
}

export interface PhoneSuccessProps {
  title?: string;
  message?: string;

  icon?: React.ReactNode;

  width?: number | string;
  height?: number | string;

  animation?: PhoneSuccessAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    successColor?: string;
    iconSize?: number;
  };
}

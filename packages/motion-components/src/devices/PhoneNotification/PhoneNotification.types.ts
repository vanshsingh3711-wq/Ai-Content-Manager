import { ReactNode } from 'react';

export interface PhoneNotificationAnimation {
  enter?: "slideDown" | "slideUp" | "fade" | "scale";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface PhoneNotificationProps {
  title: string;
  message?: string;
  icon?: ReactNode;

  width?: number | string;

  animation?: PhoneNotificationAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    background?: string;
    titleColor?: string;
    messageColor?: string;
    borderRadius?: number;
    boxShadow?: string;
    padding?: number;
    marginTop?: number;
  };
}

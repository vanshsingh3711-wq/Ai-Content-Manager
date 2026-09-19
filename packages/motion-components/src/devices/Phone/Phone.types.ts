import { ReactNode } from 'react';

export interface PhoneAnimation {
  enter?: "fade" | "scale" | "slideUp" | "slideDown";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface PhoneProps {
  width?: number;
  height?: number;

  children?: ReactNode;

  frame?: {
    radius?: number;
    borderWidth?: number;
  };

  showSpeaker?: boolean;
  showCamera?: boolean;
  showHomeIndicator?: boolean;

  animation?: PhoneAnimation;
  currentFrame?: number;
  fps?: number;

  style?: {
    bodyColor?: string;
    screenColor?: string;
    borderColor?: string;
  };
}

import { ReactNode } from 'react';

export interface PhoneAppScreenAnimation {
  enter?: "fade" | "slideUp" | "slideLeft" | "scale";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface PhoneAppScreenProps {
  children?: ReactNode;

  width?: number | string;
  height?: number | string;

  header?: {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    showMenuButton?: boolean;
  };

  statusBar?: {
    visible?: boolean;
  };

  navigationBar?: {
    visible?: boolean;
  };

  animation?: PhoneAppScreenAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    background?: string;
    headerBackground?: string;
    textColor?: string;
    secondaryTextColor?: string;
  };
}

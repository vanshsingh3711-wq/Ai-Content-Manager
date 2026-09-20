import { ReactNode } from 'react';

export interface PhoneScrollingAnimation {
  fromOffset?: number;
  toOffset?: number;
  durationInFrames?: number;
  startDelayInFrames?: number;
}

export interface PhoneScrollingProps {
  children?: ReactNode;

  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;

  scroll?: PhoneScrollingAnimation;

  direction?: "up" | "down";

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    borderRadius?: number;
    indicatorColor?: string;
  };

  showIndicator?: boolean;
}

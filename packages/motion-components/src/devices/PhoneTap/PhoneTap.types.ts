export interface PhoneTapAnimation {
  type?: "tap" | "ripple" | "pointer";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface PhoneTapProps {
  x: number;
  y: number;

  size?: number;

  animation?: PhoneTapAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    color?: string;
    opacity?: number;
  };
}

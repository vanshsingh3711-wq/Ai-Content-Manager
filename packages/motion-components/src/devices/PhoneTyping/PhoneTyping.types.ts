export interface PhoneTypingProps {
  text: string;

  x?: number;
  y?: number;
  width?: number | string;

  fontSize?: number;

  typing?: {
    durationInFrames?: number;
    startDelayInFrames?: number;
  };

  cursor?: {
    visible?: boolean;
    blink?: boolean;
    blinkRateInFrames?: number;
  };

  currentFrame?: number;
  fps?: number;

  style?: {
    textColor?: string;
    cursorColor?: string;
    fontFamily?: string;
  };
}

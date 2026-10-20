export interface CounterAnimation {
  type?: "count";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface AnimatedCounterProps {
  value: number;
  startValue?: number;
  
  format?: "number" | "currency" | "percentage";
  currencySymbol?: string;
  decimals?: number;
  
  prefix?: string;
  suffix?: string;

  width?: number;
  height?: number;

  animation?: CounterAnimation;

  typography?: {
    size?: number;
    fontFamily?: string;
    fontWeight?: string | number;
  };

  style?: {
    textColor?: string;
    background?: string;
  };

  currentFrame?: number;
  fps?: number;
}

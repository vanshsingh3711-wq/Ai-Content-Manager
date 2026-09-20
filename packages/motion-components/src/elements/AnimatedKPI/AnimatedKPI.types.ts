import { DesignTokens } from '../../themes/tokens.types';

export interface KPIAnimation {
  type?: "fade" | "slideUp";
  durationInFrames?: number;
  delayInFrames?: number;
  staggerInFrames?: number;
}

export interface AnimatedKPIProps {
  tokens?: DesignTokens;
  title: string;

  // Main Metric
  value: number;
  startValue?: number;
  format?: "number" | "currency" | "percentage";
  currencySymbol?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;

  // Change Metric
  changeValue?: number;
  changeFormat?: "number" | "percentage";
  showTrend?: boolean;

  width?: number;
  height?: number;

  animation?: KPIAnimation;

  typography?: {
    titleSize?: number;
    valueSize?: number;
    changeSize?: number;
    fontFamily?: string;
  };

  style?: {
    background?: string;
    titleColor?: string;
    valueColor?: string;
    positiveColor?: string;
    negativeColor?: string;
    neutralColor?: string;
  };

  currentFrame?: number;
  fps?: number;
}

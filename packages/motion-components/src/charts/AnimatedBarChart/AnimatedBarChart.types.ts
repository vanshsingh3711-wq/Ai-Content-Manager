export interface BarChartData {
  label: string;
  value: number;
  displayValue?: string;
}

export interface BarChartAnimation {
  type?: "grow" | "fade" | "slideUp";
  durationInFrames?: number;
  delayInFrames?: number;
  staggerInFrames?: number;
}

export interface AnimatedBarChartProps {
  data: BarChartData[];

  title?: string;
  subtitle?: string;

  width: number;
  height: number;

  maxValue?: number;

  animation?: BarChartAnimation;

  showValues?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;

  barRadius?: number;

  typography?: {
    titleSize?: number;
    labelSize?: number;
    valueSize?: number;
    fontFamily?: string;
  };

  style?: {
    background?: string;
    barColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    gridColor?: string;
  };

  currentFrame?: number;
  fps?: number;
}

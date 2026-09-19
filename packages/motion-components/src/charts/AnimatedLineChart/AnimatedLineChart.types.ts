export interface LineChartData {
  label: string;
  value: number;
  displayValue?: string;
}

export interface LineChartAnimation {
  type?: "draw" | "fade";
  durationInFrames?: number;
  delayInFrames?: number;
  staggerInFrames?: number; // for staggering the points
}

export interface AnimatedLineChartProps {
  data: LineChartData[];

  title?: string;
  subtitle?: string;

  width: number;
  height: number;

  maxValue?: number;

  animation?: LineChartAnimation;

  showValues?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  showPoints?: boolean;

  lineThickness?: number;
  pointSize?: number;

  typography?: {
    titleSize?: number;
    labelSize?: number;
    valueSize?: number;
    fontFamily?: string;
  };

  style?: {
    background?: string;
    lineColor?: string;
    pointColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    gridColor?: string;
  };

  currentFrame?: number;
  fps?: number;
}

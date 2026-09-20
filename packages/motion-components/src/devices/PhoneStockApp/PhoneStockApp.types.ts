export interface StockPoint {
  label?: string;
  value: number;
}

export interface PhoneStockAppAnimation {
  startDelayInFrames?: number;
  durationInFrames?: number;
  chartDurationInFrames?: number;
}

export interface PhoneStockAppProps {
  symbol: string;
  companyName?: string;

  price: number;
  change?: number;
  changePercent?: number;

  currency?: string;

  chartData?: StockPoint[];

  timeRange?: string;

  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;

  animation?: PhoneStockAppAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    accentColor?: string;
    positiveColor?: string;
    negativeColor?: string;
  };
}

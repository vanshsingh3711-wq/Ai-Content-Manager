export interface HighlightEffectProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;

  color?: string;
  opacity?: number;

  borderRadius?: number;
  strokeWidth?: number;

  durationInFrames?: number;
  delayInFrames?: number;
  enterDurationInFrames?: number;
  exitDurationInFrames?: number;

  animation?: 'box' | 'glow' | 'marker';

  currentFrame?: number;
  fps?: number;
  
  style?: React.CSSProperties;
}

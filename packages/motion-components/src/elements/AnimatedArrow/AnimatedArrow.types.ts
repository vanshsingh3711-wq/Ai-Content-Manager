export interface ArrowAnimation {
  type?: "draw" | "fade";
  durationInFrames?: number;
  delayInFrames?: number;
}

export interface AnimatedArrowProps {
  size?: number; // length of the arrow horizontally
  thickness?: number; // stroke width
  curvature?: number; // 0 for straight, positive/negative for bend
  rotation?: number; // degrees to rotate the entire arrow
  color?: string;
  headSize?: number;

  animation?: ArrowAnimation;
  currentFrame?: number;
  fps?: number;
}

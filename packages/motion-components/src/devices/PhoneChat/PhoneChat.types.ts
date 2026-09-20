export interface PhoneChatMessage {
  id: string;
  text: string;
  sender: "left" | "right";
  delayInFrames?: number;
}

export interface PhoneChatAnimation {
  messageDurationInFrames?: number;
  defaultGapInFrames?: number;
  startDelayInFrames?: number;
}

export interface PhoneChatProps {
  messages: PhoneChatMessage[];

  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;

  animation?: PhoneChatAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    leftBubbleColor?: string;
    rightBubbleColor?: string;
    leftTextColor?: string;
    rightTextColor?: string;
    borderRadius?: number;
    fontSize?: number;
  };
}

export interface PhoneCallAnimation {
  startDelayInFrames?: number;
  callingDurationInFrames?: number;
  connectedDurationInFrames?: number;
  endDurationInFrames?: number;
}

export interface PhoneCallProps {
  contactName?: string;
  contactSubtitle?: string;

  status?: "calling" | "connected" | "ended" | "missed";

  width?: number | string;
  height?: number | string;

  animation?: PhoneCallAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    accentColor?: string;
    avatarColor?: string;
    endCallColor?: string;
  };
}

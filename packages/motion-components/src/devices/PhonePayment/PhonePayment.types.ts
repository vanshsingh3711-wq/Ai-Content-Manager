export interface PhonePaymentAnimation {
  startDelayInFrames?: number;
  idleDurationInFrames?: number;
  tapDurationInFrames?: number;
  processingDurationInFrames?: number;
}

export interface PhonePaymentProps {
  amount: number | string;
  currency?: string;
  recipient?: string;

  status?: "success" | "error";

  width?: number | string;
  height?: number | string;

  animation?: PhonePaymentAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    successColor?: string;
    errorColor?: string;
  };
}

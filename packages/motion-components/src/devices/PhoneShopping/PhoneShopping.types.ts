import React from 'react';

export interface PhoneShoppingAnimation {
  startDelayInFrames?: number;
  browsingDurationInFrames?: number;
  cartDurationInFrames?: number;
  checkoutDurationInFrames?: number;
  processingDurationInFrames?: number;
  orderedDurationInFrames?: number;
}

export interface PhoneShoppingProps {
  productName: string;
  price: number | string;
  currency?: string;
  image?: React.ReactNode;
  rating?: number;

  status?: "browsing" | "cart" | "checkout" | "processing" | "ordered";

  width?: number | string;
  height?: number | string;

  animation?: PhoneShoppingAnimation;

  currentFrame?: number;
  fps?: number;

  style?: {
    backgroundColor?: string;
    textColor?: string;
    secondaryTextColor?: string;
    accentColor?: string;
    buttonColor?: string;
    successColor?: string;
  };
}

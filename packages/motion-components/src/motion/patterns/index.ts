import { softRevealPattern } from './softReveal';
import { scalePunchPattern } from './scalePunch';
import { slideRevealPattern } from './slideReveal';
import { blurRevealPattern } from './blurReveal';
import { elasticRevealPattern } from './elasticReveal';
import { keywordPunchPattern } from './keywordPunch';
import { focusRevealPattern } from './focusReveal';
import { staggerRevealPattern } from './staggerReveal';
import { drawRevealPattern } from './drawReveal';
import { exitFadePattern } from './exitFade';
import { registerPattern } from '../registry';

// Self-registering exports
export const patterns = {
  softReveal: softRevealPattern,
  scalePunch: scalePunchPattern,
  slideReveal: slideRevealPattern,
  blurReveal: blurRevealPattern,
  elasticReveal: elasticRevealPattern,
  keywordPunch: keywordPunchPattern,
  focusReveal: focusRevealPattern,
  staggerReveal: staggerRevealPattern,
  drawReveal: drawRevealPattern,
  exitFade: exitFadePattern,
};

// Auto-register all patterns
Object.values(patterns).forEach(registerPattern);

export * from './softReveal';
export * from './scalePunch';
export * from './slideReveal';
export * from './blurReveal';
export * from './elasticReveal';
export * from './keywordPunch';
export * from './focusReveal';
export * from './staggerReveal';
export * from './drawReveal';
export * from './exitFade';

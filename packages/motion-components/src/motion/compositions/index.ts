import { heroRevealComposition } from './heroReveal';
import { keywordEmphasisComposition } from './keywordEmphasis';
import { metricRevealComposition } from './metricReveal';
import { chartRevealComposition } from './chartReveal';
import { stepSequenceComposition } from './stepSequence';
import { quoteRevealComposition } from './quoteReveal';
import { ctaRevealComposition } from './ctaReveal';
import { beforeAfterComposition } from './beforeAfter';
import { registerComposition } from '../registry';

export const compositions = {
  heroReveal: heroRevealComposition,
  keywordEmphasis: keywordEmphasisComposition,
  metricReveal: metricRevealComposition,
  chartReveal: chartRevealComposition,
  stepSequence: stepSequenceComposition,
  quoteReveal: quoteRevealComposition,
  ctaReveal: ctaRevealComposition,
  beforeAfter: beforeAfterComposition,
};

// Auto-register all compositions
Object.values(compositions).forEach(registerComposition);

export * from './heroReveal';
export * from './keywordEmphasis';
export * from './metricReveal';
export * from './chartReveal';
export * from './stepSequence';
export * from './quoteReveal';
export * from './ctaReveal';
export * from './beforeAfter';

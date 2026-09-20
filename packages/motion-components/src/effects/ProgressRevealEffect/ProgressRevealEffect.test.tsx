import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressRevealEffect } from './ProgressRevealEffect';

describe('ProgressRevealEffect', () => {
  it('holds at fromProgress before delayInFrames', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect delayInFrames={10} currentFrame={5} fromProgress={0.2} direction="left-to-right">
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    expect(element.style.clipPath).toContain('20%');
  });

  it('reaches correctly calculated midpoint reveal', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect 
        durationInFrames={20} 
        delayInFrames={0} 
        currentFrame={10} 
        easing="linear" 
        fromProgress={0} 
        toProgress={0.8} 
        direction="left-to-right"
      >
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    // Midpoint of 0 to 0.8 is 0.4 (40%)
    expect(element.style.clipPath).toContain('40%');
  });

  it('reaches toProgress at end frame', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect 
        durationInFrames={30} 
        delayInFrames={0} 
        currentFrame={30} 
        fromProgress={0} 
        toProgress={0.75} 
        direction="left-to-right"
      >
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    expect(element.style.clipPath).toContain('75%');
  });

  it('clips correctly for right-to-left', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect currentFrame={30} toProgress={0.4} direction="right-to-left">
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    // 100 - 40 = 60
    expect(element.style.clipPath).toContain('polygon(60% 0%, 100% 0%, 100% 100%, 60% 100%)');
  });

  it('clips correctly for top-to-bottom', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect currentFrame={30} toProgress={0.3} direction="top-to-bottom">
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    expect(element.style.clipPath).toContain('polygon(0% 0%, 100% 0%, 100% 30%, 0% 30%)');
  });

  it('clips correctly for bottom-to-top', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect currentFrame={30} toProgress={0.7} direction="bottom-to-top">
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    // 100 - 70 = 30
    expect(element.style.clipPath).toContain('polygon(0% 30%, 100% 30%, 100% 100%, 0% 100%)');
  });

  it('interpolates opacity if provided', () => {
    const { getByTestId } = render(
      <ProgressRevealEffect durationInFrames={20} currentFrame={10} easing="linear" opacityFrom={0} opacityTo={1}>
        <div>Test</div>
      </ProgressRevealEffect>
    );
    const element = getByTestId('progress-reveal-effect');
    expect(element.style.opacity).toBe('0.5');
  });
});

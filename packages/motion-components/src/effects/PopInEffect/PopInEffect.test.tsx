import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PopInEffect } from './PopInEffect';

describe('PopInEffect', () => {
  it('hides completely before delayInFrames', () => {
    const { getByTestId } = render(
      <PopInEffect delayInFrames={10} currentFrame={5} opacityFrom={0.5}>
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    expect(element.style.opacity).toBe('0');
  });

  it('reaches final state at end frame', () => {
    const { getByTestId } = render(
      <PopInEffect durationInFrames={20} delayInFrames={0} currentFrame={20} scaleTo={1.5} opacityTo={0.8}>
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    expect(element.style.opacity).toBe('0.8');
    expect(element.style.transform).toContain('scale(1.5)');
    expect(element.style.transform).toContain('translate(0px, 0px)');
  });

  it('starts at initial state at frame 0', () => {
    const { getByTestId } = render(
      <PopInEffect durationInFrames={20} delayInFrames={0} currentFrame={0} scaleFrom={0.5} opacityFrom={0.2}>
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    expect(element.style.opacity).toBe('0.2');
    expect(element.style.transform).toContain('scale(0.5)');
  });

  it('translates correctly based on direction', () => {
    const { getByTestId } = render(
      <PopInEffect durationInFrames={20} delayInFrames={0} currentFrame={0} direction="bottom">
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    // bottom direction implies starting lower (+40px ty)
    expect(element.style.transform).toContain('translate(0px, 40px)');
  });

  it('handles absolute positioning if x and y are provided', () => {
    const { getByTestId } = render(
      <PopInEffect x={100} y={200} currentFrame={10}>
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');
  });

  it('overshoots if backOut easing is used (during animation)', () => {
    // With subtle backOut, at around 80% through the animation, it should overshoot slightly > 1
    // The subtle curve peaks around 70-85% progress.
    const { getByTestId } = render(
      <PopInEffect durationInFrames={100} delayInFrames={0} currentFrame={75} scaleTo={1} easing="backOut">
        <div>Test</div>
      </PopInEffect>
    );
    const element = getByTestId('pop-in-effect');
    const transform = element.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    const scale = parseFloat(scaleMatch![1]);
    expect(scale).toBeGreaterThan(1);
    expect(scale).toBeLessThan(1.2); // subtle overshoot
  });
});

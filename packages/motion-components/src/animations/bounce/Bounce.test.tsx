import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Bounce } from './Bounce';

describe('Bounce Primitive', () => {
  const FROM = 0;
  const TO = 100;
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` before delay', () => {
    const { getByTestId } = render(
      <Bounce property="y" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    expect(element.style.transform).toBe('translateY(0px)');
  });

  it('renders exactly `to` at the end of duration', () => {
    const { getByTestId } = render(
      <Bounce property="y" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    expect(element.style.transform).toBe('translateY(100px)');
  });

  it('remains at `to` after animation ends', () => {
    const { getByTestId } = render(
      <Bounce property="y" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    expect(element.style.transform).toBe('translateY(100px)');
  });

  it('overshoots past `to` during the bounce (scale)', () => {
    // A standard bounce will overshoot its target initially
    const { getByTestId } = render(
      <Bounce property="scale" from={0} to={1} delayInFrames={0} durationInFrames={20} currentFrame={10} intensity={0.5} bounces={1}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    const scaleString = element.style.transform; // 'scale(X)'
    const match = scaleString.match(/scale\(([^)]+)\)/);
    expect(match).not.toBeNull();
    if (match) {
      const scaleValue = parseFloat(match[1]);
      // Should overshoot 1.0 (e.g. 1.1 or 1.2 depending on math)
      expect(scaleValue).toBeGreaterThan(1.0);
    }
  });

  it('generates correct transform for x', () => {
    const { getByTestId } = render(
      <Bounce property="x" from={0} to={10} delayInFrames={0} durationInFrames={10} currentFrame={10}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    expect(element.style.transform).toBe('translateX(10px)');
  });

  it('generates correct transform for rotate', () => {
    const { getByTestId } = render(
      <Bounce property="rotate" from={0} to={45} delayInFrames={0} durationInFrames={10} currentFrame={10}>
        <div>Content</div>
      </Bounce>
    );
    const element = getByTestId('bounce-animation-wrapper');
    expect(element.style.transform).toBe('rotate(45deg)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Bounce from={FROM} to={TO} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Bounce>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

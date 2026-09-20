import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Blur } from './Blur';

describe('Blur Primitive', () => {
  const FROM = 0;
  const TO = 10;
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` blur before delay', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(0px)');
  });

  it('renders at `from` blur exactly at delay start', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={5}>
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(0px)');
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    // At frame 10 (halfway through 10 frames), progress is 0.5. 0 to 10 -> 5
    expect(element.style.filter).toBe('blur(5px)');
  });

  it('renders at `to` blur at the end of duration', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(10px)');
  });

  it('remains at `to` blur after animation ends', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(10px)');
  });

  it('handles zero delay correctly', () => {
    const { getByTestId } = render(
      <Blur from={FROM} to={TO} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(5px)');
  });

  it('handles blur out (10 -> 0)', () => {
    const { getByTestId } = render(
      <Blur from={10} to={0} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(5px)');
  });

  it('handles zero blur (0 -> 0)', () => {
    const { getByTestId } = render(
      <Blur from={0} to={0} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    expect(element.style.filter).toBe('blur(0px)');
  });

  it('handles easeIn correctly', () => {
    const { getByTestId } = render(
      <Blur from={0} to={10} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeIn">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    // progress 0.5 -> easeIn(0.5) = 0.125
    expect(element.style.filter).toBe('blur(1.25px)');
  });

  it('handles easeOut correctly', () => {
    const { getByTestId } = render(
      <Blur from={0} to={10} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeOut">
        <div>Content</div>
      </Blur>
    );
    const element = getByTestId('blur-animation-wrapper');
    // progress 0.5 -> easeOut(0.5) = 0.875
    expect(element.style.filter).toBe('blur(8.75px)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Blur from={FROM} to={TO} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Blur>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

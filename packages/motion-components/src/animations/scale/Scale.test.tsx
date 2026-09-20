import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Scale } from './Scale';

describe('Scale Primitive', () => {
  const FROM = 0;
  const TO = 2;
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` scale before delay', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(0)');
  });

  it('renders at `from` scale exactly at delay start', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={5}>
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(0)');
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    // At frame 10 (halfway through 10 frames), progress is 0.5. 0 to 2 -> 1
    expect(element.style.transform).toBe('scale(1)');
  });

  it('renders at `to` scale at the end of duration', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(2)');
  });

  it('remains at `to` scale after animation ends', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(2)');
  });

  it('handles zero delay correctly', () => {
    const { getByTestId } = render(
      <Scale from={FROM} to={TO} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(1)');
  });

  it('handles scale down (1 -> 0)', () => {
    const { getByTestId } = render(
      <Scale from={1} to={0} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(0.5)');
  });

  it('handles values below 1 (0.5 -> 1)', () => {
    const { getByTestId } = render(
      <Scale from={0.5} to={1} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(0.75)');
  });

  it('handles values above 1 (1 -> 1.5)', () => {
    const { getByTestId } = render(
      <Scale from={1} to={1.5} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    expect(element.style.transform).toBe('scale(1.25)');
  });

  it('handles easeIn correctly', () => {
    const { getByTestId } = render(
      <Scale from={0} to={10} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeIn">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    // progress 0.5 -> easeIn(0.5) = 0.125 -> scale(1.25)
    expect(element.style.transform).toBe('scale(1.25)');
  });

  it('handles easeOut correctly', () => {
    const { getByTestId } = render(
      <Scale from={0} to={10} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeOut">
        <div>Content</div>
      </Scale>
    );
    const element = getByTestId('scale-animation-wrapper');
    // progress 0.5 -> easeOut(0.5) = 0.875 -> scale(8.75)
    expect(element.style.transform).toBe('scale(8.75)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Scale from={FROM} to={TO} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Scale>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

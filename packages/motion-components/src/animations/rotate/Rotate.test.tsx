import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Rotate } from './Rotate';

describe('Rotate Primitive', () => {
  const FROM = 0;
  const TO = 90;
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` rotation before delay', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(0deg)');
  });

  it('renders at `from` rotation exactly at delay start', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={5}>
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(0deg)');
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    // At frame 10 (halfway through 10 frames), progress is 0.5. 0 to 90 -> 45
    expect(element.style.transform).toBe('rotate(45deg)');
  });

  it('renders at `to` rotation at the end of duration', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(90deg)');
  });

  it('remains at `to` rotation after animation ends', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(90deg)');
  });

  it('handles zero delay correctly', () => {
    const { getByTestId } = render(
      <Rotate from={FROM} to={TO} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(45deg)');
  });

  it('handles negative rotation (0 -> -90)', () => {
    const { getByTestId } = render(
      <Rotate from={0} to={-90} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(-45deg)');
  });

  it('handles full rotation (0 -> 360)', () => {
    const { getByTestId } = render(
      <Rotate from={0} to={360} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    expect(element.style.transform).toBe('rotate(180deg)');
  });

  it('handles easeIn correctly', () => {
    const { getByTestId } = render(
      <Rotate from={0} to={100} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeIn">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    // progress 0.5 -> easeIn(0.5) = 0.125 -> rotate(12.5deg)
    expect(element.style.transform).toBe('rotate(12.5deg)');
  });

  it('handles easeOut correctly', () => {
    const { getByTestId } = render(
      <Rotate from={0} to={100} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeOut">
        <div>Content</div>
      </Rotate>
    );
    const element = getByTestId('rotate-animation-wrapper');
    // progress 0.5 -> easeOut(0.5) = 0.875 -> rotate(87.5deg)
    expect(element.style.transform).toBe('rotate(87.5deg)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Rotate from={FROM} to={TO} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Rotate>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

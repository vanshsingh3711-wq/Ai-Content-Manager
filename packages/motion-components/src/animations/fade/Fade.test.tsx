import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Fade } from './Fade';

describe('Fade Primitive', () => {
  const FROM = 0;
  const TO = 1;
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` opacity before delay', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('0');
  });

  it('renders at `from` opacity exactly at delay start', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={5}>
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('0');
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    // At frame 10 (halfway through 10 frames), progress is 0.5. 0 to 1 -> 0.5
    expect(element.style.opacity).toBe('0.5');
  });

  it('renders at `to` opacity at the end of duration', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('1');
  });

  it('remains at `to` opacity after animation ends', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('1');
  });

  it('handles zero delay correctly', () => {
    const { getByTestId } = render(
      <Fade from={FROM} to={TO} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('0.5');
  });

  it('handles fade out (1 -> 0)', () => {
    const { getByTestId } = render(
      <Fade from={1} to={0} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('0.5');
  });

  it('handles partial opacity values (0.2 -> 0.8)', () => {
    const { getByTestId } = render(
      <Fade from={0.2} to={0.8} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    expect(element.style.opacity).toBe('0.5'); // halfway between 0.2 and 0.8
  });

  it('handles easeIn correctly', () => {
    const { getByTestId } = render(
      <Fade from={0} to={1} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeIn">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    // progress 0.5 -> easeIn(0.5) = 0.125
    expect(element.style.opacity).toBe('0.125');
  });

  it('handles easeOut correctly', () => {
    const { getByTestId } = render(
      <Fade from={0} to={1} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeOut">
        <div>Content</div>
      </Fade>
    );
    const element = getByTestId('fade-animation-wrapper');
    // progress 0.5 -> easeOut(0.5) = 0.875
    expect(element.style.opacity).toBe('0.875');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Fade from={FROM} to={TO} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Fade>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

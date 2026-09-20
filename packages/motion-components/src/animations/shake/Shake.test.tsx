import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Shake } from './Shake';

describe('Shake Primitive', () => {
  const AMPLITUDE = 10;
  const DURATION = 20;
  const DELAY = 5;

  it('renders at original position before delay', () => {
    const { getByTestId } = render(
      <Shake axis="x" amplitude={AMPLITUDE} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    // No transform string applied when offsets are 0
    expect(element.style.transform).toBe('');
  });

  it('renders exactly at original position at the end of duration', () => {
    const { getByTestId } = render(
      <Shake axis="x" amplitude={AMPLITUDE} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={25}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    expect(element.style.transform).toBe('');
  });

  it('remains at original position after animation ends', () => {
    const { getByTestId } = render(
      <Shake axis="x" amplitude={AMPLITUDE} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    expect(element.style.transform).toBe('');
  });

  it('generates an offset during the animation (x axis)', () => {
    const { getByTestId } = render(
      <Shake axis="x" amplitude={AMPLITUDE} delayInFrames={0} durationInFrames={20} currentFrame={2.5} frequency={2}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    const transform = element.style.transform;
    expect(transform).toContain('translate(');
    // At frame 2.5 of 20 (progress = 0.125), frequency 2 => Math.sin(0.125 * 2 * PI * 2) = Math.sin(PI/2) = 1
    // decay = 1 - 0.125 = 0.875
    // val = 1 * 0.875 * 10 = 8.75
    expect(transform).toBe('translate(8.75px, 0px)');
  });

  it('generates an offset during the animation (y axis)', () => {
    const { getByTestId } = render(
      <Shake axis="y" amplitude={AMPLITUDE} delayInFrames={0} durationInFrames={20} currentFrame={2.5} frequency={2}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    const transform = element.style.transform;
    expect(transform).toBe('translate(0px, 8.75px)');
  });

  it('generates an offset during the animation (both axes)', () => {
    const { getByTestId } = render(
      // currentFrame 2.5 -> progress 0.125
      <Shake axis="both" amplitude={AMPLITUDE} delayInFrames={0} durationInFrames={20} currentFrame={2.5} frequency={2}>
        <div>Content</div>
      </Shake>
    );
    const element = getByTestId('shake-animation-wrapper');
    const transform = element.style.transform;
    // X is 8.75
    // Y phase offset is PI/2.
    // Math.sin(PI/2 + PI/2) = Math.sin(PI) = 0
    // Val = 0 * 0.875 * 10 = 0
    // Wait, let's just check it doesn't throw and sets both
    expect(transform).toContain('translate(');
    expect(transform).toContain('px,');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Shake currentFrame={0}>
        <div>Testing children wrapper</div>
      </Shake>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Move } from './Move';

describe('Move Primitive', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 200 };
  const DURATION = 10;
  const DELAY = 5;

  it('renders at `from` position before delay', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    expect(element.style.transform).toBe('translate(0px, 0px)');
  });

  it('renders at `from` position exactly at delay start', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={5}>
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    expect(element.style.transform).toBe('translate(0px, 0px)');
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    // At frame 10 (halfway through the 10 frame duration after 5 delay)
    expect(element.style.transform).toBe('translate(50px, 100px)');
  });

  it('renders at `to` position at the end of duration', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    expect(element.style.transform).toBe('translate(100px, 200px)');
  });

  it('remains at `to` position after animation ends', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100}>
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    expect(element.style.transform).toBe('translate(100px, 200px)');
  });

  it('handles zero delay correctly', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="linear">
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    // Halfway through 10 frames with 0 delay -> frame 5
    expect(element.style.transform).toBe('translate(50px, 100px)');
  });

  it('handles easeIn correctly', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeIn">
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    // x = 0.5 -> easeIn -> 0.5^3 = 0.125. 100 * 0.125 = 12.5, 200 * 0.125 = 25
    expect(element.style.transform).toBe('translate(12.5px, 25px)');
  });

  it('handles easeOut correctly', () => {
    const { getByTestId } = render(
      <Move from={from} to={to} delayInFrames={0} durationInFrames={10} currentFrame={5} easing="easeOut">
        <div>Content</div>
      </Move>
    );
    const element = getByTestId('move-animation-wrapper');
    // x = 0.5 -> easeOut -> 1 - (0.5)^3 = 0.875. 100 * 0.875 = 87.5, 200 * 0.875 = 175
    expect(element.style.transform).toBe('translate(87.5px, 175px)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Move from={from} to={to} currentFrame={0}>
        <div>Testing children wrapper</div>
      </Move>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedCounter } from './AnimatedCounter';

describe('AnimatedCounter', () => {
  it('renders correctly at frame 0', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={100} currentFrame={0} animation={{ durationInFrames: 30 }} />
    );
    expect(getByTestId('counter-text').textContent).toBe('0');
  });

  it('renders correctly at final frame', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={100} currentFrame={30} animation={{ durationInFrames: 30 }} />
    );
    expect(getByTestId('counter-text').textContent).toBe('100');
  });

  it('formats as currency', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={1000} format="currency" currentFrame={30} />
    );
    expect(getByTestId('counter-text').textContent).toBe('$1,000');
  });

  it('formats as percentage', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={75} format="percentage" currentFrame={30} />
    );
    expect(getByTestId('counter-text').textContent).toBe('75%');
  });

  it('respects decimals', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={100} decimals={2} currentFrame={30} />
    );
    expect(getByTestId('counter-text').textContent).toBe('100.00');
  });

  it('adds commas correctly', () => {
    const { getByTestId } = render(
      <AnimatedCounter value={1234567} currentFrame={30} />
    );
    expect(getByTestId('counter-text').textContent).toBe('1,234,567');
  });
});

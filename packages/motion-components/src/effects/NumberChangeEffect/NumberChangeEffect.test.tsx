import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NumberChangeEffect } from './NumberChangeEffect';

describe('NumberChangeEffect', () => {
  it('displays the from value exactly at frame 0', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={100} to={200} currentFrame={0} />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('100');
  });

  it('displays the to value exactly at or after end frame', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={100} to={200} durationInFrames={30} delayInFrames={0} currentFrame={35} />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('200');
  });

  it('formats decimals correctly', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={2.4} to={3.8} durationInFrames={30} currentFrame={30} decimals={1} />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('3.8');
  });

  it('formats with prefix and suffix', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={45} to={72} currentFrame={30} prefix="$" suffix="M" />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('$72M');
  });

  it('handles negative values and correctly places the sign before the prefix', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={-120} to={-80} currentFrame={0} prefix="$" />
    );
    // Should be -$120, not $-120
    expect(getByTestId('number-change-effect').textContent).toBe('-$120');
  });

  it('formats large numbers with thousands separators by default', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={1000} to={25000} currentFrame={30} />
    );
    // Depending on en-US locale it should be 25,000
    expect(getByTestId('number-change-effect').textContent).toBe('25,000');
  });

  it('waits for delayInFrames before changing', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={100} to={200} delayInFrames={10} currentFrame={5} />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('100');
  });

  it('respects linear easing accurately at midpoint', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={100} to={200} durationInFrames={20} currentFrame={10} easing="linear" />
    );
    // 50% progress
    expect(getByTestId('number-change-effect').textContent).toBe('150');
  });

  it('prevents negative zero artifacts', () => {
    const { getByTestId } = render(
      <NumberChangeEffect from={-0.001} to={0} decimals={0} currentFrame={0} />
    );
    expect(getByTestId('number-change-effect').textContent).toBe('0');
  });
});

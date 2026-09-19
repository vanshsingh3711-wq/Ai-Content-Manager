import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneTap } from './PhoneTap';

describe('PhoneTap', () => {
  it('renders hidden at frame 0', () => {
    const { getByTestId } = render(
      <PhoneTap x={100} y={100} currentFrame={0} animation={{ durationInFrames: 30, delayInFrames: 10 }} />
    );
    const tap = getByTestId('phone-tap');
    expect(tap.style.opacity).toBe('0');
  });

  it('renders hidden at final frame (faded out)', () => {
    const { getByTestId } = render(
      <PhoneTap x={100} y={100} currentFrame={41} animation={{ durationInFrames: 30, delayInFrames: 10 }} />
    );
    const tap = getByTestId('phone-tap');
    expect(tap.style.opacity).toBe('0');
  });

  it('renders visible in the middle of animation', () => {
    const { getByTestId } = render(
      <PhoneTap x={100} y={100} currentFrame={20} animation={{ type: 'tap', durationInFrames: 30, delayInFrames: 10 }} />
    );
    const tap = getByTestId('phone-tap');
    expect(Number(tap.style.opacity)).toBeGreaterThan(0);
  });

  it('translates accurately based on x/y props', () => {
    const size = 48;
    const { getByTestId } = render(
      <PhoneTap x={100} y={150} size={size} currentFrame={20} animation={{ type: 'ripple', durationInFrames: 30, delayInFrames: 10 }} />
    );
    const tap = getByTestId('phone-tap');
    // Using simple regex match since scale is interpolated
    expect(tap.style.transform).toMatch(/translate\(76px, 126px\)/);
  });

  it('renders pointer svg in pointer mode', () => {
    const { getByTestId } = render(
      <PhoneTap x={100} y={100} currentFrame={15} animation={{ type: 'pointer', durationInFrames: 30 }} />
    );
    expect(getByTestId('pointer-svg')).toBeDefined();
  });

  it('applies custom dimensions and styling', () => {
    const { getByTestId } = render(
      <PhoneTap x={100} y={100} size={100} style={{ color: '#ff0000' }} currentFrame={15} />
    );
    const tap = getByTestId('phone-tap');
    expect(tap.style.width).toBe('100px');
    expect(tap.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});

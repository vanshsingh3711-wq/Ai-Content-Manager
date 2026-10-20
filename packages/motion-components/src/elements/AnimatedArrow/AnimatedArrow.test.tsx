import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedArrow } from './AnimatedArrow';

describe('AnimatedArrow', () => {
  it('renders correctly at frame 0 (hidden)', () => {
    const { getByTestId, queryByTestId } = render(
      <AnimatedArrow currentFrame={0} animation={{ type: 'draw', durationInFrames: 30 }} />
    );
    const line = getByTestId('arrow-line');
    const length = line.getAttribute('stroke-dasharray');
    const offset = line.getAttribute('stroke-dashoffset');
    expect(offset).toBe(length);
    expect(queryByTestId('arrow-head')).toBeNull(); // progress is 0
  });

  it('renders correctly at final frame (visible)', () => {
    const { getByTestId } = render(
      <AnimatedArrow currentFrame={30} animation={{ type: 'draw', durationInFrames: 30 }} />
    );
    const line = getByTestId('arrow-line');
    expect(line.getAttribute('stroke-dashoffset')).toBe('0');
    expect(getByTestId('arrow-head')).toBeDefined();
  });

  it('applies rotation correctly', () => {
    const { container } = render(
      <AnimatedArrow rotation={45} currentFrame={30} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.style.transform).toBe('rotate(45deg)');
  });

  it('adjusts path when curvature is provided', () => {
    const { getByTestId } = render(
      <AnimatedArrow size={100} curvature={50} currentFrame={30} />
    );
    const line = getByTestId('arrow-line');
    const d = line.getAttribute('d');
    expect(d).toContain('Q 50 50 100 0');
  });
});

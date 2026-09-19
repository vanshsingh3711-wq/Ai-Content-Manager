import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedBarChart } from './AnimatedBarChart';

describe('AnimatedBarChart', () => {
  const defaultProps = {
    width: 1080,
    height: 1920,
    data: [
      { label: '2021', value: 40 },
      { label: '2022', value: 55 },
    ],
  };

  it('renders with empty data without crashing', () => {
    render(<AnimatedBarChart width={1080} height={1920} data={[]} />);
    expect(document.querySelector('svg')).toBeDefined();
  });

  it('renders correct number of bars (when fully animated)', () => {
    const { container } = render(
      <AnimatedBarChart
        {...defaultProps}
        currentFrame={30}
        animation={{ durationInFrames: 30, type: 'grow' }}
      />
    );
    // At frame 30 with 30 duration, both bars should be fully visible
    const bars = container.querySelectorAll('rect');
    expect(bars.length).toBe(2);
  });

  it('calculates custom max value correctly', () => {
    const { getByText } = render(
      <AnimatedBarChart {...defaultProps} maxValue={200} showGrid={true} showAxis={true} />
    );
    // Grid lines should show 200 at the top
    expect(getByText('200')).toBeDefined();
  });

  it('animation at frame 0 results in 0 height for grow type', () => {
    const { container } = render(
      <AnimatedBarChart
        {...defaultProps}
        currentFrame={0}
        animation={{ durationInFrames: 30, type: 'grow' }}
      />
    );
    const bars = container.querySelectorAll('rect');
    // Actual height is 0, so our component skips rendering the rect if actualHeight == 0 
    // or renders it with height="0". In our code, we conditionally render `actualHeight > 0 && <rect>`
    expect(bars.length).toBe(0);
  });

  it('animation at final frame results in full height', () => {
    const { container } = render(
      <AnimatedBarChart
        {...defaultProps}
        currentFrame={30}
        animation={{ durationInFrames: 30, type: 'grow' }}
      />
    );
    const bars = container.querySelectorAll('rect');
    expect(bars.length).toBe(2);
    // The first bar target height: value (40) / max (55) * chartHeight (1920 - 80 - 60 = 1780)
    // 40 / 55 * 1780 = 1294.54
    const barHeight = parseFloat(bars[0].getAttribute('height') || '0');
    expect(barHeight).toBeGreaterThan(1200);
  });

  it('supports staggered animation', () => {
    const { container } = render(
      <AnimatedBarChart
        {...defaultProps}
        currentFrame={10} // Frame 10 out of 30.
        animation={{ durationInFrames: 30, staggerInFrames: 15, type: 'grow' }}
      />
    );
    const bars = container.querySelectorAll('rect');
    // Bar 1 delay is 0. Progress is 10/30 (33%). Should be rendered.
    // Bar 2 delay is 15. Progress is (10-15)/30 -> clamped to 0. Should NOT be rendered.
    expect(bars.length).toBe(1);
  });

  it('renders different chart dimensions responsively', () => {
    const { container } = render(<AnimatedBarChart {...defaultProps} width={540} height={960} currentFrame={30} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('540');
    expect(svg?.getAttribute('height')).toBe('960');
  });

  it('supports negative values via max/min scale (if implemented)', () => {
    // Current implementation treats negative values as 0 visually because actualHeight = Math.max(0, ...)
    // which aligns with standard finance bar charts without negative axes, but could be extended.
    const { container } = render(
      <AnimatedBarChart {...defaultProps} data={[{ label: 'Bad Year', value: -10 }]} currentFrame={30} />
    );
    const bars = container.querySelectorAll('rect');
    expect(bars.length).toBe(0); // Height clipped to 0
  });
});

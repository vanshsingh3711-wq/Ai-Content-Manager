import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedLineChart } from './AnimatedLineChart';

describe('AnimatedLineChart', () => {
  const defaultProps = {
    width: 1080,
    height: 1920,
    data: [
      { label: '2021', value: 40 },
      { label: '2022', value: 55 },
      { label: '2023', value: 72 },
    ],
  };

  it('renders with empty data without crashing', () => {
    render(<AnimatedLineChart width={1080} height={1920} data={[]} />);
    expect(document.querySelector('svg')).toBeDefined();
  });

  it('renders one data point correctly', () => {
    const { container } = render(
      <AnimatedLineChart
        {...defaultProps}
        data={[{ label: '2021', value: 40 }]}
        currentFrame={30}
        animation={{ durationInFrames: 30, type: 'fade' }}
      />
    );
    // Line path should just be a single Move command
    const path = container.querySelector('path');
    expect(path).toBeDefined();
    expect(path?.getAttribute('d')?.startsWith('M')).toBeTruthy();
  });

  it('animation at frame 0 results in hidden line (strokeDashoffset matches length)', () => {
    const { container } = render(
      <AnimatedLineChart
        {...defaultProps}
        currentFrame={0}
        animation={{ durationInFrames: 30, type: 'draw' }}
      />
    );
    const path = container.querySelector('path');
    const length = path?.getAttribute('stroke-dasharray');
    const offset = path?.getAttribute('stroke-dashoffset');
    expect(offset).toBe(length);
    
    // Points should be scaled to 0 (opacity 0)
    const pointGroup = container.querySelector('[data-testid="point-group-0"]');
    expect(pointGroup?.getAttribute('opacity')).toBe("0");
  });

  it('animation at final frame results in fully visible line (strokeDashoffset 0)', () => {
    const { container } = render(
      <AnimatedLineChart
        {...defaultProps}
        currentFrame={30}
        animation={{ durationInFrames: 30, type: 'draw' }}
      />
    );
    const path = container.querySelector('path');
    const offset = path?.getAttribute('stroke-dashoffset');
    expect(offset).toBe("0");
    
    const pointGroup = container.querySelector('[data-testid="point-group-0"]');
    expect(pointGroup?.getAttribute('opacity')).toBe("1");
  });

  it('renders different chart dimensions responsively', () => {
    const { container } = render(<AnimatedLineChart {...defaultProps} width={540} height={960} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('540');
    expect(svg?.getAttribute('height')).toBe('960');
  });

  it('calculates custom max value correctly', () => {
    const { getByText } = render(
      <AnimatedLineChart {...defaultProps} maxValue={200} showGrid={true} showAxis={true} />
    );
    expect(getByText('200')).toBeDefined();
  });
});

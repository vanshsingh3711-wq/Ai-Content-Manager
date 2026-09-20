import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartDrawEffect } from './ChartDrawEffect';

describe('ChartDrawEffect', () => {
  it('hides chart completely at frame 0 (progressFrom = 0)', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={0} progressFrom={0}>
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    expect(element.style.clipPath).toContain('0%');
  });

  it('reveals exactly 50% at midpoint with linear easing', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={10} durationInFrames={20} delayInFrames={0} easing="linear" direction="left-to-right">
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    expect(element.style.clipPath).toContain('50%');
  });

  it('reveals fully at end frame', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={45} durationInFrames={45} delayInFrames={0} progressTo={1}>
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    expect(element.style.clipPath).toContain('100%');
  });

  it('clips right-to-left correctly', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={20} durationInFrames={20} delayInFrames={0} progressTo={0.4} direction="right-to-left">
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    // 100 - 40 = 60
    expect(element.style.clipPath).toContain('polygon(60% 0%, 100% 0%, 100% 100%, 60% 100%)');
  });

  it('delays drawing until delayInFrames passes', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={10} delayInFrames={15} progressFrom={0.2}>
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    expect(element.style.clipPath).toContain('20%'); // Remains at initial progressFrom state
  });

  it('interpolates opacity smoothly', () => {
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={10} durationInFrames={20} delayInFrames={0} easing="linear" opacityFrom={0} opacityTo={1}>
        <div>Chart</div>
      </ChartDrawEffect>
    );
    const element = getByTestId('chart-draw-effect');
    expect(element.style.opacity).toBe('0.5');
  });

  it('gracefully wraps arbitrary child without failing', () => {
    const CustomChart = () => <div data-testid="custom-chart">Bars</div>;
    const { getByTestId } = render(
      <ChartDrawEffect currentFrame={30}>
        <CustomChart />
      </ChartDrawEffect>
    );
    const element = getByTestId('custom-chart');
    expect(element).toBeDefined();
  });
});

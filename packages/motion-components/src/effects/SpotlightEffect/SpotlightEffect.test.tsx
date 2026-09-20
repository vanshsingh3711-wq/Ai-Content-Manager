import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SpotlightEffect } from './SpotlightEffect';

describe('SpotlightEffect', () => {
  it('renders nothing after the animation ends', () => {
    const { queryByTestId } = render(
      <SpotlightEffect x={10} y={10} radius={100} durationInFrames={30} delayInFrames={0} currentFrame={50} />
    );
    expect(queryByTestId('spotlight-effect')).toBeNull();
  });

  it('renders correctly during hold phase', () => {
    const { getByTestId, container } = render(
      <SpotlightEffect x={10} y={20} radius={100} durationInFrames={90} delayInFrames={0} currentFrame={45} overlayOpacity={0.65} />
    );
    const overlay = getByTestId('spotlight-overlay');
    expect(overlay).toBeDefined();
    expect(parseFloat(overlay.getAttribute('opacity') || '0')).toBeCloseTo(0.65);

    const ellipse = container.querySelector('mask ellipse');
    expect(ellipse?.getAttribute('cx')).toBe('10');
    expect(ellipse?.getAttribute('cy')).toBe('20');
    expect(ellipse?.getAttribute('rx')).toBe('100');
    expect(ellipse?.getAttribute('ry')).toBe('100');
  });

  it('handles elliptical shapes', () => {
    const { container } = render(
      <SpotlightEffect x={10} y={10} radiusX={200} radiusY={50} durationInFrames={90} currentFrame={45} />
    );
    const ellipse = container.querySelector('mask ellipse');
    expect(ellipse?.getAttribute('rx')).toBe('200');
    expect(ellipse?.getAttribute('ry')).toBe('50');
  });

  it('moves position when toX and toY are provided', () => {
    // 90 frame duration, enter is 20, exit is 20. Hold is from frame 20 to 70 (50 frames long).
    // At frame 45, it is halfway through the hold phase. Easing is applied, so it should be exactly halfway.
    const { container } = render(
      <SpotlightEffect x={0} y={0} toX={100} toY={200} durationInFrames={90} enterDurationInFrames={20} exitDurationInFrames={20} delayInFrames={0} currentFrame={45} />
    );
    const ellipse = container.querySelector('mask ellipse');
    expect(parseFloat(ellipse?.getAttribute('cx') || '0')).toBeCloseTo(50);
    expect(parseFloat(ellipse?.getAttribute('cy') || '0')).toBeCloseTo(100);
  });

  it('animates scale when expand is enabled', () => {
    const { container } = render(
      <SpotlightEffect x={10} y={10} radius={100} animation="expand" delayInFrames={0} enterDurationInFrames={10} currentFrame={5} />
    );
    const ellipse = container.querySelector('mask ellipse');
    const rx = parseFloat(ellipse?.getAttribute('rx') || '0');
    expect(rx).toBeGreaterThan(0);
    expect(rx).toBeLessThan(100);
  });

  it('renders glow if enabled', () => {
    const { getByTestId } = render(
      <SpotlightEffect x={10} y={10} radius={100} glow currentFrame={30} delayInFrames={0} />
    );
    const glowShape = getByTestId('spotlight-glow');
    expect(glowShape).toBeDefined();
    expect(glowShape.getAttribute('style')).toContain('blur');
  });

  it('does not render glow if not enabled', () => {
    const { queryByTestId } = render(
      <SpotlightEffect x={10} y={10} radius={100} glow={false} currentFrame={30} delayInFrames={0} />
    );
    expect(queryByTestId('spotlight-glow')).toBeNull();
  });
});

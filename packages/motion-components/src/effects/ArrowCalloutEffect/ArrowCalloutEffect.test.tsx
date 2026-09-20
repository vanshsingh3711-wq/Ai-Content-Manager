import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ArrowCalloutEffect } from './ArrowCalloutEffect';

describe('ArrowCalloutEffect', () => {
  it('renders nothing before delayInFrames', () => {
    const { queryByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={100} delayInFrames={10} currentFrame={5} />
    );
    expect(queryByTestId('arrow-callout-effect')).toBeNull();
  });

  it('draws completely by end frame (draw)', () => {
    const { getByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={100} durationInFrames={30} delayInFrames={0} currentFrame={30} animation="draw" />
    );
    const path = getByTestId('arrow-line-path');
    const d = path.getAttribute('d') || '';
    // The point t=1 should equal toX and toY
    expect(d.endsWith('100,100')).toBe(true);
  });

  it('is partially drawn during animation (draw)', () => {
    const { getByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={100} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="draw" />
    );
    const path = getByTestId('arrow-line-path');
    const d = path.getAttribute('d') || '';
    expect(d.endsWith('100,100')).toBe(false); // Has not reached target yet
  });

  it('fades opacity correctly (fade)', () => {
    const { getByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={100} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="fade" opacity={1} />
    );
    const path = getByTestId('arrow-line-path');
    const opacity = parseFloat(path.getAttribute('opacity') || '1');
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('applies arrowhead transformation', () => {
    const { getByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={100} currentFrame={30} />
    );
    const arrowHead = getByTestId('arrow-head-path').parentElement;
    const transform = arrowHead?.getAttribute('transform') || '';
    expect(transform).toContain('translate(100, 100)');
    // Diagonal 100,100 from 0,0 is exactly 45 degrees
    expect(transform).toContain('rotate(45)');
  });

  it('supports curved arrows via quadratic control point', () => {
    const { getByTestId } = render(
      <ArrowCalloutEffect fromX={0} fromY={0} toX={100} toY={0} style="curved" curvature={0.5} currentFrame={30} />
    );
    const path = getByTestId('arrow-line-path');
    const d = path.getAttribute('d') || '';
    expect(d).toContain('Q');
    
    // For from 0,0 to 100,0. Midpoint is 50,0. 
    // dx = 100, dy = 0. distance = 100.
    // normal is -dy/d, dx/d = 0, 1.
    // cx = 50 + 0, cy = 0 + 1 * 100 * 0.5 = 50.
    // The curve control point Q should be exactly 50,50
    expect(d).toContain('50,50');
  });
});

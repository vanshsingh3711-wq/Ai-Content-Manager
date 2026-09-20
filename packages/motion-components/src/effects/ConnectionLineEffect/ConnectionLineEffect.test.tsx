import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ConnectionLineEffect } from './ConnectionLineEffect';

describe('ConnectionLineEffect', () => {
  it('renders a straight line path correctly', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect fromX={0} fromY={0} toX={100} toY={100} style="straight" />
    );
    const path = getByTestId('connection-path');
    expect(path.getAttribute('d')).toBe('M 0 0 L 100 100');
  });

  it('renders a curved line path deterministically', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect fromX={0} fromY={0} toX={100} toY={0} style="curved" curvature={50} />
    );
    const path = getByTestId('connection-path');
    
    // midpoint is 50, 0
    // dx = 100, dy = 0. length = 100
    // nx = -0 / 100 = 0, ny = 100 / 100 = 1
    // cx = 50 + 0 * 50 = 50
    // cy = 0 + 1 * 50 = 50
    // So Q 50 50 100 0
    expect(path.getAttribute('d')).toBe('M 0 0 Q 50 50 100 0');
  });

  it('delays drawing until delayInFrames', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect delayInFrames={10} currentFrame={5} fromX={0} fromY={0} toX={10} toY={10} animation="draw" />
    );
    const path = getByTestId('connection-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('100'); // completely undrawn
  });

  it('completes drawing at final frame', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect delayInFrames={0} durationInFrames={30} currentFrame={30} fromX={0} fromY={0} toX={10} toY={10} animation="draw" />
    );
    const path = getByTestId('connection-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('0'); // fully drawn
  });

  it('interpolates fade animation opacity', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect currentFrame={10} durationInFrames={20} easing="linear" fromX={0} fromY={0} toX={10} toY={10} animation="fade" />
    );
    const svg = getByTestId('connection-line-effect');
    expect(svg.style.opacity).toBe('0.5');
  });

  it('orientates arrowhead correctly for straight lines', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect fromX={0} fromY={0} toX={100} toY={0} showArrow currentFrame={30} />
    );
    const arrow = getByTestId('connection-arrow');
    // going from 0,0 to 100,0 is an angle of 0 degrees
    expect(arrow.getAttribute('transform')).toBe('translate(100, 0) rotate(0)');
  });

  it('renders start and end dots when enabled', () => {
    const { getByTestId } = render(
      <ConnectionLineEffect fromX={10} fromY={20} toX={30} toY={40} showStartDot showEndDot />
    );
    const startDot = getByTestId('start-dot');
    const endDot = getByTestId('end-dot');
    
    expect(startDot.getAttribute('cx')).toBe('10');
    expect(startDot.getAttribute('cy')).toBe('20');
    
    expect(endDot.getAttribute('cx')).toBe('30');
    expect(endDot.getAttribute('cy')).toBe('40');
  });
});

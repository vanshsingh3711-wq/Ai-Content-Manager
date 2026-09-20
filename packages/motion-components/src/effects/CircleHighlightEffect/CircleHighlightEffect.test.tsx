import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CircleHighlightEffect } from './CircleHighlightEffect';

describe('CircleHighlightEffect', () => {
  it('renders nothing before delayInFrames', () => {
    const { queryByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} delayInFrames={10} currentFrame={5} />
    );
    expect(queryByTestId('circle-highlight-effect')).toBeNull();
  });

  it('draws completely by end frame (draw)', () => {
    const { getByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} durationInFrames={30} delayInFrames={0} currentFrame={30} animation="draw" style="hand-drawn" />
    );
    const path = getByTestId('circle-highlight-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('0');
  });

  it('is partially drawn during animation (draw)', () => {
    const { getByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="draw" style="ellipse" />
    );
    const ellipse = getByTestId('circle-highlight-ellipse');
    const offset = parseFloat(ellipse.getAttribute('stroke-dashoffset') || '100');
    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThan(100);
  });

  it('fades opacity correctly (fade)', () => {
    const { getByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="fade" opacity={1} style="ellipse" />
    );
    const ellipse = getByTestId('circle-highlight-ellipse');
    const opacity = parseFloat(ellipse.getAttribute('opacity') || '1');
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('applies ellipse shape correctly', () => {
    const { getByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} padding={10} style="ellipse" currentFrame={30} />
    );
    const ellipse = getByTestId('circle-highlight-ellipse');
    expect(ellipse.getAttribute('rx')).toBe('60'); // 100/2 + 10
    expect(ellipse.getAttribute('ry')).toBe('35'); // 50/2 + 10
  });

  it('applies hand-drawn path properly', () => {
    const { getByTestId } = render(
      <CircleHighlightEffect x={10} y={10} width={100} height={50} style="hand-drawn" currentFrame={30} />
    );
    const path = getByTestId('circle-highlight-path');
    const d = path.getAttribute('d') || '';
    expect(d).toContain('M ');
    expect(d).toContain('C '); // Cubic bezier curves present
  });
});

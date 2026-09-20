import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HighlightEffect } from './HighlightEffect';

describe('HighlightEffect', () => {
  it('renders nothing after the animation ends', () => {
    const { queryByTestId } = render(
      <HighlightEffect durationInFrames={30} delayInFrames={0} currentFrame={50} />
    );
    expect(queryByTestId('highlight-effect')).toBeNull();
  });

  it('renders box animation correctly during hold phase', () => {
    const { getByTestId } = render(
      <HighlightEffect animation="box" durationInFrames={90} delayInFrames={0} currentFrame={45} opacity={1} />
    );
    const element = getByTestId('highlight-effect');
    expect(element).toBeDefined();
    // Inner SVG should have opacity 1
    const svg = element.querySelector('svg');
    expect(svg?.style.opacity).toBe('1');
    expect(svg?.style.transform).toBe('scale(1)');
  });

  it('animates opacity correctly during enter phase for box', () => {
    const { getByTestId } = render(
      <HighlightEffect animation="box" delayInFrames={10} enterDurationInFrames={10} currentFrame={15} opacity={1} />
    );
    const element = getByTestId('highlight-effect');
    const svg = element.querySelector('svg');
    
    const opacity = parseFloat(svg?.style.opacity || '0');
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    
    const transform = svg?.style.transform || '';
    expect(transform).toContain('scale');
  });

  it('animates width correctly for marker animation', () => {
    const { getByTestId } = render(
      <HighlightEffect animation="marker" delayInFrames={0} enterDurationInFrames={10} currentFrame={5} opacity={1} />
    );
    const element = getByTestId('highlight-effect');
    const innerDiv = element.children[0]?.children[0] as HTMLElement;
    
    const widthPercentage = parseFloat(innerDiv?.style.width || '0%');
    expect(widthPercentage).toBeGreaterThan(0);
    expect(widthPercentage).toBeLessThan(100);
  });

  it('applies explicit positioning properties', () => {
    const { getByTestId } = render(
      <HighlightEffect x={100} y={200} width={300} height={400} currentFrame={5} />
    );
    const element = getByTestId('highlight-effect');
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');
    expect(element.style.width).toBe('300px');
    expect(element.style.height).toBe('400px');
  });
});

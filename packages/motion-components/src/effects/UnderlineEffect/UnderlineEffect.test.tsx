import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UnderlineEffect } from './UnderlineEffect';

describe('UnderlineEffect', () => {
  it('renders nothing before delayInFrames', () => {
    const { queryByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} delayInFrames={10} currentFrame={5} />
    );
    expect(queryByTestId('underline-effect')).toBeNull();
  });

  it('draws completely by end frame (draw)', () => {
    const { getByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} durationInFrames={30} delayInFrames={0} currentFrame={30} animation="draw" />
    );
    const path = getByTestId('underline-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('0');
  });

  it('is partially drawn during animation (draw)', () => {
    const { getByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="draw" />
    );
    const path = getByTestId('underline-path');
    const offset = parseFloat(path.getAttribute('stroke-dashoffset') || '100');
    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThan(100);
  });

  it('fades opacity correctly (fade)', () => {
    const { getByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} durationInFrames={30} delayInFrames={0} currentFrame={15} animation="fade" opacity={1} />
    );
    const path = getByTestId('underline-path');
    const opacity = parseFloat(path.getAttribute('opacity') || '1');
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('applies marker styles correctly', () => {
    const { getByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} style="marker" strokeWidth={4} currentFrame={30} />
    );
    const path = getByTestId('underline-path');
    expect(path.getAttribute('stroke-linecap')).toBe('square');
    expect(path.getAttribute('stroke-width')).toBe('6'); // 4 * 1.5
  });

  it('applies hand-drawn path properly', () => {
    const { getByTestId } = render(
      <UnderlineEffect x={10} y={10} width={100} style="hand-drawn" currentFrame={30} />
    );
    const path = getByTestId('underline-path');
    const d = path.getAttribute('d') || '';
    expect(d).toContain('C '); // Cubic bezier
  });
});

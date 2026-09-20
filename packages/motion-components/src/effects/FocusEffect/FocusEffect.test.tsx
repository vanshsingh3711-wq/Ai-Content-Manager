import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FocusEffect } from './FocusEffect';

describe('FocusEffect', () => {
  it('renders nothing after the animation ends', () => {
    const { queryByTestId } = render(
      <FocusEffect x={10} y={10} width={100} height={100} durationInFrames={30} delayInFrames={0} currentFrame={50} />
    );
    expect(queryByTestId('focus-effect')).toBeNull();
  });

  it('renders overlay correctly during hold phase', () => {
    const { getByTestId } = render(
      <FocusEffect x={10} y={10} width={100} height={100} durationInFrames={90} delayInFrames={0} currentFrame={45} overlayOpacity={0.65} />
    );
    const overlay = getByTestId('focus-overlay');
    expect(overlay).toBeDefined();
    expect(parseFloat(overlay.getAttribute('opacity') || '0')).toBeCloseTo(0.65);
  });

  it('animates opacity correctly during enter phase', () => {
    const { getByTestId } = render(
      <FocusEffect x={10} y={10} width={100} height={100} delayInFrames={10} enterDurationInFrames={10} currentFrame={15} overlayOpacity={0.65} />
    );
    const overlay = getByTestId('focus-overlay');
    const opacity = parseFloat(overlay.getAttribute('opacity') || '0');
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(0.65);
  });

  it('animates scale when zoom is enabled', () => {
    // Zoom should scale the mask rectangle inside defs
    const { container } = render(
      <FocusEffect x={10} y={10} width={100} height={100} animation="zoom" delayInFrames={0} enterDurationInFrames={10} currentFrame={5} overlayOpacity={0.65} />
    );
    
    // Mask rect is the second rect in the mask
    const maskRect = container.querySelector('mask rect[fill="black"]');
    expect(maskRect).not.toBeNull();
    
    const transform = maskRect?.getAttribute('style') || '';
    expect(transform).toContain('scale');
    // Not 1 and not 0.96 (since it's in the middle)
    expect(transform).not.toContain('scale(1)');
    expect(transform).not.toContain('scale(0.96)');
  });

  it('renders glow if enabled', () => {
    const { getByTestId } = render(
      <FocusEffect x={10} y={10} width={100} height={100} glow currentFrame={30} delayInFrames={0} />
    );
    const glowRect = getByTestId('focus-glow');
    expect(glowRect).toBeDefined();
    
    // Glow uses stroke and blur
    expect(glowRect.getAttribute('stroke')).toBeDefined();
    expect(glowRect.getAttribute('style')).toContain('blur');
  });

  it('does not render glow if not enabled', () => {
    const { queryByTestId } = render(
      <FocusEffect x={10} y={10} width={100} height={100} glow={false} currentFrame={30} delayInFrames={0} />
    );
    expect(queryByTestId('focus-glow')).toBeNull();
  });
});

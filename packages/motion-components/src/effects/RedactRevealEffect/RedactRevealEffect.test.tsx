import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RedactRevealEffect } from './RedactRevealEffect';

describe('RedactRevealEffect', () => {
  it('hides child (if mask) and covers with redaction at frame 0', () => {
    const { getByTestId } = render(
      <RedactRevealEffect delayInFrames={10} currentFrame={0} revealMode="mask" direction="left-to-right">
        <div>Test</div>
      </RedactRevealEffect>
    );
    const childLayer = getByTestId('redact-child-layer');
    const redactLayer = getByTestId('redact-layer');
    
    // 0% width clip-path
    expect(childLayer.style.clipPath).toContain('0%');
    // Redaction block full size
    expect(redactLayer.style.left).toBe('0%');
    expect(redactLayer.style.right).toBe('0px');
  });

  it('reveals exactly 50% at middle frame with linear easing', () => {
    const { getByTestId } = render(
      <RedactRevealEffect durationInFrames={20} delayInFrames={0} currentFrame={10} easing="linear" direction="left-to-right" revealMode="mask">
        <div>Test</div>
      </RedactRevealEffect>
    );
    const childLayer = getByTestId('redact-child-layer');
    const redactLayer = getByTestId('redact-layer');
    
    expect(childLayer.style.clipPath).toContain('50%');
    expect(redactLayer.style.left).toBe('50%');
  });

  it('clears redaction block and fully reveals child at end frame', () => {
    const { getByTestId, queryByTestId } = render(
      <RedactRevealEffect durationInFrames={30} delayInFrames={0} currentFrame={30} direction="top-to-bottom">
        <div>Test</div>
      </RedactRevealEffect>
    );
    const childLayer = getByTestId('redact-child-layer');
    
    expect(childLayer.style.clipPath).toContain('100%');
    
    // Redaction block unmounts
    expect(queryByTestId('redact-layer')).toBeNull();
  });

  it('applies custom redaction color and opacity', () => {
    const { getByTestId } = render(
      <RedactRevealEffect currentFrame={10} redactionColor="#ff0000" redactionOpacity={0.8}>
        <div>Test</div>
      </RedactRevealEffect>
    );
    const redactLayer = getByTestId('redact-layer');
    expect(redactLayer.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(redactLayer.style.opacity).toBe('0.8');
  });

  it('works in wipe mode without clipping the child', () => {
    const { getByTestId } = render(
      <RedactRevealEffect currentFrame={10} revealMode="wipe" direction="top-to-bottom">
        <div>Test</div>
      </RedactRevealEffect>
    );
    const childLayer = getByTestId('redact-child-layer');
    // Should have no clip path
    expect(childLayer.style.clipPath).toBe('none');
  });

  it('handles right-to-left masking correctly', () => {
    const { getByTestId } = render(
      <RedactRevealEffect currentFrame={15} durationInFrames={30} easing="linear" direction="right-to-left" revealMode="mask">
        <div>Test</div>
      </RedactRevealEffect>
    );
    const childLayer = getByTestId('redact-child-layer');
    const redactLayer = getByTestId('redact-layer');
    
    // 100 - 50 = 50
    expect(childLayer.style.clipPath).toContain('50%');
    expect(redactLayer.style.right).toBe('50%');
    expect(redactLayer.style.left).toBe('0px');
  });
});

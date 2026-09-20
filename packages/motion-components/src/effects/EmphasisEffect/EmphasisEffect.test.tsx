import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmphasisEffect } from './EmphasisEffect';

describe('EmphasisEffect', () => {
  it('maintains from-state before delayInFrames', () => {
    const { getByTestId } = render(
      <EmphasisEffect delayInFrames={10} currentFrame={5} scaleFrom={1} scalePeak={1.5} opacityFrom={0.5}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.opacity).toBe('0.5');
    expect(element.style.transform).toContain('scale(1)');
  });

  it('reaches peak values exactly at the middle frame', () => {
    // 30 frames duration, no delay. Middle is frame 15.
    const { getByTestId } = render(
      <EmphasisEffect durationInFrames={30} delayInFrames={0} currentFrame={15} scalePeak={1.5} rotationPeak={10} opacityPeak={0.8}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.transform).toContain('scale(1.5)');
    expect(element.style.transform).toContain('rotate(10deg)');
    expect(element.style.opacity).toBe('0.8');
  });

  it('reaches to-state exactly at end frame', () => {
    const { getByTestId } = render(
      <EmphasisEffect durationInFrames={30} delayInFrames={0} currentFrame={30} scaleTo={1} opacityTo={1} rotationTo={0}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.transform).toContain('scale(1)');
    expect(element.style.transform).toContain('rotate(0deg)');
    expect(element.style.opacity).toBe('1');
  });

  it('applies drop-shadow filter when glow is enabled and active', () => {
    // Middle frame = full glow
    const { getByTestId } = render(
      <EmphasisEffect durationInFrames={20} currentFrame={10} glow={true} glowRadius={20} glowColor="#ff0000" glowOpacity={0.8}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.filter).toContain('drop-shadow');
    expect(element.style.filter).toContain('20px');
    expect(element.style.filter).toContain('rgba(255, 0, 0, 0.8)');
  });

  it('does not apply filter when glow is false', () => {
    const { getByTestId } = render(
      <EmphasisEffect durationInFrames={20} currentFrame={10} glow={false} glowRadius={20}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.filter).toBe('none');
  });

  it('handles absolute positioning if x and y are provided', () => {
    const { getByTestId } = render(
      <EmphasisEffect x={100} y={200} currentFrame={10}>
        <div>Test</div>
      </EmphasisEffect>
    );
    const element = getByTestId('emphasis-effect');
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');
  });
});

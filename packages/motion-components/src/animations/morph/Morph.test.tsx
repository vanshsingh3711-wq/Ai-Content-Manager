import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Morph } from './Morph';
import { interpolatePath } from '../utils/svg';

describe('SVG interpolatePath Utility', () => {
  it('returns from path if structurally incompatible (different lengths)', () => {
    const from = "M 0 0 L 10 10"; // 6 tokens: M, 0, 0, L, 10, 10
    const to = "M 0 0 L 10 10 L 20 20"; // 9 tokens
    expect(interpolatePath(from, to, 0.5)).toBe(from);
  });

  it('returns from path if structurally incompatible (different commands)', () => {
    const from = "M 0 0 L 10 10"; 
    const to = "M 0 0 C 10 10"; // same length, different command
    expect(interpolatePath(from, to, 0.5)).toBe(from);
  });

  it('interpolates successfully for identical structures', () => {
    const from = "M 0 0 L 10 10"; 
    const to = "M 10 10 L 20 20";
    
    // progress 0
    expect(interpolatePath(from, to, 0)).toBe("M 0 0 L 10 10");
    // progress 0.5
    expect(interpolatePath(from, to, 0.5)).toBe("M 5 5 L 15 15");
    // progress 1
    expect(interpolatePath(from, to, 1)).toBe("M 10 10 L 20 20");
  });

  it('handles negative numbers and decimals correctly', () => {
    const from = "M -10 -10.5 L 0 0"; 
    const to = "M 10 10.5 L -10.5 -10.5";
    
    expect(interpolatePath(from, to, 0.5)).toBe("M 0 0 L -5.25 -5.25");
  });

  it('preserves spacing between commands by implicitly adding a space after parsing', () => {
    // Even if from/to are tightly packed, the parser outputs space-separated tokens
    const from = "M0,0L10,10"; 
    const to = "M10,10L20,20";
    
    expect(interpolatePath(from, to, 0)).toBe("M0,0L10,10");
    expect(interpolatePath(from, to, 0.5)).toBe("M 5 5 L 15 15");
  });
});

describe('Morph Primitive', () => {
  const FROM_PATH = "M 0 0 L 10 10";
  const TO_PATH = "M 10 10 L 20 20";
  const DURATION = 20;
  const DELAY = 5;

  it('renders from path before delay', () => {
    const { getByTestId } = render(
      <Morph from={FROM_PATH} to={TO_PATH} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <svg><path /></svg>
      </Morph>
    );
    const path = getByTestId('morph-wrapper');
    expect(path.getAttribute('d')).toBe("M 0 0 L 10 10");
  });

  it('renders to path at the end of duration', () => {
    const { getByTestId } = render(
      <Morph from={FROM_PATH} to={TO_PATH} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={25}>
        <svg><path /></svg>
      </Morph>
    );
    const path = getByTestId('morph-wrapper');
    expect(path.getAttribute('d')).toBe("M 10 10 L 20 20");
  });

  it('interpolates correctly during animation', () => {
    const { getByTestId } = render(
      <Morph from={FROM_PATH} to={TO_PATH} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15} easing="linear">
        <svg><path /></svg>
      </Morph>
    );
    const path = getByTestId('morph-wrapper');
    // progress = 10 / 20 = 0.5
    expect(path.getAttribute('d')).toBe("M 5 5 L 15 15");
  });

  it('preserves existing path properties', () => {
    const { getByTestId } = render(
      <Morph from={FROM_PATH} to={TO_PATH} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15}>
        <svg><path fill="red" strokeWidth={2} className="my-class" /></svg>
      </Morph>
    );
    const path = getByTestId('morph-wrapper');
    expect(path.getAttribute('fill')).toBe('red');
    expect(path.getAttribute('stroke-width')).toBe('2'); // react sets stroke-width
    expect(path.getAttribute('class')).toBe('my-class');
  });

  it('gracefully handles missing from or to by preserving from (via interpolatePath fallback)', () => {
    const BAD_TO = "M 0 0 C 10 10"; // incompatible command
    const { getByTestId } = render(
      <Morph from={FROM_PATH} to={BAD_TO} delayInFrames={0} durationInFrames={10} currentFrame={5}>
        <svg><path /></svg>
      </Morph>
    );
    const path = getByTestId('morph-wrapper');
    // should remain unchanged because it's incompatible
    expect(path.getAttribute('d')).toBe(FROM_PATH);
  });
});

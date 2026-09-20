import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Parallax } from './Parallax';

describe('Parallax Primitive', () => {
  const FROM = { x: 0, y: 0 };
  const TO = { x: 100, y: 100 };
  const DURATION = 20;
  const DELAY = 5;

  it('renders no transform before delay', () => {
    const { getByTestId } = render(
      <Parallax from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0} depth={1}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    expect(element.style.transform).toBe('');
  });

  it('renders exact depth-multiplied transform at the end of duration', () => {
    const { getByTestId } = render(
      <Parallax from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={25} depth={0.5}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    // progress = 1. distance = 100. multiplier = 0.5 * 1. result = 50.
    expect(element.style.transform).toBe('translate(50px, 50px)');
  });

  it('produces no movement if depth is 0', () => {
    const { getByTestId } = render(
      <Parallax from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={15} depth={0}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    // 0 * anything = 0. If 0, it renders '' transform.
    expect(element.style.transform).toBe('');
  });

  it('scales correctly with intensity', () => {
    const { getByTestId } = render(
      <Parallax from={FROM} to={TO} delayInFrames={0} durationInFrames={DURATION} currentFrame={20} depth={1} intensity={2}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    // distance 100 * (depth 1 * intensity 2) = 200
    expect(element.style.transform).toBe('translate(200px, 200px)');
  });

  it('generates proportional offset during animation', () => {
    const { getByTestId } = render(
      <Parallax from={FROM} to={TO} delayInFrames={0} durationInFrames={20} currentFrame={10} easing="linear" depth={1}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    // halfway (10/20) -> 50
    expect(element.style.transform).toBe('translate(50px, 50px)');
  });

  it('filters by x axis', () => {
    const { getByTestId } = render(
      <Parallax axis="x" from={FROM} to={TO} delayInFrames={0} durationInFrames={20} currentFrame={20} depth={1}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    expect(element.style.transform).toBe('translate(100px, 0px)');
  });

  it('filters by y axis', () => {
    const { getByTestId } = render(
      <Parallax axis="y" from={FROM} to={TO} delayInFrames={0} durationInFrames={20} currentFrame={20} depth={1}>
        <div>Content</div>
      </Parallax>
    );
    const element = getByTestId('parallax-animation-wrapper');
    expect(element.style.transform).toBe('translate(0px, 100px)');
  });

  it('preserves children and renders wrapper div', () => {
    const { getByText } = render(
      <Parallax currentFrame={0}>
        <div>Testing children wrapper</div>
      </Parallax>
    );
    expect(getByText('Testing children wrapper')).toBeDefined();
  });
});

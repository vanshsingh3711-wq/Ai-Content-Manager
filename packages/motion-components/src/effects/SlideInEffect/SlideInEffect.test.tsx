import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SlideInEffect } from './SlideInEffect';

describe('SlideInEffect', () => {
  it('starts offset and hidden (if fade enabled) before delayInFrames', () => {
    const { getByTestId } = render(
      <SlideInEffect delayInFrames={10} currentFrame={5} direction="left" distance={100} opacityFrom={0} fade={true}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toContain('translate(-100px, 0px)');
  });

  it('reaches final state exactly at 0 translation at end frame', () => {
    const { getByTestId } = render(
      <SlideInEffect durationInFrames={20} delayInFrames={0} currentFrame={20} direction="bottom" distance={150} opacityTo={1} fade={true}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    expect(element.style.opacity).toBe('1');
    expect(element.style.transform).toContain('translate(0px, 0px)');
  });

  it('interpolates correctly during the animation', () => {
    // With linear easing, frame 10 out of 20 = 50%
    const { getByTestId } = render(
      <SlideInEffect durationInFrames={20} delayInFrames={0} currentFrame={10} direction="right" distance={200} easing="linear" fade={false}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    // fade=false means opacity is always 1
    expect(element.style.opacity).toBe('1');
    expect(element.style.transform).toContain('translate(100px, 0px)');
  });

  it('correctly maps direction "top" to -distance Y', () => {
    const { getByTestId } = render(
      <SlideInEffect currentFrame={0} direction="top" distance={100}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    expect(element.style.transform).toContain('translate(0px, -100px)');
  });

  it('correctly maps direction "bottom" to +distance Y', () => {
    const { getByTestId } = render(
      <SlideInEffect currentFrame={0} direction="bottom" distance={100}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    expect(element.style.transform).toContain('translate(0px, 100px)');
  });

  it('handles absolute positioning if x and y are provided', () => {
    const { getByTestId } = render(
      <SlideInEffect x={100} y={200} currentFrame={10}>
        <div>Test</div>
      </SlideInEffect>
    );
    const element = getByTestId('slide-in-effect');
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBe('100px');
    expect(element.style.top).toBe('200px');
  });
});

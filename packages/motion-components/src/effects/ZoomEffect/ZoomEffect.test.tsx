import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ZoomEffect } from './ZoomEffect';

describe('ZoomEffect', () => {
  it('renders at fromScale on frame 0', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={100} centerY={100} fromScale={1} toScale={2} delayInFrames={10} currentFrame={0} />
    );
    const scene = getByTestId('zoom-effect-scene');
    // Progress should be 0, so scale is 1
    // defaultCamX = 540, defaultCamY = 960 (based on 1080x1920 defaults)
    // transform should be translate(540px, 960px) scale(1) translate(-540px, -960px)
    expect(scene.style.transform).toContain('scale(1)');
    expect(scene.style.transform).toContain('translate(-540px, -960px)');
  });

  it('renders at toScale on final frame (mode="in")', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={100} centerY={200} fromScale={1} toScale={2} durationInFrames={30} delayInFrames={0} currentFrame={30} mode="in" />
    );
    const scene = getByTestId('zoom-effect-scene');
    // Progress is 1, scale is 2
    expect(scene.style.transform).toContain('scale(2)');
    // Camera should be at centerX/Y (100, 200)
    expect(scene.style.transform).toContain('translate(-100px, -200px)');
  });

  it('starts at toScale on frame 0 (mode="out")', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={100} centerY={200} fromScale={1} toScale={2} durationInFrames={30} delayInFrames={0} currentFrame={0} mode="out" />
    );
    const scene = getByTestId('zoom-effect-scene');
    // mode="out" means progress starts at 1
    expect(scene.style.transform).toContain('scale(2)');
    expect(scene.style.transform).toContain('translate(-100px, -200px)');
  });

  it('reaches toScale at mid frame (mode="in-out")', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={100} centerY={200} fromScale={1} toScale={2} durationInFrames={60} delayInFrames={0} currentFrame={30} mode="in-out" />
    );
    const scene = getByTestId('zoom-effect-scene');
    expect(scene.style.transform).toContain('scale(2)');
  });

  it('returns to fromScale on final frame (mode="in-out")', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={100} centerY={200} fromScale={1} toScale={2} durationInFrames={60} delayInFrames={0} currentFrame={60} mode="in-out" />
    );
    const scene = getByTestId('zoom-effect-scene');
    expect(scene.style.transform).toContain('scale(1)');
  });

  it('supports custom viewport dimensions', () => {
    const { getByTestId } = render(
      <ZoomEffect centerX={50} centerY={50} viewportWidth={400} viewportHeight={400} fromScale={1} toScale={2} durationInFrames={30} currentFrame={0} />
    );
    const container = getByTestId('zoom-effect-container');
    expect(container.style.width).toBe('400px');
    expect(container.style.height).toBe('400px');
    
    const scene = getByTestId('zoom-effect-scene');
    expect(scene.style.transform).toContain('translate(200px, 200px)');
    expect(scene.style.transform).toContain('translate(-200px, -200px)');
  });
});

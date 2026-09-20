import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TransitionWipeEffect } from './TransitionWipeEffect';

describe('TransitionWipeEffect', () => {
  it('hides Scene B completely at frame 0', () => {
    const { getByTestId } = render(
      <TransitionWipeEffect 
        currentFrame={0} 
        from={<div data-testid="scene-a" />} 
        to={<div data-testid="scene-b" />} 
      />
    );
    const sceneB = getByTestId('transition-scene-b');
    // Using our getClipPathStripe for 0, 0
    expect(sceneB.style.clipPath).toContain('polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)');
  });

  it('reveals Scene B completely at final frame', () => {
    const { getByTestId } = render(
      <TransitionWipeEffect 
        currentFrame={30} 
        durationInFrames={30}
        from={<div />} 
        to={<div />} 
      />
    );
    const sceneB = getByTestId('transition-scene-b');
    // Using our getClipPathStripe for 0, 100 on direction="left"
    expect(sceneB.style.clipPath).toContain('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)');
  });

  it('delays drawing until delayInFrames passes', () => {
    const { getByTestId } = render(
      <TransitionWipeEffect 
        currentFrame={5} 
        delayInFrames={10}
        from={<div />} 
        to={<div />} 
      />
    );
    const sceneB = getByTestId('transition-scene-b');
    expect(sceneB.style.clipPath).toContain('100%'); // Remains 0% width block at right edge
  });

  it('handles right wipe direction correctly in the middle', () => {
    const { getByTestId } = render(
      <TransitionWipeEffect 
        currentFrame={15} 
        durationInFrames={30}
        easing="linear"
        direction="right"
        from={<div />} 
        to={<div />} 
      />
    );
    const sceneB = getByTestId('transition-scene-b');
    // Right wipe goes 0 to 50
    expect(sceneB.style.clipPath).toContain('polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)');
  });

  it('renders solid layer during transition', () => {
    const { getByTestId } = render(
      <TransitionWipeEffect 
        currentFrame={15} 
        durationInFrames={30}
        style="solid"
        from={<div />} 
        to={<div />} 
      />
    );
    const solidLayer = getByTestId('transition-solid-layer');
    expect(solidLayer).toBeDefined();
  });

  it('removes solid layer at frame 0 and final frame', () => {
    const { queryByTestId, rerender } = render(
      <TransitionWipeEffect 
        currentFrame={0} 
        durationInFrames={30}
        style="solid"
        from={<div />} 
        to={<div />} 
      />
    );
    expect(queryByTestId('transition-solid-layer')).toBeNull();

    rerender(
      <TransitionWipeEffect 
        currentFrame={30} 
        durationInFrames={30}
        style="solid"
        from={<div />} 
        to={<div />} 
      />
    );
    expect(queryByTestId('transition-solid-layer')).toBeNull();
  });
});

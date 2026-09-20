import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BeforeAfterEffect } from './BeforeAfterEffect';

describe('BeforeAfterEffect', () => {
  it('hides after layer completely before delayInFrames', () => {
    const { getByTestId, queryByTestId } = render(
      <BeforeAfterEffect 
        delayInFrames={10} 
        currentFrame={5} 
        direction="horizontal"
        before={<div>Test</div>}
        after={<div>Test</div>}
      />
    );
    const afterLayer = getByTestId('after-layer');
    // 0% width clip-path
    expect(afterLayer.style.clipPath).toContain('0%');
    expect(afterLayer.style.clipPath).not.toContain('50%');
    
    // Divider should not show at 0%
    expect(queryByTestId('before-after-divider')).toBeNull();
  });

  it('reveals exactly 50% at middle frame with linear easing', () => {
    const { getByTestId } = render(
      <BeforeAfterEffect 
        durationInFrames={20} 
        delayInFrames={0} 
        currentFrame={10} 
        easing="linear" 
        direction="horizontal"
        before={<div>Test</div>}
        after={<div>Test</div>}
      />
    );
    const afterLayer = getByTestId('after-layer');
    expect(afterLayer.style.clipPath).toContain('50%');
    
    const divider = getByTestId('before-after-divider');
    expect(divider).not.toBeNull();
    expect(divider.style.left).toBe('50%');
  });

  it('reveals 100% exactly at end frame', () => {
    const { getByTestId, queryByTestId } = render(
      <BeforeAfterEffect 
        durationInFrames={30} 
        delayInFrames={0} 
        currentFrame={30} 
        direction="vertical"
        before={<div>Test</div>}
        after={<div>Test</div>}
      />
    );
    const afterLayer = getByTestId('after-layer');
    // Vertical clip path 100%
    expect(afterLayer.style.clipPath).toContain('100%');
    
    // Divider hides at 100%
    expect(queryByTestId('before-after-divider')).toBeNull();
  });

  it('shows custom labels when enabled', () => {
    const { getByText, queryByText } = render(
      <BeforeAfterEffect showLabels={true} labelBefore="Old UI" labelAfter="New UI" currentFrame={10} />
    );
    expect(getByText('Old UI')).not.toBeNull();
    expect(getByText('New UI')).not.toBeNull();
  });

  it('hides labels when showLabels is false', () => {
    const { queryByText } = render(
      <BeforeAfterEffect showLabels={false} labelBefore="Old UI" labelAfter="New UI" currentFrame={10} />
    );
    expect(queryByText('Old UI')).toBeNull();
    expect(queryByText('New UI')).toBeNull();
  });

  it('overrides frame timing if revealProgress is provided', () => {
    // delay is 100, frame is 0, but reveal is manually set to 0.75
    const { getByTestId } = render(
      <BeforeAfterEffect delayInFrames={100} currentFrame={0} revealProgress={0.75} direction="horizontal" />
    );
    const afterLayer = getByTestId('after-layer');
    expect(afterLayer.style.clipPath).toContain('75%');
  });
});

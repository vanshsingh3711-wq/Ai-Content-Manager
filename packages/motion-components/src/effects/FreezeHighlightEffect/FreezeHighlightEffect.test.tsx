import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FreezeHighlightEffect } from './FreezeHighlightEffect';

describe('FreezeHighlightEffect', () => {
  it('does not render overlay before delayInFrames', () => {
    const { queryByTestId } = render(
      <FreezeHighlightEffect currentFrame={0} delayInFrames={10} />
    );
    expect(queryByTestId('freeze-highlight-cutout')).toBeNull();
  });

  it('renders overlay during the effect duration', () => {
    const { getByTestId } = render(
      <FreezeHighlightEffect 
        currentFrame={15} 
        delayInFrames={10} 
        durationInFrames={20} 
        animation="instant" 
      />
    );
    const cutout = getByTestId('freeze-highlight-cutout');
    expect(cutout).toBeDefined();
    expect(cutout.style.opacity).toBe('0.7'); // Default overlayOpacity
    expect(cutout.style.boxShadow).toContain('9999px');
  });

  it('fades in the overlay gradually in fade mode', () => {
    const { getByTestId } = render(
      <FreezeHighlightEffect 
        currentFrame={5} 
        delayInFrames={0} 
        durationInFrames={20} // fadeFrames = 10
        animation="fade" 
        overlayOpacity={1}
      />
    );
    const cutout = getByTestId('freeze-highlight-cutout');
    expect(cutout.style.opacity).toBe('0.5'); // Halfway through 10-frame fade
  });

  it('removes overlay completely after duration finishes', () => {
    const { queryByTestId } = render(
      <FreezeHighlightEffect 
        currentFrame={40} 
        delayInFrames={10} 
        durationInFrames={20} 
      />
    );
    expect(queryByTestId('freeze-highlight-cutout')).toBeNull();
  });

  it('applies padding correctly to the cutout via inset', () => {
    const { getByTestId } = render(
      <FreezeHighlightEffect 
        currentFrame={15} 
        delayInFrames={0} 
        durationInFrames={30} 
        padding={25}
      />
    );
    const cutout = getByTestId('freeze-highlight-cutout');
    expect(cutout.style.left).toBe('-25px');
    expect(cutout.style.right).toBe('-25px');
    expect(cutout.style.top).toBe('-25px');
    expect(cutout.style.bottom).toBe('-25px');
  });

  it('includes glow in boxShadow when enabled', () => {
    const { getByTestId } = render(
      <FreezeHighlightEffect 
        currentFrame={15} 
        durationInFrames={30} 
        glow={true}
        glowRadius={42}
        glowColor="red"
      />
    );
    const cutout = getByTestId('freeze-highlight-cutout');
    expect(cutout.style.boxShadow).toContain('0 0 42px 0px red');
    expect(cutout.style.boxShadow).toContain('0 0 0 9999px rgba(0, 0, 0, 1)');
  });
});

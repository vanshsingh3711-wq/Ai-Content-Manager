import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ImpactEffect } from './ImpactEffect';

describe('ImpactEffect', () => {
  it('starts at scaleFrom and opacityFrom at frame 0', () => {
    const { getByTestId } = render(
      <ImpactEffect currentFrame={0} delayInFrames={0} scaleFrom={0.8} opacityFrom={0} />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toContain('scale(0.8)');
  });

  it('reaches exact scalePeak and opacityPeak around 30% of timeline (with linear)', () => {
    const { getByTestId } = render(
      <ImpactEffect 
        currentFrame={3} 
        durationInFrames={10} 
        delayInFrames={0} 
        easing="linear"
        scalePeak={1.5} 
        opacityPeak={0.9} 
      />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.opacity).toBe('0.9');
    expect(element.style.transform).toContain('scale(1.5)');
  });

  it('settles at scaleTo and opacityTo exactly at final frame', () => {
    const { getByTestId } = render(
      <ImpactEffect 
        currentFrame={20} 
        durationInFrames={20} 
        delayInFrames={0} 
        scaleTo={1} 
        opacityTo={1} 
      />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.opacity).toBe('1');
    expect(element.style.transform).toContain('scale(1)');
  });

  it('delays drawing until delayInFrames passes', () => {
    const { getByTestId } = render(
      <ImpactEffect 
        currentFrame={5} 
        delayInFrames={10}
        scaleFrom={0.5}
      />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.transform).toContain('scale(0.5)');
  });

  it('applies blur if configured', () => {
    const { getByTestId } = render(
      <ImpactEffect 
        currentFrame={3} 
        durationInFrames={10} 
        easing="linear"
        blurFrom={4}
        blurPeak={10}
        blurTo={0}
      />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.filter).toContain('blur(10px)');
  });

  it('applies glow around peak', () => {
    const { getByTestId } = render(
      <ImpactEffect 
        currentFrame={3} 
        durationInFrames={10} 
        easing="linear"
        glow={true}
        glowRadius={20}
        glowColor="red"
      />
    );
    const element = getByTestId('impact-effect');
    expect(element.style.filter).toContain('drop-shadow(0px 0px 20px red)');
  });

  it('applies deterministic shake that settles perfectly', () => {
    const { getByTestId, rerender } = render(
      <ImpactEffect 
        currentFrame={5} // middle of shake
        durationInFrames={20} 
        easing="linear"
        shake={true}
        shakeAmount={10}
      />
    );
    const element = getByTestId('impact-effect');
    // It should have translate in the transform string
    expect(element.style.transform).toMatch(/translate\(.*\)/);

    // Re-render at end
    rerender(
      <ImpactEffect 
        currentFrame={20} 
        durationInFrames={20} 
        shake={true}
        shakeAmount={10}
      />
    );
    // At end, translate is 0, 0
    expect(element.style.transform).toContain('translate(0px, 0px)');
  });
});

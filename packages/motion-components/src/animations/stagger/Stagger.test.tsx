import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Stagger } from './Stagger';

// A mock motion primitive to test prop injection
const MockPrimitive = ({ delayInFrames = 0, currentFrame = 0, id }: any) => (
  <div data-testid={`mock-${id}`} data-delay={delayInFrames} data-frame={currentFrame}>
    Content
  </div>
);

describe('Stagger Primitive', () => {
  it('injects linear stagger delays correctly (forward)', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={5} staggerInFrames={10} direction="forward">
        <MockPrimitive id="0" />
        <MockPrimitive id="1" />
        <MockPrimitive id="2" />
      </Stagger>
    );
    
    // Total children = 3
    // index 0 -> base delay = 5
    // index 1 -> base delay + 10 = 15
    // index 2 -> base delay + 20 = 25
    
    expect(getByTestId('mock-0').getAttribute('data-delay')).toBe('5');
    expect(getByTestId('mock-1').getAttribute('data-delay')).toBe('15');
    expect(getByTestId('mock-2').getAttribute('data-delay')).toBe('25');
  });

  it('injects linear stagger delays correctly (reverse)', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={5} staggerInFrames={10} direction="reverse">
        <MockPrimitive id="0" />
        <MockPrimitive id="1" />
        <MockPrimitive id="2" />
      </Stagger>
    );
    
    // reverse direction
    // index 0 -> maxStagger (20) + base (5) = 25
    // index 1 -> maxStagger (10) + base (5) = 15
    // index 2 -> maxStagger (0) + base (5) = 5
    
    expect(getByTestId('mock-0').getAttribute('data-delay')).toBe('25');
    expect(getByTestId('mock-1').getAttribute('data-delay')).toBe('15');
    expect(getByTestId('mock-2').getAttribute('data-delay')).toBe('5');
  });

  it('adds stagger delay to existing child delay', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={5} staggerInFrames={10}>
        <MockPrimitive id="0" delayInFrames={100} />
        <MockPrimitive id="1" delayInFrames={200} />
      </Stagger>
    );
    
    // index 0 -> base (5) + stagger (0) + existing (100) = 105
    // index 1 -> base (5) + stagger (10) + existing (200) = 215
    expect(getByTestId('mock-0').getAttribute('data-delay')).toBe('105');
    expect(getByTestId('mock-1').getAttribute('data-delay')).toBe('215');
  });

  it('handles zero children', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10}>
      </Stagger>
    );
    const wrapper = getByTestId('stagger-wrapper');
    expect(wrapper.children.length).toBe(0);
  });

  it('handles one child', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={10} staggerInFrames={50}>
        <MockPrimitive id="0" />
      </Stagger>
    );
    // Base delay is 10. Stagger should be 0 since it's the only child
    expect(getByTestId('mock-0').getAttribute('data-delay')).toBe('10');
  });

  it('recursively injects delay into nested primitives', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={5} staggerInFrames={10}>
        <div>
          <MockPrimitive id="0" />
        </div>
        <div>
          <MockPrimitive id="1" />
        </div>
      </Stagger>
    );
    
    // The top level divs are indexes 0 and 1.
    // Div 0 gets stagger 0. It recurses to MockPrimitive 0, which gets total 5.
    // Div 1 gets stagger 10. It recurses to MockPrimitive 1, which gets total 15.
    expect(getByTestId('mock-0').getAttribute('data-delay')).toBe('5');
    expect(getByTestId('mock-1').getAttribute('data-delay')).toBe('15');
  });

  it('does not inject delay into DOM primitives', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={5} staggerInFrames={10}>
        <div data-testid="dom-div" />
      </Stagger>
    );
    const div = getByTestId('dom-div');
    expect(div.getAttribute('delayInFrames')).toBeNull(); // Should not leak
  });

  it('supports easing for the stagger timing', () => {
    const { getByTestId } = render(
      <Stagger currentFrame={10} delayInFrames={0} staggerInFrames={10} easing="easeIn">
        <MockPrimitive id="0" />
        <MockPrimitive id="1" />
        <MockPrimitive id="2" />
        <MockPrimitive id="3" />
      </Stagger>
    );
    
    // total = 4. maxStaggerDelay = 30.
    // Index 0: progress 0 -> eased 0 -> 0 delay
    // Index 1: progress 0.333 -> easeIn(0.333) -> ~0.111 -> delay ~3.33 (Math.round -> 3)
    // Index 2: progress 0.666 -> easeIn(0.666) -> ~0.444 -> delay ~13.33 (Math.round -> 13)
    // Index 3: progress 1 -> eased 1 -> 30 delay
    // Without easeIn, linear would be: 0, 10, 20, 30. 
    // With easeIn, it stays closer to 0 longer, then speeds up.
    
    const d0 = parseInt(getByTestId('mock-0').getAttribute('data-delay') || '0', 10);
    const d1 = parseInt(getByTestId('mock-1').getAttribute('data-delay') || '0', 10);
    const d2 = parseInt(getByTestId('mock-2').getAttribute('data-delay') || '0', 10);
    const d3 = parseInt(getByTestId('mock-3').getAttribute('data-delay') || '0', 10);

    expect(d0).toBe(0);
    expect(d3).toBe(30);
    
    // Linear would be d1=10, d2=20
    // easeIn makes the early ones smaller (it's exponential: t*t)
    expect(d1).toBeLessThan(10);
    expect(d2).toBeLessThan(20);
  });
});

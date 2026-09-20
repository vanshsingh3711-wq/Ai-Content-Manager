import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Draw } from './Draw';

describe('Draw Primitive', () => {
  const FROM = 0;
  const TO = 1;
  const DURATION = 10;
  const DELAY = 5;

  it('injects pathLength and strokeDash offset correctly on children (before start)', () => {
    const { getByTestId } = render(
      <Draw mode="path" direction="forward" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0}>
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const path = getByTestId('target-path');
    expect(path.getAttribute('pathLength')).toBe('1');
    expect(path.getAttribute('stroke-dasharray')).toBe('1 1');
    expect(path.getAttribute('stroke-dashoffset')).toBe('1'); // fully hidden
  });

  it('injects pathLength and strokeDash offset correctly on children (after end)', () => {
    const { getByTestId } = render(
      <Draw mode="path" direction="forward" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={20}>
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const path = getByTestId('target-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('0'); // fully visible
  });

  it('interpolates middle frame with linear easing', () => {
    const { getByTestId } = render(
      <Draw mode="path" direction="forward" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const path = getByTestId('target-path');
    // At frame 10 (halfway), progress is 0.5. strokeDashoffset = 1 - 0.5 = 0.5
    expect(path.getAttribute('stroke-dashoffset')).toBe('0.5');
  });

  it('handles reverse mode correctly (starts visible, ends hidden)', () => {
    const { getByTestId, rerender } = render(
      <Draw mode="path" direction="reverse" from={0} to={1} delayInFrames={0} durationInFrames={10} currentFrame={0} easing="linear">
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const path = getByTestId('target-path');
    expect(path.getAttribute('stroke-dashoffset')).toBe('0'); // fully visible at start

    rerender(
      <Draw mode="path" direction="reverse" from={0} to={1} delayInFrames={0} durationInFrames={10} currentFrame={10} easing="linear">
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    expect(path.getAttribute('stroke-dashoffset')).toBe('1'); // fully hidden at end
  });

  it('renders SVG filter inline when in hand mode', () => {
    const { container, getByTestId } = render(
      <Draw mode="hand" direction="forward" from={FROM} to={TO} currentFrame={10}>
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const wrapper = getByTestId('draw-animation-wrapper');
    // It should have a filter style
    expect(wrapper.style.filter).toContain('url(#');
    
    // There should be a filter definition in the DOM
    const filter = container.querySelector('filter');
    expect(filter).not.toBeNull();
  });

  it('preserves children and renders wrapper div without filter in path mode', () => {
    const { container, getByTestId } = render(
      <Draw mode="path" from={FROM} to={TO} currentFrame={0}>
        <svg>
          <path data-testid="target-path" d="M10 10" />
        </svg>
      </Draw>
    );
    const wrapper = getByTestId('draw-animation-wrapper');
    expect(wrapper.style.filter).toBe('');
    const filter = container.querySelector('filter');
    expect(filter).toBeNull();
  });

  it('recursively injects props into nested SVGs', () => {
    const { getByTestId } = render(
      <Draw mode="path" from={FROM} to={TO} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={10} easing="linear">
        <svg>
          <g>
            <path data-testid="nested-path" d="M10 10" />
            <circle data-testid="nested-circle" cx="10" />
          </g>
        </svg>
      </Draw>
    );
    const path = getByTestId('nested-path');
    const circle = getByTestId('nested-circle');
    
    expect(path.getAttribute('stroke-dashoffset')).toBe('0.5');
    expect(circle.getAttribute('stroke-dashoffset')).toBe('0.5');
  });
});

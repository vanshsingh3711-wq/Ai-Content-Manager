import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneScrolling } from './PhoneScrolling';

describe('PhoneScrolling', () => {
  it('renders at fromOffset at frame 0', () => {
    const { getByTestId } = render(
      <PhoneScrolling currentFrame={0} scroll={{ fromOffset: 0, toOffset: 100, durationInFrames: 30 }} direction="up">
        <div>Content</div>
      </PhoneScrolling>
    );
    const content = getByTestId('scrolling-content');
    expect(content.style.transform).toBe('translateY(0px)');
  });

  it('renders at toOffset at final frame', () => {
    const { getByTestId } = render(
      <PhoneScrolling currentFrame={30} scroll={{ fromOffset: 0, toOffset: 100, durationInFrames: 30 }} direction="up">
        <div>Content</div>
      </PhoneScrolling>
    );
    const content = getByTestId('scrolling-content');
    expect(content.style.transform).toBe('translateY(-100px)'); // direction='up' makes it negative
  });

  it('translates positive when direction is down', () => {
    const { getByTestId } = render(
      <PhoneScrolling currentFrame={30} scroll={{ fromOffset: 0, toOffset: 100, durationInFrames: 30 }} direction="down">
        <div>Content</div>
      </PhoneScrolling>
    );
    const content = getByTestId('scrolling-content');
    expect(content.style.transform).toBe('translateY(100px)');
  });

  it('clips content (overflow hidden)', () => {
    const { getByTestId } = render(
      <PhoneScrolling>
        <div>Content</div>
      </PhoneScrolling>
    );
    const container = getByTestId('phone-scrolling');
    expect(container.style.overflow).toBe('hidden');
  });

  it('shows scroll indicator when enabled', () => {
    const { getByTestId } = render(
      <PhoneScrolling showIndicator currentFrame={15} scroll={{ durationInFrames: 30 }}>
        <div>Content</div>
      </PhoneScrolling>
    );
    expect(getByTestId('scroll-indicator')).toBeDefined();
  });

  it('hides scroll indicator when disabled', () => {
    const { queryByTestId } = render(
      <PhoneScrolling showIndicator={false}>
        <div>Content</div>
      </PhoneScrolling>
    );
    expect(queryByTestId('scroll-indicator')).toBeNull();
  });

  it('applies custom dimensions and absolute positioning if x/y provided', () => {
    const { getByTestId } = render(
      <PhoneScrolling x={10} y={20} width={200} height={300}>
        <div>Content</div>
      </PhoneScrolling>
    );
    const container = getByTestId('phone-scrolling');
    expect(container.style.position).toBe('absolute');
    expect(container.style.left).toBe('10px');
    expect(container.style.top).toBe('20px');
    expect(container.style.width).toBe('200px');
    expect(container.style.height).toBe('300px');
  });
});

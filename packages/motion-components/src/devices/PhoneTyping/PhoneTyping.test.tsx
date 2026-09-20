import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneTyping } from './PhoneTyping';

describe('PhoneTyping', () => {
  it('renders empty text at frame 0', () => {
    const { getByTestId } = render(
      <PhoneTyping text="Hello" currentFrame={0} typing={{ durationInFrames: 30, startDelayInFrames: 10 }} />
    );
    expect(getByTestId('typing-text').textContent).toBe('');
  });

  it('renders partial text in the middle of animation', () => {
    const { getByTestId } = render(
      <PhoneTyping text="Hello" currentFrame={25} typing={{ durationInFrames: 30, startDelayInFrames: 10 }} />
    );
    const text = getByTestId('typing-text').textContent;
    expect(text?.length).toBeGreaterThan(0);
    expect(text?.length).toBeLessThan(5);
  });

  it('renders full text at final frame', () => {
    const { getByTestId } = render(
      <PhoneTyping text="Hello" currentFrame={40} typing={{ durationInFrames: 30, startDelayInFrames: 10 }} />
    );
    expect(getByTestId('typing-text').textContent).toBe('Hello');
  });

  it('handles empty text correctly', () => {
    const { getByTestId } = render(
      <PhoneTyping text="" currentFrame={20} />
    );
    expect(getByTestId('typing-text').textContent).toBe('');
  });

  it('hides cursor when disabled', () => {
    const { getByTestId } = render(
      <PhoneTyping text="A" currentFrame={0} cursor={{ visible: false }} />
    );
    expect(getByTestId('typing-cursor').style.opacity).toBe('0');
  });

  it('blinks cursor based on frame', () => {
    // 0 / 15 % 2 == 0 -> visible
    const res1 = render(<PhoneTyping text="A" currentFrame={0} cursor={{ blink: true, blinkRateInFrames: 15 }} />);
    expect(res1.getByTestId('typing-cursor').style.opacity).toBe('1');
    res1.unmount();

    // 16 / 15 = 1 % 2 == 1 -> hidden
    const res2 = render(<PhoneTyping text="A" currentFrame={16} cursor={{ blink: true, blinkRateInFrames: 15 }} />);
    expect(res2.getByTestId('typing-cursor').style.opacity).toBe('0');
  });

  it('applies custom dimensions and font size', () => {
    const { getByTestId } = render(
      <PhoneTyping text="A" x={10} y={20} width={200} fontSize={24} currentFrame={0} />
    );
    const container = getByTestId('phone-typing');
    expect(container.style.left).toBe('10px');
    expect(container.style.top).toBe('20px');
    expect(container.style.width).toBe('200px');
    expect(container.style.fontSize).toBe('24px');
  });
});

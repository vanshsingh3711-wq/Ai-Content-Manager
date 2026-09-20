import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneChat } from './PhoneChat';
import { PhoneChatMessage } from './PhoneChat.types';

describe('PhoneChat', () => {
  const mockMessages: PhoneChatMessage[] = [
    { id: '1', text: 'Hello', sender: 'left', delayInFrames: 30 },
    { id: '2', text: 'Hi there', sender: 'right', delayInFrames: 30 },
  ];

  it('renders no messages at frame 0 (before delay)', () => {
    const { queryByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={0} />
    );
    expect(queryByTestId('msg-1')).toBeNull();
    expect(queryByTestId('msg-2')).toBeNull();
  });

  it('renders typing indicator during delay', () => {
    const { getByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={15} />
    );
    expect(getByTestId('typing-indicator')).toBeDefined();
  });

  it('renders first message when its frame is reached', () => {
    // 0 + 30 = 30
    const { getByTestId, queryByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={35} />
    );
    expect(getByTestId('msg-1')).toBeDefined();
    expect(getByTestId('msg-1').textContent).toBe('Hello');
    expect(queryByTestId('msg-2')).toBeNull();
  });

  it('renders both messages eventually', () => {
    // 30 (delay 1) + 15 (duration 1) + 30 (delay 2) = 75
    const { getByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={90} />
    );
    expect(getByTestId('msg-1')).toBeDefined();
    expect(getByTestId('msg-2')).toBeDefined();
  });

  it('aligns left and right messages correctly', () => {
    const { getByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={90} />
    );
    const msg1 = getByTestId('msg-1');
    const msg2 = getByTestId('msg-2');
    
    expect(msg1.style.alignSelf).toBe('flex-start');
    expect(msg2.style.alignSelf).toBe('flex-end');
  });

  it('uses clipping / flex-end to manage overflow automatically', () => {
    const { getByTestId } = render(
      <PhoneChat messages={mockMessages} currentFrame={90} />
    );
    const container = getByTestId('phone-chat');
    expect(container.style.overflow).toBe('hidden');
    expect(container.style.justifyContent).toBe('flex-end');
  });

  it('applies custom dimensions and absolute positioning if provided', () => {
    const { getByTestId } = render(
      <PhoneChat messages={mockMessages} x={10} y={20} width={300} height={400} currentFrame={90} />
    );
    const container = getByTestId('phone-chat');
    expect(container.style.position).toBe('absolute');
    expect(container.style.left).toBe('10px');
    expect(container.style.width).toBe('300px');
    expect(container.style.height).toBe('400px');
  });
});

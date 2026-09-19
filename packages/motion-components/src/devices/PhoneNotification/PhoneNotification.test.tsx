import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneNotification } from './PhoneNotification';

describe('PhoneNotification', () => {
  it('renders correctly at frame 0 (hidden due to animation)', () => {
    const { getByTestId } = render(
      <PhoneNotification title="Payment successful" currentFrame={0} animation={{ enter: 'slideDown', durationInFrames: 30 }} />
    );
    const container = getByTestId('phone-notification');
    expect(container.style.opacity).toBe('0');
  });

  it('renders correctly at final frame (fully visible)', () => {
    const { getByTestId } = render(
      <PhoneNotification title="Payment successful" currentFrame={30} animation={{ enter: 'slideDown', durationInFrames: 30 }} />
    );
    const container = getByTestId('phone-notification');
    expect(container.style.opacity).toBe('1');
    expect(container.style.transform).toBe('translateY(0px) scale(1)');
  });

  it('renders title and message', () => {
    const { getByTestId } = render(
      <PhoneNotification title="Test Title" message="Test Message" currentFrame={30} />
    );
    expect(getByTestId('notification-title').textContent).toBe('Test Title');
    expect(getByTestId('notification-message').textContent).toBe('Test Message');
  });

  it('renders only title if no message provided', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneNotification title="Test Title Only" currentFrame={30} />
    );
    expect(getByTestId('notification-title').textContent).toBe('Test Title Only');
    expect(queryByTestId('notification-message')).toBeNull();
  });

  it('renders icon if provided', () => {
    const { getByTestId } = render(
      <PhoneNotification title="With Icon" icon={<span>🔔</span>} currentFrame={30} />
    );
    expect(getByTestId('notification-icon').textContent).toBe('🔔');
  });

  it('applies custom dimensions and styling', () => {
    const { getByTestId } = render(
      <PhoneNotification title="Custom" width={300} style={{ background: '#ff0000', borderRadius: 5 }} currentFrame={30} />
    );
    const container = getByTestId('phone-notification');
    expect(container.style.width).toBe('300px');
    // jsdom rgb conversion
    expect(container.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(container.style.borderRadius).toBe('5px');
  });

  it('handles different animation types', () => {
    const { getByTestId } = render(
      <PhoneNotification title="Scale Anim" animation={{ enter: 'scale', durationInFrames: 30 }} currentFrame={15} />
    );
    const container = getByTestId('phone-notification');
    expect(container.style.transform).toContain('scale');
  });
});

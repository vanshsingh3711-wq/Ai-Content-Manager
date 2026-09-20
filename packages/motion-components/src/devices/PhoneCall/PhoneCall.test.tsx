import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneCall } from './PhoneCall';

describe('PhoneCall', () => {
  it('renders correctly at frame 0 (calling)', () => {
    const { getByTestId } = render(
      <PhoneCall contactName="Alex" currentFrame={0} />
    );
    expect(getByTestId('contact-name').textContent).toBe('Alex');
    expect(getByTestId('call-status').textContent).toBe('Calling...');
    expect(getByTestId('end-call-btn')).toBeDefined();
  });

  it('renders connected state with correct timer based on frames', () => {
    // default: calling is 60 frames. So at 60 it should be 00:00. At 90 (30fps) it should be 00:01
    const { getByTestId } = render(
      <PhoneCall currentFrame={90} fps={30} />
    );
    expect(getByTestId('call-status').textContent).toBe('00:01');
  });

  it('renders ended state based on frames', () => {
    // 60 + 120 = 180 (start of ended)
    const { getByTestId, queryByTestId } = render(
      <PhoneCall currentFrame={180} />
    );
    expect(getByTestId('call-status').textContent).toBe('Call Ended');
    expect(queryByTestId('end-call-btn')).toBeNull(); // Controls hide on end
  });

  it('allows overriding status', () => {
    const { getByTestId } = render(
      <PhoneCall status="missed" currentFrame={0} />
    );
    expect(getByTestId('call-status').textContent).toBe('Missed Call');
  });

  it('allows overriding status to connected and calculates timer', () => {
    // If status is connected, the timer starts from 0 at currentFrame 0
    const { getByTestId } = render(
      <PhoneCall status="connected" currentFrame={60} fps={30} />
    );
    expect(getByTestId('call-status').textContent).toBe('00:02');
  });
});

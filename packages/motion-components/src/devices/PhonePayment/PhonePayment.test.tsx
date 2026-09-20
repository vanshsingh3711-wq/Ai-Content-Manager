import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhonePayment } from './PhonePayment';

describe('PhonePayment', () => {
  it('renders correctly at frame 0 (idle)', () => {
    const { getByTestId, queryByTestId } = render(
      <PhonePayment amount="1,500" currentFrame={0} />
    );
    expect(getByTestId('pay-button')).toBeDefined();
    expect(queryByTestId('processing-state')).toBeNull();
    expect(queryByTestId('result-state')).toBeNull();
  });

  it('renders amount and recipient correctly', () => {
    const { getByTestId } = render(
      <PhonePayment amount="1,500" currency="₹" recipient="Amazon" currentFrame={0} />
    );
    expect(getByTestId('payment-amount').textContent).toContain('₹');
    expect(getByTestId('payment-amount').textContent).toContain('1,500');
    expect(getByTestId('recipient-name').textContent).toContain('Amazon');
  });

  it('enters processing state based on animation frames', () => {
    // idle 30 + tap 30 = 60
    const { getByTestId, queryByTestId } = render(
      <PhonePayment amount="1,500" currentFrame={65} />
    );
    expect(getByTestId('processing-state')).toBeDefined();
    expect(queryByTestId('pay-button')).toBeNull();
  });

  it('enters success state based on animation frames', () => {
    // idle 30 + tap 30 + processing 60 = 120
    const { getByTestId, queryByTestId } = render(
      <PhonePayment amount="1,500" currentFrame={130} />
    );
    expect(getByTestId('result-state')).toBeDefined();
    expect(getByTestId('result-state').textContent).toContain('Payment Successful');
    expect(queryByTestId('processing-state')).toBeNull();
  });

  it('enters error state correctly', () => {
    const { getByTestId } = render(
      <PhonePayment amount="1,500" status="error" currentFrame={130} />
    );
    expect(getByTestId('result-state')).toBeDefined();
    expect(getByTestId('result-state').textContent).toContain('Payment Failed');
  });

  it('renders PhoneTap internally', () => {
    const { getByTestId } = render(
      <PhonePayment amount="1,500" currentFrame={45} />
    );
    expect(getByTestId('phone-tap')).toBeDefined();
  });

  it('applies custom dimensions', () => {
    const { getByTestId } = render(
      <PhonePayment amount="1,500" width={300} height={500} currentFrame={0} />
    );
    const container = getByTestId('phone-payment');
    expect(container.style.width).toBe('300px');
    expect(container.style.height).toBe('500px');
  });
});

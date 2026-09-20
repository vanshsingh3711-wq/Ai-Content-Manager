import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneBankTransfer } from './PhoneBankTransfer';

describe('PhoneBankTransfer', () => {
  it('renders correctly at frame 0 (idle)', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneBankTransfer amount="5,000" currentFrame={0} />
    );
    expect(getByTestId('transfer-button')).toBeDefined();
    expect(queryByTestId('processing-state')).toBeNull();
    expect(queryByTestId('result-state')).toBeNull();
  });

  it('renders amount, sender and recipient correctly', () => {
    const { getByTestId } = render(
      <PhoneBankTransfer amount="5,000" currency="₹" recipient="Alex" senderAccount="•••• 4821" currentFrame={0} />
    );
    expect(getByTestId('transfer-amount').textContent).toContain('₹5,000');
    expect(getByTestId('recipient-name').textContent).toContain('Alex');
    expect(getByTestId('sender-account').textContent).toContain('•••• 4821');
  });

  it('enters processing state based on animation frames', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneBankTransfer amount="5,000" currentFrame={65} />
    );
    expect(getByTestId('processing-state')).toBeDefined();
    expect(queryByTestId('transfer-button')).toBeNull();
  });

  it('enters success state based on animation frames', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneBankTransfer amount="5,000" currentFrame={130} />
    );
    expect(getByTestId('result-state')).toBeDefined();
    expect(getByTestId('result-state').textContent).toContain('Transfer Successful');
    expect(queryByTestId('processing-state')).toBeNull();
  });

  it('enters error state correctly', () => {
    const { getByTestId } = render(
      <PhoneBankTransfer amount="5,000" status="error" currentFrame={130} />
    );
    expect(getByTestId('result-state')).toBeDefined();
    expect(getByTestId('result-state').textContent).toContain('Transfer Failed');
  });

  it('renders PhoneTap internally', () => {
    const { getByTestId } = render(
      <PhoneBankTransfer amount="5,000" currentFrame={45} />
    );
    expect(getByTestId('phone-tap')).toBeDefined();
  });

  it('applies custom dimensions', () => {
    const { getByTestId } = render(
      <PhoneBankTransfer amount="5,000" width={300} height={500} currentFrame={0} />
    );
    const container = getByTestId('phone-bank-transfer');
    expect(container.style.width).toBe('300px');
    expect(container.style.height).toBe('500px');
  });
});

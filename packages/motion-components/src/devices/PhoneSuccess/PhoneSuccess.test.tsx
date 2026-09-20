import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneSuccess } from './PhoneSuccess';

describe('PhoneSuccess', () => {
  it('renders correctly with given static text data', () => {
    const { getByTestId } = render(
      <PhoneSuccess 
        title="Payment Successful" 
        message="Thank you for your purchase."
        currentFrame={100} // End of animation
      />
    );
    expect(getByTestId('success-title').textContent).toBe('Payment Successful');
    expect(getByTestId('success-message').textContent).toBe('Thank you for your purchase.');
  });

  it('renders default icon when none is provided', () => {
    const { getByTestId } = render(
      <PhoneSuccess currentFrame={100} />
    );
    // Should have an SVG checkmark inside
    expect(getByTestId('success-icon').innerHTML).toContain('svg');
  });

  it('renders custom icon when provided', () => {
    const { getByTestId } = render(
      <PhoneSuccess 
        currentFrame={100}
        icon={<div data-testid="custom-icon">Custom</div>}
      />
    );
    expect(getByTestId('custom-icon')).toBeDefined();
  });

  it('animates elements progressively based on currentFrame (frame 0)', () => {
    const { getByTestId } = render(<PhoneSuccess title="T" message="M" currentFrame={0} />);
    expect(getByTestId('success-icon').style.opacity).toBe('1'); 
    expect(getByTestId('success-icon').style.transform).toBe('scale(0)');
    expect(getByTestId('success-title').style.opacity).toBe('0');
    expect(getByTestId('success-message').style.opacity).toBe('0');
  });

  it('animates elements progressively based on currentFrame (frame 30)', () => {
    const { getByTestId } = render(<PhoneSuccess title="T" message="M" currentFrame={30} />);
    expect(getByTestId('success-icon').style.transform).toBe('scale(1)');
    expect(parseFloat(getByTestId('success-title').style.opacity)).toBeGreaterThanOrEqual(0);
  });

  it('animates elements progressively based on currentFrame (frame 60)', () => {
    const { getByTestId } = render(<PhoneSuccess title="T" message="M" currentFrame={60} />);
    expect(getByTestId('success-icon').style.transform).toBe('scale(1)');
    expect(getByTestId('success-title').style.opacity).toBe('1');
    expect(getByTestId('success-message').style.opacity).toBe('1');
  });

  it('can use custom animation durations', () => {
    const { getByTestId } = render(
      <PhoneSuccess 
        title="T" 
        currentFrame={60} // Usually done, but we'll delay it
        animation={{
          startDelayInFrames: 100
        }}
      />
    );
    // Still frame 60, but delay is 100, so nothing started
    expect(getByTestId('success-icon').style.transform).toBe('scale(0)');
    expect(getByTestId('success-title').style.opacity).toBe('0');
  });
});

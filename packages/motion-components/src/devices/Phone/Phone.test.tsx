import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Phone } from './Phone';

describe('Phone', () => {
  it('renders correctly at frame 0 (hidden due to entrance animation)', () => {
    const { getByTestId } = render(
      <Phone currentFrame={0} animation={{ enter: 'fade', durationInFrames: 30 }} />
    );
    const container = getByTestId('phone-container');
    expect(container.style.opacity).toBe('0');
  });

  it('renders correctly at final frame (fully visible)', () => {
    const { getByTestId } = render(
      <Phone currentFrame={30} animation={{ enter: 'fade', durationInFrames: 30 }} />
    );
    const container = getByTestId('phone-container');
    expect(container.style.opacity).toBe('1');
  });

  it('renders screen content correctly', () => {
    const { getByText } = render(
      <Phone currentFrame={30}>
        <div>Banking App Content</div>
      </Phone>
    );
    expect(getByText('Banking App Content')).toBeDefined();
  });

  it('handles empty screen content', () => {
    const { getByTestId } = render(
      <Phone currentFrame={30} />
    );
    expect(getByTestId('phone-screen').childNodes.length).toBe(0);
  });

  it('scales correctly to different dimensions', () => {
    const { getByTestId } = render(
      <Phone width={500} height={1000} currentFrame={30} />
    );
    const container = getByTestId('phone-container');
    expect(container.style.width).toBe('500px');
    expect(container.style.height).toBe('1000px');
  });

  it('applies custom styling correctly', () => {
    const { getByTestId } = render(
      <Phone currentFrame={30} style={{ screenColor: '#ff0000' }} />
    );
    const screen = getByTestId('phone-screen');
    // Using simple color matching, jsdom converts hex to rgb for inline styles
    expect(screen.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});

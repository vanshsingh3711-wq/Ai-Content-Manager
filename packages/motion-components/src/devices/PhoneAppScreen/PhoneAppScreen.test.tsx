import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneAppScreen } from './PhoneAppScreen';

describe('PhoneAppScreen', () => {
  it('renders correctly at frame 0 (hidden)', () => {
    const { getByTestId } = render(
      <PhoneAppScreen currentFrame={0} animation={{ enter: 'fade', durationInFrames: 30 }} />
    );
    const screen = getByTestId('phone-app-screen');
    expect(screen.style.opacity).toBe('0');
  });

  it('renders correctly at final frame', () => {
    const { getByTestId } = render(
      <PhoneAppScreen currentFrame={30} animation={{ enter: 'fade', durationInFrames: 30 }} />
    );
    const screen = getByTestId('phone-app-screen');
    expect(screen.style.opacity).toBe('1');
  });

  it('renders header title and subtitle', () => {
    const { getByTestId } = render(
      <PhoneAppScreen 
        header={{ title: 'Finance App', subtitle: 'v1.0' }} 
        currentFrame={30} 
      />
    );
    expect(getByTestId('header-title').textContent).toBe('Finance App');
    expect(getByTestId('header-subtitle').textContent).toBe('v1.0');
  });

  it('renders back button if enabled', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneAppScreen 
        header={{ showBackButton: true }} 
        currentFrame={30} 
      />
    );
    expect(getByTestId('back-button')).toBeDefined();
    expect(queryByTestId('menu-button')).toBeNull();
  });

  it('renders custom children', () => {
    const { getByText } = render(
      <PhoneAppScreen currentFrame={30}>
        <div>Banking Layout</div>
      </PhoneAppScreen>
    );
    expect(getByText('Banking Layout')).toBeDefined();
  });

  it('handles empty children cleanly', () => {
    const { getByTestId } = render(<PhoneAppScreen currentFrame={30} />);
    const contentArea = getByTestId('app-content');
    expect(contentArea.childNodes.length).toBe(0);
  });
});

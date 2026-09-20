import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CreditCard } from './CreditCard';

describe('CreditCard Object', () => {
  it('renders default SVG correctly', () => {
    const { getByTestId, container } = render(<CreditCard />);
    const card = getByTestId('object-credit-card');
    
    // Check wrapper style
    expect(card.style.position).toBe('relative');
    expect(card.style.transform).toContain('scale(1)');
    expect(card.style.transform).toContain('rotate(0deg)');
    
    // Check SVG presence
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 500 350');
  });

  it('applies position, scale, and rotation props', () => {
    const { getByTestId } = render(<CreditCard x={100} y={200} scale={2} rotation={45} opacity={0.5} />);
    const card = getByTestId('object-credit-card');
    
    expect(card.style.position).toBe('absolute');
    expect(card.style.left).toBe('100px');
    expect(card.style.top).toBe('200px');
    expect(card.style.transform).toContain('scale(2)');
    expect(card.style.transform).toContain('rotate(45deg)');
    expect(card.style.opacity).toBe('0.5');
  });

  it('preserves important data-part groups', () => {
    const { container } = render(<CreditCard />);
    
    const parts = [
      'shadow',
      'card',
      'details',
      'chip',
      'contactless',
      'logo',
      'cardNumber',
      'name',
      'expiry'
    ];

    parts.forEach(part => {
      const el = container.querySelector(`g[data-part="${part}"]`);
      expect(el).toBeDefined();
      expect(el).not.toBeNull();
    });
  });
});

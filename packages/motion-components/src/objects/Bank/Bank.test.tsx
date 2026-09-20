import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Bank } from './Bank';

describe('Bank Object', () => {
  it('renders default SVG correctly', () => {
    const { getByTestId, container } = render(<Bank />);
    const bank = getByTestId('object-bank');
    
    // Check wrapper style
    expect(bank.style.position).toBe('relative');
    expect(bank.style.transform).toContain('scale(1)');
    expect(bank.style.transform).toContain('rotate(0deg)');
    
    // Check SVG presence
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 400 400');
  });

  it('applies position, scale, and rotation props', () => {
    const { getByTestId } = render(<Bank x={100} y={200} scale={2} rotation={45} opacity={0.5} />);
    const bank = getByTestId('object-bank');
    
    expect(bank.style.position).toBe('absolute');
    expect(bank.style.left).toBe('100px');
    expect(bank.style.top).toBe('200px');
    expect(bank.style.transform).toContain('scale(2)');
    expect(bank.style.transform).toContain('rotate(45deg)');
    expect(bank.style.opacity).toBe('0.5');
  });

  it('preserves important data-part groups', () => {
    const { container } = render(<Bank />);
    
    const parts = [
      'shadow',
      'building',
      'roof',
      'columns',
      'windows',
      'door',
      'sign',
      'details'
    ];

    parts.forEach(part => {
      const el = container.querySelector(`g[data-part="${part}"]`);
      expect(el).toBeDefined();
      expect(el).not.toBeNull();
    });
  });
});

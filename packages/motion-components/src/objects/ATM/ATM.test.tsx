import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ATM } from './ATM';

describe('ATM Object', () => {
  it('renders default SVG correctly', () => {
    const { getByTestId, container } = render(<ATM />);
    const atm = getByTestId('object-atm');
    
    // Check wrapper style
    expect(atm.style.position).toBe('relative');
    expect(atm.style.transform).toContain('scale(1)');
    expect(atm.style.transform).toContain('rotate(0deg)');
    
    // Check SVG presence
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 400 500');
  });

  it('applies position, scale, and rotation props', () => {
    const { getByTestId } = render(<ATM x={100} y={200} scale={2} rotation={45} opacity={0.5} />);
    const atm = getByTestId('object-atm');
    
    expect(atm.style.position).toBe('absolute');
    expect(atm.style.left).toBe('100px');
    expect(atm.style.top).toBe('200px');
    expect(atm.style.transform).toContain('scale(2)');
    expect(atm.style.transform).toContain('rotate(45deg)');
    expect(atm.style.opacity).toBe('0.5');
  });

  it('preserves important data-part groups', () => {
    const { container } = render(<ATM />);
    
    const parts = [
      'shadow',
      'body',
      'details',
      'buttons',
      'screen',
      'screenContent',
      'cardSlot',
      'keypad',
      'cash',
      'cashSlot'
    ];

    parts.forEach(part => {
      const el = container.querySelector(`g[data-part="${part}"]`);
      expect(el).toBeDefined();
      expect(el).not.toBeNull();
    });
  });
});

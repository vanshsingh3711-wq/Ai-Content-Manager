import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedKPI } from './AnimatedKPI';

describe('AnimatedKPI', () => {
  const defaultProps = {
    title: 'Total Revenue',
    value: 125000,
  };

  it('renders title and value when fully animated', () => {
    const { getByTestId } = render(
      <AnimatedKPI {...defaultProps} currentFrame={60} />
    );
    expect(getByTestId('kpi-title').textContent).toBe('TOTAL REVENUE');
    expect(getByTestId('kpi-value').textContent).toBe('125,000');
  });

  it('renders change metric if provided', () => {
    const { getByTestId } = render(
      <AnimatedKPI {...defaultProps} changeValue={5.2} currentFrame={60} />
    );
    expect(getByTestId('kpi-change').textContent).toBe('▲ 5.2%');
  });

  it('renders negative trend symbol if negative change', () => {
    const { getByTestId } = render(
      <AnimatedKPI {...defaultProps} changeValue={-2.1} currentFrame={60} />
    );
    expect(getByTestId('kpi-change').textContent).toBe('▼ 2.1%');
  });

  it('hides elements based on animation frame stagger', () => {
    // Title is delay=0, Value is delay=10, Change is delay=20
    const { container, queryByTestId } = render(
      <AnimatedKPI {...defaultProps} changeValue={10} currentFrame={5} animation={{ staggerInFrames: 10 }} />
    );
    // Frame 5: Title is visible (fading in), Value and Change are delay>5 so they should be hidden/opacity 0
    // Actually in the implementation, if opacity > 0 it renders. Let's see if queryByTestId finds it.
    expect(queryByTestId('kpi-title')).toBeDefined();
    expect(queryByTestId('kpi-value')).toBeNull(); // opacity is 0, conditionally rendered
    expect(queryByTestId('kpi-change')).toBeNull();
  });
});

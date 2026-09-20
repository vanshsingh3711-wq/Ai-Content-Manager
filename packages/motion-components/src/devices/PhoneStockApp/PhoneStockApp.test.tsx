import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneStockApp } from './PhoneStockApp';

describe('PhoneStockApp', () => {
  const chartData = [
    { value: 100 },
    { value: 110 },
  ];

  it('renders correctly with given static text data', () => {
    const { getByTestId } = render(
      <PhoneStockApp 
        symbol="AAPL" 
        companyName="Apple"
        price={150} 
        change={5} 
        changePercent={3.45} 
        currentFrame={100} // end of animation
      />
    );
    expect(getByTestId('stock-symbol').textContent).toBe('AAPL');
    expect(getByTestId('stock-company').textContent).toBe('Apple');
  });

  it('uses positive color for positive change', () => {
    const { getByTestId } = render(
      <PhoneStockApp 
        symbol="AAPL" 
        price={150} 
        change={5} 
        changePercent={3.45} 
        currentFrame={100} 
      />
    );
    // Green color is default for positive
    expect(getByTestId('stock-change').style.color).toBe('rgb(16, 185, 129)'); 
  });

  it('uses negative color for negative change', () => {
    const { getByTestId } = render(
      <PhoneStockApp 
        symbol="AAPL" 
        price={150} 
        change={-5} 
        changePercent={-3.45} 
        currentFrame={100} 
      />
    );
    // Red color is default for negative
    expect(getByTestId('stock-change').style.color).toBe('rgb(239, 68, 68)'); 
  });

  it('renders the chart container when data is provided', () => {
    const { getByTestId } = render(
      <PhoneStockApp 
        symbol="AAPL" 
        price={150} 
        chartData={chartData}
        currentFrame={100} 
      />
    );
    expect(getByTestId('stock-chart')).toBeDefined();
    // Chart should contain an svg element internally
    expect(getByTestId('stock-chart').innerHTML).toContain('svg');
  });

  it('animates elements initially', () => {
    const { getByTestId } = render(
      <PhoneStockApp 
        symbol="AAPL" 
        price={150} 
        currentFrame={0} 
      />
    );
    // At frame 0, opacity might be 0, or price counter is at start value.
    const container = getByTestId('phone-stock-app');
    expect(container.style.opacity).toBe('0');
  });
});

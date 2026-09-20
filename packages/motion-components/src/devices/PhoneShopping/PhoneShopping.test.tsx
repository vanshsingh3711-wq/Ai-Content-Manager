import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneShopping } from './PhoneShopping';

describe('PhoneShopping', () => {
  it('renders browsing state initially and displays provided props', () => {
    const { getByTestId, queryByTestId } = render(
      <PhoneShopping 
        productName="Wireless Headphones" 
        price="2,499" 
        currency="₹" 
        rating={4.6}
        currentFrame={0} 
      />
    );
    expect(getByTestId('state-browsing')).toBeDefined();
    expect(getByTestId('product-name').textContent).toBe('Wireless Headphones');
    expect(getByTestId('product-price').textContent).toBe('₹2,499');
    expect(getByTestId('product-rating').textContent).toBe('4.6');
    expect(queryByTestId('state-cart')).toBeNull();
  });

  it('renders cart state correctly', () => {
    const { getByTestId } = render(
      <PhoneShopping 
        productName="Headphones" 
        price="100" 
        status="cart"
      />
    );
    expect(getByTestId('state-cart')).toBeDefined();
  });

  it('renders checkout state correctly', () => {
    const { getByTestId } = render(
      <PhoneShopping 
        productName="Headphones" 
        price="100" 
        status="checkout"
      />
    );
    expect(getByTestId('state-checkout')).toBeDefined();
  });

  it('transitions through animation timeline deterministically', () => {
    // defaults are 60 per phase.
    // 0-59: browsing
    // 60-119: cart
    // 120-179: checkout
    // 180-239: processing
    // 240+: ordered

    const testFrame = (frame: number, testId: string) => {
      const { getByTestId } = render(
        <PhoneShopping productName="Test" price="10" currentFrame={frame} />
      );
      expect(getByTestId(testId)).toBeDefined();
    };

    testFrame(30, 'state-browsing');
    testFrame(90, 'state-cart');
    testFrame(150, 'state-checkout');
    testFrame(210, 'state-processing');
    testFrame(270, 'state-ordered');
  });

  it('uses custom animation timing if provided', () => {
    const { getByTestId } = render(
      <PhoneShopping 
        productName="Test" 
        price="10" 
        currentFrame={100} // with default this would be cart.
        animation={{
          startDelayInFrames: 0,
          browsingDurationInFrames: 120, // push cart start back
        }}
      />
    );
    expect(getByTestId('state-browsing')).toBeDefined();
  });
});

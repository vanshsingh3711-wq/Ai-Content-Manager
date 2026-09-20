import React from 'react';
import { PhoneShoppingProps } from './PhoneShopping.types';
import { interpolate } from './PhoneShopping.utils';
import { PhoneTap } from '../PhoneTap';

export const PhoneShopping: React.FC<PhoneShoppingProps> = ({
  productName,
  price,
  currency = '$',
  image,
  rating,
  status,
  width = '100%',
  height = '100%',
  animation = {},
  currentFrame = 0,
  fps = 30,
  style = {},
}) => {
  const {
    startDelayInFrames = 0,
    browsingDurationInFrames = 60,
    cartDurationInFrames = 60,
    checkoutDurationInFrames = 60,
    processingDurationInFrames = 60,
    orderedDurationInFrames = 60, // conceptually ends here
  } = animation;

  const {
    backgroundColor = 'transparent',
    textColor = '#111827',
    secondaryTextColor = '#6b7280',
    accentColor = '#2563eb',
    buttonColor = '#2563eb',
    successColor = '#10b981',
  } = style;

  // Timeline Math
  const cartStart = startDelayInFrames + browsingDurationInFrames;
  const checkoutStart = cartStart + cartDurationInFrames;
  const processingStart = checkoutStart + checkoutDurationInFrames;
  const orderedStart = processingStart + processingDurationInFrames;

  let derivedStatus: NonNullable<PhoneShoppingProps['status']> = 'browsing';
  if (currentFrame >= orderedStart) derivedStatus = 'ordered';
  else if (currentFrame >= processingStart) derivedStatus = 'processing';
  else if (currentFrame >= checkoutStart) derivedStatus = 'checkout';
  else if (currentFrame >= cartStart) derivedStatus = 'cart';

  const finalStatus = status || derivedStatus;

  // Render a clean SVG placeholder if no image provided
  const ProductImage = image || (
    <div style={{ width: '100%', height: 240, backgroundColor: '#f3f4f6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );

  const spinnerRotation = (currentFrame * 8) % 360; 

  const renderBrowsing = () => (
    <div data-testid="state-browsing" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>{ProductImage}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: textColor, marginBottom: 8 }} data-testid="product-name">{productName}</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: textColor }} data-testid="product-price">{currency}{price}</div>
        {rating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span data-testid="product-rating">{rating}</span>
          </div>
        )}
      </div>
      
      {/* Subtle details lines */}
      <div style={{ flex: 1 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: i === 3 ? '60%' : '100%', height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, marginBottom: 12 }} />
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', height: 56, backgroundColor: buttonColor, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 600, marginTop: 'auto' }}>
        Add to Cart
        {!status && (
          <PhoneTap 
            x={'50%' as unknown as number} y={'50%' as unknown as number} size={80} 
            animation={{ type: 'tap', durationInFrames: 30, delayInFrames: cartStart - 30 }} 
            currentFrame={currentFrame} style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          />
        )}
      </div>
    </div>
  );

  const renderCart = () => (
    <div data-testid="state-cart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: textColor, marginBottom: 24 }}>Cart</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${secondaryTextColor}20` }}>
        <div style={{ width: 64, height: 64, backgroundColor: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left' }}>{ProductImage}</div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: textColor }}>{productName}</div>
          <div style={{ fontSize: 14, color: secondaryTextColor }}>Qty: 1</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginTop: 4 }}>{currency}{price}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: textColor, marginBottom: 'auto' }}>
        <span>Total</span>
        <span>{currency}{price}</span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 56, backgroundColor: buttonColor, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 600 }}>
        Checkout
        {!status && (
          <PhoneTap 
            x={'50%' as unknown as number} y={'50%' as unknown as number} size={80} 
            animation={{ type: 'tap', durationInFrames: 30, delayInFrames: checkoutStart - 30 }} 
            currentFrame={currentFrame} style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          />
        )}
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div data-testid="state-checkout" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: textColor, marginBottom: 24 }}>Checkout</div>
      
      <div style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: secondaryTextColor, marginBottom: 12 }}>
          <span>Item</span>
          <span>{currency}{price}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: secondaryTextColor, marginBottom: 12 }}>
          <span>Delivery</span>
          <span>{currency}0</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: textColor, paddingTop: 12, borderTop: `1px solid ${secondaryTextColor}20` }}>
          <span>Total</span>
          <span>{currency}{price}</span>
        </div>
      </div>

      <div style={{ marginBottom: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: textColor, marginBottom: 8 }}>Payment Method</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${accentColor}`, borderRadius: 8 }}>
          <div style={{ width: 32, height: 20, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
          <div style={{ fontSize: 14, color: textColor }}>•••• 4242</div>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 56, backgroundColor: buttonColor, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 600 }}>
        Place Order
        {!status && (
          <PhoneTap 
            x={'50%' as unknown as number} y={'50%' as unknown as number} size={80} 
            animation={{ type: 'tap', durationInFrames: 30, delayInFrames: processingStart - 30 }} 
            currentFrame={currentFrame} style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          />
        )}
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div data-testid="state-processing" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" style={{ transform: `rotate(${spinnerRotation}deg)`, marginBottom: 24 }}>
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 18, fontWeight: 600, color: textColor }}>Processing order...</div>
    </div>
  );

  const renderOrdered = () => {
    const scale = interpolate(currentFrame, [orderedStart, orderedStart + 15], [0.5, 1], 'clamp');
    const opacity = interpolate(currentFrame, [orderedStart, orderedStart + 15], [0, 1], 'clamp');

    return (
      <div data-testid="state-ordered" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', opacity, transform: `scale(${scale})` }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: successColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: textColor, marginBottom: 8 }}>Order Placed</div>
        <div style={{ fontSize: 16, color: secondaryTextColor }}>Thank you!</div>
      </div>
    );
  };

  return (
    <div
      data-testid="phone-shopping"
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {finalStatus === 'browsing' && renderBrowsing()}
      {finalStatus === 'cart' && renderCart()}
      {finalStatus === 'checkout' && renderCheckout()}
      {finalStatus === 'processing' && renderProcessing()}
      {finalStatus === 'ordered' && renderOrdered()}
    </div>
  );
};

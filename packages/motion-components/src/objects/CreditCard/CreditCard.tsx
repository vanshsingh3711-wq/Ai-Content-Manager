import React from 'react';
import { CreditCardProps } from './CreditCard.types';

export const CreditCard: React.FC<CreditCardProps> = ({
  x,
  y,
  scale = 1,
  rotation = 0,
  opacity = 1,
  className = '',
  style = {},
}) => {
  const isAbsolute = x !== undefined || y !== undefined;

  return (
    <div
      data-testid="object-credit-card"
      className={className}
      style={{
        position: isAbsolute ? 'absolute' : 'relative',
        left: x,
        top: y,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        opacity,
        width: 500,
        height: 350,
        ...style,
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="100%" height="100%">
        {/* SHADOW */}
        <g id="credit-card-shadow" data-part="shadow">
          <ellipse cx="250" cy="305" rx="150" ry="12" fill="#94A3B8" opacity="0.4" />
        </g>

        {/* CARD BODY & BACKGROUND */}
        <g id="credit-card-body" data-part="card">
          {/* Main base */}
          <rect x="80" y="68" width="340" height="214" rx="16" fill="#0F172A" />

          {/* Geometric abstract layers for a premium SaaS look */}
          <path d="M 80 200 L 250 68 L 380 68 L 150 282 L 80 282 Z" fill="#1E293B" />
          <path d="M 420 150 L 280 282 L 420 282 Z" fill="#334155" opacity="0.4" />

          {/* Diagonal gloss / reflection */}
          <polygon points="80,180 320,68 420,68 420,110 80,260" fill="#FFFFFF" opacity="0.03" />

          {/* Subtle inset border to create an edge thickness effect */}
          <rect x="83" y="71" width="334" height="208" rx="13" fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* DETAILS & DECORATIONS */}
        <g id="credit-card-details" data-part="details">
          {/* Card Tier Text */}
          <text x="115" y="94" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#94A3B8" letterSpacing="4">PLATINUM</text>

          {/* Directional insertion arrow indicator */}
          <polygon points="80,170 86,175 80,180" fill="#475569" />
        </g>

        {/* CHIP */}
        <g id="credit-card-chip" data-part="chip">
          {/* Gold base */}
          <rect x="115" y="110" width="42" height="32" rx="4" fill="#FBBF24" />

          {/* Inner EMV circuit lines */}
          <path d="M 115 118 H 128 V 110 M 115 134 H 128 V 142 M 142 110 V 118 H 157 M 142 142 V 134 H 157 M 128 110 V 142 M 142 110 V 142 M 128 126 H 142" stroke="#B45309" strokeWidth="1.5" fill="none" />

          {/* Chip subtle inner shadow / edge */}
          <rect x="115" y="110" width="42" height="32" rx="4" fill="none" stroke="#D97706" strokeWidth="1" />
        </g>

        {/* CONTACTLESS ICON */}
        <g id="credit-card-contactless" data-part="contactless">
          {/* Radio waves flaring outward */}
          <path d="M 170 119 Q 174 126 170 133 M 175 114 Q 181 126 175 138 M 180 109 Q 188 126 180 143 M 185 104 Q 195 126 185 148" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* GENERIC LOGO */}
        <g id="credit-card-logo" data-part="logo">
          {/* Interlocking generic finance circles (Mastercard/Venn style) */}
          <circle cx="360" cy="105" r="18" fill="#38BDF8" opacity="0.9" />
          <circle cx="380" cy="105" r="18" fill="#6366F1" opacity="0.9" />
          {/* Brand Name */}
          <text x="370" y="135" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="900" fill="#F8FAFC" textAnchor="middle" letterSpacing="3">GLOBAL</text>
        </g>

        {/* CARD NUMBER */}
        <g id="credit-card-number" data-part="cardNumber">
          {/* Monospace text for easy replacement and natural typesetting */}
          <text x="115" y="205" fontFamily="ui-monospace, 'Courier New', monospace" fontSize="23" fontWeight="600" fill="#F8FAFC" letterSpacing="4.5">1234 5678 9012 3456</text>
        </g>

        {/* CARDHOLDER NAME */}
        <g id="credit-card-name" data-part="name">
          <text x="115" y="255" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#F1F5F9" letterSpacing="2">ALEX MORGAN</text>
        </g>

        {/* EXPIRY DATE */}
        <g id="credit-card-expiry" data-part="expiry">
          {/* Small label */}
          <text x="310" y="238" fontFamily="system-ui, -apple-system, sans-serif" fontSize="7" fontWeight="700" fill="#94A3B8" letterSpacing="1">VALID THRU</text>
          {/* Date */}
          <text x="310" y="255" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#F1F5F9" letterSpacing="1">12/29</text>
        </g>
      </svg>
    </div>
  );
};

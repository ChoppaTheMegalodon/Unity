'use client';

import { formatPrice, formatConfidence } from '@pythfolio/core';

interface PriceDisplayProps {
  price: number | null;
  confidence: number | null;
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ price, confidence, symbol, size = 'md' }: PriceDisplayProps) {
  if (price === null) {
    return <span style={{ color: '#666' }}>Loading...</span>;
  }

  const sizes = {
    sm: { price: '0.9rem', conf: '0.7rem' },
    md: { price: '1.1rem', conf: '0.8rem' },
    lg: { price: '1.8rem', conf: '0.85rem' },
  };

  const s = sizes[size];

  return (
    <div>
      <div style={{ fontSize: s.price, fontWeight: 600, color: '#FFF' }}>
        ${formatPrice(price)}
      </div>
      {confidence !== null && confidence > 0 && (
        <div style={{ fontSize: s.conf, color: '#888', marginTop: 2 }}>
          {formatConfidence(confidence, price)}
        </div>
      )}
    </div>
  );
}

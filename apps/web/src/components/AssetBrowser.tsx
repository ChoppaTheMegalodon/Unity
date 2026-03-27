'use client';

import { useState, useEffect } from 'react';
import { PriceDisplay } from './PriceDisplay';
import type { AssetClass } from '@pythfolio/core';

interface Feed {
  feedId: string;
  symbol: string;
  baseAsset: string;
  displayName: string;
  assetClass: string;
}

interface AssetBrowserProps {
  feeds: Feed[];
  prices: Record<string, { price: number; confidence: number } | null>;
  onSelect?: (feed: Feed) => void;
}

const ASSET_CLASSES: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Equities', value: 'equity' },
  { label: 'Forex', value: 'forex' },
  { label: 'Commodities', value: 'commodity' },
];

export function AssetBrowser({ feeds, prices, onSelect }: AssetBrowserProps) {
  const [search, setSearch] = useState('');
  const [activeClass, setActiveClass] = useState<string | null>(null);

  const filtered = feeds.filter((f) => {
    if (activeClass && f.assetClass !== activeClass) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.symbol.toLowerCase().includes(q) ||
        f.baseAsset.toLowerCase().includes(q) ||
        (f.displayName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search assets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          backgroundColor: '#1A1A1A',
          border: '1px solid #333',
          borderRadius: 8,
          color: '#FFF',
          fontSize: '0.95rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Asset class filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {ASSET_CLASSES.map((cls) => (
          <button
            key={cls.label}
            onClick={() => setActiveClass(cls.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: activeClass === cls.value ? '#8B5CF6' : '#333',
              backgroundColor: activeClass === cls.value ? '#8B5CF620' : 'transparent',
              color: activeClass === cls.value ? '#8B5CF6' : '#888',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {cls.label}
          </button>
        ))}
      </div>

      {/* Feed list */}
      <div style={{ marginTop: 12 }}>
        {filtered.map((feed) => {
          const priceData = prices[feed.feedId];
          return (
            <div
              key={feed.feedId}
              onClick={() => onSelect?.(feed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid #1A1A1A',
                cursor: onSelect ? 'pointer' : 'default',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{feed.symbol}</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  {feed.displayName || feed.baseAsset}
                </div>
              </div>
              <PriceDisplay
                price={priceData?.price ?? null}
                confidence={priceData?.confidence ?? null}
                symbol={feed.symbol}
                size="sm"
              />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: 24 }}>
            No assets found
          </div>
        )}
      </div>
    </div>
  );
}

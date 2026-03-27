'use client';

import { useState } from 'react';

interface Feed {
  feedId: string;
  symbol: string;
  baseAsset: string;
  assetClass: string;
  displayName: string;
}

interface AddPositionModalProps {
  feed: Feed;
  onAdd: (data: {
    feedId: string;
    symbol: string;
    assetClass: string;
    quantity: string;
    avgCostBasis?: string;
  }) => void;
  onClose: () => void;
}

export function AddPositionModal({ feed, onAdd, onClose }: AddPositionModalProps) {
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return;

    onAdd({
      feedId: feed.feedId,
      symbol: feed.symbol,
      assetClass: feed.assetClass,
      quantity,
      avgCostBasis: costBasis || undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h3 style={{ margin: '0 0 16px' }}>
          Add {feed.displayName || feed.symbol}
        </h3>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Quantity</span>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 0.5"
              autoFocus
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                marginTop: 4,
                backgroundColor: '#0F0F0F',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#FFF',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              Avg. Cost Basis (optional)
            </span>
            <input
              type="number"
              step="any"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder="e.g. 95000"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                marginTop: 4,
                backgroundColor: '#0F0F0F',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#FFF',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#8B5CF6',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Add Position
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: '#888',
                border: '1px solid #333',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { formatPrice } from '@pythfolio/core';
import { PriceDisplay } from './PriceDisplay';

interface PositionRowProps {
  symbol: string;
  assetClass: string;
  quantity: number;
  avgCostBasis: number | null;
  currentPrice: number | null;
  confidence: number | null;
  onDelete?: () => void;
}

export function PositionRow({
  symbol,
  assetClass,
  quantity,
  avgCostBasis,
  currentPrice,
  confidence,
  onDelete,
}: PositionRowProps) {
  const marketValue = currentPrice ? quantity * currentPrice : null;
  const costBasis = avgCostBasis ? quantity * avgCostBasis : null;
  const pnl = marketValue !== null && costBasis !== null ? marketValue - costBasis : null;
  const pnlPct = pnl !== null && costBasis && costBasis > 0 ? (pnl / costBasis) * 100 : null;

  const classColors: Record<string, string> = {
    crypto: '#8B5CF6',
    equity: '#3B82F6',
    forex: '#10B981',
    commodity: '#F59E0B',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #1F1F1F',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{symbol}</span>
          <span
            style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: classColors[assetClass] || '#666',
              color: '#FFF',
              textTransform: 'uppercase',
            }}
          >
            {assetClass}
          </span>
        </div>
        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 2 }}>
          {quantity} units
          {avgCostBasis && ` @ $${formatPrice(avgCostBasis)}`}
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: 1 }}>
        <PriceDisplay price={currentPrice} confidence={confidence} symbol={symbol} size="sm" />
      </div>

      <div style={{ textAlign: 'right', minWidth: 100, marginLeft: 16 }}>
        {marketValue !== null && (
          <div style={{ fontWeight: 600 }}>${formatPrice(marketValue)}</div>
        )}
        {pnl !== null && pnlPct !== null && (
          <div
            style={{
              fontSize: '0.8rem',
              color: pnl >= 0 ? '#4ADE80' : '#F87171',
            }}
          >
            {pnl >= 0 ? '+' : ''}${formatPrice(Math.abs(pnl))} ({pnlPct.toFixed(1)}%)
          </div>
        )}
      </div>

      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            marginLeft: 12,
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
        >
          x
        </button>
      )}
    </div>
  );
}

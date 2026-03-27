'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@pythfolio/core';
import { api } from '../lib/api';
import { priceSocket } from '../lib/ws';
import { isTelegramMiniApp, getTelegramInitData, initTelegramApp } from '../lib/telegram';
import { PositionRow } from '../components/PositionRow';
import { AssetBrowser } from '../components/AssetBrowser';
import { AddPositionModal } from '../components/AddPositionModal';

type View = 'portfolio' | 'browse' | 'auth';

interface Feed {
  feedId: string;
  symbol: string;
  baseAsset: string;
  displayName: string;
  assetClass: string;
}

export default function Home() {
  const [view, setView] = useState<View>('auth');
  const [user, setUser] = useState<{ userId: string; tier: string } | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // ── Initialize ──

  useEffect(() => {
    initTelegramApp();

    // Check if already logged in
    const token = api.getToken();
    if (token) {
      loadDashboard();
      return;
    }

    // Auto-auth via Telegram if inside TMA
    const initData = getTelegramInitData();
    if (initData) {
      api
        .authTelegram(initData)
        .then((data) => {
          setUser(data);
          loadDashboard();
        })
        .catch(() => setView('auth'));
    }
  }, []);

  // ── Data Loading ──

  const loadDashboard = useCallback(async () => {
    try {
      const [portfolios, feedList] = await Promise.all([
        api.getPortfolios(),
        api.getFeeds(),
      ]);

      setFeeds(feedList);

      if (portfolios.length > 0) {
        const p = portfolios[0];
        setPortfolio(p);
        const pos = await api.getPositions(p.id);
        setPositions(pos);

        // Fetch initial prices for all positions + feeds
        const allFeedIds = [
          ...pos.map((p: any) => p.feedId),
          ...feedList.map((f: Feed) => f.feedId),
        ];
        const uniqueIds = [...new Set(allFeedIds)];
        if (uniqueIds.length > 0) {
          const priceData = await api.getPrices(uniqueIds);
          setPrices(priceData);
        }

        // Connect WebSocket for live updates
        priceSocket.connect('free');
        uniqueIds.forEach((feedId) => {
          priceSocket.subscribe(feedId, (update) => {
            setPrices((prev) => ({
              ...prev,
              [update.feedId]: update,
            }));
          });
        });
      }

      setView('portfolio');
      setUser({ userId: '', tier: 'free' }); // Will be set properly from token
    } catch (err) {
      setError('Failed to load data');
      setView('auth');
    }
  }, []);

  // ── Auth Handlers ──

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        const data = await api.register(email, password, displayName);
        setUser(data);
      } else {
        const data = await api.login(email, password);
        setUser(data);
      }
      loadDashboard();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Position Management ──

  const handleAddPosition = async (data: any) => {
    if (!portfolio) return;
    try {
      await api.addPosition(portfolio.id, data);
      const pos = await api.getPositions(portfolio.id);
      setPositions(pos);
      setSelectedFeed(null);
      setView('portfolio');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!portfolio) return;
    try {
      await api.deletePosition(portfolio.id, positionId);
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Portfolio Summary ──

  const totalValue = positions.reduce((sum, pos) => {
    const p = prices[pos.feedId];
    return sum + (p?.price ?? 0) * parseFloat(pos.quantity);
  }, 0);

  // ── Render ──

  if (view === 'auth') {
    return (
      <main style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 8 }}>
          PythFolio
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>
          Portfolio tracker powered by Pyth
        </p>

        {error && (
          <div style={{ color: '#F87171', marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth}>
          {isRegister && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            display: 'block',
            margin: '16px auto',
            background: 'none',
            border: 'none',
            color: '#8B5CF6',
            cursor: 'pointer',
          }}
        >
          {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>PythFolio</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('portfolio')}
            style={view === 'portfolio' ? tabActiveStyle : tabStyle}
          >
            Portfolio
          </button>
          <button
            onClick={() => setView('browse')}
            style={view === 'browse' ? tabActiveStyle : tabStyle}
          >
            Browse
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: '#F87171',
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#F8717110',
            borderRadius: 8,
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
          >
            x
          </button>
        </div>
      )}

      {/* Portfolio View */}
      {view === 'portfolio' && (
        <div>
          {/* Total Value Card */}
          <div
            style={{
              padding: 20,
              backgroundColor: '#1A1A1A',
              borderRadius: 12,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 4 }}>
              Total Value
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              ${formatPrice(totalValue)}
            </div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 4 }}>
              {positions.length} position{positions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Positions */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #1F1F1F',
              }}
            >
              <span style={{ fontWeight: 600 }}>Positions</span>
              <button
                onClick={() => setView('browse')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#8B5CF6',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                + Add
              </button>
            </div>

            {positions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: 32 }}>
                No positions yet. Browse assets to add one.
              </div>
            ) : (
              positions.map((pos) => {
                const p = prices[pos.feedId];
                return (
                  <PositionRow
                    key={pos.id}
                    symbol={pos.symbol}
                    assetClass={pos.assetClass}
                    quantity={parseFloat(pos.quantity)}
                    avgCostBasis={pos.avgCostBasis ? parseFloat(pos.avgCostBasis) : null}
                    currentPrice={p?.price ?? null}
                    confidence={p?.confidence ?? null}
                    onDelete={() => handleDeletePosition(pos.id)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Browse View */}
      {view === 'browse' && (
        <AssetBrowser
          feeds={feeds}
          prices={prices}
          onSelect={(feed) => setSelectedFeed(feed)}
        />
      )}

      {/* Add Position Modal */}
      {selectedFeed && (
        <AddPositionModal
          feed={selectedFeed}
          onAdd={handleAddPosition}
          onClose={() => setSelectedFeed(null)}
        />
      )}
    </main>
  );
}

// ── Styles ──

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  marginBottom: 12,
  backgroundColor: '#1A1A1A',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#FFF',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  backgroundColor: '#8B5CF6',
  color: '#FFF',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '1rem',
};

const tabStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 20,
  border: '1px solid #333',
  backgroundColor: 'transparent',
  color: '#888',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const tabActiveStyle: React.CSSProperties = {
  ...tabStyle,
  borderColor: '#8B5CF6',
  backgroundColor: '#8B5CF620',
  color: '#8B5CF6',
};

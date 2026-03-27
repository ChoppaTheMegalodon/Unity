import { FEED_IDS } from '@pythfolio/core';

export default function Home() {
  const feedCount = Object.keys(FEED_IDS).length;

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>PythFolio</h1>
      <p style={{ color: '#888', fontSize: '1.1rem', maxWidth: '500px' }}>
        Portfolio tracker powered by Pyth Network price feeds.
        Real-time prices with confidence intervals across crypto, equities, forex, and commodities.
      </p>
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          border: '1px solid #333',
          borderRadius: '12px',
          background: '#1A1A1A',
        }}
      >
        <p style={{ margin: 0, color: '#4ADE80' }}>
          {feedCount} feeds loaded from @pythfolio/core
        </p>
      </div>
    </main>
  );
}

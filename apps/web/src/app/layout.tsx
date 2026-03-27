import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PythFolio — Portfolio Tracker powered by Pyth',
  description:
    'Track your portfolio across crypto, equities, forex, and commodities with real-time Pyth price feeds and confidence intervals.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Better TMA experience
  themeColor: '#0F0F0F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram Mini App SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#0F0F0F',
          color: '#FFFFFF',
        }}
      >
        {children}
      </body>
    </html>
  );
}

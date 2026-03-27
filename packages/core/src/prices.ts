/**
 * Pyth Price Feed Client
 *
 * Handles price parsing and conversion from Pyth's integer representation
 * to human-readable decimals. Supports both REST and WebSocket sources.
 */

import type { PythRawPrice, PriceData } from './types';

/**
 * Parse raw Pyth price data into human-readable format.
 *
 * Pyth stores prices as integers with a negative exponent:
 *   actual_price = raw_price * 10^(expo)
 *
 * Example: price=9523450000000, expo=-8 → $95,234.50
 */
export function parsePythPrice(
  feedId: string,
  symbol: string,
  raw: PythRawPrice,
  numPublishers: number = 0,
): PriceData {
  const expo = Math.abs(raw.expo);
  const divisor = Math.pow(10, expo);

  const price = Number(BigInt(raw.price)) / divisor;
  const confidence = Number(BigInt(raw.conf)) / divisor;
  const confidencePct = price > 0 ? (confidence / price) * 100 : 0;

  return {
    feedId,
    symbol,
    price,
    confidence,
    confidencePct,
    publishTime: raw.publish_time,
    numPublishers,
  };
}

/**
 * Format price for display with appropriate decimal places.
 * - Prices >= $1: 2 decimal places
 * - Prices >= $0.01: 4 decimal places
 * - Prices < $0.01: 6 decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 0.01) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

/**
 * Format confidence interval for display.
 */
export function formatConfidence(confidence: number, price: number): string {
  const pct = price > 0 ? (confidence / price) * 100 : 0;
  return `±$${formatPrice(confidence)} (${pct.toFixed(2)}%)`;
}

// ── Well-known Pyth Feed IDs ──

export const FEED_IDS = {
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'XRP/USD': '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  'DOGE/USD': '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  'ADA/USD': '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  'AVAX/USD': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'LINK/USD': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'XAU/USD': '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  'EUR/USD': '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
} as const;

export type KnownFeedSymbol = keyof typeof FEED_IDS;

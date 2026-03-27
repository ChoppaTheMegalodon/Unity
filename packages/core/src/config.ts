/**
 * Configuration helpers — reusable env loading utilities.
 */

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export function requireEnvInt(key: string): number {
  const value = requireEnv(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: ${value}`);
  }
  return parsed;
}

export function optionalEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ── Tier limits ──

export const TIER_LIMITS = {
  free: {
    maxPortfolios: 1,
    maxPositionsPerPortfolio: 25,
    maxWatchlists: 1,
    maxWatchlistAssets: 10,
    priceRefreshMs: 5000,
    alerts: false,
    csvExport: false,
    historicalDays: 7,
  },
  pro: {
    maxPortfolios: Infinity,
    maxPositionsPerPortfolio: Infinity,
    maxWatchlists: Infinity,
    maxWatchlistAssets: Infinity,
    priceRefreshMs: 0, // real-time
    alerts: true,
    csvExport: true,
    historicalDays: Infinity,
  },
} as const;

export type TierLimits = (typeof TIER_LIMITS)[keyof typeof TIER_LIMITS];

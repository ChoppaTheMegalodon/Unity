/**
 * Core type definitions for PythFolio
 */

// ── Pyth Price Types ──

/** Raw price data from Pyth API (integer representation) */
export interface PythRawPrice {
  /** Price in integer format (multiply by 10^expo) */
  price: string;
  /** Confidence interval in integer format */
  conf: string;
  /** Exponent for price conversion (negative number) */
  expo: number;
  /** Unix timestamp of price publication */
  publish_time: number;
}

/** Human-readable parsed price */
export interface PriceData {
  feedId: string;
  symbol: string;
  /** Actual price as decimal */
  price: number;
  /** Confidence interval as decimal (±) */
  confidence: number;
  /** Confidence as percentage of price */
  confidencePct: number;
  /** Unix timestamp (seconds) */
  publishTime: number;
  /** Number of publishers contributing */
  numPublishers: number;
}

/** Price update event from WebSocket */
export interface PriceUpdate {
  type: 'price_update';
  feedId: string;
  price: number;
  confidence: number;
  confidencePct: number;
  change24h: number | null;
  publishTime: number;
  numPublishers: number;
}

// ── Asset & Feed Types ──

export type AssetClass = 'crypto' | 'equity' | 'forex' | 'commodity';

export interface FeedInfo {
  feedId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  assetClass: AssetClass;
  displayName: string;
  logoUrl?: string;
  exponent: number;
}

// ── Portfolio Types ──

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  currency: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  portfolioId: string;
  feedId: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  avgCostBasis: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out';

export interface Transaction {
  id: string;
  positionId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  fee: number;
  notes: string | null;
  executedAt: Date;
  createdAt: Date;
}

// ── Subscription Types ──

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionPlatform = 'stripe' | 'telegram_stars' | 'apple' | 'google';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';
export type SubscriptionPlan = 'pro_monthly' | 'pro_annual';

export interface Subscription {
  id: string;
  userId: string;
  platform: SubscriptionPlatform;
  externalId: string | null;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Alert Types ──

export type AlertCondition = 'above' | 'below' | 'confidence_spike';
export type AlertChannel = 'push' | 'telegram' | 'both';

export interface PriceAlert {
  id: string;
  userId: string;
  feedId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number | null;
  confidenceThreshold: number | null;
  triggered: boolean;
  channel: AlertChannel;
  createdAt: Date;
}

// ── User Types ──

export interface User {
  id: string;
  email: string | null;
  telegramId: number | null;
  displayName: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

// ── API Types ──

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── WebSocket Types ──

export interface WsSubscribeMessage {
  type: 'subscribe';
  feedIds: string[];
}

export interface WsUnsubscribeMessage {
  type: 'unsubscribe';
  feedIds: string[];
}

export interface WsPingMessage {
  type: 'ping';
}

export interface WsPongMessage {
  type: 'pong';
}

export interface WsAlertTriggered {
  type: 'alert_triggered';
  alertId: string;
  symbol: string;
  price: number;
  condition: AlertCondition;
}

export type WsClientMessage = WsSubscribeMessage | WsUnsubscribeMessage | WsPingMessage;
export type WsServerMessage = PriceUpdate | WsPongMessage | WsAlertTriggered;

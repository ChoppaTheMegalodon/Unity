/**
 * @pythfolio/core — shared types, price parsing, portfolio math, and config.
 */

// Types
export type {
  PythRawPrice,
  PriceData,
  PriceUpdate,
  AssetClass,
  FeedInfo,
  Portfolio,
  Position,
  Transaction,
  TransactionType,
  Subscription,
  SubscriptionTier,
  SubscriptionPlatform,
  SubscriptionStatus,
  SubscriptionPlan,
  PriceAlert,
  AlertCondition,
  AlertChannel,
  User,
  ApiError,
  PaginatedResponse,
  WsSubscribeMessage,
  WsUnsubscribeMessage,
  WsPingMessage,
  WsPongMessage,
  WsAlertTriggered,
  WsClientMessage,
  WsServerMessage,
} from './types';

// Price utilities
export {
  parsePythPrice,
  formatPrice,
  formatConfidence,
  FEED_IDS,
} from './prices';
export type { KnownFeedSymbol } from './prices';

// Portfolio math
export {
  calculatePositionValue,
  calculatePortfolioSummary,
  recalculateCostBasis,
} from './portfolio';
export type { PositionValue, PortfolioSummary } from './portfolio';

// Config utilities
export {
  requireEnv,
  optionalEnv,
  requireEnvInt,
  optionalEnvInt,
  TIER_LIMITS,
} from './config';
export type { TierLimits } from './config';

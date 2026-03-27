/**
 * Database schema — Drizzle ORM definitions for PostgreSQL.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
} from 'drizzle-orm/pg-core';

// ── Users ──

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  telegramId: varchar('telegram_id', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  tier: varchar('tier', { length: 20 }).notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Portfolios ──

export const portfolios = pgTable('portfolios', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull().default('Main Portfolio'),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Positions ──

export const positions = pgTable('positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  portfolioId: uuid('portfolio_id')
    .notNull()
    .references(() => portfolios.id, { onDelete: 'cascade' }),
  feedId: varchar('feed_id', { length: 66 }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  assetClass: varchar('asset_class', { length: 20 }).notNull(),
  quantity: decimal('quantity', { precision: 28, scale: 12 }).notNull(),
  avgCostBasis: decimal('avg_cost_basis', { precision: 28, scale: 12 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Transactions ──

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  positionId: uuid('position_id')
    .notNull()
    .references(() => positions.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 15 }).notNull(),
  quantity: decimal('quantity', { precision: 28, scale: 12 }).notNull(),
  price: decimal('price', { precision: 28, scale: 12 }).notNull(),
  fee: decimal('fee', { precision: 28, scale: 12 }).notNull().default('0'),
  notes: text('notes'),
  executedAt: timestamp('executed_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Subscriptions ──

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull(),
  plan: varchar('plan', { length: 20 }).notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Price Alerts (Pro only) ──

export const priceAlerts = pgTable('price_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  feedId: varchar('feed_id', { length: 66 }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  condition: varchar('condition', { length: 20 }).notNull(),
  targetPrice: decimal('target_price', { precision: 28, scale: 12 }),
  confidenceThreshold: decimal('confidence_threshold', { precision: 10, scale: 4 }),
  triggered: boolean('triggered').notNull().default(false),
  channel: varchar('channel', { length: 20 }).notNull().default('push'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Watchlists ──

export const watchlists = pgTable('watchlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull().default('Watchlist'),
  feedIds: text('feed_ids').notNull().default('[]'), // JSON array of feed IDs
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Feed Registry ──

export const feedRegistry = pgTable('feed_registry', {
  feedId: varchar('feed_id', { length: 66 }).primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  baseAsset: varchar('base_asset', { length: 20 }).notNull(),
  quoteAsset: varchar('quote_asset', { length: 10 }).notNull().default('USD'),
  assetClass: varchar('asset_class', { length: 20 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  logoUrl: text('logo_url'),
  exponent: integer('exponent').notNull(),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

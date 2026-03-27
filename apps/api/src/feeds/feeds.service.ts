/**
 * Feed Registry — manages Pyth price feed metadata.
 * Seeds from well-known feeds on startup, serves search/browse API.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { getDb, schema } from '../db';
import { FEED_IDS } from '@pythfolio/core';
import { like, or, eq, sql } from 'drizzle-orm';

// Extended feed catalog beyond the core well-known feeds
const FEED_CATALOG: Array<{
  feedId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  assetClass: string;
  displayName: string;
  exponent: number;
}> = [
  { feedId: FEED_IDS['BTC/USD'], symbol: 'BTC/USD', baseAsset: 'BTC', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Bitcoin', exponent: 8 },
  { feedId: FEED_IDS['ETH/USD'], symbol: 'ETH/USD', baseAsset: 'ETH', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Ethereum', exponent: 8 },
  { feedId: FEED_IDS['SOL/USD'], symbol: 'SOL/USD', baseAsset: 'SOL', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Solana', exponent: 8 },
  { feedId: FEED_IDS['USDC/USD'], symbol: 'USDC/USD', baseAsset: 'USDC', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'USD Coin', exponent: 8 },
  { feedId: FEED_IDS['USDT/USD'], symbol: 'USDT/USD', baseAsset: 'USDT', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Tether', exponent: 8 },
  { feedId: FEED_IDS['BNB/USD'], symbol: 'BNB/USD', baseAsset: 'BNB', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'BNB', exponent: 8 },
  { feedId: FEED_IDS['XRP/USD'], symbol: 'XRP/USD', baseAsset: 'XRP', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'XRP', exponent: 8 },
  { feedId: FEED_IDS['DOGE/USD'], symbol: 'DOGE/USD', baseAsset: 'DOGE', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Dogecoin', exponent: 8 },
  { feedId: FEED_IDS['ADA/USD'], symbol: 'ADA/USD', baseAsset: 'ADA', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Cardano', exponent: 8 },
  { feedId: FEED_IDS['AVAX/USD'], symbol: 'AVAX/USD', baseAsset: 'AVAX', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Avalanche', exponent: 8 },
  { feedId: FEED_IDS['LINK/USD'], symbol: 'LINK/USD', baseAsset: 'LINK', quoteAsset: 'USD', assetClass: 'crypto', displayName: 'Chainlink', exponent: 8 },
  { feedId: FEED_IDS['XAU/USD'], symbol: 'XAU/USD', baseAsset: 'XAU', quoteAsset: 'USD', assetClass: 'commodity', displayName: 'Gold', exponent: 8 },
  { feedId: FEED_IDS['EUR/USD'], symbol: 'EUR/USD', baseAsset: 'EUR', quoteAsset: 'USD', assetClass: 'forex', displayName: 'Euro', exponent: 8 },
];

@Injectable()
export class FeedsService implements OnModuleInit {
  private readonly logger = new Logger(FeedsService.name);

  async onModuleInit() {
    await this.seedFeeds();
  }

  private async seedFeeds() {
    try {
      const db = getDb();

      for (const feed of FEED_CATALOG) {
        await db
          .insert(schema.feedRegistry)
          .values(feed)
          .onConflictDoUpdate({
            target: schema.feedRegistry.feedId,
            set: {
              symbol: feed.symbol,
              displayName: feed.displayName,
              assetClass: feed.assetClass,
              updatedAt: new Date(),
            },
          });
      }

      this.logger.log(`Seeded ${FEED_CATALOG.length} feeds into registry`);
    } catch (err) {
      this.logger.warn('Feed seeding skipped (DB may not be available):', (err as Error).message);
    }
  }

  async listFeeds(assetClass?: string) {
    const db = getDb();
    let query = db.select().from(schema.feedRegistry).where(eq(schema.feedRegistry.active, true));

    if (assetClass) {
      query = db
        .select()
        .from(schema.feedRegistry)
        .where(
          sql`${schema.feedRegistry.active} = true AND ${schema.feedRegistry.assetClass} = ${assetClass}`,
        );
    }

    return query;
  }

  async searchFeeds(q: string) {
    const db = getDb();
    const pattern = `%${q.toLowerCase()}%`;

    return db
      .select()
      .from(schema.feedRegistry)
      .where(
        sql`${schema.feedRegistry.active} = true AND (
          LOWER(${schema.feedRegistry.symbol}) LIKE ${pattern} OR
          LOWER(${schema.feedRegistry.baseAsset}) LIKE ${pattern} OR
          LOWER(${schema.feedRegistry.displayName}) LIKE ${pattern}
        )`,
      );
  }

  async getFeed(feedId: string) {
    const db = getDb();
    const [feed] = await db
      .select()
      .from(schema.feedRegistry)
      .where(eq(schema.feedRegistry.feedId, feedId))
      .limit(1);
    return feed || null;
  }

  /** Get the full catalog for the price engine to track */
  getCatalog() {
    return FEED_CATALOG;
  }
}

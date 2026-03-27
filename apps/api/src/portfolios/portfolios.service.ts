/**
 * Portfolio + Position CRUD — core data operations.
 */

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getDb, schema } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { TIER_LIMITS, type SubscriptionTier } from '@pythfolio/core';

@Injectable()
export class PortfoliosService {
  // ── Portfolios ──

  async listPortfolios(userId: string) {
    const db = getDb();
    return db
      .select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.userId, userId))
      .orderBy(schema.portfolios.sortOrder);
  }

  async getPortfolio(userId: string, portfolioId: string) {
    const db = getDb();
    const [portfolio] = await db
      .select()
      .from(schema.portfolios)
      .where(
        and(
          eq(schema.portfolios.id, portfolioId),
          eq(schema.portfolios.userId, userId),
        ),
      )
      .limit(1);

    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async createPortfolio(userId: string, name: string, tier: SubscriptionTier) {
    const db = getDb();
    const limits = TIER_LIMITS[tier];

    // Check portfolio limit
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.portfolios)
      .where(eq(schema.portfolios.userId, userId));

    if (existing[0].count >= limits.maxPortfolios) {
      throw new ForbiddenException(
        `Portfolio limit reached (${limits.maxPortfolios}). Upgrade to Pro for unlimited.`,
      );
    }

    const [portfolio] = await db
      .insert(schema.portfolios)
      .values({ userId, name })
      .returning();

    return portfolio;
  }

  async updatePortfolio(userId: string, portfolioId: string, data: { name?: string; currency?: string }) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership

    const [updated] = await db
      .update(schema.portfolios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.portfolios.id, portfolioId))
      .returning();

    return updated;
  }

  async deletePortfolio(userId: string, portfolioId: string) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership

    await db
      .delete(schema.portfolios)
      .where(eq(schema.portfolios.id, portfolioId));

    return { deleted: true };
  }

  // ── Positions ──

  async listPositions(userId: string, portfolioId: string) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership

    return db
      .select()
      .from(schema.positions)
      .where(eq(schema.positions.portfolioId, portfolioId));
  }

  async addPosition(
    userId: string,
    portfolioId: string,
    data: {
      feedId: string;
      symbol: string;
      assetClass: string;
      quantity: string;
      avgCostBasis?: string;
      notes?: string;
    },
    tier: SubscriptionTier,
  ) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership
    const limits = TIER_LIMITS[tier];

    // Check position limit
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.positions)
      .where(eq(schema.positions.portfolioId, portfolioId));

    if (existing[0].count >= limits.maxPositionsPerPortfolio) {
      throw new ForbiddenException(
        `Position limit reached (${limits.maxPositionsPerPortfolio}). Upgrade to Pro for unlimited.`,
      );
    }

    const [position] = await db
      .insert(schema.positions)
      .values({
        portfolioId,
        feedId: data.feedId,
        symbol: data.symbol,
        assetClass: data.assetClass,
        quantity: data.quantity,
        avgCostBasis: data.avgCostBasis || null,
        notes: data.notes || null,
      })
      .returning();

    return position;
  }

  async updatePosition(
    userId: string,
    portfolioId: string,
    positionId: string,
    data: { quantity?: string; avgCostBasis?: string; notes?: string },
  ) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership

    const [updated] = await db
      .update(schema.positions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.positions.id, positionId))
      .returning();

    if (!updated) throw new NotFoundException('Position not found');
    return updated;
  }

  async deletePosition(userId: string, portfolioId: string, positionId: string) {
    const db = getDb();
    await this.getPortfolio(userId, portfolioId); // verify ownership

    const result = await db
      .delete(schema.positions)
      .where(eq(schema.positions.id, positionId))
      .returning();

    if (result.length === 0) throw new NotFoundException('Position not found');
    return { deleted: true };
  }

  // ── Watchlists ──

  async listWatchlists(userId: string) {
    const db = getDb();
    return db
      .select()
      .from(schema.watchlists)
      .where(eq(schema.watchlists.userId, userId))
      .orderBy(schema.watchlists.sortOrder);
  }

  async createWatchlist(userId: string, name: string, feedIds: string[], tier: SubscriptionTier) {
    const db = getDb();
    const limits = TIER_LIMITS[tier];

    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.watchlists)
      .where(eq(schema.watchlists.userId, userId));

    if (existing[0].count >= limits.maxWatchlists) {
      throw new ForbiddenException('Watchlist limit reached. Upgrade to Pro.');
    }

    if (feedIds.length > limits.maxWatchlistAssets) {
      throw new ForbiddenException(
        `Max ${limits.maxWatchlistAssets} assets per watchlist. Upgrade to Pro.`,
      );
    }

    const [watchlist] = await db
      .insert(schema.watchlists)
      .values({ userId, name, feedIds: JSON.stringify(feedIds) })
      .returning();

    return watchlist;
  }

  async updateWatchlist(userId: string, watchlistId: string, data: { name?: string; feedIds?: string[] }) {
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.feedIds) updateData.feedIds = JSON.stringify(data.feedIds);

    const [updated] = await db
      .update(schema.watchlists)
      .set(updateData)
      .where(and(eq(schema.watchlists.id, watchlistId), eq(schema.watchlists.userId, userId)))
      .returning();

    if (!updated) throw new NotFoundException('Watchlist not found');
    return updated;
  }

  async deleteWatchlist(userId: string, watchlistId: string) {
    const db = getDb();
    const result = await db
      .delete(schema.watchlists)
      .where(and(eq(schema.watchlists.id, watchlistId), eq(schema.watchlists.userId, userId)))
      .returning();

    if (result.length === 0) throw new NotFoundException('Watchlist not found');
    return { deleted: true };
  }
}

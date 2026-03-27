/**
 * Price Engine — fetches prices from Pyth and pushes to Redis.
 *
 * Strategy:
 * 1. If PYTH_PRO_WS_URL is set → use Pyth Pro WebSocket (real-time)
 * 2. Fallback → poll Hermes REST API every 2 seconds
 *
 * Writes each price update to Redis cache + publishes to pub/sub channel.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { parsePythPrice } from '@pythfolio/core';
import { RedisService } from '../redis/redis.service';
import WebSocket from 'ws';

const HERMES_API = 'https://hermes.pyth.network/v2/updates/price/latest';
const POLL_INTERVAL_MS = 2000;

interface TrackedFeed {
  feedId: string;
  symbol: string;
  exponent: number;
}

@Injectable()
export class PriceEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PriceEngineService.name);
  private trackedFeeds: TrackedFeed[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private ws: WebSocket | null = null;
  private running = false;

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    // Load tracked feeds from Redis or DB (seeded by feed registry)
    await this.loadTrackedFeeds();
    this.running = true;

    const pythProWs = process.env.PYTH_PRO_WS_URL;
    if (pythProWs && process.env.PYTH_PRO_API_KEY) {
      this.logger.log('Starting Pyth Pro WebSocket price engine');
      this.startWebSocket(pythProWs);
    } else {
      this.logger.log('Starting Hermes REST polling price engine');
      this.startPolling();
    }
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.ws) this.ws.close();
  }

  /** Register feeds to track (called by feed registry after seeding) */
  setTrackedFeeds(feeds: TrackedFeed[]) {
    this.trackedFeeds = feeds;
    this.logger.log(`Tracking ${feeds.length} price feeds`);
  }

  private async loadTrackedFeeds() {
    // Will be populated by feed registry module on startup
    // For now, start with well-known feeds
    const { FEED_IDS } = await import('@pythfolio/core');
    this.trackedFeeds = Object.entries(FEED_IDS).map(([symbol, feedId]) => ({
      feedId,
      symbol,
      exponent: 8, // default, overridden by registry
    }));
  }

  // ── Hermes REST Polling ──

  private startPolling() {
    this.pollTimer = setInterval(() => {
      if (this.running) this.pollPrices();
    }, POLL_INTERVAL_MS);
    // Initial fetch
    this.pollPrices();
  }

  private async pollPrices() {
    if (this.trackedFeeds.length === 0) return;

    try {
      // Batch feeds into groups of 50 to avoid URL length limits
      const batches = this.chunk(this.trackedFeeds, 50);

      for (const batch of batches) {
        const params = new URLSearchParams();
        batch.forEach((f) => params.append('ids[]', f.feedId));

        const response = await fetch(`${HERMES_API}?${params.toString()}`, {
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          this.logger.warn(`Hermes API returned ${response.status}`);
          continue;
        }

        const data = await response.json() as { parsed?: Array<{
          id: string;
          price: { price: string; conf: string; expo: number; publish_time: number };
          metadata?: { num_publishers?: number };
        }> };

        if (!data.parsed) continue;

        for (const item of data.parsed) {
          const feedId = `0x${item.id}`;
          const feed = batch.find((f) => f.feedId === feedId);
          if (!feed) continue;

          const priceData = parsePythPrice(
            feedId,
            feed.symbol,
            {
              price: item.price.price,
              conf: item.price.conf,
              expo: item.price.expo,
              publish_time: item.price.publish_time,
            },
            item.metadata?.num_publishers ?? 0,
          );

          // Write to Redis cache + publish
          await this.redis.setPrice(feedId, priceData);
          await this.redis.publishPriceUpdate(feedId, priceData);
        }
      }
    } catch (err) {
      this.logger.error('Price poll failed:', err);
    }
  }

  // ── Pyth Pro WebSocket ──

  private startWebSocket(url: string) {
    const apiKey = process.env.PYTH_PRO_API_KEY;

    this.ws = new WebSocket(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    this.ws.on('open', () => {
      this.logger.log('Pyth Pro WebSocket connected');
      // Subscribe to all tracked feeds
      const feedIds = this.trackedFeeds.map((f) => f.feedId);
      this.ws!.send(
        JSON.stringify({
          type: 'subscribe',
          ids: feedIds,
        }),
      );
    });

    this.ws.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'price_update' && msg.price_feed) {
          const pf = msg.price_feed;
          const feedId = `0x${pf.id}`;
          const feed = this.trackedFeeds.find((f) => f.feedId === feedId);
          if (!feed) return;

          const priceData = parsePythPrice(
            feedId,
            feed.symbol,
            {
              price: pf.price.price,
              conf: pf.price.conf,
              expo: pf.price.expo,
              publish_time: pf.price.publish_time,
            },
            pf.metadata?.num_publishers ?? 0,
          );

          await this.redis.setPrice(feedId, priceData);
          await this.redis.publishPriceUpdate(feedId, priceData);
        }
      } catch (err) {
        this.logger.error('WS message parse error:', err);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('Pyth Pro WebSocket disconnected');
      if (this.running) {
        setTimeout(() => this.startWebSocket(url), 3000);
      }
    });

    this.ws.on('error', (err) => {
      this.logger.error('Pyth Pro WebSocket error:', err);
    });
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
}

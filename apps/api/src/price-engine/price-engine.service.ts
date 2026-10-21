/**
 * Price Engine — fetches prices from Pyth and pushes to Redis.
 *
 * Strategy:
 * 1. If PYTH_PRO_API_KEY is set → use Hermes SSE streaming (real-time, authenticated)
 * 2. Fallback → poll Hermes REST API every 2 seconds
 *
 * Writes each price update to Redis cache + publishes to pub/sub channel.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { parsePythPrice } from '@pythfolio/core';
import { RedisService } from '../redis/redis.service';

const HERMES_API = 'https://hermes.pyth.network/v2/updates/price/latest';
const HERMES_STREAM = 'https://hermes.pyth.network/v2/updates/price/stream';
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
  private abortController: AbortController | null = null;
  private running = false;

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    await this.loadTrackedFeeds();
    this.running = true;

    const apiKey = process.env.PYTH_PRO_API_KEY;
    if (apiKey) {
      this.logger.log('Starting Pyth Pro SSE streaming price engine');
      this.startSSEStream();
    } else {
      this.logger.log('Starting Hermes REST polling price engine');
      this.startPolling();
    }
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.abortController) this.abortController.abort();
  }

  /** Register feeds to track (called by feed registry after seeding) */
  setTrackedFeeds(feeds: TrackedFeed[]) {
    this.trackedFeeds = feeds;
    this.logger.log(`Tracking ${feeds.length} price feeds`);
  }

  private async loadTrackedFeeds() {
    const { FEED_IDS } = await import('@pythfolio/core');
    this.trackedFeeds = Object.entries(FEED_IDS).map(([symbol, feedId]) => ({
      feedId,
      symbol,
      exponent: 8,
    }));
  }

  // ── Pyth Pro SSE Streaming ──

  private async startSSEStream() {
    const apiKey = process.env.PYTH_PRO_API_KEY;
    if (!apiKey || this.trackedFeeds.length === 0) return;

    const params = new URLSearchParams();
    this.trackedFeeds.forEach((f) => params.append('ids[]', f.feedId));
    params.append('parsed', 'true');

    const url = `${HERMES_STREAM}?${params.toString()}`;

    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        this.logger.error(`SSE stream returned ${response.status}`);
        this.logger.log('Falling back to REST polling');
        this.startPolling();
        return;
      }

      this.logger.log(`SSE stream connected — tracking ${this.trackedFeeds.length} feeds`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (this.running) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE format: "data:{json}\n\n"
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // keep incomplete message

        for (const msg of messages) {
          const dataLine = msg.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(5); // strip "data:"
          try {
            const data = JSON.parse(jsonStr);
            await this.processParsedUpdate(data);
          } catch {
            // skip malformed messages
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // intentional shutdown
      this.logger.error('SSE stream error:', err.message);
    }

    // Reconnect if still running
    if (this.running) {
      this.logger.log('SSE stream disconnected, reconnecting in 3s...');
      setTimeout(() => this.startSSEStream(), 3000);
    }
  }

  private async processParsedUpdate(data: any) {
    if (!data.parsed || !Array.isArray(data.parsed)) return;

    for (const item of data.parsed) {
      const feedId = `0x${item.id}`;
      const feed = this.trackedFeeds.find((f) => f.feedId === feedId);
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
        0,
      );

      await this.redis.setPrice(feedId, priceData);
      await this.redis.publishPriceUpdate(feedId, priceData);
    }
  }

  // ── Hermes REST Polling (fallback) ──

  private startPolling() {
    this.pollTimer = setInterval(() => {
      if (this.running) this.pollPrices();
    }, POLL_INTERVAL_MS);
    this.pollPrices();
  }

  private async pollPrices() {
    if (this.trackedFeeds.length === 0) return;

    try {
      const batches = this.chunk(this.trackedFeeds, 50);

      for (const batch of batches) {
        const params = new URLSearchParams();
        batch.forEach((f) => params.append('ids[]', f.feedId));

        const headers: Record<string, string> = {};
        const apiKey = process.env.PYTH_PRO_API_KEY;
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const response = await fetch(`${HERMES_API}?${params.toString()}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          this.logger.warn(`Hermes API returned ${response.status}`);
          continue;
        }

        const data = await response.json() as any;
        await this.processParsedUpdate(data);
      }
    } catch (err) {
      this.logger.error('Price poll failed:', err);
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
}

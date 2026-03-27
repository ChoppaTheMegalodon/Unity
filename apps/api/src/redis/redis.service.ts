/**
 * Redis service — connection management, price cache, pub/sub.
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url);
    this.subscriber = new Redis(url);
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.subscriber.disconnect();
  }

  /** Get the main Redis client for reads/writes */
  getClient(): Redis {
    return this.client;
  }

  /** Get a dedicated subscriber connection */
  getSubscriber(): Redis {
    return this.subscriber;
  }

  // ── Price Cache ──

  async setPrice(feedId: string, data: object): Promise<void> {
    await this.client.set(
      `price:${feedId}`,
      JSON.stringify(data),
      'EX',
      60, // 60s TTL — stale prices expire
    );
  }

  async getPrice(feedId: string): Promise<object | null> {
    const raw = await this.client.get(`price:${feedId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async getPrices(feedIds: string[]): Promise<Record<string, object | null>> {
    if (feedIds.length === 0) return {};

    const keys = feedIds.map((id) => `price:${id}`);
    const values = await this.client.mget(...keys);

    const result: Record<string, object | null> = {};
    feedIds.forEach((id, i) => {
      result[id] = values[i] ? JSON.parse(values[i]!) : null;
    });
    return result;
  }

  // ── Pub/Sub ──

  async publishPriceUpdate(feedId: string, data: object): Promise<void> {
    await this.client.publish(
      'price_updates',
      JSON.stringify({ feedId, ...data }),
    );
  }

  async subscribeToPriceUpdates(
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe('price_updates');
    this.subscriber.on('message', (_channel: string, message: string) => {
      callback(message);
    });
  }
}

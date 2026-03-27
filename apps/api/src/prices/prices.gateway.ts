/**
 * WebSocket Gateway — fans out price updates from Redis pub/sub to clients.
 *
 * Clients send: { type: "subscribe", feedIds: ["0x..."] }
 * Server sends: { type: "price_update", feedId, price, confidence, ... }
 */

import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import type WebSocket from 'ws';

interface ClientState {
  feedIds: Set<string>;
  tier: string;
  lastSent: Map<string, number>; // feedId → timestamp of last sent update
}

@WebSocketGateway({ path: '/ws' })
export class PricesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PricesGateway.name);
  private clients = new Map<WebSocket, ClientState>();

  constructor(private redis: RedisService) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');

    // Subscribe to Redis price updates and fan out
    this.redis.subscribeToPriceUpdates((message: string) => {
      try {
        const update = JSON.parse(message);
        this.fanOut(update);
      } catch (err) {
        this.logger.error('Failed to parse price update:', err);
      }
    });
  }

  handleConnection(client: WebSocket) {
    this.clients.set(client, {
      feedIds: new Set(),
      tier: 'free', // default, upgraded on auth
      lastSent: new Map(),
    });

    client.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleClientMessage(client, msg);
      } catch {
        // ignore malformed messages
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
  }

  private handleClientMessage(client: WebSocket, msg: any) {
    const state = this.clients.get(client);
    if (!state) return;

    switch (msg.type) {
      case 'subscribe':
        if (Array.isArray(msg.feedIds)) {
          msg.feedIds.forEach((id: string) => state.feedIds.add(id));
        }
        break;

      case 'unsubscribe':
        if (Array.isArray(msg.feedIds)) {
          msg.feedIds.forEach((id: string) => state.feedIds.delete(id));
        }
        break;

      case 'auth':
        // Allow clients to upgrade their tier after auth
        if (msg.tier) state.tier = msg.tier;
        break;

      case 'ping':
        client.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private fanOut(update: any) {
    const feedId = update.feedId;
    if (!feedId) return;

    const now = Date.now();

    for (const [client, state] of this.clients) {
      if (!state.feedIds.has(feedId)) continue;
      if (client.readyState !== 1) continue; // OPEN

      // Throttle: free tier gets updates every 5s, pro gets all
      const throttleMs = state.tier === 'pro' ? 0 : 5000;
      const lastSent = state.lastSent.get(feedId) || 0;

      if (throttleMs > 0 && now - lastSent < throttleMs) continue;

      state.lastSent.set(feedId, now);
      client.send(
        JSON.stringify({
          type: 'price_update',
          ...update,
        }),
      );
    }
  }
}

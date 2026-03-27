/**
 * WebSocket client for real-time price updates.
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';

type PriceCallback = (update: {
  feedId: string;
  price: number;
  confidence: number;
  confidencePct: number;
  publishTime: number;
  numPublishers: number;
}) => void;

class PriceSocket {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<PriceCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  connect(tier: string = 'free') {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      // Re-subscribe to all feeds
      const feedIds = [...this.subscribers.keys()];
      if (feedIds.length > 0) {
        this.ws!.send(JSON.stringify({ type: 'subscribe', feedIds }));
      }
      // Send tier info
      this.ws!.send(JSON.stringify({ type: 'auth', tier }));
      // Start ping
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'price_update' && msg.feedId) {
          const callbacks = this.subscribers.get(msg.feedId);
          callbacks?.forEach((cb) => cb(msg));
        }
      } catch {
        // ignore
      }
    };

    this.ws.onclose = () => {
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.reconnectTimer = setTimeout(() => this.connect(tier), 3000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  subscribe(feedId: string, callback: PriceCallback) {
    if (!this.subscribers.has(feedId)) {
      this.subscribers.set(feedId, new Set());
      // If connected, send subscribe message
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', feedIds: [feedId] }));
      }
    }
    this.subscribers.get(feedId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.subscribers.get(feedId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(feedId);
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', feedIds: [feedId] }));
          }
        }
      }
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const priceSocket = new PriceSocket();

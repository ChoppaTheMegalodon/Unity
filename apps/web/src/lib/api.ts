/**
 * API client for PythFolio backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      if (typeof window !== 'undefined') localStorage.setItem('token', token);
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json();
  }

  // ── Auth ──

  async register(email: string, password: string, displayName: string) {
    const data = await this.request<{ accessToken: string; userId: string; tier: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, displayName }) },
    );
    this.setToken(data.accessToken);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; userId: string; tier: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    this.setToken(data.accessToken);
    return data;
  }

  async authTelegram(initData: string) {
    const data = await this.request<{ accessToken: string; userId: string; tier: string }>(
      '/auth/telegram',
      { method: 'POST', body: JSON.stringify({ initData }) },
    );
    this.setToken(data.accessToken);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // ── Feeds ──

  async getFeeds(assetClass?: string) {
    const params = assetClass ? `?class=${assetClass}` : '';
    return this.request<any[]>(`/feeds${params}`);
  }

  async searchFeeds(q: string) {
    return this.request<any[]>(`/feeds/search?q=${encodeURIComponent(q)}`);
  }

  // ── Prices ──

  async getPrices(feedIds: string[]) {
    return this.request<Record<string, any>>(`/prices?ids=${feedIds.join(',')}`);
  }

  async getPrice(feedId: string) {
    return this.request<any>(`/prices/${feedId}`);
  }

  // ── Portfolios ──

  async getPortfolios() {
    return this.request<any[]>('/portfolios');
  }

  async createPortfolio(name: string) {
    return this.request<any>('/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getPortfolio(id: string) {
    return this.request<any>(`/portfolios/${id}`);
  }

  // ── Positions ──

  async getPositions(portfolioId: string) {
    return this.request<any[]>(`/portfolios/${portfolioId}/positions`);
  }

  async addPosition(
    portfolioId: string,
    data: {
      feedId: string;
      symbol: string;
      assetClass: string;
      quantity: string;
      avgCostBasis?: string;
    },
  ) {
    return this.request<any>(`/portfolios/${portfolioId}/positions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePosition(portfolioId: string, positionId: string) {
    return this.request<any>(`/portfolios/${portfolioId}/positions/${positionId}`, {
      method: 'DELETE',
    });
  }

  // ── Watchlists ──

  async getWatchlists() {
    return this.request<any[]>('/watchlists');
  }

  async createWatchlist(name: string, feedIds: string[]) {
    return this.request<any>('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name, feedIds }),
    });
  }

  async updateWatchlist(id: string, data: { name?: string; feedIds?: string[] }) {
    return this.request<any>(`/watchlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

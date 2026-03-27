/**
 * API client for PythFolio mobile app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage' ;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('token', token);
    } else {
      await AsyncStorage.removeItem('token');
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.token = await AsyncStorage.getItem('token');
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json();
  }

  async register(email: string, password: string, displayName: string) {
    const data = await this.request<{ accessToken: string; userId: string; tier: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, displayName }) },
    );
    await this.setToken(data.accessToken);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; userId: string; tier: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    await this.setToken(data.accessToken);
    return data;
  }

  async logout() {
    await this.setToken(null);
  }

  async getFeeds(assetClass?: string) {
    const params = assetClass ? `?class=${assetClass}` : '';
    return this.request<any[]>(`/feeds${params}`);
  }

  async searchFeeds(q: string) {
    return this.request<any[]>(`/feeds/search?q=${encodeURIComponent(q)}`);
  }

  async getPrices(feedIds: string[]) {
    return this.request<Record<string, any>>(`/prices?ids=${feedIds.join(',')}`);
  }

  async getPortfolios() {
    return this.request<any[]>('/portfolios');
  }

  async getPositions(portfolioId: string) {
    return this.request<any[]>(`/portfolios/${portfolioId}/positions`);
  }

  async addPosition(
    portfolioId: string,
    data: { feedId: string; symbol: string; assetClass: string; quantity: string; avgCostBasis?: string },
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

  async getWatchlists() {
    return this.request<any[]>('/watchlists');
  }
}

export const api = new ApiClient();

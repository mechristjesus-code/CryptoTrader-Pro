import axios, { AxiosInstance } from 'axios';

export interface CryptohopperHopper {
  id: number;
  name: string;
  status: string;
  exchange: string;
  symbol: string;
  profit: number;
  profitPercent: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
}

export interface CryptohopperTrade {
  id: number;
  hopperId: number;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  profit?: number;
  timestamp: string;
}

export class CryptohopperClient {
  private client: AxiosInstance;
  private accessToken: string;
  private baseUrl = 'https://api.cryptohopper.com/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Get all hoppers (trading bots)
   */
  async getHoppers(): Promise<CryptohopperHopper[]> {
    try {
      const response = await this.client.get('/hopper');
      return response.data.data || [];
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get hoppers:', error);
      throw error;
    }
  }

  /**
   * Get hopper details by ID
   */
  async getHopperById(hopperId: number): Promise<CryptohopperHopper | null> {
    try {
      const response = await this.client.get(`/hopper/${hopperId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get hopper:', error);
      throw error;
    }
  }

  /**
   * Get hopper performance statistics
   */
  async getHopperStats(hopperId: number): Promise<any> {
    try {
      const response = await this.client.get(`/hopper/${hopperId}/stats`);
      return response.data.data || null;
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get hopper stats:', error);
      throw error;
    }
  }

  /**
   * Get trades for a hopper
   */
  async getHopperTrades(hopperId: number, limit: number = 100): Promise<CryptohopperTrade[]> {
    try {
      const response = await this.client.get(`/hopper/${hopperId}/trades`, {
        params: { limit },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get trades:', error);
      throw error;
    }
  }

  /**
   * Get trade details
   */
  async getTradeById(tradeId: number): Promise<CryptohopperTrade | null> {
    try {
      const response = await this.client.get(`/trade/${tradeId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get trade:', error);
      throw error;
    }
  }

  /**
   * Get hopper profit data
   */
  async getHopperProfit(hopperId: number): Promise<any> {
    try {
      const response = await this.client.get(`/hopper/${hopperId}/profit`);
      return response.data.data || null;
    } catch (error) {
      console.error('[CryptohopperClient] Failed to get profit data:', error);
      throw error;
    }
  }
}

export default CryptohopperClient;


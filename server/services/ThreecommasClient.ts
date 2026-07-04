import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface ThreecommasBot {
  id: number;
  name: string;
  status: string;
  exchange: string;
  pairs: string[];
  strategy: string;
  profit_percentage: number;
  profit: number;
  total_deals: number;
  active_deals: number;
}

export interface ThreecommasDeal {
  id: number;
  bot_id: number;
  pair: string;
  status: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  profit: number;
  profit_percentage: number;
  opened_at: string;
  closed_at?: string;
}

export class ThreecommasClient {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.3commas.io/api';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Get all bots for the user
   */
  async getBots(): Promise<ThreecommasBot[]> {
    try {
      const response = await this.makeRequest('GET', '/v1/bots', {});
      return response.data || [];
    } catch (error) {
      console.error('[ThreecommasClient] Failed to get bots:', error);
      throw error;
    }
  }

  /**
   * Get bot details by ID
   */
  async getBotById(botId: number): Promise<ThreecommasBot | null> {
    try {
      const response = await this.makeRequest('GET', `/v1/bots/${botId}`, {});
      return response.data || null;
    } catch (error) {
      console.error('[ThreecommasClient] Failed to get bot:', error);
      throw error;
    }
  }

  /**
   * Get deals for a specific bot
   */
  async getBotDeals(botId: number, limit: number = 100): Promise<ThreecommasDeal[]> {
    try {
      const response = await this.makeRequest('GET', `/v1/bots/${botId}/deals`, {
        limit,
      });
      return response.data || [];
    } catch (error) {
      console.error('[ThreecommasClient] Failed to get deals:', error);
      throw error;
    }
  }

  /**
   * Get deal details
   */
  async getDealById(dealId: number): Promise<ThreecommasDeal | null> {
    try {
      const response = await this.makeRequest('GET', `/v1/deals/${dealId}`, {});
      return response.data || null;
    } catch (error) {
      console.error('[ThreecommasClient] Failed to get deal:', error);
      throw error;
    }
  }

  /**
   * Make an API request with HMAC SHA256 signing
   */
  private async makeRequest(method: string, endpoint: string, params: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(endpoint, params, timestamp);

    const headers: any = {
      'Apikey': this.apiKey,
      'Sign': signature,
      'Timestamp': timestamp,
    };

    try {
      const config: any = { headers };
      if (method === 'GET') {
        config.params = params;
      } else {
        config.data = params;
      }

      const response = await this.client.request({
        method,
        url: endpoint,
        ...config,
      });

      return response.data;
    } catch (error) {
      console.error('[ThreecommasClient] Request failed:', error);
      throw error;
    }
  }

  /**
   * Generate HMAC SHA256 signature
   */
  private generateSignature(endpoint: string, params: any, timestamp: number): string {
    const message = `${endpoint}${timestamp}${JSON.stringify(params)}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }
}

export default ThreecommasClient;


import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface KrakenOHLC {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
}

export interface KrakenTicker {
  ask: string[];
  bid: string[];
  c: string[];
  h: string[];
  l: string[];
  o: string[];
  p: string[];
  t: number[];
  v: string[];
}

export class KrakenClient {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.kraken.com';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Get OHLC data for a trading pair
   * @param pair Trading pair (e.g., XXBTZUSD)
   * @param interval Timeframe in minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
   * @param since Optional timestamp to retrieve data since
   */
  async getOHLC(pair: string, interval: number = 1440, since?: number): Promise<KrakenOHLC[]> {
    try {
      const params: any = { pair, interval };
      if (since) params.since = since;

      const response = await this.client.get('/0/public/OHLC', { params });
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      const ohlcData = response.data.result[pair] || [];
      return ohlcData.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[6],
        trades: candle[7],
      }));
    } catch (error) {
      console.error('[KrakenClient] Failed to get OHLC:', error);
      throw error;
    }
  }

  /**
   * Get ticker information for a trading pair
   */
  async getTicker(pair: string): Promise<KrakenTicker | null> {
    try {
      const response = await this.client.get('/0/public/Ticker', {
        params: { pair },
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result[pair] || null;
    } catch (error) {
      console.error('[KrakenClient] Failed to get ticker:', error);
      throw error;
    }
  }

  /**
   * Get account balance (requires private API key)
   */
  async getBalance(): Promise<Record<string, string>> {
    try {
      const response = await this.makePrivateRequest('/0/private/Balance', {});

      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.error.join(', ')}`);
      }

      return response.result || {};
    } catch (error) {
      console.error('[KrakenClient] Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get trade history (requires private API key)
   */
  async getTradeHistory(trades: boolean = true, start?: number): Promise<any> {
    try {
      const params: any = { trades };
      if (start) params.start = start;

      const response = await this.makePrivateRequest('/0/private/TradesHistory', params);

      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.error.join(', ')}`);
      }

      return response.result || {};
    } catch (error) {
      console.error('[KrakenClient] Failed to get trade history:', error);
      throw error;
    }
  }

  /**
   * Make a private API request (requires signing)
   */
  private async makePrivateRequest(endpoint: string, params: any): Promise<any> {
    const nonce = Date.now() * 1000;
    const postdata = new URLSearchParams({ ...params, nonce });
    const postdataString = postdata.toString();

    const message = endpoint + postdataString;
    const signature = this.getMessageSignature(message);

    try {
      const response = await this.client.post(endpoint, postdataString, {
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': signature,
        },
      });

      return response.data;
    } catch (error) {
      console.error('[KrakenClient] Private request failed:', error);
      throw error;
    }
  }

  /**
   * Generate message signature for private requests
   */
  private getMessageSignature(message: string): string {
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const hmac = crypto.createHmac('sha512', Buffer.from(this.apiSecret, 'base64'));
    hmac.update(messageHash);
    return hmac.digest('base64');
  }
}

export default KrakenClient;

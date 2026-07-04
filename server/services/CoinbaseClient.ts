import crypto from 'crypto';
import axios from 'axios';

export class CoinbaseClient {
  private baseURL = 'https://api.coinbase.com/api/v3';

  /**
   * Sign request for Coinbase API v3
   */
  private signRequest(
    method: string,
    requestPath: string,
    body: string,
    timestamp: string,
    secret: string
  ): string {
    const message = timestamp + method + requestPath + body;
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(message).digest('base64');
  }

  /**
   * Get account information
   */
  async getAccounts(apiKey: string, apiSecret: string) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'GET';
      const requestPath = '/brokerage/accounts';
      const body = '';

      const signature = this.signRequest(method, requestPath, body, timestamp, apiSecret);

      const response = await axios.get(`${this.baseURL}${requestPath}`, {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
        },
      });

      return response.data.accounts || [];
    } catch (error) {
      console.error('Error fetching Coinbase accounts:', error);
      throw error;
    }
  }

  /**
   * Get product (trading pair) information
   */
  async getProducts() {
    try {
      const response = await axios.get(`${this.baseURL}/brokerage/products`);
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching Coinbase products:', error);
      throw error;
    }
  }

  /**
   * Get product ticker (price data)
   */
  async getTicker(productId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/brokerage/product_ticker?product_id=${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Coinbase ticker:', error);
      throw error;
    }
  }

  /**
   * Get OHLC (candlestick) data
   */
  async getOHLC(productId: string, granularity: number = 60) {
    try {
      const response = await axios.get(
        `${this.baseURL}/brokerage/products/${productId}/candles?granularity=${granularity}`
      );
      return response.data.candles || [];
    } catch (error) {
      console.error('Error fetching Coinbase OHLC:', error);
      throw error;
    }
  }

  /**
   * Get orders
   */
  async getOrders(apiKey: string, apiSecret: string, productId?: string) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'GET';
      let requestPath = '/brokerage/orders/historical/batch';
      if (productId) {
        requestPath += `?product_id=${productId}`;
      }
      const body = '';

      const signature = this.signRequest(method, requestPath, body, timestamp, apiSecret);

      const response = await axios.get(`${this.baseURL}${requestPath}`, {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
        },
      });

      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching Coinbase orders:', error);
      throw error;
    }
  }

  /**
   * Get fills (trade history)
   */
  async getFills(apiKey: string, apiSecret: string, productId?: string) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'GET';
      let requestPath = '/brokerage/orders/historical/fills';
      if (productId) {
        requestPath += `?product_id=${productId}`;
      }
      const body = '';

      const signature = this.signRequest(method, requestPath, body, timestamp, apiSecret);

      const response = await axios.get(`${this.baseURL}${requestPath}`, {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
        },
      });

      return response.data.fills || [];
    } catch (error) {
      console.error('Error fetching Coinbase fills:', error);
      throw error;
    }
  }

  /**
   * Create order
   */
  async createOrder(
    apiKey: string,
    apiSecret: string,
    productId: string,
    side: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    size?: string,
    price?: string
  ) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'POST';
      const requestPath = '/brokerage/orders';
      const orderData = {
        product_id: productId,
        side,
        order_type: orderType,
        ...(size && { size }),
        ...(price && { price }),
      };
      const body = JSON.stringify(orderData);

      const signature = this.signRequest(method, requestPath, body, timestamp, apiSecret);

      const response = await axios.post(`${this.baseURL}${requestPath}`, orderData, {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Coinbase order:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(apiKey: string, apiSecret: string, orderId: string) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'DELETE';
      const requestPath = `/brokerage/orders/${orderId}`;
      const body = '';

      const signature = this.signRequest(method, requestPath, body, timestamp, apiSecret);

      const response = await axios.delete(`${this.baseURL}${requestPath}`, {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error cancelling Coinbase order:', error);
      throw error;
    }
  }
}

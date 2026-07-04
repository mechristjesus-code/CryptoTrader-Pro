import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { CoinbaseClient } from '../services/CoinbaseClient';

const coinbaseClient = new CoinbaseClient();

export const coinbaseRouter = router({
  // Store Coinbase API credentials
  storeCredentials: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return { success: true };
    }),

  // Get Coinbase accounts
  getAccounts: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const accounts = await coinbaseClient.getAccounts(input.apiKey, input.apiSecret);
        return accounts;
      } catch (error) {
        console.error('Error fetching Coinbase accounts:', error);
        return [];
      }
    }),

  // Get available products (trading pairs)
  getProducts: publicProcedure.query(async () => {
    try {
      const products = await coinbaseClient.getProducts();
      return products;
    } catch (error) {
      console.error('Error fetching Coinbase products:', error);
      return [];
    }
  }),

  // Get product ticker
  getTicker: publicProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const ticker = await coinbaseClient.getTicker(input.productId);
        return ticker;
      } catch (error) {
        console.error('Error fetching ticker:', error);
        return null;
      }
    }),

  // Get OHLC data
  getOHLC: publicProcedure
    .input(z.object({
      productId: z.string(),
      granularity: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const ohlc = await coinbaseClient.getOHLC(input.productId, input.granularity || 60);
        return ohlc;
      } catch (error) {
        console.error('Error fetching OHLC:', error);
        return [];
      }
    }),

  // Get orders
  getOrders: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
      productId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const orders = await coinbaseClient.getOrders(input.apiKey, input.apiSecret, input.productId);
        return orders;
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    }),

  // Get trade history (fills)
  getFills: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
      productId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const fills = await coinbaseClient.getFills(input.apiKey, input.apiSecret, input.productId);
        return fills;
      } catch (error) {
        console.error('Error fetching fills:', error);
        return [];
      }
    }),

  // Create order
  createOrder: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
      productId: z.string(),
      side: z.enum(['BUY', 'SELL']),
      orderType: z.enum(['MARKET', 'LIMIT']),
      size: z.string().optional(),
      price: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const order = await coinbaseClient.createOrder(
          input.apiKey,
          input.apiSecret,
          input.productId,
          input.side,
          input.orderType,
          input.size,
          input.price
        );
        return order;
      } catch (error) {
        console.error('Error creating order:', error);
        throw error;
      }
    }),

  // Cancel order
  cancelOrder: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      apiSecret: z.string(),
      orderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await coinbaseClient.cancelOrder(input.apiKey, input.apiSecret, input.orderId);
        return result;
      } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
      }
    }),
});

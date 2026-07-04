import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { advancedOrders, orderHistory } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const createOrderSchema = z.object({
  symbol: z.string().min(1),
  orderType: z.enum(['limit', 'stop_loss', 'take_profit', 'trailing_stop', 'oco']),
  side: z.enum(['buy', 'sell']),
  quantity: z.string().regex(/^\d+(\.\d+)?$/),
  entryPrice: z.string().regex(/^\d+(\.\d+)?$/),
  limitPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  stopPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  trailingPercent: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  exchange: z.string().min(1),
  expiresAt: z.date().optional(),
});

export const ordersRouter = router({
  /**
   * Create a new advanced order
   */
  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const result = await db.insert(advancedOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        orderType: input.orderType,
        side: input.side,
        quantity: input.quantity,
        entryPrice: input.entryPrice,
        limitPrice: input.limitPrice,
        stopPrice: input.stopPrice,
        trailingPercent: input.trailingPercent,
        exchange: input.exchange,
        expiresAt: input.expiresAt,
      });

      return {
        id: (result as any).insertId || 0,
        message: `${input.orderType} order created successfully`,
      };
    }),

  /**
   * Get all orders for the current user
   */
  getOrders: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'active', 'filled', 'cancelled', 'expired']).optional(),
      symbol: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      let conditions: any[] = [eq(advancedOrders.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(advancedOrders.status, input.status));
      }

      if (input.symbol) {
        conditions.push(eq(advancedOrders.symbol, input.symbol));
      }

      return await db.select().from(advancedOrders).where(
        conditions.length > 1 ? and(...conditions) : conditions[0]
      );
    }),

  /**
   * Cancel an order
   */
  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify order belongs to user
      const order = await db.select().from(advancedOrders).where(
        and(
          eq(advancedOrders.id, input.orderId),
          eq(advancedOrders.userId, ctx.user.id)
        )
      );

      if (order.length === 0) throw new Error('Order not found');

      await db.update(advancedOrders)
        .set({ status: 'cancelled' })
        .where(eq(advancedOrders.id, input.orderId));

      // Log cancellation in history
      await db.insert(orderHistory).values({
        orderId: input.orderId,
        status: 'cancelled',
        notes: 'Order cancelled by user',
      });

      return { message: 'Order cancelled successfully' };
    }),

  /**
   * Get order history
   */
  getOrderHistory: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      return await db.select().from(orderHistory).where(
        eq(orderHistory.orderId, input.orderId)
      );
    }),

  /**
   * Update order status (for internal use)
   */
  updateOrderStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'active', 'filled', 'cancelled', 'expired']),
      executedPrice: z.string().optional(),
      executedQuantity: z.string().optional(),
      fee: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      await db.update(advancedOrders)
        .set({
          status: input.status,
          executedPrice: input.executedPrice,
          executedQuantity: input.executedQuantity,
        })
        .where(eq(advancedOrders.id, input.orderId));

      // Log status change
      await db.insert(orderHistory).values({
        orderId: input.orderId,
        status: input.status,
        price: input.executedPrice,
        quantity: input.executedQuantity,
        fee: input.fee,
      });

      return { message: 'Order status updated' };
    }),
});

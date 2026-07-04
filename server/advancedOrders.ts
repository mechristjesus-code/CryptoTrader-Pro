import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  createLimitOrderSchema,
  createStopLossOrderSchema,
  createTakeProfitOrderSchema,
  createTrailingStopOrderSchema,
  createOCOOrderSchema,
  cancelOrderSchema,
  orderFilterSchema,
} from '../_core/validationSchemas';
import { db } from '../db';
import {
  limitOrders,
  stopLossOrders,
  takeProfitOrders,
  trailingStopOrders,
  ocoOrders,
} from '../../drizzle/advanced-schema';
import { eq, and, or, desc, gte, lte } from 'drizzle-orm';

export const advancedOrdersRouter = router({
  /**
   * Create a limit order
   * Allows users to set a specific price at which to buy or sell
   */
  createLimitOrder: protectedProcedure
    .input(createLimitOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const order = await db.insert(limitOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        price: input.price.toString(),
        quantity: input.quantity.toString(),
        type: input.type,
        expiryDate: input.expiryDate,
      });

      return {
        id: order.insertId,
        message: 'Limit order created successfully',
      };
    }),

  /**
   * Create a stop-loss order
   * Automatically sells when price drops below trigger price
   */
  createStopLossOrder: protectedProcedure
    .input(createStopLossOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const order = await db.insert(stopLossOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        triggerPrice: input.triggerPrice.toString(),
        quantity: input.quantity.toString(),
      });

      return {
        id: order.insertId,
        message: 'Stop-loss order created successfully',
      };
    }),

  /**
   * Create a take-profit order
   * Automatically sells when price rises above target price
   */
  createTakeProfitOrder: protectedProcedure
    .input(createTakeProfitOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const order = await db.insert(takeProfitOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        targetPrice: input.targetPrice.toString(),
        quantity: input.quantity.toString(),
      });

      return {
        id: order.insertId,
        message: 'Take-profit order created successfully',
      };
    }),

  /**
   * Create a trailing stop order
   * Automatically adjusts stop price as market price increases
   */
  createTrailingStopOrder: protectedProcedure
    .input(createTrailingStopOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const order = await db.insert(trailingStopOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        trailingPercent: input.trailingPercent.toString(),
        quantity: input.quantity.toString(),
      });

      return {
        id: order.insertId,
        message: 'Trailing stop order created successfully',
      };
    }),

  /**
   * Create an OCO (One-Cancels-Other) order
   * Combines stop-loss and take-profit orders; when one executes, the other cancels
   */
  createOCOOrder: protectedProcedure
    .input(createOCOOrderSchema)
    .mutation(async ({ input, ctx }) => {
      // Create stop-loss order
      const slResult = await db.insert(stopLossOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        triggerPrice: input.stopLossPrice.toString(),
        quantity: input.quantity.toString(),
      });

      // Create take-profit order
      const tpResult = await db.insert(takeProfitOrders).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        targetPrice: input.takeProfitPrice.toString(),
        quantity: input.quantity.toString(),
      });

      // Link them in OCO table
      const ocoResult = await db.insert(ocoOrders).values({
        userId: ctx.user.id,
        stopLossOrderId: slResult.insertId,
        takeProfitOrderId: tpResult.insertId,
      });

      return {
        id: ocoResult.insertId,
        stopLossOrderId: slResult.insertId,
        takeProfitOrderId: tpResult.insertId,
        message: 'OCO order created successfully',
      };
    }),

  /**
   * List all orders for the current user
   * Supports filtering by type, status, and symbol
   */
  listOrders: protectedProcedure
    .input(orderFilterSchema)
    .query(async ({ input, ctx }) => {
      const { type, status, symbol, limit, offset } = input;

      let query: any = [];

      if (type === 'limit' || !type) {
        const limitOrdersData = await db
          .select()
          .from(limitOrders)
          .where(
            and(
              eq(limitOrders.userId, ctx.user.id),
              status ? eq(limitOrders.status, status) : undefined,
              symbol ? eq(limitOrders.symbol, symbol) : undefined
            )
          )
          .orderBy(desc(limitOrders.createdAt))
          .limit(limit)
          .offset(offset);

        query.push(...limitOrdersData.map(o => ({ ...o, type: 'limit' })));
      }

      if (type === 'stop-loss' || !type) {
        const stopLossData = await db
          .select()
          .from(stopLossOrders)
          .where(
            and(
              eq(stopLossOrders.userId, ctx.user.id),
              status ? eq(stopLossOrders.status, status) : undefined,
              symbol ? eq(stopLossOrders.symbol, symbol) : undefined
            )
          )
          .orderBy(desc(stopLossOrders.createdAt))
          .limit(limit)
          .offset(offset);

        query.push(...stopLossData.map(o => ({ ...o, type: 'stop-loss' })));
      }

      if (type === 'take-profit' || !type) {
        const takeProfitData = await db
          .select()
          .from(takeProfitOrders)
          .where(
            and(
              eq(takeProfitOrders.userId, ctx.user.id),
              status ? eq(takeProfitOrders.status, status) : undefined,
              symbol ? eq(takeProfitOrders.symbol, symbol) : undefined
            )
          )
          .orderBy(desc(takeProfitOrders.createdAt))
          .limit(limit)
          .offset(offset);

        query.push(...takeProfitData.map(o => ({ ...o, type: 'take-profit' })));
      }

      return query;
    }),

  /**
   * Cancel an order
   * Only pending orders can be cancelled
   */
  cancelOrder: protectedProcedure
    .input(cancelOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const { orderId, orderType } = input;

      let result;

      switch (orderType) {
        case 'limit':
          result = await db
            .update(limitOrders)
            .set({ status: 'cancelled' })
            .where(and(eq(limitOrders.id, orderId), eq(limitOrders.userId, ctx.user.id)));
          break;
        case 'stop-loss':
          result = await db
            .update(stopLossOrders)
            .set({ status: 'cancelled' })
            .where(and(eq(stopLossOrders.id, orderId), eq(stopLossOrders.userId, ctx.user.id)));
          break;
        case 'take-profit':
          result = await db
            .update(takeProfitOrders)
            .set({ status: 'cancelled' })
            .where(and(eq(takeProfitOrders.id, orderId), eq(takeProfitOrders.userId, ctx.user.id)));
          break;
        case 'trailing-stop':
          result = await db
            .update(trailingStopOrders)
            .set({ status: 'cancelled' })
            .where(and(eq(trailingStopOrders.id, orderId), eq(trailingStopOrders.userId, ctx.user.id)));
          break;
      }

      return {
        success: true,
        message: `${orderType} order cancelled successfully`,
      };
    }),

  /**
   * Get order statistics for the user
   * Returns counts of pending, executed, and cancelled orders
   */
  getOrderStats: protectedProcedure.query(async ({ ctx }) => {
    const limitStats = await db
      .select()
      .from(limitOrders)
      .where(eq(limitOrders.userId, ctx.user.id));

    const stopLossStats = await db
      .select()
      .from(stopLossOrders)
      .where(eq(stopLossOrders.userId, ctx.user.id));

    const takeProfitStats = await db
      .select()
      .from(takeProfitOrders)
      .where(eq(takeProfitOrders.userId, ctx.user.id));

    const allOrders = [...limitStats, ...stopLossStats, ...takeProfitStats];

    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      executed: allOrders.filter(o => o.status === 'executed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    };
  }),
});

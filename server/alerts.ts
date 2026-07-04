import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  createPriceAlertSchema,
  createIndicatorAlertSchema,
  createWebhookSchema,
  createScheduledTaskSchema,
  paginationSchema,
} from '../_core/validationSchemas';
import { db } from '../db';
import {
  priceAlerts,
  indicatorAlerts,
  webhooks,
  scheduledTasks,
} from '../../drizzle/advanced-schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

export const alertsRouter = router({
  /**
   * Create a price alert
   * Triggers when price goes above or below specified level
   */
  createPriceAlert: protectedProcedure
    .input(createPriceAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const alert = await db.insert(priceAlerts).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        price: input.price.toString(),
        type: input.type,
      });

      return {
        id: alert.insertId,
        message: `Price alert created for ${input.symbol} at ${input.price}`,
      };
    }),

  /**
   * Create an indicator alert
   * Triggers when technical indicator crosses threshold
   */
  createIndicatorAlert: protectedProcedure
    .input(createIndicatorAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const alert = await db.insert(indicatorAlerts).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        indicator: input.indicator,
        threshold: input.threshold.toString(),
        type: input.type,
      });

      return {
        id: alert.insertId,
        message: `Indicator alert created for ${input.symbol} ${input.indicator}`,
      };
    }),

  /**
   * List all alerts for the user
   */
  listAlerts: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      const priceAlertsData = await db
        .select()
        .from(priceAlerts)
        .where(eq(priceAlerts.userId, ctx.user.id))
        .orderBy(desc(priceAlerts.createdAt))
        .limit(limit)
        .offset(offset);

      const indicatorAlertsData = await db
        .select()
        .from(indicatorAlerts)
        .where(eq(indicatorAlerts.userId, ctx.user.id))
        .orderBy(desc(indicatorAlerts.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        priceAlerts: priceAlertsData,
        indicatorAlerts: indicatorAlertsData,
      };
    }),

  /**
   * Dismiss an alert
   */
  dismissAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      alertType: z.enum(['price', 'indicator']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { alertId, alertType } = input;

      if (alertType === 'price') {
        await db
          .update(priceAlerts)
          .set({ status: 'cancelled' })
          .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, ctx.user.id)));
      } else {
        await db
          .update(indicatorAlerts)
          .set({ status: 'cancelled' })
          .where(and(eq(indicatorAlerts.id, alertId), eq(indicatorAlerts.userId, ctx.user.id)));
      }

      return { success: true };
    }),

  /**
   * Create a webhook for event notifications
   */
  createWebhook: protectedProcedure
    .input(createWebhookSchema)
    .mutation(async ({ input, ctx }) => {
      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await db.insert(webhooks).values({
        userId: ctx.user.id,
        url: input.url,
        events: JSON.stringify(input.events),
        secret,
      });

      return {
        id: webhook.insertId,
        secret,
        message: 'Webhook created successfully',
      };
    }),

  /**
   * List all webhooks for the user
   */
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, ctx.user.id))
      .orderBy(desc(webhooks.createdAt));

    return userWebhooks.map(w => ({
      ...w,
      secret: '***' + w.secret.slice(-4), // Hide secret
    }));
  }),

  /**
   * Delete a webhook
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(webhooks)
        .set({ status: 'inactive' })
        .where(and(eq(webhooks.id, input.webhookId), eq(webhooks.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Create a scheduled task
   */
  createScheduledTask: protectedProcedure
    .input(createScheduledTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const task = await db.insert(scheduledTasks).values({
        userId: ctx.user.id,
        taskType: input.taskType,
        parameters: JSON.stringify(input.parameters),
        scheduleTime: input.scheduleTime,
        frequency: input.frequency,
        nextExecutionAt: input.scheduleTime,
      });

      return {
        id: task.insertId,
        message: 'Scheduled task created successfully',
      };
    }),

  /**
   * List all scheduled tasks for the user
   */
  listScheduledTasks: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.userId, ctx.user.id),
          eq(scheduledTasks.status, 'pending')
        )
      )
      .orderBy(scheduledTasks.nextExecutionAt);

    return tasks;
  }),

  /**
   * Cancel a scheduled task
   */
  cancelScheduledTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(scheduledTasks)
        .set({ status: 'cancelled' })
        .where(and(eq(scheduledTasks.id, input.taskId), eq(scheduledTasks.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Get alert statistics
   */
  getAlertStats: protectedProcedure.query(async ({ ctx }) => {
    const priceAlertsCount = await db
      .select()
      .from(priceAlerts)
      .where(
        and(
          eq(priceAlerts.userId, ctx.user.id),
          eq(priceAlerts.status, 'active')
        )
      );

    const indicatorAlertsCount = await db
      .select()
      .from(indicatorAlerts)
      .where(
        and(
          eq(indicatorAlerts.userId, ctx.user.id),
          eq(indicatorAlerts.status, 'active')
        )
      );

    const webhooksCount = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.userId, ctx.user.id),
          eq(webhooks.status, 'active')
        )
      );

    const tasksCount = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.userId, ctx.user.id),
          eq(scheduledTasks.status, 'pending')
        )
      );

    return {
      priceAlerts: priceAlertsCount.length,
      indicatorAlerts: indicatorAlertsCount.length,
      webhooks: webhooksCount.length,
      scheduledTasks: tasksCount.length,
    };
  }),
});

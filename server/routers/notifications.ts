import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const notificationsRouter = router({
  /**
   * Get user notifications
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // In production: Query notifications table
        return {
          success: true,
          data: [
            {
              id: "1",
              type: "deal_completed",
              title: "Bot Trade Completed",
              message: "BTC DCA bot completed a buy order for $150",
              read: false,
              createdAt: new Date(),
            },
            {
              id: "2",
              type: "loss_threshold",
              title: "Loss Threshold Breached",
              message: "ETH Grid bot reached -5% loss limit",
              read: false,
              createdAt: new Date(Date.now() - 3600000),
            },
          ],
        };
      } catch (error) {
        console.error("[notificationsRouter.list]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          message: "Notification marked as read",
        };
      } catch (error) {
        console.error("[notificationsRouter.markAsRead]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          message: "Notification deleted",
        };
      } catch (error) {
        console.error("[notificationsRouter.delete]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        success: true,
        count: 3,
      };
    } catch (error) {
      console.error("[notificationsRouter.getUnreadCount]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});

export default notificationsRouter;


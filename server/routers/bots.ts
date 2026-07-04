import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserBots,
  getBotById,
  upsertBot,
  getBotDeals,
  getThreecommasAccount,
  getCryptohopperAccount,
  getKrakenAccount,
  getUserNotifications,
  getUserSettings,
} from "../db";
import ThreecommasClient from "../services/ThreecommasClient";
import CryptohopperClient from "../services/CryptohopperClient";
import KrakenClient from "../services/KrakenClient";

export const botsRouter = router({
  /**
   * List all bots for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const bots = await getUserBots(ctx.user.id);
      return {
        success: true,
        data: bots,
      };
    } catch (error) {
      console.error("[botsRouter.list]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get bot details by ID
   */
  getById: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const bot = await getBotById(input.botId);
        if (!bot || bot.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Bot not found",
          };
        }
        return {
          success: true,
          data: bot,
        };
      } catch (error) {
        console.error("[botsRouter.getById]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get bot deals/history
   */
  getDeals: protectedProcedure
    .input(z.object({ botId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input, ctx }) => {
      try {
        const bot = await getBotById(input.botId);
        if (!bot || bot.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Bot not found",
          };
        }

        const deals = await getBotDeals(input.botId, input.limit);
        return {
          success: true,
          data: deals,
        };
      } catch (error) {
        console.error("[botsRouter.getDeals]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Sync bots from 3Commas
   */
  syncThreecommas: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const account = await getThreecommasAccount(ctx.user.id);
      if (!account) {
        return {
          success: false,
          error: "3Commas account not connected",
        };
      }

      const client = new ThreecommasClient(account.apiKey, account.apiSecret);
      const bots = await client.getBots();

      let synced = 0;
      for (const bot of bots) {
        await upsertBot({
          userId: ctx.user.id,
          platform: "3commas",
          platformBotId: bot.id.toString(),
          botName: bot.name,
          status: bot.status as any,
          exchange: bot.exchange,
          tradingPair: bot.pairs?.[0] || "",
          totalProfit: bot.profit.toString(),
          winRate: bot.profit_percentage.toString(),
          totalDeals: bot.total_deals,
          openDeals: bot.active_deals,
          metadata: {
            strategy: bot.strategy,
            pairs: bot.pairs,
          },
        });
        synced++;
      }

      return {
        success: true,
        message: `Synced ${synced} bots from 3Commas`,
        data: { synced },
      };
    } catch (error) {
      console.error("[botsRouter.syncThreecommas]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Sync bots from Cryptohopper
   */
  syncCryptohopper: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const account = await getCryptohopperAccount(ctx.user.id);
      if (!account) {
        return {
          success: false,
          error: "Cryptohopper account not connected",
        };
      }

      const client = new CryptohopperClient(account.accessToken);
      const hoppers = await client.getHoppers();

      let synced = 0;
      for (const hopper of hoppers) {
        await upsertBot({
          userId: ctx.user.id,
          platform: "cryptohopper",
          platformBotId: hopper.id.toString(),
          botName: hopper.name,
          status: hopper.status as any,
          exchange: hopper.exchange,
          tradingPair: hopper.symbol,
          totalProfit: hopper.profit.toString(),
          winRate: hopper.profitPercent.toString(),
          totalDeals: hopper.totalTrades,
          openDeals: 0,
          metadata: {
            winningTrades: hopper.winningTrades,
            winRate: hopper.winRate,
          },
        });
        synced++;
      }

      return {
        success: true,
        message: `Synced ${synced} hoppers from Cryptohopper`,
        data: { synced },
      };
    } catch (error) {
      console.error("[botsRouter.syncCryptohopper]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get dashboard stats
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const bots = await getUserBots(ctx.user.id);
      const notifications = await getUserNotifications(ctx.user.id, 10);
      const settings = await getUserSettings(ctx.user.id);

      const activeBots = bots.filter((b) => b.status === "active").length;
      const totalProfit = bots.reduce((sum, b) => sum + (parseFloat(b.totalProfit?.toString() || "0")), 0);
      const avgWinRate = bots.length > 0 ? bots.reduce((sum, b) => sum + (parseFloat(b.winRate?.toString() || "0")), 0) / bots.length : 0;

      return {
        success: true,
        data: {
          totalBots: bots.length,
          activeBots,
          totalProfit,
          avgWinRate: avgWinRate.toFixed(2),
          recentNotifications: notifications.slice(0, 5),
          userSettings: settings,
        },
      };
    } catch (error) {
      console.error("[botsRouter.getDashboardStats]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});

export default botsRouter;

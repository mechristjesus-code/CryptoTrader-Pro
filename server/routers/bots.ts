import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
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

interface BotPerformanceMetrics {
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageWinTrade: number;
  averageLossTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

interface PortfolioMetrics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  allTimeChange: number;
  allTimeChangePercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface BotEquityCurve {
  timestamp: number;
  equity: number;
  profit: number;
}

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
   * Get detailed bot performance metrics
   */
  getPerformanceMetrics: protectedProcedure
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

        const deals = await getBotDeals(input.botId, 1000);
        const metrics = calculatePerformanceMetrics(deals);

        return {
          success: true,
          data: {
            botId: input.botId,
            botName: bot.botName,
            metrics,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[botsRouter.getPerformanceMetrics]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get bot equity curve (historical performance)
   */
  getEquityCurve: protectedProcedure
    .input(z.object({ botId: z.number(), days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      try {
        const bot = await getBotById(input.botId);
        if (!bot || bot.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Bot not found",
          };
        }

        const equityCurve = generateMockEquityCurve(input.days);

        return {
          success: true,
          data: {
            botId: input.botId,
            botName: bot.botName,
            equityCurve,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[botsRouter.getEquityCurve]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get trade history visualization data
   */
  getTradeHistory: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        limit: z.number().default(50),
      })
    )
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
        const tradeHistory = deals.map((deal: any) => ({
          id: deal.id,
          timestamp: deal.timestamp || Date.now(),
          entryPrice: parseFloat(deal.entryPrice || "0"),
          exitPrice: parseFloat(deal.exitPrice || "0"),
          profit: parseFloat(deal.profit || "0"),
          profitPercent: parseFloat(deal.profitPercent || "0"),
          status: deal.status,
          duration: deal.duration || 0,
        }));

        return {
          success: true,
          data: {
            botId: input.botId,
            botName: bot.botName,
            trades: tradeHistory,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[botsRouter.getTradeHistory]", error);
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
   * Get comprehensive dashboard stats
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const bots = await getUserBots(ctx.user.id);
      const notifications = await getUserNotifications(ctx.user.id, 10);
      const settings = await getUserSettings(ctx.user.id);

      const activeBots = bots.filter((b) => b.status === "active").length;
      const totalProfit = bots.reduce(
        (sum, b) => sum + (parseFloat(b.totalProfit?.toString() || "0") || 0),
        0
      );
      const avgWinRate =
        bots.length > 0
          ? bots.reduce(
              (sum, b) => sum + (parseFloat(b.winRate?.toString() || "0") || 0),
              0
            ) / bots.length
          : 0;

      const portfolioMetrics = generateMockPortfolioMetrics(totalProfit);

      return {
        success: true,
        data: {
          totalBots: bots.length,
          activeBots,
          inactiveBots: bots.length - activeBots,
          totalProfit,
          avgWinRate: avgWinRate.toFixed(2),
          portfolioMetrics,
          recentNotifications: notifications.slice(0, 5),
          userSettings: settings,
          timestamp: Date.now(),
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

  /**
   * Get portfolio metrics for all bots
   */
  getPortfolioMetrics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const bots = await getUserBots(ctx.user.id);
      const totalProfit = bots.reduce(
        (sum, b) => sum + (parseFloat(b.totalProfit?.toString() || "0") || 0),
        0
      );
      const metrics = generateMockPortfolioMetrics(totalProfit);

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      console.error("[botsRouter.getPortfolioMetrics]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get bot comparison data
   */
  compareBots: protectedProcedure
    .input(z.object({ botIds: z.array(z.number()) }))
    .query(async ({ input, ctx }) => {
      try {
        const comparison = [];

        for (const botId of input.botIds) {
          const bot = await getBotById(botId);
          if (!bot || bot.userId !== ctx.user.id) continue;

          const deals = await getBotDeals(botId, 100);
          const metrics = calculatePerformanceMetrics(deals);

          comparison.push({
            botId,
            botName: bot.botName,
            platform: bot.platform,
            status: bot.status,
            metrics,
          });
        }

        return {
          success: true,
          data: comparison,
        };
      } catch (error) {
        console.error("[botsRouter.compareBots]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});

// Helper functions
function calculatePerformanceMetrics(deals: any[]): BotPerformanceMetrics {
  if (deals.length === 0) {
    return {
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageWinTrade: 0,
      averageLossTrade: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
    };
  }

  let totalProfit = 0;
  let totalLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  const returns: number[] = [];

  for (const deal of deals) {
    const profit = parseFloat(deal.profit || "0");
    const profitPercent = parseFloat(deal.profitPercent || "0");

    if (profit > 0) {
      totalProfit += profit;
      winCount++;
      consecutiveWins++;
      consecutiveLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
    } else {
      totalLoss += Math.abs(profit);
      lossCount++;
      consecutiveLosses++;
      consecutiveWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
    }

    returns.push(profitPercent);
    currentDrawdown += profit;
    maxDrawdown = Math.min(maxDrawdown, currentDrawdown);
  }

  const winRate = (winCount / deals.length) * 100;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;
  const sharpeRatio = calculateSharpeRatio(returns);
  const averageWinTrade = winCount > 0 ? totalProfit / winCount : 0;
  const averageLossTrade = lossCount > 0 ? totalLoss / lossCount : 0;

  return {
    totalProfit,
    totalLoss,
    winRate: Math.round(winRate * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(Math.abs(maxDrawdown) * 100) / 100,
    averageWinTrade: Math.round(averageWinTrade * 100) / 100,
    averageLossTrade: Math.round(averageLossTrade * 100) / 100,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
  };
}

function calculateSharpeRatio(returns: number[]): number {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev !== 0 ? mean / stdDev : 0;
}

function generateMockEquityCurve(days: number): BotEquityCurve[] {
  const curve: BotEquityCurve[] = [];
  let equity = 10000;
  const now = Date.now();

  for (let i = 0; i < days; i++) {
    const dailyReturn = (Math.random() - 0.48) * 100;
    equity += dailyReturn;
    curve.push({
      timestamp: now - (days - i) * 24 * 60 * 60 * 1000,
      equity: Math.max(equity, 0),
      profit: equity - 10000,
    });
  }

  return curve;
}

function generateMockPortfolioMetrics(baseProfit: number): PortfolioMetrics {
  const totalValue = 100000 + baseProfit;
  const dayChange = (Math.random() - 0.5) * 5000;
  const dayChangePercent = (dayChange / totalValue) * 100;
  const allTimeChange = baseProfit;
  const allTimeChangePercent = (baseProfit / 100000) * 100;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
    dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    allTimeChange: Math.round(allTimeChange * 100) / 100,
    allTimeChangePercent: Math.round(allTimeChangePercent * 100) / 100,
    realizedPnL: Math.round(baseProfit * 0.7 * 100) / 100,
    unrealizedPnL: Math.round(baseProfit * 0.3 * 100) / 100,
    volatility: Math.round((Math.random() * 5 + 5) * 100) / 100,
    sharpeRatio: Math.round((Math.random() * 2 + 1) * 100) / 100,
    maxDrawdown: Math.round((Math.random() * 10 + 5) * 100) / 100,
  };
}

export default botsRouter;

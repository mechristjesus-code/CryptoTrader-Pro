import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  exportMetricsCSV,
  exportTradesCSV,
  exportEquityCurveCSV,
  exportCompleteBacktestCSV,
  generateExportFilename,
  filterTradesByDateRange,
  filterEquityCurveByDateRange,
  calculateFilteredMetrics,
  exportTradesCSVWithDateRange,
} from "../utils/csv-export";

interface BacktestTrade {
  id: number;
  entryTime: string;
  exitTime: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
}

interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  maxDrawdown: string;
  sharpeRatio: number;
  expectancy: number;
  avgWinTrade: number;
  avgLossTrade: number;
  largestWin: number;
  largestLoss: number;
}

interface EquityCurvePoint {
  timestamp: number;
  equity: number;
  drawdown: number;
}

/**
 * Calculate backtest metrics from trades
 */
function calculateMetrics(trades: BacktestTrade[], initialCapital: number): BacktestMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: "0%",
      netProfit: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      maxDrawdown: "0%",
      sharpeRatio: 0,
      expectancy: 0,
      avgWinTrade: 0,
      avgLossTrade: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl < 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const netProfit = grossProfit - grossLoss;

  const winRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
  const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : 0;

  const avgWinTrade = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLossTrade = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

  const largestWin = Math.max(...winningTrades.map((t) => t.pnl), 0);
  const largestLoss = Math.min(...losingTrades.map((t) => t.pnl), 0);

  // Calculate Sharpe Ratio (simplified)
  const returns = trades.map((t) => t.pnlPercent / 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? parseFloat(((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2)) : 0;

  // Calculate expectancy
  const expectancy = parseFloat(
    ((winRate as any) / 100 * avgWinTrade - (1 - (winRate as any) / 100) * avgLossTrade).toFixed(2)
  );

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: winRate + "%",
    netProfit: parseFloat(netProfit.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    profitFactor,
    maxDrawdown: "-12.5%", // Simplified - would calculate from equity curve
    sharpeRatio,
    expectancy,
    avgWinTrade: parseFloat(avgWinTrade.toFixed(2)),
    avgLossTrade: parseFloat(avgLossTrade.toFixed(2)),
    largestWin: parseFloat(largestWin.toFixed(2)),
    largestLoss: parseFloat(largestLoss.toFixed(2)),
  };
}

/**
 * Generate equity curve from trades
 */
function generateEquityCurve(trades: BacktestTrade[], initialCapital: number): EquityCurvePoint[] {
  const curve: EquityCurvePoint[] = [];
  let currentEquity = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdown = 0;

  const sortedTrades = [...trades].sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime());

  sortedTrades.forEach((trade) => {
    currentEquity += trade.pnl;
    const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    curve.push({
      timestamp: new Date(trade.exitTime).getTime(),
      equity: parseFloat(currentEquity.toFixed(2)),
      drawdown: parseFloat(drawdown.toFixed(2)),
    });
  });

  return curve;
}

/**
 * Generate mock trades for backtesting (production: use real strategy engine)
 */
function generateMockTrades(count: number, initialPrice: number): BacktestTrade[] {
  const trades: BacktestTrade[] = [];

  for (let i = 0; i < count; i++) {
    const entryPrice = initialPrice * (1 + (Math.random() - 0.5) * 0.1);
    const exitPrice = entryPrice * (1 + (Math.random() - 0.48) * 0.08);
    const quantity = 1;
    const pnl = (exitPrice - entryPrice) * quantity;
    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

    trades.push({
      id: i + 1,
      entryTime: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
      exitTime: new Date(Date.now() - Math.random() * 1728000000).toISOString(),
      side: Math.random() > 0.5 ? "long" : "short",
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      quantity,
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2)),
      commission: parseFloat((Math.abs(pnl) * 0.001).toFixed(2)),
    });
  }

  return trades;
}

export const pineBacktestRouter = router({
  /**
   * Run backtest for a Pine Script strategy
   */
  run: protectedProcedure
    .input(
      z.object({
        strategyId: z.string(),
        symbol: z.string().default("BTC/USD"),
        timeframe: z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]).default("1h"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        initialCapital: z.number().default(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate mock trades (production: execute real Pine Script)
        const tradeCount = Math.floor(Math.random() * 60) + 20;
        const initialPrice = Math.random() * 50000 + 30000;
        const trades = generateMockTrades(tradeCount, initialPrice);

        // Calculate metrics
        const metrics = calculateMetrics(trades, input.initialCapital);

        // Generate equity curve
        const equityCurve = generateEquityCurve(trades, input.initialCapital);

        return {
          success: true,
          data: {
            strategyId: input.strategyId,
            symbol: input.symbol,
            timeframe: input.timeframe,
            period: `${input.startDate || "30d"} backtest`,
            initialCapital: input.initialCapital,
            finalEquity: input.initialCapital + metrics.netProfit,
            metrics,
            equityCurve,
            trades: trades.slice(0, 20), // Return first 20 trades
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.run]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get backtest history
   */
  getHistory: protectedProcedure
    .input(z.object({ strategyId: z.string().optional() }))
    .query(async ({ ctx }) => {
      try {
        // In production: Query strategyBacktests table
        return {
          success: true,
          data: [
            {
              id: 1,
              strategyId: "1",
              symbol: "BTC/USD",
              timeframe: "1h",
              netProfit: 1250.5,
              winRate: "62.5%",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
        };
      } catch (error) {
        console.error("[pineBacktestRouter.getHistory]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Compare two backtests
   */
    compare: protectedProcedure
      .input(
        z.object({
          backtestId1: z.string(),
          backtestId2: z.string(),
        })
      )
      .query(async ({ input }) => {
        try {
          return {
            success: true,
            data: {
              comparison: {
                winRate: { backtest1: "62.5%", backtest2: "58.3%", winner: "backtest1" },
                profitFactor: { backtest1: 1.85, backtest2: 1.62, winner: "backtest1" },
                maxDrawdown: { backtest1: "-12.5%", backtest2: "-15.3%", winner: "backtest1" },
                sharpeRatio: { backtest1: 1.45, backtest2: 1.28, winner: "backtest1" },
              },
            },
          };
        } catch (error) {
          console.error("[pineBacktestRouter.compare]", error);
          return {
            success: false,
            error: (error as Error).message,
          };
        }
      }),

  /**
   * Export backtest metrics as CSV
   */
  exportMetrics: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        timeframe: z.string(),
        metrics: z.object({
          totalTrades: z.number(),
          winningTrades: z.number(),
          losingTrades: z.number(),
          winRate: z.string(),
          netProfit: z.number(),
          grossProfit: z.number(),
          grossLoss: z.number(),
          profitFactor: z.number(),
          maxDrawdown: z.string(),
          sharpeRatio: z.number(),
          expectancy: z.number(),
          avgWinTrade: z.number(),
          avgLossTrade: z.number(),
          largestWin: z.number(),
          largestLoss: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportMetricsCSV(input.metrics, input.strategyName, input.symbol, input.timeframe);
        const filename = generateExportFilename(input.strategyName, input.symbol, "metrics");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportMetrics]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Export trade list as CSV
   */
  exportTrades: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        trades: z.array(
          z.object({
            id: z.number(),
            entryTime: z.string(),
            exitTime: z.string(),
            side: z.enum(["long", "short"]),
            entryPrice: z.number(),
            exitPrice: z.number(),
            quantity: z.number(),
            pnl: z.number(),
            pnlPercent: z.number(),
            commission: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportTradesCSV(input.trades);
        const filename = generateExportFilename(input.strategyName, input.symbol, "trades");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportTrades]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Export equity curve as CSV
   */
  exportEquityCurve: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        curve: z.array(
          z.object({
            timestamp: z.number(),
            equity: z.number(),
            drawdown: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportEquityCurveCSV(input.curve);
        const filename = generateExportFilename(input.strategyName, input.symbol, "equity");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportEquityCurve]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Export complete backtest report as CSV
   */
  exportComplete: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        timeframe: z.string(),
        metrics: z.object({
          totalTrades: z.number(),
          winningTrades: z.number(),
          losingTrades: z.number(),
          winRate: z.string(),
          netProfit: z.number(),
          grossProfit: z.number(),
          grossLoss: z.number(),
          profitFactor: z.number(),
          maxDrawdown: z.string(),
          sharpeRatio: z.number(),
          expectancy: z.number(),
          avgWinTrade: z.number(),
          avgLossTrade: z.number(),
          largestWin: z.number(),
          largestLoss: z.number(),
        }),
        trades: z.array(
          z.object({
            id: z.number(),
            entryTime: z.string(),
            exitTime: z.string(),
            side: z.enum(["long", "short"]),
            entryPrice: z.number(),
            exitPrice: z.number(),
            quantity: z.number(),
            pnl: z.number(),
            pnlPercent: z.number(),
            commission: z.number(),
          })
        ),
        curve: z.array(
          z.object({
            timestamp: z.number(),
            equity: z.number(),
            drawdown: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportCompleteBacktestCSV(
          input.metrics,
          input.trades,
          input.curve,
          input.strategyName,
          input.symbol,
          input.timeframe
        );
        const filename = generateExportFilename(input.strategyName, input.symbol, "complete");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportComplete]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
  /**
   * Export trades with date range filter
   */
  exportTradesWithDateRange: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        trades: z.array(
          z.object({
            id: z.number(),
            entryTime: z.string(),
            exitTime: z.string(),
            side: z.enum(["long", "short"]),
            entryPrice: z.number(),
            exitPrice: z.number(),
            quantity: z.number(),
            pnl: z.number(),
            pnlPercent: z.number(),
            commission: z.number(),
          })
        ),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const csv = exportTradesCSVWithDateRange(input.trades, startDate, endDate);
        const filename = generateExportFilename(input.strategyName, input.symbol, "trades");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
            recordsCount: filterTradesByDateRange(input.trades, startDate, endDate).length,
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportTradesWithDateRange]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Export equity curve with date range filter
   */
  exportEquityCurveWithDateRange: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        symbol: z.string(),
        curve: z.array(
          z.object({
            timestamp: z.number(),
            equity: z.number(),
            drawdown: z.number(),
          })
        ),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const filteredCurve = filterEquityCurveByDateRange(input.curve, startDate, endDate);
        const csv = exportEquityCurveCSV(filteredCurve);
        const filename = generateExportFilename(input.strategyName, input.symbol, "equity");

        return {
          success: true,
          data: {
            csv,
            filename,
            mimeType: "text/csv",
            pointsCount: filteredCurve.length,
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.exportEquityCurveWithDateRange]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get filtered metrics for date range
   */
  getFilteredMetrics: protectedProcedure
    .input(
      z.object({
        trades: z.array(
          z.object({
            id: z.number(),
            entryTime: z.string(),
            exitTime: z.string(),
            side: z.enum(["long", "short"]),
            entryPrice: z.number(),
            exitPrice: z.number(),
            quantity: z.number(),
            pnl: z.number(),
            pnlPercent: z.number(),
            commission: z.number(),
          })
        ),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const filteredTrades = filterTradesByDateRange(input.trades, startDate, endDate);
        const metrics = calculateFilteredMetrics(filteredTrades);

        return {
          success: true,
          data: {
            metrics,
            tradeCount: filteredTrades.length,
          },
        };
      } catch (error) {
        console.error("[pineBacktestRouter.getFilteredMetrics]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});

export default pineBacktestRouter;

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { calculateMetricsSchema, getCorrelationMatrixSchema } from '../_core/validationSchemas';
import { db } from '../db';
import { riskMetrics, correlationMatrix, performanceAttribution } from '../../drizzle/advanced-schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Calculate Sharpe Ratio
 * Measures risk-adjusted returns (excess return per unit of risk)
 * Formula: (Average Return - Risk-Free Rate) / Standard Deviation
 */
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return (avgReturn - riskFreeRate) / stdDev;
}

/**
 * Calculate Sortino Ratio
 * Similar to Sharpe but only considers downside volatility
 * Formula: (Average Return - Risk-Free Rate) / Downside Deviation
 */
function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns
    .filter(r => r < riskFreeRate)
    .reduce((a, b) => a + Math.pow(b - riskFreeRate, 2), 0) / returns.length;

  const downstdDev = Math.sqrt(downside);

  if (downstdDev === 0) return 0;
  return (avgReturn - riskFreeRate) / downstdDev;
}

/**
 * Calculate Maximum Drawdown
 * Measures the largest peak-to-trough decline
 */
function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;

  let maxPrice = prices[0];
  let maxDrawdown = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > maxPrice) {
      maxPrice = prices[i];
    } else {
      const drawdown = (maxPrice - prices[i]) / maxPrice;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return maxDrawdown;
}

/**
 * Calculate Volatility
 * Standard deviation of returns
 */
function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Calculate Pearson Correlation
 * Measures the linear relationship between two variables
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

export const analyticsRouter = router({
  /**
   * Calculate risk metrics (Sharpe, Sortino, Max Drawdown, Volatility)
   */
  calculateRiskMetrics: protectedProcedure
    .input(calculateMetricsSchema)
    .mutation(async ({ input, ctx }) => {
      const { symbol, days } = input;

      // Fetch user's trades for the specified period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const userTrades = await db
        .select()
        .from(trades)
        .where(
          and(
            eq(trades.userId, ctx.user.id),
            symbol ? eq(trades.symbol, symbol) : undefined
          )
        );

      if (userTrades.length === 0) {
        return {
          sharpeRatio: 0,
          sortinoRatio: 0,
          maxDrawdown: 0,
          volatility: 0,
        };
      }

      // Calculate returns
      const returns = [];
      for (let i = 1; i < userTrades.length; i++) {
        const prevValue = parseFloat(userTrades[i - 1].value);
        const currValue = parseFloat(userTrades[i].value);
        const ret = (currValue - prevValue) / prevValue;
        returns.push(ret);
      }

      // Calculate metrics
      const sharpeRatio = calculateSharpeRatio(returns);
      const sortinoRatio = calculateSortinoRatio(returns);
      const prices = userTrades.map(t => parseFloat(t.value));
      const maxDrawdown = calculateMaxDrawdown(prices);
      const volatility = calculateVolatility(returns);

      // Store in database
      if (symbol) {
        await db.insert(riskMetrics).values({
          userId: ctx.user.id,
          symbol,
          sharpeRatio: sharpeRatio.toString(),
          sortinoRatio: sortinoRatio.toString(),
          maxDrawdown: (maxDrawdown * 100).toString(),
          volatility: (volatility * 100).toString(),
        });
      }

      return {
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
        maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
        volatility: parseFloat((volatility * 100).toFixed(2)),
      };
    }),

  /**
   * Get correlation matrix between multiple symbols
   */
  getCorrelationMatrix: protectedProcedure
    .input(getCorrelationMatrixSchema)
    .query(async ({ input, ctx }) => {
      const { symbols } = input;

      // Fetch price data for each symbol
      const symbolPrices: Record<string, number[]> = {};

      for (const symbol of symbols) {
        const trades = await db
          .select()
          .from(trades)
          .where(
            and(
              eq(trades.userId, ctx.user.id),
              eq(trades.symbol, symbol)
            )
          )
          .orderBy(trades.createdAt);

        symbolPrices[symbol] = trades.map(t => parseFloat(t.value));
      }

      // Calculate correlation matrix
      const correlationData: Record<string, Record<string, number>> = {};

      for (let i = 0; i < symbols.length; i++) {
        correlationData[symbols[i]] = {};
        for (let j = 0; j < symbols.length; j++) {
          if (i === j) {
            correlationData[symbols[i]][symbols[j]] = 1;
          } else {
            const corr = calculateCorrelation(
              symbolPrices[symbols[i]],
              symbolPrices[symbols[j]]
            );
            correlationData[symbols[i]][symbols[j]] = parseFloat(corr.toFixed(4));
          }
        }
      }

      return correlationData;
    }),

  /**
   * Get performance attribution by asset
   * Shows which assets contributed most to portfolio performance
   */
  getPerformanceAttribution: protectedProcedure.query(async ({ ctx }) => {
    const userTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, ctx.user.id))
      .orderBy(trades.createdAt);

    if (userTrades.length === 0) {
      return [];
    }

    // Group trades by symbol
    const tradesBySymbol: Record<string, any[]> = {};
    for (const trade of userTrades) {
      if (!tradesBySymbol[trade.symbol]) {
        tradesBySymbol[trade.symbol] = [];
      }
      tradesBySymbol[trade.symbol].push(trade);
    }

    // Calculate contribution for each symbol
    const attribution = [];
    const totalReturn = userTrades[userTrades.length - 1].value - userTrades[0].value;

    for (const [symbol, symbolTrades] of Object.entries(tradesBySymbol)) {
      const symbolReturn = symbolTrades[symbolTrades.length - 1].value - symbolTrades[0].value;
      const contribution = (symbolReturn / totalReturn) * 100;

      attribution.push({
        symbol,
        contribution: parseFloat(contribution.toFixed(2)),
        returnPercent: parseFloat(((symbolReturn / symbolTrades[0].value) * 100).toFixed(2)),
      });
    }

    return attribution.sort((a, b) => b.contribution - a.contribution);
  }),

  /**
   * Get portfolio metrics summary
   */
  getPortfolioMetrics: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await db
      .select()
      .from(riskMetrics)
      .where(eq(riskMetrics.userId, ctx.user.id))
      .orderBy(desc(riskMetrics.calculatedAt))
      .limit(1);

    if (metrics.length === 0) {
      return null;
    }

    return metrics[0];
  }),
});

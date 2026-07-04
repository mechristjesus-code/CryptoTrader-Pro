/**
 * CSV Export Utilities for Backtesting Results and Trade History
 */

export interface BacktestMetrics {
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

export interface BacktestTrade {
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

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface EquityCurvePoint {
  timestamp: number;
  equity: number;
  drawdown: number;
}

/**
 * Filter trades by date range
 */
export function filterTradesByDateRange(
  trades: BacktestTrade[],
  startDate?: Date,
  endDate?: Date
): BacktestTrade[] {
  if (!startDate && !endDate) {
    return trades;
  }

  return trades.filter((trade) => {
    const exitTime = new Date(trade.exitTime);

    if (startDate && exitTime < startDate) {
      return false;
    }

    if (endDate && exitTime > endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Filter equity curve by date range
 */
export function filterEquityCurveByDateRange(
  curve: EquityCurvePoint[],
  startDate?: Date,
  endDate?: Date
): EquityCurvePoint[] {
  if (!startDate && !endDate) {
    return curve;
  }

  const startTime = startDate?.getTime();
  const endTime = endDate?.getTime();

  return curve.filter((point) => {
    if (startTime && point.timestamp < startTime) {
      return false;
    }

    if (endTime && point.timestamp > endTime) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate filtered metrics
 */
export function calculateFilteredMetrics(
  trades: BacktestTrade[]
): Omit<BacktestMetrics, "totalTrades" | "winningTrades" | "losingTrades"> & {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
} {
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : "0.00";

  const netProfit = trades.reduce((sum, t) => sum + t.pnl, 0);
  const grossProfit = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWinTrade = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLossTrade = losingTrades > 0 ? grossLoss / losingTrades : 0;

  const largestWin = trades.length > 0 ? Math.max(...trades.map((t) => t.pnl)) : 0;
  const largestLoss = trades.length > 0 ? Math.min(...trades.map((t) => t.pnl)) : 0;

  // Simplified Sharpe ratio calculation
  const returns = trades.map((t) => t.pnlPercent);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 0
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Expectancy = (Win% * Avg Win) - (Loss% * Avg Loss)
  const expectancy =
    (winRate ? parseFloat(winRate) / 100 : 0) * avgWinTrade -
    (100 - (winRate ? parseFloat(winRate) : 0)) / 100 * avgLossTrade;

  // Max drawdown (simplified)
  let maxDrawdown = 0;
  let peak = 0;
  let equity = 0;
  for (const trade of trades) {
    equity += trade.pnl;
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    netProfit,
    grossProfit,
    grossLoss,
    profitFactor,
    maxDrawdown: maxDrawdown.toFixed(2) + "%",
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    avgWinTrade: parseFloat(avgWinTrade.toFixed(2)),
    avgLossTrade: parseFloat(avgLossTrade.toFixed(2)),
    largestWin,
    largestLoss,
  };
}

/**
 * Escape CSV field values
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Export backtest metrics as CSV
 */
export function exportMetricsCSV(
  metrics: BacktestMetrics,
  strategyName: string,
  symbol: string,
  timeframe: string
): string {
  const headers = [
    "Strategy Name",
    "Symbol",
    "Timeframe",
    "Total Trades",
    "Winning Trades",
    "Losing Trades",
    "Win Rate",
    "Net Profit",
    "Gross Profit",
    "Gross Loss",
    "Profit Factor",
    "Max Drawdown",
    "Sharpe Ratio",
    "Expectancy",
    "Avg Win Trade",
    "Avg Loss Trade",
    "Largest Win",
    "Largest Loss",
  ];

  const values = [
    escapeCSV(strategyName),
    escapeCSV(symbol),
    escapeCSV(timeframe),
    metrics.totalTrades,
    metrics.winningTrades,
    metrics.losingTrades,
    escapeCSV(metrics.winRate),
    metrics.netProfit,
    metrics.grossProfit,
    metrics.grossLoss,
    metrics.profitFactor,
    escapeCSV(metrics.maxDrawdown),
    metrics.sharpeRatio,
    metrics.expectancy,
    metrics.avgWinTrade,
    metrics.avgLossTrade,
    metrics.largestWin,
    metrics.largestLoss,
  ];

  return [headers.join(","), values.join(",")].join("\n");
}

/**
 * Export trade list as CSV
 */
export function exportTradesCSV(trades: BacktestTrade[]): string {
  const headers = [
    "Trade ID",
    "Entry Time",
    "Exit Time",
    "Side",
    "Entry Price",
    "Exit Price",
    "Quantity",
    "P&L",
    "P&L %",
    "Commission",
  ];

  const rows = trades.map((trade) => [
    trade.id,
    escapeCSV(trade.entryTime),
    escapeCSV(trade.exitTime),
    escapeCSV(trade.side),
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity,
    trade.pnl,
    trade.pnlPercent,
    trade.commission,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csvContent;
}

/**
 * Export trades with date range filter
 */
export function exportTradesCSVWithDateRange(
  trades: BacktestTrade[],
  startDate?: Date,
  endDate?: Date
): string {
  const filteredTrades = filterTradesByDateRange(trades, startDate, endDate);
  return exportTradesCSV(filteredTrades);
}

/**
 * Export equity curve as CSV
 */
export function exportEquityCurveCSV(curve: EquityCurvePoint[]): string {
  const headers = ["Timestamp", "Equity", "Drawdown %"];

  const rows = curve.map((point) => [
    new Date(point.timestamp).toISOString(),
    point.equity,
    point.drawdown,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csvContent;
}

/**
 * Export complete backtest report as CSV (all sections combined)
 */
export function exportCompleteBacktestCSV(
  metrics: BacktestMetrics,
  trades: BacktestTrade[],
  curve: EquityCurvePoint[],
  strategyName: string,
  symbol: string,
  timeframe: string
): string {
  const sections: string[] = [];

  // Add header with export info
  sections.push(`Backtest Report - ${strategyName}`);
  sections.push(`Symbol: ${symbol}, Timeframe: ${timeframe}`);
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push("");

  // Add metrics section
  sections.push("=== BACKTEST METRICS ===");
  sections.push(exportMetricsCSV(metrics, strategyName, symbol, timeframe));
  sections.push("");

  // Add trades section
  sections.push("=== TRADE HISTORY ===");
  sections.push(exportTradesCSV(trades));
  sections.push("");

  // Add equity curve section
  sections.push("=== EQUITY CURVE ===");
  sections.push(exportEquityCurveCSV(curve));

  return sections.join("\n");
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  strategyName: string,
  symbol: string,
  fileType: "metrics" | "trades" | "equity" | "complete"
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedName = strategyName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const sanitizedSymbol = symbol.replace(/[^a-zA-Z0-9-_]/g, "_");

  const typeMap = {
    metrics: "metrics",
    trades: "trades",
    equity: "equity_curve",
    complete: "backtest_report",
  };

  return `${sanitizedName}_${sanitizedSymbol}_${typeMap[fileType]}_${timestamp}.csv`;
}

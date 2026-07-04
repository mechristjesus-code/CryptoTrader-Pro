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

export interface EquityCurvePoint {
  timestamp: number;
  equity: number;
  drawdown: number;
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

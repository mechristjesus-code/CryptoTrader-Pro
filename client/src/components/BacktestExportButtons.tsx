import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface BacktestExportButtonsProps {
  strategyName: string;
  symbol: string;
  timeframe: string;
  metrics: {
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
  };
  trades: Array<{
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
  }>;
  equityCurve: Array<{
    timestamp: number;
    equity: number;
    drawdown: number;
  }>;
}

/**
 * Download CSV file helper
 */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function BacktestExportButtons({
  strategyName,
  symbol,
  timeframe,
  metrics,
  trades,
  equityCurve,
}: BacktestExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportMetricsMutation = trpc.pineBacktest.exportMetrics.useMutation();
  const exportTradesMutation = trpc.pineBacktest.exportTrades.useMutation();
  const exportEquityCurveMutation = trpc.pineBacktest.exportEquityCurve.useMutation();
  const exportCompleteMutation = trpc.pineBacktest.exportComplete.useMutation();

  const handleExportMetrics = async () => {
    try {
      setIsExporting(true);
      const result = await exportMetricsMutation.mutateAsync({
        strategyName,
        symbol,
        timeframe,
        metrics,
      });

      if (result.success && result.data) {
        downloadCSV(result.data.csv, result.data.filename);
        toast.success("Metrics exported successfully");
      } else {
        toast.error("Failed to export metrics");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting metrics");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTrades = async () => {
    try {
      setIsExporting(true);
      const result = await exportTradesMutation.mutateAsync({
        strategyName,
        symbol,
        trades,
      });

      if (result.success && result.data) {
        downloadCSV(result.data.csv, result.data.filename);
        toast.success("Trade history exported successfully");
      } else {
        toast.error("Failed to export trades");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting trades");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEquityCurve = async () => {
    try {
      setIsExporting(true);
      const result = await exportEquityCurveMutation.mutateAsync({
        strategyName,
        symbol,
        curve: equityCurve,
      });

      if (result.success && result.data) {
        downloadCSV(result.data.csv, result.data.filename);
        toast.success("Equity curve exported successfully");
      } else {
        toast.error("Failed to export equity curve");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting equity curve");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportComplete = async () => {
    try {
      setIsExporting(true);
      const result = await exportCompleteMutation.mutateAsync({
        strategyName,
        symbol,
        timeframe,
        metrics,
        trades,
        curve: equityCurve,
      });

      if (result.success && result.data) {
        downloadCSV(result.data.csv, result.data.filename);
        toast.success("Complete backtest report exported successfully");
      } else {
        toast.error("Failed to export complete report");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting complete report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportMetrics}
        disabled={isExporting}
        className="gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        <Download className="h-4 w-4" />
        Metrics
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportTrades}
        disabled={isExporting}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        <Download className="h-4 w-4" />
        Trades
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportEquityCurve}
        disabled={isExporting}
        className="gap-2"
      >
        <TrendingUp className="h-4 w-4" />
        <Download className="h-4 w-4" />
        Equity Curve
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleExportComplete}
        disabled={isExporting}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export All"}
      </Button>
    </div>
  );
}

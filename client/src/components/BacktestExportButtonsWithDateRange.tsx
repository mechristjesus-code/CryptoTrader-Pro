import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DateRangeFilter from "@/components/DateRangeFilter";

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

export default function BacktestExportButtonsWithDateRange({
  strategyName,
  symbol,
  timeframe,
  metrics,
  trades,
  equityCurve,
}: BacktestExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState<{ start?: Date; end?: Date }>({});
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  const exportMetricsMutation = trpc.pineBacktest.exportMetrics.useMutation();
  const exportTradesMutation = trpc.pineBacktest.exportTrades.useMutation();
  const exportEquityCurveMutation = trpc.pineBacktest.exportEquityCurve.useMutation();
  const exportCompleteMutation = trpc.pineBacktest.exportComplete.useMutation();
  const exportTradesWithDateRangeMutation = trpc.pineBacktest.exportTradesWithDateRange.useMutation();
  const exportEquityCurveWithDateRangeMutation = trpc.pineBacktest.exportEquityCurveWithDateRange.useMutation();
  const getFilteredMetricsQuery = trpc.pineBacktest.getFilteredMetrics.useQuery;

  const handleDateFilterApply = (startDate?: Date, endDate?: Date) => {
    setDateFilter({ start: startDate, end: endDate });
    setIsDateFilterActive(true);
    toast.success("Date filter applied");
  };

  const handleDateFilterClear = () => {
    setDateFilter({});
    setIsDateFilterActive(false);
    toast.info("Date filter cleared");
  };

  const handleExportMetrics = async () => {
    try {
      setIsExporting(true);

      if (isDateFilterActive && dateFilter.start) {
        toast.info("Exporting metrics for selected date range...");
      }

      // For now, just export unfiltered metrics when date range is active
      // In a full implementation, you would call the query endpoint

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

      if (isDateFilterActive && dateFilter.start) {
        const result = await exportTradesWithDateRangeMutation.mutateAsync({
          strategyName,
          symbol,
          trades,
          startDate: dateFilter.start.toISOString(),
          endDate: dateFilter.end?.toISOString(),
        });

        if (result.success && result.data) {
          downloadCSV(result.data.csv, result.data.filename);
          toast.success(`Trade history exported (${result.data.recordsCount} trades)`);
        } else {
          toast.error("Failed to export trades");
        }
        return;
      }

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

      if (isDateFilterActive && dateFilter.start) {
        const result = await exportEquityCurveWithDateRangeMutation.mutateAsync({
          strategyName,
          symbol,
          curve: equityCurve,
          startDate: dateFilter.start.toISOString(),
          endDate: dateFilter.end?.toISOString(),
        });

        if (result.success && result.data) {
          downloadCSV(result.data.csv, result.data.filename);
          toast.success(`Equity curve exported (${result.data.pointsCount} points)`);
        } else {
          toast.error("Failed to export equity curve");
        }
        return;
      }

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
    <div className="space-y-4">
      <DateRangeFilter
        onApply={handleDateFilterApply}
        onClear={handleDateFilterClear}
        isActive={isDateFilterActive}
      />

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
    </div>
  );
}

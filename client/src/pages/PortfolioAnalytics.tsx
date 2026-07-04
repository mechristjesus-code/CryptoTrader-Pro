import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingDown, TrendingUp, Zap } from "lucide-react";

export function PortfolioAnalyticsContent() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["BTC", "ETH"]);
  const [newSymbol, setNewSymbol] = useState("");

  const riskMetrics = trpc.analytics.calculateRiskMetrics.useMutation();
  const correlationMatrix = trpc.analytics.getCorrelationMatrix.useQuery(
    { symbols: selectedSymbols },
    { enabled: selectedSymbols.length > 0 }
  );
  const performanceAttribution = trpc.analytics.getPerformanceAttribution.useQuery();
  const portfolioMetrics = trpc.analytics.getPortfolioMetrics.useQuery();

  const handleAddSymbol = () => {
    if (newSymbol && !selectedSymbols.includes(newSymbol)) {
      setSelectedSymbols([...selectedSymbols, newSymbol.toUpperCase()]);
      setNewSymbol("");
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  };

  const handleCalculateMetrics = async () => {
    for (const symbol of selectedSymbols) {
      await riskMetrics.mutateAsync({ symbol, days: 365 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.data?.sharpeRatio?.toFixed(2) || "N/A"}
            </div>
            <p className="text-xs text-gray-600">Risk-adjusted returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sortino Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.data?.sortinoRatio?.toFixed(2) || "N/A"}
            </div>
            <p className="text-xs text-gray-600">Downside risk adjusted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {portfolioMetrics.data?.maxDrawdown?.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-600">Peak to trough decline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioMetrics.data?.volatility?.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-600">Annual volatility</p>
          </CardContent>
        </Card>
      </div>

      {/* Symbol Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Symbols for Analysis</CardTitle>
          <CardDescription>Choose which assets to analyze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter symbol (BTC, ETH, etc.)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleAddSymbol()}
            />
            <Button onClick={handleAddSymbol}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSymbols.map((symbol) => (
              <div
                key={symbol}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {symbol}
                <button
                  onClick={() => handleRemoveSymbol(symbol)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Button onClick={handleCalculateMetrics} disabled={riskMetrics.isPending}>
            {riskMetrics.isPending ? "Calculating..." : "Calculate Metrics"}
          </Button>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      {correlationMatrix.data && (
        <Card>
          <CardHeader>
            <CardTitle>Correlation Matrix</CardTitle>
            <CardDescription>Asset correlation analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Symbol</th>
                    {selectedSymbols.map((symbol) => (
                      <th key={symbol} className="text-center py-2 px-2">{symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSymbols.map((symbol1) => (
                    <tr key={symbol1} className="border-b">
                      <td className="py-2 px-2 font-medium">{symbol1}</td>
                      {selectedSymbols.map((symbol2) => (
                        <td key={`${symbol1}-${symbol2}`} className="text-center py-2 px-2">
                          <span className={`px-2 py-1 rounded ${
                            correlationMatrix.data[symbol1]?.[symbol2] > 0.7 ? 'bg-red-100 text-red-800' :
                            correlationMatrix.data[symbol1]?.[symbol2] < -0.3 ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {correlationMatrix.data[symbol1]?.[symbol2]?.toFixed(2) || 'N/A'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Attribution */}
      {performanceAttribution.data && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Attribution</CardTitle>
            <CardDescription>Contribution of each asset to portfolio performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceAttribution.data.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.symbol}</p>
                    <p className="text-sm text-gray-600">Return: {item.returnPercent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{item.contribution}%</p>
                    <p className="text-xs text-gray-600">Contribution</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PortfolioAnalytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Portfolio Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Advanced risk metrics and performance analysis</p>
        </div>
        <PortfolioAnalyticsContent />
      </div>
    </DashboardLayout>
  );
}

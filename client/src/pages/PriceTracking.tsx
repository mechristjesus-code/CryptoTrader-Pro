import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradingViewChart } from "@/components/TradingViewChart";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK"];
const DAYS_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function PriceTracking() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [days, setDays] = useState(14);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [showIndicators, setShowIndicators] = useState({
    rsi: true,
    macd: false,
    bollingerBands: true,
    atr: false,
    adx: false,
  });
  const [isChartLoading, setIsChartLoading] = useState(false);

  const { data: topCoins, isLoading: coinsLoading, refetch } = trpc.prices.getTopCoins.useQuery({ limit: 20 });
  const { data: ohlcData, isLoading: ohlcLoading } = trpc.prices.getOHLCData.useQuery(
    { symbol: selectedSymbol, days },
    { refetchInterval: 60000 }
  );
  const { data: priceChartData, isLoading: chartLoading } = trpc.prices.getMarketChart.useQuery(
    { symbol: selectedSymbol, days },
    { refetchInterval: 60000 }
  );
  const { data: indicators } = trpc.prices.getTechnicalIndicators.useQuery(
    { symbol: selectedSymbol, days: 30 },
    { refetchInterval: 120000 }
  );

  // Generate TradingView chart data from OHLC
  useEffect(() => {
    setIsChartLoading(true);
    if (ohlcData && ohlcData.length > 0) {
      const data = ohlcData.map((c) => ({
        time: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: 0,
      }));
      setChartData(data);
    }
    setIsChartLoading(false);
  }, [ohlcData]);

  const selectedCoin = topCoins?.find(c => c.symbol === selectedSymbol);
  const isPositive = (selectedCoin?.priceChangePercent24h ?? 0) >= 0;

  const lineChartData = (priceChartData ?? []).map(d => ({
    date: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: d.price,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Live Prices
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Professional charts with TradingView Lightweight Charts</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
              Live
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Coin List */}
          <div className="xl:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm">Top Coins</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {coinsLoading
                ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 mx-3 my-1.5 rounded-lg" />)
                : topCoins?.map(coin => (
                    <button
                      key={coin.symbol}
                      onClick={() => setSelectedSymbol(coin.symbol)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors text-left ${
                        selectedSymbol === coin.symbol ? "bg-primary/10 border-l-2 border-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {coin.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{coin.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[80px]">{coin.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-medium">
                          ${coin.currentPrice > 1
                            ? coin.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : coin.currentPrice.toFixed(6)}
                        </div>
                        <div className={`text-xs font-medium ${coin.priceChangePercent24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {coin.priceChangePercent24h >= 0 ? "+" : ""}{coin.priceChangePercent24h.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="xl:col-span-3 space-y-4">
            {/* Coin Header */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                    {selectedSymbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{selectedCoin?.name ?? selectedSymbol}</h2>
                      <Badge variant="secondary" className="text-xs">{selectedSymbol}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-mono font-bold">
                        ${selectedCoin?.currentPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}
                      </span>
                      <span className={`flex items-center gap-0.5 text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(selectedCoin?.priceChangePercent24h ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {DAYS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDays(opt.value)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          days === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-accent/50 text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                {[
                  { label: "24h High", value: `$${selectedCoin?.high24h?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}` },
                  { label: "24h Low", value: `$${selectedCoin?.low24h?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}` },
                  { label: "Volume 24h", value: selectedCoin?.volume24h ? `$${(selectedCoin.volume24h / 1e9).toFixed(2)}B` : "—" },
                  { label: "Market Cap", value: selectedCoin?.marketCap ? `$${(selectedCoin.marketCap / 1e9).toFixed(2)}B` : "—" },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-sm font-mono font-semibold mt-0.5">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TradingView Professional Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Professional Chart (TradingView)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIndicators((prev) => ({ ...prev, rsi: !prev.rsi }))}
                    className={showIndicators.rsi ? "bg-blue-500/10 border-blue-500/50" : ""}
                  >
                    RSI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIndicators((prev) => ({ ...prev, bollingerBands: !prev.bollingerBands }))}
                    className={showIndicators.bollingerBands ? "bg-purple-500/10 border-purple-500/50" : ""}
                  >
                    BB
                  </Button>
                </div>
              </div>
              {isChartLoading || ohlcLoading ? (
                <Skeleton className="w-full h-96" />
              ) : (
                <TradingViewChart
                  symbol={selectedSymbol}
                  timeframe={days === 7 ? "1d" : days === 14 ? "1d" : days === 30 ? "1d" : "1w"}
                  data={chartData}
                  indicators={showIndicators}
                  isLoading={isChartLoading}
                />
              )}
            </Card>

            {/* Technical Indicators */}
            {indicators && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4">Technical Indicators</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    {
                      label: "RSI (14)",
                      value: indicators.rsi.toFixed(1),
                      status: indicators.rsi > 70 ? "Overbought" : indicators.rsi < 30 ? "Oversold" : "Neutral",
                      color: indicators.rsi > 70 ? "text-red-500" : indicators.rsi < 30 ? "text-green-500" : "text-muted-foreground",
                    },
                    {
                      label: "MACD",
                      value: indicators.macd.macd.toFixed(4),
                      status: indicators.macd.histogram > 0 ? "Bullish" : "Bearish",
                      color: indicators.macd.histogram > 0 ? "text-green-500" : "text-red-500",
                    },
                    {
                      label: "ATR",
                      value: indicators.atr.toFixed(2),
                      status: "Volatility",
                      color: "text-muted-foreground",
                    },
                    {
                      label: "ADX",
                      value: indicators.adx.toFixed(1),
                      status: indicators.adx > 25 ? "Strong Trend" : "Weak Trend",
                      color: indicators.adx > 25 ? "text-blue-500" : "text-muted-foreground",
                    },
                    {
                      label: "Bollinger Bands",
                      value: ((indicators.bollingerBands.upper + indicators.bollingerBands.lower) / 2).toFixed(2),
                      status: "Support/Resistance",
                      color: "text-muted-foreground",
                    },
                  ].map(ind => (
                    <div key={ind.label} className="p-3 bg-background rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">{ind.label}</div>
                      <div className={`text-lg font-mono font-bold ${ind.color}`}>{ind.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{ind.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

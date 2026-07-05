import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface MarketOverviewProps {
  pair?: string;
  timeframe?: string;
}

export default function MarketOverview({ pair = 'BTC/USD', timeframe = '1h' }: MarketOverviewProps) {
  const { data: ticker } = trpc.market.getTicker.useQuery({ pair });
  const { data: ohlc } = trpc.market.getOHLC.useQuery({ pair, interval: 60 });
  const { data: orderBook } = trpc.market.getOrderBook.useQuery({ pair, depth: 20 });
  const { data: technicalIndicators } = trpc.market.getTechnicalIndicators.useQuery({
    pair,
    timeframe,
  });
  const { data: marketHeatmap } = trpc.market.getMarketHeatmap.useQuery();

  // Mock chart data for visualization
  const priceChart = [
    { time: '9:00', price: 43100, volume: 1200 },
    { time: '10:00', price: 43250, volume: 1500 },
    { time: '11:00', price: 43150, volume: 1100 },
    { time: '12:00', price: 43400, volume: 1800 },
    { time: '13:00', price: 43300, volume: 1400 },
    { time: '14:00', price: 43500, volume: 2000 },
  ];

  const tickerData = ticker?.data;
  const indicators = technicalIndicators?.data?.indicators;
  const heatmap = marketHeatmap?.data;

  return (
    <div className="space-y-4">
      {/* Price and Ticker Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{pair}</CardTitle>
            <Badge variant="outline">{timeframe}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Price */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Price</p>
              <p className="text-2xl font-bold">${tickerData?.last}</p>
              <div className="flex items-center gap-1 mt-1">
                {parseFloat(tickerData?.change24h || '0') > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{tickerData?.change24h}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{tickerData?.change24h}</span>
                  </>
                )}
              </div>
            </div>

            {/* Bid/Ask */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bid / Ask</p>
              <p className="text-lg font-semibold">${tickerData?.bid} / ${tickerData?.ask}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Spread: ${(parseFloat(tickerData?.ask || '0') - parseFloat(tickerData?.bid || '0')).toFixed(2)}
              </p>
            </div>

            {/* 24h High/Low */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">24h High / Low</p>
              <p className="text-lg font-semibold">${tickerData?.high24h} / ${tickerData?.low24h}</p>
              <p className="text-xs text-muted-foreground mt-1">Range</p>
            </div>

            {/* Volume */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-lg font-semibold">{tickerData?.volume24h}</p>
              <p className="text-xs text-muted-foreground mt-1">BTC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Technical Analysis */}
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="orderbook">Order Book</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        {/* Price Chart */}
        <TabsContent value="price">
          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceChart}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Book */}
        <TabsContent value="orderbook">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bids */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orderBook?.data?.bids?.slice(0, 10).map((bid: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-green-600">${bid.price}</span>
                      <span className="text-muted-foreground">{bid.volume} BTC</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Asks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orderBook?.data?.asks?.slice(0, 10).map((ask: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-red-600">${ask.price}</span>
                      <span className="text-muted-foreground">{ask.volume} BTC</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Indicators */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RSI */}
                <div>
                  <p className="text-sm font-medium mb-2">RSI (14)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${indicators?.rsi}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{indicators?.rsi?.toFixed(1)}</span>
                  </div>
                </div>

                {/* MACD */}
                <div>
                  <p className="text-sm font-medium mb-2">MACD</p>
                  <div className="space-y-1 text-sm">
                    <p>Line: {indicators?.macd?.line?.toFixed(2)}</p>
                    <p>Signal: {indicators?.macd?.signal?.toFixed(2)}</p>
                    <p>Histogram: {indicators?.macd?.histogram?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div>
                  <p className="text-sm font-medium mb-2">Bollinger Bands</p>
                  <div className="space-y-1 text-sm">
                    <p>Upper: ${indicators?.bollinger?.upper?.toFixed(2)}</p>
                    <p>Middle: ${indicators?.bollinger?.middle?.toFixed(2)}</p>
                    <p>Lower: ${indicators?.bollinger?.lower?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Moving Averages */}
                <div>
                  <p className="text-sm font-medium mb-2">Moving Averages</p>
                  <div className="space-y-1 text-sm">
                    <p>MA20: ${indicators?.movingAverages?.ma20?.toFixed(2)}</p>
                    <p>MA50: ${indicators?.movingAverages?.ma50?.toFixed(2)}</p>
                    <p>MA200: ${indicators?.movingAverages?.ma200?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Heatmap */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Market Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {heatmap?.assets?.map((asset: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      asset.change > 0
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <p className="font-semibold">{asset.symbol}</p>
                    <p className={`text-sm font-medium ${asset.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change > 0 ? '+' : ''}{asset.change}%
                    </p>
                    <p className="text-xs text-muted-foreground">{asset.volume}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

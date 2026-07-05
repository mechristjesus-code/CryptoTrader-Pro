import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { ZoomIn, ZoomOut, Download, Settings } from 'lucide-react';

interface AdvancedChartProps {
  pair: string;
  timeframe?: string;
  height?: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function AdvancedChart({
  pair,
  timeframe = '1h',
  height = 400,
}: AdvancedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['MA20', 'MA50']);
  const [chartType, setChartType] = useState<'candle' | 'line' | 'bar'>('candle');

  const { data: ohlc } = trpc.market.getOHLC.useQuery({ pair, interval: 60 });
  const { data: indicators } = trpc.market.getTechnicalIndicators.useQuery({
    pair,
    timeframe,
  });

  // Mock candle data
  const mockCandleData: CandleData[] = [
    { time: 1625097600, open: 43000, high: 43500, low: 42800, close: 43200, volume: 1200 },
    { time: 1625101200, open: 43200, high: 43800, low: 43000, close: 43500, volume: 1500 },
    { time: 1625104800, open: 43500, high: 43600, low: 43100, close: 43300, volume: 1100 },
    { time: 1625108400, open: 43300, high: 44000, low: 43200, close: 43800, volume: 1800 },
    { time: 1625112000, open: 43800, high: 44200, low: 43500, close: 44000, volume: 2000 },
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // This is a placeholder for TradingView Lightweight Charts integration
    // In production, you would initialize the chart library here
    const container = chartContainerRef.current;
    container.innerHTML = `
      <div style="width: 100%; height: ${height}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold;">
        Advanced Chart: ${pair} (${timeframe})
        <br/>
        <small style="font-size: 12px; margin-top: 10px;">TradingView Lightweight Charts Integration</small>
      </div>
    `;
  }, [pair, timeframe, height]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleDownloadChart = () => {
    // In production, implement chart download functionality
    console.log('Downloading chart...');
  };

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{pair}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart - {timeframe}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadChart}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart Container */}
        <div
          ref={chartContainerRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
        />

        {/* Controls */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Chart Type</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Chart Type Tab */}
          <TabsContent value="chart" className="space-y-3">
            <div className="flex gap-2">
              {['candle', 'line', 'bar'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={chartType === type ? 'default' : 'outline'}
                  onClick={() => setChartType(type as typeof chartType)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* Indicators Tab */}
          <TabsContent value="indicators" className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['MA20', 'MA50', 'MA200', 'RSI', 'MACD', 'Bollinger', 'Stochastic', 'ATR'].map(
                (indicator) => (
                  <Button
                    key={indicator}
                    size="sm"
                    variant={selectedIndicators.includes(indicator) ? 'default' : 'outline'}
                    onClick={() => toggleIndicator(indicator)}
                  >
                    {indicator}
                  </Button>
                )
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Indicators:</p>
              <div className="flex flex-wrap gap-2">
                {selectedIndicators.map((ind) => (
                  <Badge key={ind} variant="secondary">
                    {ind}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-right py-2">Open</th>
                    <th className="text-right py-2">High</th>
                    <th className="text-right py-2">Low</th>
                    <th className="text-right py-2">Close</th>
                    <th className="text-right py-2">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCandleData.map((candle, idx) => (
                    <tr key={idx} className="border-b hover:bg-secondary">
                      <td className="py-2">
                        {new Date(candle.time * 1000).toLocaleString()}
                      </td>
                      <td className="text-right">${candle.open.toFixed(2)}</td>
                      <td className="text-right">${candle.high.toFixed(2)}</td>
                      <td className="text-right">${candle.low.toFixed(2)}</td>
                      <td className="text-right font-semibold">
                        ${candle.close.toFixed(2)}
                      </td>
                      <td className="text-right">{candle.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Chart Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-lg font-bold">$43,500</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">24h High</p>
            <p className="text-lg font-bold">$44,200</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">24h Low</p>
            <p className="text-lg font-bold">$42,800</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">24h Change</p>
            <p className="text-lg font-bold text-green-600">+2.3%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

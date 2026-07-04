import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IndicatorChartProps {
  ohlcData: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators?: ('rsi' | 'macd' | 'bb' | 'atr')[];
}

export default function IndicatorChart({ ohlcData, indicators = ['rsi', 'macd'] }: IndicatorChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all indicators
  const { data: indicatorsData } = trpc.indicators.all.useQuery(
    { ohlcData },
    { enabled: ohlcData.length > 0 }
  );

  useEffect(() => {
    if (!indicatorsData?.data) return;

    const { rsi = [], macd = [], bollingerBands = [], atr = [] } = indicatorsData.data || {};

    // Combine all indicator data
    const combined = ohlcData.map((candle, idx) => ({
      timestamp: idx,
      close: candle.close,
      rsi: rsi[idx]?.rsi,
      macd: macd[idx]?.macd,
      signal: macd[idx]?.signal,
      histogram: macd[idx]?.histogram,
      bbUpper: bollingerBands[idx]?.upper,
      bbMiddle: bollingerBands[idx]?.middle,
      bbLower: bollingerBands[idx]?.lower,
      atr: atr[idx]?.atr,
    }));

    setChartData(combined);
  }, [indicatorsData, ohlcData]);

  if (loading || !chartData.length) {
    return <div className="text-center py-8">Loading indicators...</div>;
  }

  return (
    <div className="space-y-6">
      {/* RSI Chart */}
      {indicators.includes('rsi') && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">RSI (Relative Strength Index)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rsi" stroke="#8884d8" name="RSI (14)" />
              <Line type="monotone" dataKey={() => 70} stroke="#ff7300" strokeDasharray="5 5" name="Overbought (70)" />
              <Line type="monotone" dataKey={() => 30} stroke="#82ca9d" strokeDasharray="5 5" name="Oversold (30)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* MACD Chart */}
      {indicators.includes('macd') && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">MACD (Moving Average Convergence Divergence)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="macd" stroke="#8884d8" name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#82ca9d" name="Signal" />
              <Line type="monotone" dataKey="histogram" stroke="#ffc658" name="Histogram" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Bollinger Bands Chart */}
      {indicators.includes('bb') && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Bollinger Bands</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="close" stroke="#8884d8" name="Price" />
              <Line type="monotone" dataKey="bbUpper" stroke="#ff7300" strokeDasharray="5 5" name="Upper Band" />
              <Line type="monotone" dataKey="bbMiddle" stroke="#82ca9d" strokeDasharray="5 5" name="Middle Band (SMA)" />
              <Line type="monotone" dataKey="bbLower" stroke="#ffc658" strokeDasharray="5 5" name="Lower Band" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ATR Chart */}
      {indicators.includes('atr') && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">ATR (Average True Range)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="atr" stroke="#8884d8" name="ATR (14)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

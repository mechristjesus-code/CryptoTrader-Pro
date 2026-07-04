import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  data: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators?: {
    rsi?: boolean;
    macd?: boolean;
    bollingerBands?: boolean;
    atr?: boolean;
    adx?: boolean;
  };
  onTimeframeChange?: (timeframe: string) => void;
  isLoading?: boolean;
}

// Technical indicator calculation functions
function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      rsi.push(50);
      continue;
    }

    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;

    if (i === period) {
      gains /= period;
      losses /= period;
    } else if (i > period) {
      gains = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
      losses = (losses * (period - 1) + (change < 0 ? -change : 0)) / period;
    }

    const rs = losses === 0 ? 100 : gains === 0 ? 0 : gains / losses;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const bands: Array<{ upper: number; middle: number; lower: number }> = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      bands.push({ upper: 0, middle: 0, lower: 0 });
      continue;
    }

    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2)) / period;
    const std = Math.sqrt(variance);

    bands.push({
      middle: mean,
      upper: mean + std * stdDev,
      lower: mean - std * stdDev,
    });
  }

  return bands;
}

export function TradingViewChart({
  symbol,
  timeframe,
  data,
  indicators = {},
  isLoading = false,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0 || isLoading) return;

    // Create chart
    chart.current = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#9ca3af',
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const chartAny = chart.current as any;
    candleSeries.current = chartAny.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Convert data to candlestick format
    const candleData: CandlestickData[] = data.map((d) => ({
      time: Math.floor(d.time / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    if (candleData.length > 0 && candleSeries.current) {
      candleSeries.current.setData(candleData);

      // Add indicators
      if (indicators.rsi && data.length > 14 && chart.current) {
        const closes = data.map((d) => d.close);
        const rsiValues = calculateRSI(closes);
        const rsiSeries = chartAny.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
        });

        const rsiData: LineData[] = rsiValues.map((val, i) => ({
          time: Math.floor(data[i + 14].time / 1000) as any,
          value: val,
        }));

        rsiSeries.setData(rsiData);
      }

      if (indicators.bollingerBands && data.length > 20 && chart.current) {
        const closes = data.map((d) => d.close);
        const bands = calculateBollingerBands(closes);

        const upperBandSeries = chartAny.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 1,
          lineStyle: 2,
        });

        const lowerBandSeries = chartAny.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 1,
          lineStyle: 2,
        });

        const upperData: LineData[] = bands.map((band, i) => ({
          time: Math.floor(data[i + 20].time / 1000) as any,
          value: band.upper,
        }));

        const lowerData: LineData[] = bands.map((band, i) => ({
          time: Math.floor(data[i + 20].time / 1000) as any,
          value: band.lower,
        }));

        upperBandSeries.setData(upperData);
        lowerBandSeries.setData(lowerData);
      }

      chart.current.timeScale().fitContent();
    }

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chart.current) {
        chart.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [data, indicators, isLoading]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-900 rounded-lg border border-slate-700"
      style={{ minHeight: '400px' }}
    />
  );
}

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

// Types for market data
interface OrderBookLevel {
  price: string;
  volume: string;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

interface MarketDepth {
  pair: string;
  bids: Array<{ price: number; cumulativeVolume: number }>;
  asks: Array<{ price: number; cumulativeVolume: number }>;
  timestamp: number;
}

interface TechnicalIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  movingAverages: { ma20: number; ma50: number; ma200: number };
}

export const marketRouter = router({
  /**
   * Get OHLC data from Kraken
   */
  getOHLC: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        interval: z.number().default(60),
        since: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // In production: Fetch from Kraken API
        const ohlcData = generateMockOHLC(input.pair, input.interval);
        return {
          success: true,
          data: {
            pair: input.pair,
            interval: input.interval,
            ohlc: ohlcData,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[marketRouter.getOHLC]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get ticker information with real-time updates
   */
  getTicker: protectedProcedure
    .input(z.object({ pair: z.string() }))
    .query(async ({ input }) => {
      try {
        const tickerData = generateMockTicker(input.pair);
        return {
          success: true,
          data: tickerData,
        };
      } catch (error) {
        console.error("[marketRouter.getTicker]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get market overview with sentiment and dominance
   */
  getOverview: protectedProcedure.query(async () => {
    try {
      const overviewData = generateMockOverview();
      return {
        success: true,
        data: overviewData,
      };
    } catch (error) {
      console.error("[marketRouter.getOverview]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get order book data for a trading pair
   */
  getOrderBook: protectedProcedure
    .input(z.object({ pair: z.string(), depth: z.number().default(20) }))
    .query(async ({ input }) => {
      try {
        const orderBook = generateMockOrderBook(input.pair, input.depth);
        return {
          success: true,
          data: orderBook,
        };
      } catch (error) {
        console.error("[marketRouter.getOrderBook]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get market depth data for visualization
   */
  getMarketDepth: protectedProcedure
    .input(z.object({ pair: z.string(), levels: z.number().default(50) }))
    .query(async ({ input }) => {
      try {
        const depth = generateMockMarketDepth(input.pair, input.levels);
        return {
          success: true,
          data: depth,
        };
      } catch (error) {
        console.error("[marketRouter.getMarketDepth]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get technical indicators for a pair
   */
  getTechnicalIndicators: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        timeframe: z.string().default("1h"),
      })
    )
    .query(async ({ input }) => {
      try {
        const indicators = generateMockTechnicalIndicators();
        return {
          success: true,
          data: {
            pair: input.pair,
            timeframe: input.timeframe,
            indicators,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[marketRouter.getTechnicalIndicators]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get market heatmap data (top gainers/losers)
   */
  getMarketHeatmap: protectedProcedure.query(async () => {
    try {
      const heatmapData = generateMockHeatmap();
      return {
        success: true,
        data: heatmapData,
      };
    } catch (error) {
      console.error("[marketRouter.getMarketHeatmap]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get multiple ticker data at once (for dashboard overview)
   */
  getMultipleTickers: protectedProcedure
    .input(z.object({ pairs: z.array(z.string()) }))
    .query(async ({ input }) => {
      try {
        const tickers = input.pairs.map((pair) => generateMockTicker(pair));
        return {
          success: true,
          data: tickers,
        };
      } catch (error) {
        console.error("[marketRouter.getMultipleTickers]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get historical volatility data
   */
  getVolatility: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        period: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const volatilityData = generateMockVolatility(input.period);
        return {
          success: true,
          data: {
            pair: input.pair,
            period: input.period,
            volatility: volatilityData,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[marketRouter.getVolatility]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});

// Mock data generation functions
function generateMockOHLC(
  pair: string,
  interval: number
): Array<[number, string, string, string, string, string, string]> {
  const data: Array<[number, string, string, string, string, string, string]> =
    [];
  const now = Math.floor(Date.now() / 1000);
  const basePrice = 43150;

  for (let i = 24; i >= 0; i--) {
    const timestamp = now - i * interval * 60;
    const open = (basePrice + Math.random() * 1000 - 500).toFixed(2);
    const high = (parseFloat(open) + Math.random() * 500).toFixed(2);
    const low = (parseFloat(open) - Math.random() * 500).toFixed(2);
    const close = (
      parseFloat(open) +
      (Math.random() * 1000 - 500)
    ).toFixed(2);
    const volume = (Math.random() * 5000).toFixed(2);
    const quoteVolume = (parseFloat(volume) * parseFloat(close)).toFixed(0);

    data.push([timestamp, open, high, low, close, volume, quoteVolume]);
  }

  return data;
}

function generateMockTicker(pair: string) {
  const basePrice = 43150;
  const price = basePrice + Math.random() * 1000 - 500;
  const change24h = (Math.random() * 10 - 5).toFixed(2);

  return {
    pair,
    bid: (price - Math.random() * 10).toFixed(2),
    ask: (price + Math.random() * 10).toFixed(2),
    last: price.toFixed(2),
    volume24h: (Math.random() * 50000).toFixed(2),
    high24h: (price + 1000).toFixed(2),
    low24h: (price - 1000).toFixed(2),
    change24h: `${change24h}%`,
    timestamp: Date.now(),
  };
}

function generateMockOverview() {
  return {
    btc: {
      price: "43150.50",
      change24h: "+2.5%",
      volume: "28.5B",
      dominance: "48.2%",
    },
    eth: {
      price: "2280.75",
      change24h: "+1.8%",
      volume: "12.3B",
      dominance: "16.5%",
    },
    topMovers: [
      { symbol: "SOL/USD", change: "+8.2%", price: "98.50", volume: "2.1B" },
      { symbol: "XRP/USD", change: "+5.1%", price: "2.15", volume: "1.8B" },
      { symbol: "ADA/USD", change: "+3.7%", price: "0.92", volume: "1.2B" },
      { symbol: "DOGE/USD", change: "+4.3%", price: "0.38", volume: "0.9B" },
    ],
    topLosers: [
      { symbol: "BNB/USD", change: "-1.2%", price: "612.50", volume: "1.5B" },
      { symbol: "LINK/USD", change: "-0.8%", price: "28.75", volume: "0.8B" },
    ],
    marketSentiment: "bullish",
    fearGreedIndex: 72,
    timestamp: Date.now(),
  };
}

function generateMockOrderBook(pair: string, depth: number): OrderBook {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  const basePrice = 43150;

  for (let i = 0; i < depth; i++) {
    const bidPrice = (basePrice - i * 10).toFixed(2);
    const askPrice = (basePrice + i * 10).toFixed(2);
    const volume = (Math.random() * 50).toFixed(2);

    bids.push({ price: bidPrice, volume });
    asks.push({ price: askPrice, volume });
  }

  return {
    bids: bids.reverse(),
    asks,
    timestamp: Date.now(),
  };
}

function generateMockMarketDepth(pair: string, levels: number): MarketDepth {
  const bids: Array<{ price: number; cumulativeVolume: number }> = [];
  const asks: Array<{ price: number; cumulativeVolume: number }> = [];
  const basePrice = 43150;
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 0; i < levels; i++) {
    const bidPrice = basePrice - i * 5;
    const askPrice = basePrice + i * 5;
    const volume = Math.random() * 100;

    bidCumulative += volume;
    askCumulative += volume;

    bids.push({ price: bidPrice, cumulativeVolume: bidCumulative });
    asks.push({ price: askPrice, cumulativeVolume: askCumulative });
  }

  return {
    pair,
    bids: bids.reverse(),
    asks,
    timestamp: Date.now(),
  };
}

function generateMockTechnicalIndicators(): TechnicalIndicators {
  return {
    rsi: Math.random() * 100,
    macd: {
      line: Math.random() * 100 - 50,
      signal: Math.random() * 100 - 50,
      histogram: Math.random() * 100 - 50,
    },
    bollinger: {
      upper: 44200,
      middle: 43150,
      lower: 42100,
    },
    movingAverages: {
      ma20: 43050,
      ma50: 42950,
      ma200: 42800,
    },
  };
}

function generateMockHeatmap() {
  const categories = [
    "Large Cap",
    "Mid Cap",
    "Small Cap",
    "DeFi",
    "Layer 2",
    "Meme Coins",
  ];
  const assets = [
    { symbol: "BTC", change: 2.5, volume: "28.5B" },
    { symbol: "ETH", change: 1.8, volume: "12.3B" },
    { symbol: "SOL", change: 8.2, volume: "2.1B" },
    { symbol: "XRP", change: 5.1, volume: "1.8B" },
    { symbol: "ADA", change: 3.7, volume: "1.2B" },
    { symbol: "DOGE", change: 4.3, volume: "0.9B" },
  ];

  return {
    categories,
    assets,
    timestamp: Date.now(),
  };
}

function generateMockVolatility(period: number) {
  const data = [];
  for (let i = 0; i < period; i++) {
    data.push({
      date: new Date(Date.now() - (period - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      volatility: (Math.random() * 5 + 1).toFixed(2),
    });
  }
  return data;
}

export default marketRouter;

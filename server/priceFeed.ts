/**
 * CoinGecko price feed service
 * Fetches live price data, OHLCV candles, and market data
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  LTC: "litecoin",
  ATOM: "cosmos",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  FIL: "filecoin",
  TRX: "tron",
  ETC: "ethereum-classic",
};

export function symbolToId(symbol: string): string {
  return SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
}

export interface PriceData {
  symbol: string;
  id: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  image: string;
  lastUpdated: string;
}

export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function fetchTopCoins(limit = 20): Promise<PriceData[]> {
  try {
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();
    return data.map((coin: Record<string, unknown>) => ({
      symbol: String(coin.symbol).toUpperCase(),
      id: coin.id as string,
      name: coin.name as string,
      currentPrice: (coin.current_price as number) || 0,
      priceChange24h: (coin.price_change_24h as number) || 0,
      priceChangePercent24h: (coin.price_change_percentage_24h as number) || 0,
      marketCap: (coin.market_cap as number) || 0,
      volume24h: (coin.total_volume as number) || 0,
      high24h: (coin.high_24h as number) || 0,
      low24h: (coin.low_24h as number) || 0,
      circulatingSupply: (coin.circulating_supply as number) || 0,
      image: (coin.image as string) || "",
      lastUpdated: (coin.last_updated as string) || new Date().toISOString(),
    }));
  } catch (err) {
    console.error("[PriceFeed] fetchTopCoins error:", err);
    return [];
  }
}

export async function fetchCoinPrice(symbol: string): Promise<PriceData | null> {
  try {
    const id = symbolToId(symbol);
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${id}&sparkline=false`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();
    if (!data[0]) return null;
    const coin = data[0];
    return {
      symbol: String(coin.symbol).toUpperCase(),
      id: coin.id,
      name: coin.name,
      currentPrice: coin.current_price || 0,
      priceChange24h: coin.price_change_24h || 0,
      priceChangePercent24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap || 0,
      volume24h: coin.total_volume || 0,
      high24h: coin.high_24h || 0,
      low24h: coin.low_24h || 0,
      circulatingSupply: coin.circulating_supply || 0,
      image: coin.image || "",
      lastUpdated: coin.last_updated || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[PriceFeed] fetchCoinPrice error:", err);
    return null;
  }
}

export async function fetchOHLCData(symbol: string, days: number = 7): Promise<OHLCCandle[]> {
  try {
    const id = symbolToId(symbol);
    const url = `${COINGECKO_BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko OHLC error: ${res.status}`);
    const data: number[][] = await res.json();
    return data.map(([timestamp, open, high, low, close]) => ({
      timestamp,
      open,
      high,
      low,
      close,
    }));
  } catch (err) {
    console.error("[PriceFeed] fetchOHLCData error:", err);
    return [];
  }
}

export async function fetchMarketChart(symbol: string, days: number = 30): Promise<{ timestamp: number; price: number }[]> {
  try {
    const id = symbolToId(symbol);
    const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko chart error: ${res.status}`);
    const data = await res.json();
    return (data.prices || []).map(([timestamp, price]: number[]) => ({ timestamp, price }));
  } catch (err) {
    console.error("[PriceFeed] fetchMarketChart error:", err);
    return [];
  }
}

// Calculate technical indicators from OHLC data
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine.slice(-9), 9);
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return { macd, signal, histogram: macd - signal };
}

export function calculateBollingerBands(closes: number[], period = 20, stdDev = 2) {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: middle + stdDev * std, middle, lower: middle - stdDev * std };
}

export function calculateATR(candles: OHLCCandle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(hl, hc, lc));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function calculateADX(candles: OHLCCandle[], period = 14): number {
  if (candles.length < period * 2) return 25;
  // Simplified ADX approximation
  let upMoves = 0, downMoves = 0;
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    if (upMove > downMove && upMove > 0) upMoves += upMove;
    if (downMove > upMove && downMove > 0) downMoves += downMove;
  }
  const total = upMoves + downMoves;
  if (total === 0) return 25;
  return Math.min(100, Math.abs((upMoves - downMoves) / total) * 100);
}

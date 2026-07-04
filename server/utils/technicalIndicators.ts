/**
 * Technical Indicators Library
 * Implements RSI, MACD, Bollinger Bands, and ATR calculations
 */

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIValue {
  timestamp: number;
  rsi: number;
}

export interface MACDValue {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsValue {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface ATRValue {
  timestamp: number;
  atr: number;
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param closes Array of closing prices
 * @param period Period for RSI calculation (default: 14)
 * @returns Array of RSI values
 */
export function calculateRSI(closes: number[], period: number = 14): RSIValue[] {
  const rsiValues: RSIValue[] = [];
  
  if (closes.length < period + 1) return [];

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI for each subsequent price
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    rsiValues.push({
      timestamp: i,
      rsi: Math.round(rsi * 100) / 100,
    });
  }

  return rsiValues;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param closes Array of closing prices
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line period (default: 9)
 * @returns Array of MACD values
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDValue[] {
  const macdValues: MACDValue[] = [];

  if (closes.length < slowPeriod) return [];

  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = slowPeriod - 1; i < closes.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    macdValues.push({
      timestamp: slowPeriod + i,
      macd: Math.round(macdLine[i] * 10000) / 10000,
      signal: Math.round(signalLine[i] * 10000) / 10000,
      histogram: Math.round((macdLine[i] - signalLine[i]) * 10000) / 10000,
    });
  }

  return macdValues;
}

/**
 * Calculate Bollinger Bands
 * @param closes Array of closing prices
 * @param period Period for SMA (default: 20)
 * @param stdDevMultiplier Standard deviation multiplier (default: 2)
 * @returns Array of Bollinger Bands values
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsValue[] {
  const bbValues: BollingerBandsValue[] = [];

  if (closes.length < period) return [];

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b) / period;

    // Calculate standard deviation
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    bbValues.push({
      timestamp: i,
      upper: Math.round((sma + stdDev * stdDevMultiplier) * 10000) / 10000,
      middle: Math.round(sma * 10000) / 10000,
      lower: Math.round((sma - stdDev * stdDevMultiplier) * 10000) / 10000,
    });
  }

  return bbValues;
}

/**
 * Calculate ATR (Average True Range)
 * @param ohlcData Array of OHLC data
 * @param period Period for ATR (default: 14)
 * @returns Array of ATR values
 */
export function calculateATR(ohlcData: OHLC[], period: number = 14): ATRValue[] {
  const atrValues: ATRValue[] = [];

  if (ohlcData.length < period) return [];

  const trValues: number[] = [];

  // Calculate True Range for each candle
  for (let i = 0; i < ohlcData.length; i++) {
    let tr = ohlcData[i].high - ohlcData[i].low;

    if (i > 0) {
      const hc = Math.abs(ohlcData[i].high - ohlcData[i - 1].close);
      const lc = Math.abs(ohlcData[i].low - ohlcData[i - 1].close);
      tr = Math.max(tr, hc, lc);
    }

    trValues.push(tr);
  }

  // Calculate ATR as SMA of TR
  let atr = trValues.slice(0, period).reduce((a, b) => a + b) / period;
  atrValues.push({ timestamp: period - 1, atr: Math.round(atr * 10000) / 10000 });

  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    atrValues.push({ timestamp: i, atr: Math.round(atr * 10000) / 10000 });
  }

  return atrValues;
}

/**
 * Calculate EMA (Exponential Moving Average)
 * Helper function for MACD and other indicators
 */
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate SMA for first period
  let sma = data.slice(0, period).reduce((a, b) => a + b) / period;
  ema.push(sma);

  // Calculate EMA for remaining data
  for (let i = period; i < data.length; i++) {
    sma = (data[i] - sma) * multiplier + sma;
    ema.push(sma);
  }

  // Fill initial values with SMA
  for (let i = 0; i < period - 1; i++) {
    ema.unshift(data.slice(0, i + 1).reduce((a, b) => a + b) / (i + 1));
  }

  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 * @param data Array of values
 * @param period Period for SMA
 * @returns Array of SMA values
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b) / period;
    sma.push(Math.round(avg * 10000) / 10000);
  }

  return sma;
}

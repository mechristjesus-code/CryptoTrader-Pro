import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateSMA,
  type OHLC,
} from '../utils/technicalIndicators';

export const indicatorsRouter = router({
  // Calculate RSI
  rsi: publicProcedure
    .input(z.object({
      closes: z.array(z.number()),
      period: z.number().optional(),
    }))
    .query(({ input }) => {
      try {
        const rsiValues = calculateRSI(input.closes, input.period || 14);
        return { success: true, data: rsiValues };
      } catch (error) {
        console.error('Error calculating RSI:', error);
        return { success: false, data: [], error: 'Failed to calculate RSI' };
      }
    }),

  // Calculate MACD
  macd: publicProcedure
    .input(z.object({
      closes: z.array(z.number()),
      fastPeriod: z.number().optional(),
      slowPeriod: z.number().optional(),
      signalPeriod: z.number().optional(),
    }))
    .query(({ input }) => {
      try {
        const macdValues = calculateMACD(
          input.closes,
          input.fastPeriod || 12,
          input.slowPeriod || 26,
          input.signalPeriod || 9
        );
        return { success: true, data: macdValues };
      } catch (error) {
        console.error('Error calculating MACD:', error);
        return { success: false, data: [], error: 'Failed to calculate MACD' };
      }
    }),

  // Calculate Bollinger Bands
  bollingerBands: publicProcedure
    .input(z.object({
      closes: z.array(z.number()),
      period: z.number().optional(),
      stdDevMultiplier: z.number().optional(),
    }))
    .query(({ input }) => {
      try {
        const bbValues = calculateBollingerBands(
          input.closes,
          input.period || 20,
          input.stdDevMultiplier || 2
        );
        return { success: true, data: bbValues };
      } catch (error) {
        console.error('Error calculating Bollinger Bands:', error);
        return { success: false, data: [], error: 'Failed to calculate Bollinger Bands' };
      }
    }),

  // Calculate ATR
  atr: publicProcedure
    .input(z.object({
      ohlcData: z.array(z.object({
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number(),
      })),
      period: z.number().optional(),
    }))
    .query(({ input }) => {
      try {
        const atrValues = calculateATR(input.ohlcData as OHLC[], input.period || 14);
        return { success: true, data: atrValues };
      } catch (error) {
        console.error('Error calculating ATR:', error);
        return { success: false, data: [], error: 'Failed to calculate ATR' };
      }
    }),

  // Calculate SMA
  sma: publicProcedure
    .input(z.object({
      closes: z.array(z.number()),
      period: z.number(),
    }))
    .query(({ input }) => {
      try {
        const smaValues = calculateSMA(input.closes, input.period);
        return { success: true, data: smaValues };
      } catch (error) {
        console.error('Error calculating SMA:', error);
        return { success: false, data: [], error: 'Failed to calculate SMA' };
      }
    }),

  // Calculate all indicators at once
  all: publicProcedure
    .input(z.object({
      ohlcData: z.array(z.object({
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number(),
      })),
    }))
    .query(({ input }) => {
      try {
        const closes = input.ohlcData.map(d => d.close);
        
        const rsi = calculateRSI(closes, 14);
        const macd = calculateMACD(closes, 12, 26, 9);
        const bb = calculateBollingerBands(closes, 20, 2);
        const atr = calculateATR(input.ohlcData as OHLC[], 14);
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);

        return {
          success: true,
          data: {
            rsi,
            macd,
            bollingerBands: bb,
            atr,
            sma20,
            sma50,
          },
        };
      } catch (error) {
        console.error('Error calculating indicators:', error);
        return { success: false, data: {}, error: 'Failed to calculate indicators' };
      }
    }),
});

import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { encryptCredential, decryptCredential } from "./encryption";
import {
  fetchTopCoins,
  fetchCoinPrice,
  fetchOHLCData,
  fetchMarketChart,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateADX,
} from "./priceFeed";
import {
  upsertUser,
  getUserByOpenId,
  upsertExchangeCredential,
  getAllExchangeCredentials,
  getExchangeCredentials,
  deleteExchangeCredential,
  upsertBotCredential,
  getBotCredentials,
  getPaperTradingAccount,
  createPaperTradingAccount,
  updatePaperTradingBalance,
  getPaperTradingPositions,
  insertTradeLog,
  getTradeLogs,
  getTradeLogCount,
  insertPortfolioSnapshot,
  getLatestPortfolioSnapshot,
  getTradingBots,
  getTradingBot,
  insertTradingBot,
  updateTradingBotStatus,
  deleteTradingBot,
  insertBotSignal,
  getBotSignals,
  insertAIAnalysisResult,
  getAIAnalysisHistory,
  insertAIChatMessage,
  getAIChatHistory,
  clearAIChatHistory,
  insertPredictionTrade,
  getPredictionTrades,
  getActivePredictionTrades,
  settlePredictionTrade,
  insertTradeArchive,
  getTradeArchives,
} from "./db";
import { advancedOrdersRouter } from "./routers/advancedOrders";
import { alertsRouter } from "./routers/alerts";
import { analyticsRouter } from "./routers/analytics";
import { socialRouter } from "./routers/social";

const COOKIE_NAME = "auth";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Price Feed ─────────────────────────────────────────────────────────────
  prices: router({
    getTopCoins: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return fetchTopCoins(input?.limit || 20);
      }),

    getCoinPrice: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return fetchCoinPrice(input);
      }),

    getOHLCData: publicProcedure
      .input(z.object({ symbol: z.string(), days: z.number().default(7) }))
      .query(async ({ input }) => {
        return fetchOHLCData(input.symbol, input.days);
      }),

    getMarketChart: publicProcedure
      .input(z.object({ symbol: z.string(), days: z.number().default(30) }))
      .query(async ({ input }) => {
        return fetchMarketChart(input.symbol, input.days);
      }),

    getTechnicalIndicators: publicProcedure
      .input(z.object({ symbol: z.string(), days: z.number().default(30) }))
      .query(async ({ input }) => {
        const candles = await fetchOHLCData(input.symbol, input.days);
        const closes = candles.map(c => c.close);
        const rsi = calculateRSI(closes);
        const macd = calculateMACD(closes);
        const bb = calculateBollingerBands(closes);
        const atr = calculateATR(candles);
        const adx = calculateADX(candles);
        const currentPrice = closes[closes.length - 1] || 0;
        return { rsi, macd, bollingerBands: bb, atr, adx, currentPrice, candleCount: candles.length };
      }),
  }),

  // ─── Exchange Credentials ────────────────────────────────────────────────────
  credentials: router({
    getExchanges: protectedProcedure.query(async ({ ctx }) => {
      const creds = await getAllExchangeCredentials(ctx.user.id);
      return creds.map(cred => ({
        ...cred,
        apiKey: decryptCredential(cred.apiKey).slice(0, 8) + "••••••••",
        apiSecret: "••••••••",
        passphrase: cred.passphrase ? "••••••••" : undefined,
      }));
    }),

    saveExchange: protectedProcedure
      .input(z.object({
        exchange: z.enum(["kraken", "coinbase"]),
        apiKey: z.string().min(1),
        apiSecret: z.string().min(1),
        passphrase: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertExchangeCredential({
          userId: ctx.user.id,
          exchange: input.exchange,
          apiKey: encryptCredential(input.apiKey),
          apiSecret: encryptCredential(input.apiSecret),
          passphrase: input.passphrase ? encryptCredential(input.passphrase) : undefined,
          isActive: 1,
        });
        return { success: true };
      }),

    deleteExchange: protectedProcedure
      .input(z.enum(["kraken", "coinbase"]))
      .mutation(async ({ ctx, input }) => {
        await deleteExchangeCredential(ctx.user.id, input);
        return { success: true };
      }),

    hasExchange: protectedProcedure
      .input(z.enum(["kraken", "coinbase"]))
      .query(async ({ ctx, input }) => {
        const cred = await getExchangeCredentials(ctx.user.id, input);
        return !!cred;
      }),
  }),

  // ─── Paper Trading ───────────────────────────────────────────────────────────
  paperTrading: router({
    getAccount: protectedProcedure.query(async ({ ctx }) => {
      let account = await getPaperTradingAccount(ctx.user.id);
      if (!account) {
        await createPaperTradingAccount(ctx.user.id, "10000");
        account = await getPaperTradingAccount(ctx.user.id);
      }
      return account;
    }),

    initialize: protectedProcedure
      .input(z.object({ initialBalance: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getPaperTradingAccount(ctx.user.id);
        if (existing) {
          await updatePaperTradingBalance(existing.id, input.initialBalance);
          return { success: true };
        }
        await createPaperTradingAccount(ctx.user.id, input.initialBalance);
        return { success: true };
      }),

    getPositions: protectedProcedure.query(async ({ ctx }) => {
      const account = await getPaperTradingAccount(ctx.user.id);
      if (!account) return [];
      return getPaperTradingPositions(account.id);
    }),

    placeTrade: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        side: z.enum(["buy", "sell"]),
        quantity: z.string(),
        price: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const account = await getPaperTradingAccount(ctx.user.id);
        if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "No paper trading account" });
        const qty = parseFloat(input.quantity);
        const price = parseFloat(input.price);
        const total = qty * price;
        const currentBalance = parseFloat(account.currentBalance);

        if (input.side === "buy" && total > currentBalance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        const newBalance = input.side === "buy" ? currentBalance - total : currentBalance + total;
        await updatePaperTradingBalance(account.id, newBalance.toFixed(2));
        await insertTradeLog({
          userId: ctx.user.id,
          tradeType: "paper",
          exchange: "paper",
          symbol: input.symbol,
          side: input.side,
          quantity: input.quantity,
          price: input.price,
          total: total.toFixed(2),
          status: "filled",
        });
        return { success: true, newBalance: newBalance.toFixed(2) };
      }),
  }),

  // ─── Trade Logs ──────────────────────────────────────────────────────────────
  trades: router({
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        return getTradeLogs(ctx.user.id, input?.limit || 100, input?.offset || 0);
      }),

    recordTrade: protectedProcedure
      .input(z.object({
        tradeType: z.enum(["live", "paper"]),
        exchange: z.enum(["kraken", "coinbase", "paper"]),
        symbol: z.string(),
        side: z.enum(["buy", "sell"]),
        quantity: z.string(),
        price: z.string(),
        total: z.string(),
        fee: z.string().optional(),
        orderId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await insertTradeLog({ ...input, userId: ctx.user.id, status: "filled" });
        return { success: true };
      }),

    archiveToS3: protectedProcedure
      .input(z.object({ fileType: z.enum(["csv", "json"]) }))
      .mutation(async ({ ctx, input }) => {
        const trades = await getTradeLogs(ctx.user.id, 10000, 0);
        if (trades.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "No trades to archive" });

        let content: string;
        let mimeType: string;

        if (input.fileType === "csv") {
          const headers = "id,type,exchange,symbol,side,quantity,price,total,fee,status,date\n";
          const rows = trades.map(t =>
            `${t.id},${t.tradeType},${t.exchange},${t.symbol},${t.side},${t.quantity},${t.price},${t.total},${t.fee || "0"},${t.status},${t.createdAt.toISOString()}`
          ).join("\n");
          content = headers + rows;
          mimeType = "text/csv";
        } else {
          content = JSON.stringify(trades, null, 2);
          mimeType = "application/json";
        }

        const fileName = `trades-${ctx.user.id}-${Date.now()}.${input.fileType}`;
        const fileKey = `trade-archives/${ctx.user.id}/${fileName}`;
        const { key, url } = await storagePut(fileKey, Buffer.from(content, "utf-8"), mimeType);

        await insertTradeArchive({
          userId: ctx.user.id,
          fileName,
          fileKey: key,
          fileUrl: url,
          fileType: input.fileType,
          recordCount: trades.length,
          fileSizeBytes: Buffer.byteLength(content, "utf-8"),
        });

        return { success: true, url, fileName, recordCount: trades.length };
      }),

    getArchives: protectedProcedure.query(async ({ ctx }) => {
      return getTradeArchives(ctx.user.id);
    }),
  }),

  // ─── Portfolio ────────────────────────────────────────────────────────────────
  portfolio: router({
    getLatest: protectedProcedure
      .input(z.enum(["live", "paper"]))
      .query(async ({ ctx, input }) => {
        return getLatestPortfolioSnapshot(ctx.user.id, input);
      }),

    recordSnapshot: protectedProcedure
      .input(z.object({
        type: z.enum(["live", "paper"]),
        totalValue: z.string(),
        totalGain: z.string(),
        gainPercent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await insertPortfolioSnapshot({
          userId: ctx.user.id,
          type: input.type,
          totalValue: input.totalValue,
          totalGain: input.totalGain,
          gainPercent: input.gainPercent,
        });
        return { success: true };
      }),
  }),

  // ─── Trading Bots ─────────────────────────────────────────────────────────────
  bots: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTradingBots(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return getTradingBot(ctx.user.id, input);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        strategy: z.enum(["dca", "grid", "scalping", "swing", "arbitrage"]),
        symbol: z.string(),
        enabled: z.boolean().default(false),
        config: z.record(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const bot = await insertTradingBot({
          userId: ctx.user.id,
          name: input.name,
          strategy: input.strategy,
          symbol: input.symbol,
          enabled: input.enabled ? 1 : 0,
          config: JSON.stringify(input.config),
        });
        return { success: true, botId: bot.insertId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ botId: z.number(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await updateTradingBotStatus(ctx.user.id, input.botId, input.enabled ? 1 : 0);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await deleteTradingBot(ctx.user.id, input);
        return { success: true };
      }),

    getSignals: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return getBotSignals(input);
      }),
  }),

  // ─── AI Analysis ──────────────────────────────────────────────────────────────
  ai: router({
    analyzeChart: protectedProcedure
      .input(z.object({ symbol: z.string(), days: z.number().default(30) }))
      .mutation(async ({ ctx, input }) => {
        const candles = await fetchOHLCData(input.symbol, input.days);
        const closes = candles.map(c => c.close);
        const rsi = calculateRSI(closes);
        const macd = calculateMACD(closes);
        const bb = calculateBollingerBands(closes);

        const prompt = `Analyze this cryptocurrency chart data for ${input.symbol}:
        - Current Price: $${closes[closes.length - 1]}
        - RSI: ${rsi}
        - MACD: ${macd.macd}
        - Bollinger Bands: Upper=${bb.upper}, Middle=${bb.middle}, Lower=${bb.lower}
        
        Provide a brief technical analysis with trading insights.`;

        const analysis = await invokeLLM(prompt);
        await insertAIAnalysisResult({
          userId: ctx.user.id,
          symbol: input.symbol,
          analysis: analysis,
        });

        return { analysis };
      }),

    chat: protectedProcedure
      .input(z.object({ message: z.string(), symbol: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM(input.message);
        await insertAIChatMessage({
          userId: ctx.user.id,
          message: input.message,
          response: response,
          symbol: input.symbol,
        });

        return { response };
      }),

    getChatHistory: protectedProcedure.query(async ({ ctx }) => {
      return getAIChatHistory(ctx.user.id);
    }),

    clearChat: protectedProcedure.mutation(async ({ ctx }) => {
      await clearAIChatHistory(ctx.user.id);
      return { success: true };
    }),

    getAnalysisHistory: protectedProcedure.query(async ({ ctx }) => {
      return getAIAnalysisHistory(ctx.user.id);
    }),
  }),

  // ─── Prediction Trading ───────────────────────────────────────────────────────
  predictions: router({
    create: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        direction: z.enum(["up", "down"]),
        amount: z.string(),
        durationMinutes: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const prediction = await insertPredictionTrade({
          userId: ctx.user.id,
          symbol: input.symbol,
          direction: input.direction,
          amount: input.amount,
          durationMinutes: input.durationMinutes,
          status: "active",
        });

        return { success: true, predictionId: prediction.insertId };
      }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return getActivePredictionTrades(ctx.user.id);
    }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return getPredictionTrades(ctx.user.id);
    }),

    settle: protectedProcedure
      .input(z.object({ predictionId: z.number(), finalPrice: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await settlePredictionTrade(input.predictionId, input.finalPrice);
        return { success: true };
      }),
  }),

  // ─── Advanced Orders (NEW) ────────────────────────────────────────────────────
  advancedOrders: advancedOrdersRouter,

  // ─── Alerts & Automation (NEW) ────────────────────────────────────────────────
  alerts: alertsRouter,

  // ─── Portfolio Analytics (NEW) ────────────────────────────────────────────────
  analytics: analyticsRouter,

  // ─── Social & Community (NEW) ─────────────────────────────────────────────────
  social: socialRouter,
});

export type AppRouter = typeof appRouter;

import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  aiAnalysisResults,
  aiChatHistory,
  botCredentials,
  botSignals,
  exchangeCredentials,
  paperTradingAccounts,
  paperTradingPositions,
  pineScriptStrategies,
  portfolioSnapshots,
  predictionTrades,
  tradeArchives,
  tradeLogs,
  tradingBots,
  users,
  limitOrders,
  priceAlerts,
  riskMetrics,
  copyTradingRelationships,
  tradingSignals,
  contests,
  auditLogs,
  type InsertAIChatHistory,
  type InsertAIAnalysisResult,
  type InsertBotCredential,
  type InsertBotSignal,
  type InsertExchangeCredential,
  type InsertPaperTradingAccount,
  type InsertPaperTradingPosition,
  type InsertPortfolioSnapshot,
  type InsertPredictionTrade,
  type InsertTradeArchive,
  type InsertTradeLog,
  type InsertTradingBot,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Export raw db for routers that need direct access
export const db = {
  select: async (...args: any[]) => (await getDb())?.select(...args),
  insert: async (...args: any[]) => (await getDb())?.insert(...args),
  update: async (...args: any[]) => (await getDb())?.update(...args),
  delete: async (...args: any[]) => (await getDb())?.delete(...args),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Exchange Credentials ─────────────────────────────────────────────────────

export async function upsertExchangeCredential(data: InsertExchangeCredential) {
  const db = await getDb();
  if (!db) return;
  await db.insert(exchangeCredentials).values(data).onDuplicateKeyUpdate({
    set: { apiKey: data.apiKey, apiSecret: data.apiSecret, passphrase: data.passphrase, isActive: 1 },
  });
}

export async function getAllExchangeCredentials(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exchangeCredentials).where(eq(exchangeCredentials.userId, userId));
}

export async function getExchangeCredentials(userId: number, exchange: "kraken" | "coinbase") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(exchangeCredentials)
    .where(and(eq(exchangeCredentials.userId, userId), eq(exchangeCredentials.exchange, exchange)))
    .limit(1);
  return result[0];
}

export async function deleteExchangeCredential(userId: number, exchange: "kraken" | "coinbase") {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(exchangeCredentials)
    .where(and(eq(exchangeCredentials.userId, userId), eq(exchangeCredentials.exchange, exchange)));
}

// ─── Bot Credentials ──────────────────────────────────────────────────────────

export async function upsertBotCredential(data: InsertBotCredential) {
  const db = await getDb();
  if (!db) return;
  await db.insert(botCredentials).values(data).onDuplicateKeyUpdate({
    set: { apiKey: data.apiKey, apiSecret: data.apiSecret, isActive: 1 },
  });
}

export async function getBotCredentials(userId: number, platform: "cryptohopper" | "3commas") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(botCredentials)
    .where(and(eq(botCredentials.userId, userId), eq(botCredentials.botPlatform, platform)))
    .limit(1);
  return result[0];
}

// ─── Paper Trading ────────────────────────────────────────────────────────────

export async function getPaperTradingAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(paperTradingAccounts)
    .where(eq(paperTradingAccounts.userId, userId))
    .limit(1);
  return result[0];
}

export async function createPaperTradingAccount(userId: number, initialBalance: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(paperTradingAccounts).values({ userId, initialBalance, currentBalance: initialBalance });
}

export async function updatePaperTradingBalance(accountId: number, currentBalance: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(paperTradingAccounts)
    .set({ currentBalance })
    .where(eq(paperTradingAccounts.id, accountId));
}

export async function getPaperTradingPositions(accountId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paperTradingPositions).where(eq(paperTradingPositions.accountId, accountId));
}

export async function upsertPaperTradingPosition(data: InsertPaperTradingPosition) {
  const db = await getDb();
  if (!db) return;
  await db.insert(paperTradingPositions).values(data).onDuplicateKeyUpdate({
    set: { quantity: data.quantity, entryPrice: data.entryPrice },
  });
}

export async function deletePaperTradingPosition(accountId: number, symbol: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(paperTradingPositions)
    .where(and(eq(paperTradingPositions.accountId, accountId), eq(paperTradingPositions.symbol, symbol)));
}

// ─── Trade Logs ───────────────────────────────────────────────────────────────

export async function getTradeLogs(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tradeLogs)
    .where(eq(tradeLogs.userId, userId))
    .orderBy(desc(tradeLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function insertTradeLog(data: InsertTradeLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tradeLogs).values(data);
}

export async function getTradeLogCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(tradeLogs).where(eq(tradeLogs.userId, userId));
  return result.length;
}

// ─── Portfolio Snapshots ──────────────────────────────────────────────────────

export async function getLatestPortfolioSnapshot(userId: number, snapshotType: "live" | "paper") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(portfolioSnapshots)
    .where(and(eq(portfolioSnapshots.userId, userId), eq(portfolioSnapshots.snapshotType, snapshotType)))
    .orderBy(desc(portfolioSnapshots.createdAt))
    .limit(1);
  return result[0];
}

export async function insertPortfolioSnapshot(data: InsertPortfolioSnapshot) {
  const db = await getDb();
  if (!db) return;
  await db.insert(portfolioSnapshots).values(data);
}

// ─── Trading Bots ─────────────────────────────────────────────────────────────

export async function getTradingBots(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tradingBots).where(eq(tradingBots.userId, userId)).orderBy(desc(tradingBots.createdAt));
}

export async function getTradingBot(userId: number, botId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(tradingBots)
    .where(and(eq(tradingBots.id, botId), eq(tradingBots.userId, userId)))
    .limit(1);
  return result[0];
}

export async function insertTradingBot(data: InsertTradingBot) {
  const db = await getDb();
  if (!db) return { insertId: 0 };
  const result = await db.insert(tradingBots).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function updateTradingBotStatus(userId: number, botId: number, enabled: number) {
  const db = await getDb();
  if (!db) return;
  const status = enabled ? "active" : "stopped";
  await db.update(tradingBots).set({ status }).where(and(eq(tradingBots.id, botId), eq(tradingBots.userId, userId)));
}

export async function deleteTradingBot(userId: number, botId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tradingBots).where(and(eq(tradingBots.id, botId), eq(tradingBots.userId, userId)));
}

export async function insertBotSignal(data: InsertBotSignal) {
  const db = await getDb();
  if (!db) return;
  await db.insert(botSignals).values(data);
}

export async function getBotSignals(botId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(botSignals).where(eq(botSignals.botId, botId)).orderBy(desc(botSignals.createdAt)).limit(limit);
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export async function insertAIAnalysisResult(data: InsertAIAnalysisResult) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiAnalysisResults).values(data);
}

export async function getAIAnalysisHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiAnalysisResults)
    .where(eq(aiAnalysisResults.userId, userId))
    .orderBy(desc(aiAnalysisResults.createdAt))
    .limit(limit);
}

// ─── AI Chat History ──────────────────────────────────────────────────────────

export async function insertAIChatMessage(data: InsertAIChatHistory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiChatHistory).values(data);
}

export async function getAIChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .orderBy(desc(aiChatHistory.createdAt))
    .limit(limit);
}

export async function clearAIChatHistory(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiChatHistory).where(eq(aiChatHistory.userId, userId));
}

// ─── Prediction Trades ────────────────────────────────────────────────────────

export async function insertPredictionTrade(data: InsertPredictionTrade) {
  const db = await getDb();
  if (!db) return;
  await db.insert(predictionTrades).values(data);
}

export async function getPredictionTrades(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(predictionTrades)
    .where(eq(predictionTrades.userId, userId))
    .orderBy(desc(predictionTrades.createdAt))
    .limit(limit);
}

export async function getActivePredictionTrades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(predictionTrades)
    .where(and(eq(predictionTrades.userId, userId), eq(predictionTrades.status, "active")));
}

export async function settlePredictionTrade(
  tradeId: number,
  exitPrice: string,
  profitLoss: string,
  leveragedProfitLoss: string,
  leveragedProfitLossPercentage: string,
  priceChange: string,
  status: "won" | "lost" | "settled",
  result: "win" | "loss" | "break_even",
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(predictionTrades)
    .set({
      exitPrice,
      exitTime: new Date(),
      profitLoss,
      leveragedProfitLoss,
      leveragedProfitLossPercentage,
      priceChange,
      status,
      result,
    })
    .where(eq(predictionTrades.id, tradeId));
}

// ─── Trade Archives ───────────────────────────────────────────────────────────

export async function insertTradeArchive(data: InsertTradeArchive) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tradeArchives).values(data);
}

export async function getTradeArchives(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tradeArchives)
    .where(eq(tradeArchives.userId, userId))
    .orderBy(desc(tradeArchives.createdAt));
}

// ─── Pine Script Strategies ───────────────────────────────────────────────────

export async function getPineScriptStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pineScriptStrategies).where(eq(pineScriptStrategies.userId, userId));
}

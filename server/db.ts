import { eq } from "drizzle-orm";
import { and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  threecommasAccounts,
  cryptohopperAccounts,
  krakenAccounts,
  bots,
  deals,
  marketData,
  trades,
  notifications,
  aiChatHistory,
  userSettings,
  type Bot,
  type Deal,
  type MarketData,
  type Trade,
  type Notification,
  type InsertMarketData,
  type InsertDeal,
  type InsertTrade,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Platform Account Management

export async function getThreecommasAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(threecommasAccounts)
    .where(and(eq(threecommasAccounts.userId, userId), eq(threecommasAccounts.isActive, 1)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCryptohopperAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(cryptohopperAccounts)
    .where(and(eq(cryptohopperAccounts.userId, userId), eq(cryptohopperAccounts.isActive, 1)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getKrakenAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(krakenAccounts)
    .where(and(eq(krakenAccounts.userId, userId), eq(krakenAccounts.isActive, 1)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Bot Management

export async function getUserBots(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bots).where(eq(bots.userId, userId));
}

export async function getBotById(botId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBot(botData: Partial<Bot> & { userId: number; platformBotId: string; platform: string }) {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await db
    .select()
    .from(bots)
    .where(
      and(
        eq(bots.userId, botData.userId),
        eq(bots.platformBotId, botData.platformBotId),
        eq(bots.platform, botData.platform as any)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.update(bots).set(botData).where(eq(bots.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(bots).values(botData as any);
    return result[0];
  }
}

// Deal Management

export async function getBotDeals(botId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(deals)
    .where(eq(deals.botId, botId))
    .orderBy(desc(deals.openedAt))
    .limit(limit);
}

export async function upsertDeal(dealData: Partial<Deal> & { userId: number; botId: number; platformDealId: string }) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.userId, dealData.userId),
        eq(deals.platformDealId, dealData.platformDealId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.update(deals).set(dealData).where(eq(deals.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(deals).values(dealData as any);
    return result[0];
  }
}

// Market Data Management

export async function storeMarketData(data: InsertMarketData) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(marketData).values(data);
  return result[0];
}

export async function getMarketData(userId: number, pair: string, timeframe: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(marketData)
    .where(
      and(
        eq(marketData.userId, userId),
        eq(marketData.pair, pair),
        eq(marketData.timeframe, timeframe)
      )
    )
    .orderBy(desc(marketData.timestamp))
    .limit(limit);
}

// Trade Management

export async function storeTrade(data: InsertTrade) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(trades).values(data);
  return result[0];
}

export async function getUserTrades(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.timestamp))
    .limit(limit);
}

// Notification Management

export async function createNotification(data: {
  userId: number;
  type: 'deal_completed' | 'loss_threshold' | 'bot_error' | 'market_alert';
  title: string;
  message: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(notifications).values(data);
  return result[0];
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Chat History Management

export async function saveChatMessage(userId: number, role: 'user' | 'assistant', message: string, context?: any) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(aiChatHistory).values({
    userId,
    role,
    message,
    context,
  });
  return result[0];
}

export async function getChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .orderBy(desc(aiChatHistory.createdAt))
    .limit(limit);
}

// User Settings Management

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSettings(userId: number, settings: Partial<typeof userSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await getUserSettings(userId);
  if (existing) {
    await db.update(userSettings).set(settings).where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, ...settings } as any);
  }
}

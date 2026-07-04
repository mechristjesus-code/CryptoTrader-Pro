import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Platform API Credentials Tables

export const threecommasAccounts = mysqlTable("threecommas_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: text("apiKey").notNull(), // Encrypted
  apiSecret: text("apiSecret").notNull(), // Encrypted
  accountName: varchar("accountName", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThreecommasAccount = typeof threecommasAccounts.$inferSelect;
export type InsertThreecommasAccount = typeof threecommasAccounts.$inferInsert;

export const cryptohopperAccounts = mysqlTable("cryptohopper_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accessToken: text("accessToken").notNull(), // Encrypted
  refreshToken: text("refreshToken"), // Encrypted
  accountName: varchar("accountName", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CryptohopperAccount = typeof cryptohopperAccounts.$inferSelect;
export type InsertCryptohopperAccount = typeof cryptohopperAccounts.$inferInsert;

export const krakenAccounts = mysqlTable("kraken_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: text("apiKey").notNull(), // Encrypted
  apiSecret: text("apiSecret").notNull(), // Encrypted
  accountName: varchar("accountName", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KrakenAccount = typeof krakenAccounts.$inferSelect;
export type InsertKrakenAccount = typeof krakenAccounts.$inferInsert;

// Bot Tracking Tables

export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["3commas", "cryptohopper"]).notNull(),
  platformBotId: varchar("platformBotId", { length: 255 }).notNull(),
  botName: varchar("botName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "paused", "error"]).default("inactive").notNull(),
  exchange: varchar("exchange", { length: 100 }),
  tradingPair: varchar("tradingPair", { length: 50 }),
  currentProfit: decimal("currentProfit", { precision: 18, scale: 8 }).default("0"),
  totalProfit: decimal("totalProfit", { precision: 18, scale: 8 }).default("0"),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0"),
  totalDeals: int("totalDeals").default(0),
  openDeals: int("openDeals").default(0),
  metadata: json("metadata"), // Store platform-specific data
  lastUpdatedAt: timestamp("lastUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// Deal/Trade Tracking Tables

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  botId: int("botId").notNull(),
  platform: mysqlEnum("platform", ["3commas", "cryptohopper"]).notNull(),
  platformDealId: varchar("platformDealId", { length: 255 }).notNull(),
  pair: varchar("pair", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).notNull(),
  entryPrice: decimal("entryPrice", { precision: 18, scale: 8 }).notNull(),
  exitPrice: decimal("exitPrice", { precision: 18, scale: 8 }),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  profit: decimal("profit", { precision: 18, scale: 8 }).default("0"),
  profitPercent: decimal("profitPercent", { precision: 5, scale: 2 }).default("0"),
  openedAt: timestamp("openedAt").notNull(),
  closedAt: timestamp("closedAt"),
  metadata: json("metadata"), // Store platform-specific deal data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// Market Data Storage (Kraken OHLC)

export const marketData = mysqlTable("market_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pair: varchar("pair", { length: 50 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(), // 1m, 5m, 15m, 1h, 4h, 1d, etc.
  timestamp: int("timestamp").notNull(), // Unix timestamp
  open: decimal("open", { precision: 18, scale: 8 }).notNull(),
  high: decimal("high", { precision: 18, scale: 8 }).notNull(),
  low: decimal("low", { precision: 18, scale: 8 }).notNull(),
  close: decimal("close", { precision: 18, scale: 8 }).notNull(),
  volume: decimal("volume", { precision: 18, scale: 8 }).notNull(),
  trades: int("trades"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

// Unified Trade Tracking

export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["kraken", "3commas", "cryptohopper"]).notNull(),
  platformTradeId: varchar("platformTradeId", { length: 255 }).notNull(),
  pair: varchar("pair", { length: 50 }).notNull(),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }).default("0"),
  timestamp: timestamp("timestamp").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// Paper Trading Simulations

export const paperTrades = mysqlTable("paper_trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  strategyName: varchar("strategyName", { length: 255 }).notNull(),
  pair: varchar("pair", { length: 50 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  initialBalance: decimal("initialBalance", { precision: 18, scale: 8 }).notNull(),
  finalBalance: decimal("finalBalance", { precision: 18, scale: 8 }).notNull(),
  profit: decimal("profit", { precision: 18, scale: 8 }).default("0"),
  profitPercent: decimal("profitPercent", { precision: 5, scale: 2 }).default("0"),
  totalTrades: int("totalTrades").default(0),
  winningTrades: int("winningTrades").default(0),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaperTrade = typeof paperTrades.$inferSelect;
export type InsertPaperTrade = typeof paperTrades.$inferInsert;

// Notifications

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deal_completed", "loss_threshold", "bot_error", "market_alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// AI Chat History

export const aiChatHistory = mysqlTable("ai_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: text("message").notNull(),
  context: json("context"), // Store relevant bot/market data context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;

// User Settings

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("dark").notNull(),
  notificationsEnabled: int("notificationsEnabled").default(1).notNull(),
  emailNotificationsEnabled: int("emailNotificationsEnabled").default(0).notNull(),
  dataRefreshInterval: int("dataRefreshInterval").default(60).notNull(), // seconds
  dataRetentionDays: int("dataRetentionDays").default(90).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Advanced Orders Tables

export const advancedOrders = mysqlTable("advanced_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  orderType: mysqlEnum("orderType", ["limit", "stop_loss", "take_profit", "trailing_stop", "oco"]).notNull(),
  side: mysqlEnum("side", ["buy", "sell"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entryPrice", { precision: 18, scale: 8 }).notNull(),
  limitPrice: decimal("limitPrice", { precision: 18, scale: 8 }),
  stopPrice: decimal("stopPrice", { precision: 18, scale: 8 }),
  trailingPercent: decimal("trailingPercent", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["pending", "active", "filled", "cancelled", "expired"]).default("pending").notNull(),
  exchange: varchar("exchange", { length: 50 }).notNull(),
  executedPrice: decimal("executedPrice", { precision: 18, scale: 8 }),
  executedQuantity: decimal("executedQuantity", { precision: 18, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type AdvancedOrder = typeof advancedOrders.$inferSelect;
export type InsertAdvancedOrder = typeof advancedOrders.$inferInsert;

export const orderHistory = mysqlTable("order_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "filled", "cancelled", "expired"]).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }),
  quantity: decimal("quantity", { precision: 18, scale: 8 }),
  fee: decimal("fee", { precision: 18, scale: 8 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderHistory = typeof orderHistory.$inferSelect;
export type InsertOrderHistory = typeof orderHistory.$inferInsert;

import {
  mysqlTable,
  int,
  varchar,
  decimal,
  timestamp,
  enum as enumType,
  json,
  boolean,
  index,
  foreignKey,
  text,
} from 'drizzle-orm/mysql-core';

// ─────────────────────────────────────────────────────────────────────────
// ADVANCED ORDERS (12 features)
// ─────────────────────────────────────────────────────────────────────────

export const limitOrders = mysqlTable(
  'limitOrders',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    price: decimal('price', { precision: 20, scale: 8 }).notNull(),
    quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
    type: enumType('type', ['buy', 'sell']).notNull(),
    status: enumType('status', ['pending', 'executed', 'cancelled', 'expired']).default('pending'),
    expiryDate: timestamp('expiryDate'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_limitOrders_user_status').on(table.userId, table.status),
    symbolPriceIdx: index('idx_limitOrders_symbol_price').on(table.symbol, table.price),
  })
);

export const stopLossOrders = mysqlTable(
  'stopLossOrders',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    triggerPrice: decimal('triggerPrice', { precision: 20, scale: 8 }).notNull(),
    quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
    status: enumType('status', ['pending', 'executed', 'cancelled']).default('pending'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_stopLoss_user_status').on(table.userId, table.status),
  })
);

export const takeProfitOrders = mysqlTable(
  'takeProfitOrders',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    targetPrice: decimal('targetPrice', { precision: 20, scale: 8 }).notNull(),
    quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
    status: enumType('status', ['pending', 'executed', 'cancelled']).default('pending'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_takeProfit_user_status').on(table.userId, table.status),
  })
);

export const trailingStopOrders = mysqlTable(
  'trailingStopOrders',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    trailingPercent: decimal('trailingPercent', { precision: 5, scale: 2 }).notNull(),
    quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
    highestPrice: decimal('highestPrice', { precision: 20, scale: 8 }),
    currentStopPrice: decimal('currentStopPrice', { precision: 20, scale: 8 }),
    status: enumType('status', ['pending', 'executed', 'cancelled']).default('pending'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_trailingStop_user_status').on(table.userId, table.status),
  })
);

export const ocoOrders = mysqlTable(
  'ocoOrders',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    stopLossOrderId: int('stopLossOrderId').notNull(),
    takeProfitOrderId: int('takeProfitOrderId').notNull(),
    status: enumType('status', ['active', 'executed', 'cancelled']).default('active'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_oco_user_status').on(table.userId, table.status),
  })
);

// ─────────────────────────────────────────────────────────────────────────
// ALERTS & AUTOMATION (10 features)
// ─────────────────────────────────────────────────────────────────────────

export const priceAlerts = mysqlTable(
  'priceAlerts',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    price: decimal('price', { precision: 20, scale: 8 }).notNull(),
    type: enumType('type', ['above', 'below']).notNull(),
    status: enumType('status', ['active', 'triggered', 'cancelled']).default('active'),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_priceAlert_user_status').on(table.userId, table.status),
  })
);

export const indicatorAlerts = mysqlTable(
  'indicatorAlerts',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    indicator: varchar('indicator', { length: 50 }).notNull(),
    threshold: decimal('threshold', { precision: 10, scale: 2 }).notNull(),
    type: enumType('type', ['above', 'below', 'crossover']).notNull(),
    status: enumType('status', ['active', 'triggered', 'cancelled']).default('active'),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_indicatorAlert_user_status').on(table.userId, table.status),
  })
);

export const webhooks = mysqlTable(
  'webhooks',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    url: text('url').notNull(),
    events: json('events').notNull(),
    status: enumType('status', ['active', 'inactive', 'failed']).default('active'),
    secret: varchar('secret', { length: 255 }).notNull(),
    lastTriggeredAt: timestamp('lastTriggeredAt'),
    failureCount: int('failureCount').default(0),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('idx_webhook_user_status').on(table.userId, table.status),
  })
);

export const scheduledTasks = mysqlTable(
  'scheduledTasks',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    taskType: varchar('taskType', { length: 50 }).notNull(),
    parameters: json('parameters').notNull(),
    scheduleTime: timestamp('scheduleTime'),
    frequency: enumType('frequency', ['once', 'daily', 'weekly', 'monthly']).default('once'),
    status: enumType('status', ['pending', 'completed', 'cancelled', 'failed']).default('pending'),
    lastExecutedAt: timestamp('lastExecutedAt'),
    nextExecutionAt: timestamp('nextExecutionAt'),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => ({
    userNextExecIdx: index('idx_scheduledTask_user_nextExec').on(table.userId, table.nextExecutionAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────
// PORTFOLIO ANALYTICS (10 features)
// ─────────────────────────────────────────────────────────────────────────

export const riskMetrics = mysqlTable(
  'riskMetrics',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }),
    sharpeRatio: decimal('sharpeRatio', { precision: 5, scale: 2 }),
    sortinoRatio: decimal('sortinoRatio', { precision: 5, scale: 2 }),
    maxDrawdown: decimal('maxDrawdown', { precision: 5, scale: 2 }),
    volatility: decimal('volatility', { precision: 5, scale: 2 }),
    valueAtRisk: decimal('valueAtRisk', { precision: 10, scale: 2 }),
    beta: decimal('beta', { precision: 5, scale: 2 }),
    calculatedAt: timestamp('calculatedAt').defaultNow(),
  },
  (table) => ({
    userSymbolIdx: index('idx_riskMetrics_user_symbol').on(table.userId, table.symbol),
  })
);

export const correlationMatrix = mysqlTable(
  'correlationMatrix',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol1: varchar('symbol1', { length: 20 }).notNull(),
    symbol2: varchar('symbol2', { length: 20 }).notNull(),
    correlation: decimal('correlation', { precision: 5, scale: 4 }),
    calculatedAt: timestamp('calculatedAt').defaultNow(),
  },
  (table) => ({
    userSymbolsIdx: index('idx_correlation_user_symbols').on(table.userId, table.symbol1, table.symbol2),
  })
);

export const performanceAttribution = mysqlTable(
  'performanceAttribution',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    contribution: decimal('contribution', { precision: 5, scale: 2 }),
    returnPercent: decimal('returnPercent', { precision: 10, scale: 2 }),
    calculatedAt: timestamp('calculatedAt').defaultNow(),
  },
  (table) => ({
    userSymbolIdx: index('idx_attribution_user_symbol').on(table.userId, table.symbol),
  })
);

// ─────────────────────────────────────────────────────────────────────────
// SOCIAL & COMMUNITY (6 features)
// ─────────────────────────────────────────────────────────────────────────

export const copyTradingRelationships = mysqlTable(
  'copyTradingRelationships',
  {
    id: int('id').primaryKey().autoincrement(),
    followerId: int('followerId').notNull(),
    leaderId: int('leaderId').notNull(),
    status: enumType('status', ['active', 'paused', 'stopped']).default('active'),
    positionSizePercent: decimal('positionSizePercent', { precision: 5, scale: 2 }).default('100'),
    startDate: timestamp('startDate').defaultNow(),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
  },
  (table) => ({
    leaderFollowersIdx: index('idx_copyTrading_leader_followers').on(table.leaderId),
  })
);

export const tradingSignals = mysqlTable(
  'tradingSignals',
  {
    id: int('id').primaryKey().autoincrement(),
    publisherId: int('publisherId').notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    action: enumType('action', ['buy', 'sell']).notNull(),
    price: decimal('price', { precision: 20, scale: 8 }),
    confidence: decimal('confidence', { precision: 3, scale: 2 }),
    description: text('description'),
    subscribers: int('subscribers').default(0),
    successRate: decimal('successRate', { precision: 5, scale: 2 }),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => ({
    publisherIdx: index('idx_tradingSignals_publisher').on(table.publisherId),
    symbolActionIdx: index('idx_tradingSignals_symbol_action').on(table.symbol, table.action),
  })
);

export const contests = mysqlTable(
  'contests',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    startDate: timestamp('startDate').notNull(),
    endDate: timestamp('endDate').notNull(),
    rules: json('rules'),
    prizes: json('prizes'),
    status: enumType('status', ['upcoming', 'active', 'completed']).default('upcoming'),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => ({
    statusDatesIdx: index('idx_contests_status_dates').on(table.status, table.startDate, table.endDate),
  })
);

export const contestParticipants = mysqlTable(
  'contestParticipants',
  {
    id: int('id').primaryKey().autoincrement(),
    contestId: int('contestId').notNull(),
    userId: int('userId').notNull(),
    rank: int('rank'),
    returnPercent: decimal('returnPercent', { precision: 5, scale: 2 }),
    prizeAmount: decimal('prizeAmount', { precision: 20, scale: 2 }),
    joinedAt: timestamp('joinedAt').defaultNow(),
  },
  (table) => ({
    contestRankIdx: index('idx_contestParticipants_contest_rank').on(table.contestId, table.rank),
  })
);

// ─────────────────────────────────────────────────────────────────────────
// COMPLIANCE & REPORTING (4 features)
// ─────────────────────────────────────────────────────────────────────────

export const taxReports = mysqlTable(
  'taxReports',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    year: int('year').notNull(),
    jurisdiction: varchar('jurisdiction', { length: 50 }),
    totalGains: decimal('totalGains', { precision: 20, scale: 2 }),
    totalLosses: decimal('totalLosses', { precision: 20, scale: 2 }),
    netGains: decimal('netGains', { precision: 20, scale: 2 }),
    taxableIncome: decimal('taxableIncome', { precision: 20, scale: 2 }),
    generatedAt: timestamp('generatedAt').defaultNow(),
  },
  (table) => ({
    userYearIdx: index('idx_taxReports_user_year').on(table.userId, table.year),
  })
);

export const arbitrageOpportunities = mysqlTable(
  'arbitrageOpportunities',
  {
    id: int('id').primaryKey().autoincrement(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    buyExchange: varchar('buyExchange', { length: 50 }).notNull(),
    buyPrice: decimal('buyPrice', { precision: 20, scale: 8 }).notNull(),
    sellExchange: varchar('sellExchange', { length: 50 }).notNull(),
    sellPrice: decimal('sellPrice', { precision: 20, scale: 8 }).notNull(),
    profitPercent: decimal('profitPercent', { precision: 5, scale: 2 }).notNull(),
    profitAmount: decimal('profitAmount', { precision: 20, scale: 2 }).notNull(),
    fees: decimal('fees', { precision: 5, scale: 2 }).notNull(),
    netProfit: decimal('netProfit', { precision: 5, scale: 2 }).notNull(),
    detectedAt: timestamp('detectedAt').defaultNow(),
    expiresAt: timestamp('expiresAt'),
  },
  (table) => ({
    symbolProfitIdx: index('idx_arbitrage_symbol_profit').on(table.symbol, table.profitPercent),
    detectedAtIdx: index('idx_arbitrage_detectedAt').on(table.detectedAt),
  })
);

export const auditLogs = mysqlTable(
  'auditLogs',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('userId').notNull(),
    action: varchar('action', { length: 255 }).notNull(),
    resourceType: varchar('resourceType', { length: 50 }),
    resourceId: int('resourceId'),
    details: json('details'),
    ipAddress: varchar('ipAddress', { length: 45 }),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => ({
    userActionIdx: index('idx_auditLog_user_action').on(table.userId, table.action),
    timestampIdx: index('idx_auditLog_timestamp').on(table.timestamp),
  })
);

export default {
  limitOrders,
  stopLossOrders,
  takeProfitOrders,
  trailingStopOrders,
  ocoOrders,
  priceAlerts,
  indicatorAlerts,
  webhooks,
  scheduledTasks,
  riskMetrics,
  correlationMatrix,
  performanceAttribution,
  copyTradingRelationships,
  tradingSignals,
  contests,
  contestParticipants,
  taxReports,
  arbitrageOpportunities,
  auditLogs,
};

import { z } from 'zod';

/**
 * Common validation schemas used across all tRPC procedures
 */

// ─────────────────────────────────────────────────────────────────────────
// BASIC TYPES
// ─────────────────────────────────────────────────────────────────────────

export const symbolSchema = z.string().min(1).max(20).toUpperCase();
export const priceSchema = z.number().positive().finite();
export const quantitySchema = z.number().positive().finite();
export const percentSchema = z.number().min(0).max(100);
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();

// ─────────────────────────────────────────────────────────────────────────
// ADVANCED ORDERS
// ─────────────────────────────────────────────────────────────────────────

export const createLimitOrderSchema = z.object({
  symbol: symbolSchema,
  price: priceSchema,
  quantity: quantitySchema,
  type: z.enum(['buy', 'sell']),
  expiryDate: z.date().optional(),
});

export const createStopLossOrderSchema = z.object({
  symbol: symbolSchema,
  triggerPrice: priceSchema,
  quantity: quantitySchema,
});

export const createTakeProfitOrderSchema = z.object({
  symbol: symbolSchema,
  targetPrice: priceSchema,
  quantity: quantitySchema,
});

export const createTrailingStopOrderSchema = z.object({
  symbol: symbolSchema,
  trailingPercent: percentSchema,
  quantity: quantitySchema,
});

export const createOCOOrderSchema = z.object({
  symbol: symbolSchema,
  stopLossPrice: priceSchema,
  takeProfitPrice: priceSchema,
  quantity: quantitySchema,
});

export const cancelOrderSchema = z.object({
  orderId: z.number().positive(),
  orderType: z.enum(['limit', 'stop-loss', 'take-profit', 'trailing-stop']),
});

// ─────────────────────────────────────────────────────────────────────────
// ALERTS & AUTOMATION
// ─────────────────────────────────────────────────────────────────────────

export const createPriceAlertSchema = z.object({
  symbol: symbolSchema,
  price: priceSchema,
  type: z.enum(['above', 'below']),
});

export const createIndicatorAlertSchema = z.object({
  symbol: symbolSchema,
  indicator: z.string().min(1).max(50),
  threshold: z.number().finite(),
  type: z.enum(['above', 'below', 'crossover']),
});

export const createWebhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1),
});

export const createScheduledTaskSchema = z.object({
  taskType: z.string().min(1).max(50),
  parameters: z.record(z.any()),
  scheduleTime: z.date(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
});

// ─────────────────────────────────────────────────────────────────────────
// PORTFOLIO & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────

export const calculateMetricsSchema = z.object({
  symbol: symbolSchema.optional(),
  days: z.number().positive().default(365),
});

export const getCorrelationMatrixSchema = z.object({
  symbols: z.array(symbolSchema).min(2),
});

// ─────────────────────────────────────────────────────────────────────────
// SOCIAL & COMMUNITY
// ─────────────────────────────────────────────────────────────────────────

export const createCopyTradingSchema = z.object({
  leaderId: z.number().positive(),
  positionSizePercent: percentSchema.default(100),
});

export const publishTradingSignalSchema = z.object({
  symbol: symbolSchema,
  action: z.enum(['buy', 'sell']),
  price: priceSchema.optional(),
  confidence: z.number().min(0).max(1),
  description: z.string().max(500).optional(),
});

export const joinContestSchema = z.object({
  contestId: z.number().positive(),
});

// ─────────────────────────────────────────────────────────────────────────
// PAGINATION & FILTERING
// ─────────────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  cursor: z.string().optional(),
});

export const orderFilterSchema = z.object({
  type: z.enum(['limit', 'stop-loss', 'take-profit', 'trailing-stop', 'oco']).optional(),
  status: z.enum(['pending', 'executed', 'cancelled']).optional(),
  symbol: symbolSchema.optional(),
  ...paginationSchema.shape,
});

export const tradeFilterSchema = z.object({
  symbol: symbolSchema.optional(),
  type: z.enum(['buy', 'sell']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────
// AUTHENTICATION & SECURITY
// ─────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).regex(/[A-Z]/, 'Password must contain uppercase'),
  confirmPassword: z.string(),
  name: z.string().min(1).max(100),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ─────────────────────────────────────────────────────────────────────────
// EXCHANGE CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────

export const addExchangeCredentialsSchema = z.object({
  exchange: z.enum(['kraken', 'coinbase', 'binance']),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  passphrase: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// COMPLIANCE & REPORTING
// ─────────────────────────────────────────────────────────────────────────

export const generateTaxReportSchema = z.object({
  year: z.number().min(2000).max(new Date().getFullYear()),
  jurisdiction: z.string().optional(),
});

export type CreateLimitOrderInput = z.infer<typeof createLimitOrderSchema>;
export type CreateStopLossOrderInput = z.infer<typeof createStopLossOrderSchema>;
export type CreateTakeProfitOrderInput = z.infer<typeof createTakeProfitOrderSchema>;
export type CreateTrailingStopOrderInput = z.infer<typeof createTrailingStopOrderSchema>;
export type CreateOCOOrderInput = z.infer<typeof createOCOOrderSchema>;
export type CreatePriceAlertInput = z.infer<typeof createPriceAlertSchema>;
export type CreateIndicatorAlertInput = z.infer<typeof createIndicatorAlertSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type CreateScheduledTaskInput = z.infer<typeof createScheduledTaskSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type TradeFilterInput = z.infer<typeof tradeFilterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddExchangeCredentialsInput = z.infer<typeof addExchangeCredentialsSchema>;
export type GenerateTaxReportInput = z.infer<typeof generateTaxReportSchema>;

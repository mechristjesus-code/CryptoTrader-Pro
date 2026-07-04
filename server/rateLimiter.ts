import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter: 100 requests per 15 minutes per user
 * Protects against general API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many requests from this account, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === '/health';
  },
});

/**
 * Strict limiter for sensitive operations: 10 requests per hour
 * Protects against targeted attacks on critical endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many sensitive operations, please try again later.',
});

/**
 * Authentication limiter: 5 failed attempts per 15 minutes
 * Protects against brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => req.body?.email || req.ip || 'unknown',
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.',
});

/**
 * Price feed limiter: 30 requests per minute
 * Respects CoinGecko API rate limits
 */
export const priceFeedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many price requests, please try again later.',
});

/**
 * Trade execution limiter: 20 requests per minute
 * Prevents rapid-fire trade execution
 */
export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many trade requests, please try again later.',
});

/**
 * LLM API limiter: 50 requests per hour
 * Prevents excessive LLM usage and cost overruns
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'LLM request limit exceeded, please try again later.',
});

/**
 * File upload limiter: 10 uploads per hour
 * Prevents storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id ? `user-${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many upload requests, please try again later.',
});

export default {
  apiLimiter,
  strictLimiter,
  authLimiter,
  priceFeedLimiter,
  tradeLimiter,
  llmLimiter,
  uploadLimiter,
};

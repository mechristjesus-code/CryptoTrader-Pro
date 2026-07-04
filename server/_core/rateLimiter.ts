import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number; // Max requests per window (default: 100)
  keyGenerator?: (req: Request) => string; // Custom key generator (default: IP address)
  message?: string; // Custom error message
}

/**
 * Rate limiting middleware for Express
 * Prevents abuse by limiting requests per IP or custom key
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or get existing record
    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    const record = store[key];

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Increment request count
    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    // Check if limit exceeded
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * API-specific rate limiter for tRPC endpoints
 * More restrictive for sensitive operations
 */
export function apiRateLimiter(options: RateLimitOptions = {}) {
  return rateLimiter({
    windowMs: 60000,
    maxRequests: 50,
    ...options,
  });
}

/**
 * Auth-specific rate limiter for login/signup
 * Very restrictive to prevent brute force
 */
export function authRateLimiter(options: RateLimitOptions = {}) {
  return rateLimiter({
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    ...options,
  });
}

/**
 * Clean up expired entries periodically
 */
export function startCleanupInterval(intervalMs: number = 600000) {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (now > store[key].resetTime + 600000) {
        delete store[key];
      }
    });
  }, intervalMs);
}

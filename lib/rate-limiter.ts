/**
 * Rate Limiter Middleware
 *
 * In-memory rate limiter for API routes. Protects endpoints from abuse
 * and handles large user bases gracefully.
 *
 * For production with multiple instances, replace with Redis-backed rate limiting.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 300_000);
  }

  /**
   * Check if a request should be allowed
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(
    key: string,
    maxRequests: number,
    windowMs: number,
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration presets
 */
export const RateLimitPreset = {
  // General API endpoints
  standard: { maxRequests: 100, windowMs: 60_000 }, // 100 req/min

  // Auth endpoints (login, register)
  auth: { maxRequests: 10, windowMs: 60_000 }, // 10 req/min

  // Notification endpoints (polling fallback)
  notifications: { maxRequests: 30, windowMs: 60_000 }, // 30 req/min

  // SSE connections
  sse: { maxRequests: 5, windowMs: 60_000 }, // 5 connections/min

  // File uploads
  upload: { maxRequests: 10, windowMs: 300_000 }, // 10 uploads/5min

  // Live session actions
  live: { maxRequests: 200, windowMs: 60_000 }, // 200 req/min (chat etc.)

  // Search endpoints
  search: { maxRequests: 30, windowMs: 60_000 }, // 30 req/min

  // Webhook endpoints (high throughput)
  webhook: { maxRequests: 1000, windowMs: 60_000 }, // 1000 req/min
} as const;

/**
 * Helper: Apply rate limiting to an API route handler
 */
export function withRateLimit(
  req: NextRequest,
  preset: keyof typeof RateLimitPreset = "standard",
  keyExtractor?: (req: NextRequest) => string,
): NextResponse | null {
  const config = RateLimitPreset[preset];
  const key = keyExtractor
    ? keyExtractor(req)
    : req.headers.get("x-forwarded-for") || req.ip || "anonymous";

  const result = rateLimiter.check(
    `${preset}:${key}`,
    config.maxRequests,
    config.windowMs,
  );

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((result.resetAt - Date.now()) / 1000),
          ),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      },
    );
  }

  return null; // Request is allowed
}

// Simple in-memory rate limiter for API routes
// Note: This works for single-instance deployments. For multi-instance, use Redis.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup on module load
if (typeof window === 'undefined') {
  startCleanup();
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean;
  /**
   * Number of remaining requests in the current window
   */
  remaining: number;
  /**
   * Unix timestamp (ms) when the rate limit resets
   */
  resetTime: number;
  /**
   * Number of seconds until reset
   */
  retryAfter: number;
}

/**
 * Check if a request is allowed under the rate limit
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const existing = rateLimitStore.get(key);

  // If no existing entry or window has expired, create new entry
  if (!existing || now > existing.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime,
      retryAfter: 0,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.limit) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfter,
    };
  }

  // Increment counter
  existing.count++;
  rateLimitStore.set(key, existing);

  return {
    success: true,
    remaining: config.limit - existing.count,
    resetTime: existing.resetTime,
    retryAfter: 0,
  };
}

/**
 * Get the client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.success ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    ...(result.retryAfter > 0 && { 'Retry-After': String(result.retryAfter) }),
  };
}

// Preset configurations for different API endpoints
export const RATE_LIMITS = {
  // Contact form: 2 requests per minute
  contact: { limit: 2, windowSeconds: 60 } as RateLimitConfig,
  // Coupon validation: 5 requests per minute
  coupon: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
  // Payment initiation: 3 requests per minute
  payment: { limit: 3, windowSeconds: 60 } as RateLimitConfig,
  // Order lookup: 10 requests per minute
  orderLookup: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
} as const;

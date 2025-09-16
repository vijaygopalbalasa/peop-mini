// Simple in-memory rate limiter for production deployment
// For high-scale production, consider using Redis or similar

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

// Simple Map-based cache with TTL
const cache = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: Options = {}) {
  const _limit = options.uniqueTokenPerInterval || 500; // For future use
  const interval = options.interval || 60000; // 1 minute default

  // Cleanup expired entries periodically
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.resetTime) {
        cache.delete(key);
      }
    }
  };

  // Run cleanup every minute
  setInterval(cleanup, 60000);

  return {
    check: async (token: string, requestLimit = 5): Promise<number> => {
      const now = Date.now();
      const entry = cache.get(token);

      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired one
        cache.set(token, { count: 1, resetTime: now + interval });
        return requestLimit - 1;
      }

      if (entry.count >= requestLimit) {
        return -1; // Rate limited
      }

      entry.count += 1;
      cache.set(token, entry);
      return requestLimit - entry.count;
    },
  };
}
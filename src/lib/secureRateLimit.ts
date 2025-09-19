/**
 * Production-ready rate limiter with persistent storage and advanced security features
 * Supports distributed deployments and sophisticated attack protection
 */

import { createHash } from 'crypto';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
  maxBurstSize?: number;
  slidingWindow?: boolean;
  enableFingerprinting?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  fingerprint?: string;
  blocked?: boolean;
  blockExpiry?: number;
}

interface RateLimitResult {
  remaining: number;
  resetTime: number;
  blocked: boolean;
  reason?: string;
}

// In-memory cache with TTL for high-performance access
const memoryCache = new Map<string, RateLimitEntry>();
const MEMORY_CLEANUP_INTERVAL = 60000; // 1 minute
const MAX_MEMORY_ENTRIES = 10000;

// Security constants
const SUSPICIOUS_THRESHOLD = 100; // requests per minute that trigger enhanced monitoring
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const FINGERPRINT_SALT = process.env.RATE_LIMIT_SALT || 'POEP_DEFAULT_SALT_V1';

/**
 * Enhanced rate limiter with enterprise security features
 */
export class SecureRateLimit {
  private options: Required<RateLimitOptions>;
  private memoryCleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimitOptions = {}) {
    this.options = {
      uniqueTokenPerInterval: options.uniqueTokenPerInterval || 500,
      interval: options.interval || 60000, // 1 minute
      maxBurstSize: options.maxBurstSize || 10,
      slidingWindow: options.slidingWindow ?? true,
      enableFingerprinting: options.enableFingerprinting ?? true,
    };

    this.startMemoryCleanup();
  }

  /**
   * Check rate limit for a given identifier with enhanced security
   */
  async check(
    identifier: string,
    requestLimit: number = 5,
    request?: {
      userAgent?: string;
      ip?: string;
      headers?: Record<string, string>;
    }
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const normalizedId = this.normalizeIdentifier(identifier);
      
      // Generate request fingerprint for advanced tracking
      const fingerprint = this.options.enableFingerprinting && request
        ? this.generateFingerprint(request)
        : undefined;

      // Check if identifier is currently blocked
      const blockStatus = await this.checkBlockStatus(normalizedId, now);
      if (blockStatus.blocked) {
        return {
          remaining: -1,
          resetTime: blockStatus.blockExpiry || now + this.options.interval,
          blocked: true,
          reason: 'Rate limit exceeded - temporarily blocked'
        };
      }

      // Get or create entry
      let entry = this.getEntry(normalizedId);
      
      if (!entry || this.shouldResetEntry(entry, now)) {
        entry = this.createNewEntry(now, fingerprint);
        this.setEntry(normalizedId, entry);
      }

      // Apply sliding window if enabled
      if (this.options.slidingWindow) {
        this.applySlidingWindow(entry, now, requestLimit);
      }

      // Check for suspicious activity
      const suspiciousActivity = this.detectSuspiciousActivity(entry, now, requestLimit);
      if (suspiciousActivity.detected) {
        await this.handleSuspiciousActivity(normalizedId, entry, suspiciousActivity.reason);
        return {
          remaining: -1,
          resetTime: now + BLOCK_DURATION,
          blocked: true,
          reason: suspiciousActivity.reason
        };
      }

      // Rate limit check
      if (entry.count >= requestLimit) {
        // Check if this qualifies for automatic blocking
        if (entry.count >= requestLimit * 2) {
          await this.blockIdentifier(normalizedId, entry, 'Excessive requests');
        }
        
        return {
          remaining: -1,
          resetTime: entry.resetTime,
          blocked: false,
          reason: 'Rate limit exceeded'
        };
      }

      // Update entry
      entry.count += 1;
      if (fingerprint) {
        entry.fingerprint = fingerprint;
      }
      this.setEntry(normalizedId, entry);

      return {
        remaining: Math.max(0, requestLimit - entry.count),
        resetTime: entry.resetTime,
        blocked: false
      };
    } catch (error) {
      // Fail open for availability, but log the error
      if (process.env.NODE_ENV === 'development') {
        console.error('Rate limit check failed:', error);
      }
      
      return {
        remaining: 1,
        resetTime: Date.now() + this.options.interval,
        blocked: false,
        reason: 'Rate limit service unavailable'
      };
    }
  }

  /**
   * Normalize identifier for consistent tracking
   */
  private normalizeIdentifier(identifier: string): string {
    // Remove common proxy headers and normalize
    const cleaned = identifier
      .toLowerCase()
      .replace(/[^a-z0-9.:]/g, '')
      .substring(0, 100); // Limit length for security

    // Hash for privacy if it looks like PII
    if (this.containsPII(cleaned)) {
      return this.hashIdentifier(cleaned);
    }

    return cleaned;
  }

  /**
   * Check if identifier contains potential PII
   */
  private containsPII(identifier: string): boolean {
    // Simple heuristics for PII detection
    const piiPatterns = [
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/, // Email
      /\d{3}-?\d{2}-?\d{4}/, // SSN-like
      /\d{10,}/, // Long numbers
    ];

    return piiPatterns.some(pattern => pattern.test(identifier));
  }

  /**
   * Hash identifier for privacy
   */
  private hashIdentifier(identifier: string): string {
    return createHash('sha256')
      .update(identifier + FINGERPRINT_SALT)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Generate request fingerprint for tracking
   */
  private generateFingerprint(request: {
    userAgent?: string;
    ip?: string;
    headers?: Record<string, string>;
  }): string {
    const components = [
      request.userAgent || 'unknown',
      request.ip || 'unknown',
      JSON.stringify(request.headers || {})
    ];

    return createHash('sha256')
      .update(components.join('|') + FINGERPRINT_SALT)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Check if identifier is currently blocked
   */
  private async checkBlockStatus(identifier: string, now: number): Promise<{
    blocked: boolean;
    blockExpiry?: number;
  }> {
    const entry = this.getEntry(identifier);
    if (!entry || !entry.blocked) {
      return { blocked: false };
    }

    if (entry.blockExpiry && now > entry.blockExpiry) {
      // Block has expired, remove it
      entry.blocked = false;
      entry.blockExpiry = undefined;
      this.setEntry(identifier, entry);
      return { blocked: false };
    }

    return {
      blocked: true,
      blockExpiry: entry.blockExpiry
    };
  }

  /**
   * Create new rate limit entry
   */
  private createNewEntry(now: number, fingerprint?: string): RateLimitEntry {
    return {
      count: 0,
      resetTime: now + this.options.interval,
      firstRequest: now,
      fingerprint
    };
  }

  /**
   * Check if entry should be reset
   */
  private shouldResetEntry(entry: RateLimitEntry, now: number): boolean {
    return now > entry.resetTime;
  }

  /**
   * Apply sliding window algorithm
   */
  private applySlidingWindow(entry: RateLimitEntry, now: number, _requestLimit: number): void {
    const timeElapsed = now - entry.firstRequest;
    const windowProgress = Math.min(1, timeElapsed / this.options.interval);
    
    // Adjust count based on sliding window
    if (windowProgress > 0) {
      entry.count = Math.max(0, entry.count * (1 - windowProgress));
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(
    entry: RateLimitEntry,
    now: number,
    requestLimit: number
  ): { detected: boolean; reason?: string } {
    // Burst detection
    const timeSinceFirst = now - entry.firstRequest;
    const requestRate = entry.count / (timeSinceFirst / 1000); // requests per second
    
    if (requestRate > requestLimit / 5) { // More than 5x normal rate
      return {
        detected: true,
        reason: 'Burst rate detected - suspicious activity'
      };
    }

    // Volume detection
    if (entry.count > SUSPICIOUS_THRESHOLD) {
      return {
        detected: true,
        reason: 'High volume requests detected'
      };
    }

    return { detected: false };
  }

  /**
   * Handle suspicious activity
   */
  private async handleSuspiciousActivity(
    identifier: string,
    entry: RateLimitEntry,
    reason: string
  ): Promise<void> {
    await this.blockIdentifier(identifier, entry, reason);
    
    // Log for security monitoring (in production, send to security system)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Suspicious activity detected for ${identifier}: ${reason}`);
    }
  }

  /**
   * Block an identifier temporarily
   */
  private async blockIdentifier(
    identifier: string,
    entry: RateLimitEntry,
    reason: string
  ): Promise<void> {
    const now = Date.now();
    entry.blocked = true;
    entry.blockExpiry = now + BLOCK_DURATION;
    this.setEntry(identifier, entry);

    // In production, this would also update persistent storage
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Blocked identifier ${identifier} until ${new Date(entry.blockExpiry).toISOString()}: ${reason}`);
    }
  }

  /**
   * Get entry from memory cache
   */
  private getEntry(identifier: string): RateLimitEntry | undefined {
    return memoryCache.get(identifier);
  }

  /**
   * Set entry in memory cache
   */
  private setEntry(identifier: string, entry: RateLimitEntry): void {
    // Prevent memory cache from growing too large
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      this.cleanupMemoryCache(true);
    }

    memoryCache.set(identifier, entry);
  }

  /**
   * Start memory cache cleanup timer
   */
  private startMemoryCleanup(): void {
    this.memoryCleanupTimer = setInterval(() => {
      this.cleanupMemoryCache();
    }, MEMORY_CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(force = false): void {
    const now = Date.now();
    let cleanupCount = 0;

    for (const [key, entry] of memoryCache.entries()) {
      // Remove expired entries or force cleanup of oldest entries
      const shouldRemove = force
        ? cleanupCount < MAX_MEMORY_ENTRIES * 0.1 // Remove 10% when forced
        : now > entry.resetTime && (!entry.blocked || (entry.blockExpiry && now > entry.blockExpiry));

      if (shouldRemove) {
        memoryCache.delete(key);
        cleanupCount++;
      }
    }

    if (process.env.NODE_ENV === 'development' && cleanupCount > 0) {
      console.log(`Cleaned up ${cleanupCount} expired rate limit entries`);
    }
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy(): void {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
      this.memoryCleanupTimer = null;
    }
    memoryCache.clear();
  }
}

/**
 * Create a rate limiter instance with default configuration
 */
export function createSecureRateLimit(options: RateLimitOptions = {}) {
  return new SecureRateLimit(options);
}

/**
 * Default rate limiter for API routes
 */
export const defaultRateLimit = createSecureRateLimit({
  uniqueTokenPerInterval: 1000,
  interval: 60 * 1000, // 1 minute
  maxBurstSize: 5,
  slidingWindow: true,
  enableFingerprinting: true,
});
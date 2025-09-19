/**
 * Secure Error Handling Utilities for Production APIs
 * Prevents sensitive information leakage while maintaining debugging capability
 */

import { NextResponse } from 'next/server';

export interface SecureError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  debug?: any; // Only included in development
}

export class SecurityError extends Error {
  public code: string;
  public statusCode: number;
  public sensitive: boolean;

  constructor(message: string, code: string = 'SECURITY_ERROR', statusCode: number = 400, sensitive = false) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode;
    this.sensitive = sensitive;
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string = 'Invalid input parameters') {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class RateLimitError extends SecurityError {
  public retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED', 401, true);
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403, true);
  }
}

export class NetworkError extends SecurityError {
  constructor(message: string = 'Network service unavailable') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class TimeoutError extends SecurityError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT', 408);
  }
}

/**
 * Secure logging utility that respects environment settings
 */
export class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  public info(component: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[${component}] INFO: ${message}`, data || '');
    }
    // In production, send to monitoring service
    this.sendToMonitoring('info', component, message, data);
  }

  public warn(component: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[${component}] WARN: ${message}`, data || '');
    }
    // Always log warnings for security monitoring
    this.sendToMonitoring('warn', component, message, data);
  }

  public error(component: string, message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(`[${component}] ERROR: ${message}`, error || '');
    }
    // Always log errors for security monitoring
    this.sendToMonitoring('error', component, message, error);
  }

  public security(component: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      console.error(`[${component}] SECURITY: ${message}`, data || '');
    }
    // Always send security events to monitoring
    this.sendToMonitoring('security', component, message, data);
  }

  private sendToMonitoring(_level: string, _component: string, _message: string, _data?: any): void {
    // In production, this would send to monitoring services like:
    // - Datadog, New Relic, Sentry, CloudWatch, etc.
    // - Security Information and Event Management (SIEM) systems
    if (_level === 'security' || _level === 'error') {
      // Critical events - implement immediate alerting
    }
  }
}

/**
 * Sanitize sensitive data from objects before logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitive = ['password', 'token', 'key', 'secret', 'privateKey', 'mnemonic', 'signature'];
  const sanitized = { ...data };

  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitive.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
}

/**
 * Input validation and sanitization utilities
 */
export class InputValidator {
  /**
   * Validate Ethereum address with additional security checks
   */
  static validateEthereumAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic format check
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return false;
    }

    // Security: Check for suspicious patterns
    const suspicious = [
      '0x0000000000000000000000000000000000000000', // Null address
      '<script', '>', '<', 'javascript:', 'data:', 'vbscript:'
    ];

    const lowerAddress = address.toLowerCase();
    if (suspicious.some(pattern => lowerAddress.includes(pattern))) {
      return false;
    }

    return true;
  }

  /**
   * Validate and sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      throw new ValidationError('Invalid string input');
    }

    // Remove potential XSS vectors
    let sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();

    // Limit length to prevent DoS
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate numeric string (for BigInt inputs)
   */
  static validateNumericString(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Must be digits only, no scientific notation or special formats
    if (!/^\d+$/.test(input)) {
      return false;
    }

    // Reasonable length limit to prevent DoS
    if (input.length > 100) {
      return false;
    }

    try {
      const bigIntValue = BigInt(input);
      return bigIntValue > 0n; // Must be positive
    } catch {
      return false;
    }
  }

  /**
   * Validate proof structure for ZK proofs
   */
  static validateProofStructure(proof: any): boolean {
    if (!proof || typeof proof !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['pA', 'pB', 'pC'];
    for (const field of requiredFields) {
      if (!proof[field] || !Array.isArray(proof[field])) {
        return false;
      }
    }

    // Validate array structures
    if (proof.pA.length !== 2 || proof.pC.length !== 2) {
      return false;
    }

    if (proof.pB.length !== 2 || !Array.isArray(proof.pB[0]) || !Array.isArray(proof.pB[1])) {
      return false;
    }

    if (proof.pB[0].length !== 2 || proof.pB[1].length !== 2) {
      return false;
    }

    // Validate that all elements are strings (hex values)
    const allElements = [
      ...proof.pA,
      ...proof.pB[0],
      ...proof.pB[1],
      ...proof.pC
    ];

    for (const element of allElements) {
      if (typeof element !== 'string' || !/^0x[a-fA-F0-9]+$/.test(element)) {
        return false;
      }

      // Reasonable length check
      if (element.length > 100) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Secure error response builder
 */
export function createSecureErrorResponse(error: Error): NextResponse {
  const logger = SecureLogger.getInstance();
  const isDevelopment = process.env.NODE_ENV === 'development';

  let secureError: SecureError;

  if (error instanceof SecurityError) {
    secureError = {
      code: error.code,
      message: error.sensitive && !isDevelopment ? 'Access denied' : error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { debug: sanitizeForLogging(error) })
    };

    // Log security events
    if (error.sensitive) {
      logger.security('API', `Security error: ${error.code}`, { message: error.message });
    }
  } else {
    // Handle unexpected errors securely
    logger.error('API', 'Unexpected error', sanitizeForLogging(error));

    secureError = {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : 'Internal server error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { debug: sanitizeForLogging(error) })
    };
  }

  // Add rate limit headers for rate limit errors
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (error instanceof RateLimitError) {
    headers['Retry-After'] = error.retryAfter.toString();
    headers['X-RateLimit-Limit'] = '5';
    headers['X-RateLimit-Remaining'] = '0';
    headers['X-RateLimit-Reset'] = new Date(Date.now() + error.retryAfter * 1000).toISOString();
  }

  return NextResponse.json(
    {
      error: secureError.message,
      code: secureError.code,
      timestamp: secureError.timestamp,
      ...(secureError.debug && { debug: secureError.debug })
    },
    {
      status: secureError.statusCode,
      headers
    }
  );
}

/**
 * Wrap API handlers with secure error handling
 */
export function withSecureErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  component: string = 'API'
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T): Promise<R | NextResponse> => {
    const logger = SecureLogger.getInstance();

    try {
      return await handler(...args);
    } catch (error) {
      logger.error(component, 'Handler error', sanitizeForLogging(error));

      if (error instanceof SecurityError) {
        return createSecureErrorResponse(error);
      }

      // Convert unknown errors to SecurityErrors
      const securityError = new SecurityError(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR',
        500
      );

      return createSecureErrorResponse(securityError);
    }
  };
}

// Export default logger instance
export const logger = SecureLogger.getInstance();
/**
 * Health Check API Endpoint for Production Monitoring
 * Provides comprehensive system health information
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { validateEnvironment } from '~/lib/environmentValidator';
import { logger, SecurityError } from '~/lib/secureErrorHandler';
import { defaultRateLimit } from '~/lib/secureRateLimit';

// Health check configuration
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const CACHE_DURATION = 30000; // 30 seconds

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    environment: HealthCheckResult;
    blockchain: HealthCheckResult;
    rateLimit: HealthCheckResult;
    circuitFiles: HealthCheckResult;
  };
  uptime: number;
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
  details?: any;
}

// Cache for health check results
let cachedHealthStatus: HealthStatus | null = null;
let lastHealthCheck = 0;
const startTime = Date.now();

/**
 * GET /api/health - System health check endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting for health checks
    const identifier = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'health-check';

    const rateLimitResult = await defaultRateLimit.check(
      `health:${identifier}`,
      10, // 10 requests per minute for health checks
      {
        userAgent: request.headers.get('user-agent') || '',
        ip: identifier
      }
    );

    if (rateLimitResult.blocked) {
      throw new SecurityError('Health check rate limit exceeded', 'RATE_LIMITED', 429);
    }

    // Check if we have a cached result
    const now = Date.now();
    if (cachedHealthStatus && (now - lastHealthCheck) < CACHE_DURATION) {
      return NextResponse.json(cachedHealthStatus, {
        headers: {
          'Cache-Control': `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`,
          'X-Health-Cached': 'true'
        }
      });
    }

    // Perform comprehensive health check
    const healthStatus = await performHealthCheck();
    
    // Update cache
    cachedHealthStatus = healthStatus;
    lastHealthCheck = now;

    // Determine HTTP status code based on health
    let statusCode = 200;
    if (healthStatus.status === 'degraded') {
      statusCode = 200; // Still functional
    } else if (healthStatus.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    // Log health check results
    logger.info('HEALTH_CHECK', `Health check completed: ${healthStatus.status}`, {
      checks: Object.entries(healthStatus.checks).map(([name, result]) => ({
        name,
        status: result.status
      }))
    });

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`,
        'X-Health-Timestamp': healthStatus.timestamp,
        'X-Health-Status': healthStatus.status
      }
    });
  } catch (error) {
    logger.error('HEALTH_CHECK', 'Health check failed', error);
    
    // Return minimal health status on error
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: Date.now() - startTime,
      checks: {
        environment: { status: 'fail', message: 'Health check system failure' },
        blockchain: { status: 'fail', message: 'Not checked due to system error' },
        rateLimit: { status: 'fail', message: 'Not checked due to system error' },
        circuitFiles: { status: 'fail', message: 'Not checked due to system error' }
      }
    };

    if (error instanceof SecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

/**
 * Perform comprehensive system health check
 */
async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  logger.info('HEALTH_CHECK', 'Starting comprehensive health check');

  const checks = {
    environment: await checkEnvironment(),
    blockchain: await checkBlockchainConnectivity(),
    rateLimit: await checkRateLimitSystem(),
    circuitFiles: await checkCircuitFiles()
  };

  // Determine overall health status
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
  const warningChecks = Object.values(checks).filter(check => check.status === 'warn').length;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks > 0) {
    overallStatus = 'unhealthy';
  } else if (warningChecks > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: Date.now() - startTime,
    checks
  };

  logger.info('HEALTH_CHECK', `Health check completed in ${Date.now() - startTime}ms`, {
    status: overallStatus,
    failedChecks,
    warningChecks
  });

  return healthStatus;
}

/**
 * Check environment configuration
 */
async function checkEnvironment(): Promise<HealthCheckResult> {
  const checkStart = Date.now();
  
  try {
    const validation = validateEnvironment();
    
    if (!validation.isValid) {
      return {
        status: 'fail',
        message: `Environment validation failed: ${validation.errors.length} errors`,
        responseTime: Date.now() - checkStart,
        details: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      };
    }
    
    if (validation.warnings.length > 0) {
      return {
        status: 'warn',
        message: `Environment has warnings: ${validation.warnings.length} warnings`,
        responseTime: Date.now() - checkStart,
        details: {
          warnings: validation.warnings
        }
      };
    }
    
    return {
      status: 'pass',
      message: 'Environment configuration is valid',
      responseTime: Date.now() - checkStart
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Environment check failed',
      responseTime: Date.now() - checkStart,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check blockchain connectivity
 */
async function checkBlockchainConnectivity(): Promise<HealthCheckResult> {
  const checkStart = Date.now();
  
  try {
    const rpcUrl = process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org';

    if (!rpcUrl) {
      return {
        status: 'fail',
        message: 'No RPC URL configured',
        responseTime: Date.now() - checkStart
      };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test connection with timeout
    const networkPromise = provider.getNetwork();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Blockchain connection timeout')), HEALTH_CHECK_TIMEOUT)
    );
    
    const network = await Promise.race([networkPromise, timeoutPromise]) as any;
    const responseTime = Date.now() - checkStart;

    // Check if we're connected to the expected network
    const expectedChainId = process.env.NODE_ENV === 'production' ? 8453n : 84532n; // Base mainnet : Base Sepolia

    if (network.chainId !== expectedChainId) {
      return {
        status: 'warn',
        message: `Connected to unexpected network: ${network.chainId}`,
        responseTime,
        details: {
          chainId: network.chainId.toString(),
          expected: expectedChainId.toString(),
          name: network.name
        }
      };
    }
    
    return {
      status: 'pass',
      message: `Connected to ${network.name} (Chain ID: ${network.chainId})`,
      responseTime,
      details: {
        chainId: network.chainId.toString(),
        name: network.name
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Blockchain connectivity check failed',
      responseTime: Date.now() - checkStart,
      details: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Check rate limiting system
 */
async function checkRateLimitSystem(): Promise<HealthCheckResult> {
  const checkStart = Date.now();
  
  try {
    // Test rate limiter with a dummy identifier
    const testResult = await defaultRateLimit.check('health-check-test', 100);
    
    if (testResult.remaining < 0) {
      return {
        status: 'warn',
        message: 'Rate limiter is active but may be overly restrictive',
        responseTime: Date.now() - checkStart,
        details: {
          remaining: testResult.remaining,
          resetTime: testResult.resetTime
        }
      };
    }
    
    return {
      status: 'pass',
      message: 'Rate limiting system is operational',
      responseTime: Date.now() - checkStart,
      details: {
        remaining: testResult.remaining
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Rate limiting system check failed',
      responseTime: Date.now() - checkStart,
      details: error instanceof Error ? error.message : 'Rate limiter error'
    };
  }
}

/**
 * Check ZK circuit files availability
 */
async function checkCircuitFiles(): Promise<HealthCheckResult> {
  const checkStart = Date.now();
  
  try {
    const circuitFiles = [
      { path: '/circuit.wasm', name: 'Circuit WASM' },
      { path: '/circuit_final.zkey', name: 'Circuit ZKey' }
    ];
    
    const checkPromises = circuitFiles.map(async (file) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}${file.path}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT)
        });
        
        return {
          file: file.name,
          available: response.ok,
          size: response.headers.get('content-length'),
          status: response.status
        };
      } catch (error) {
        return {
          file: file.name,
          available: false,
          error: error instanceof Error ? error.message : 'Check failed'
        };
      }
    });
    
    const results = await Promise.all(checkPromises);
    const unavailableFiles = results.filter(result => !result.available);
    
    if (unavailableFiles.length > 0) {
      return {
        status: 'fail',
        message: `${unavailableFiles.length} circuit files unavailable`,
        responseTime: Date.now() - checkStart,
        details: results
      };
    }
    
    return {
      status: 'pass',
      message: 'All circuit files are accessible',
      responseTime: Date.now() - checkStart,
      details: results
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Circuit files check failed',
      responseTime: Date.now() - checkStart,
      details: error instanceof Error ? error.message : 'Check failed'
    };
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
    },
  });
}

// Disable other HTTP methods
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
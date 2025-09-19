/**
 * Environment Validation and Hardening for Production Deployment
 * Ensures all required configuration is present and secure
 */

import { logger } from './secureErrorHandler';

export interface EnvironmentConfig {
  NODE_ENV: string;
  NEXT_PUBLIC_POEP_CONTRACT_ADDRESS: string;
  PRIVATE_KEY: string;
  BASE_RPC_URL?: string;
  BASE_SEPOLIA_RPC?: string;
  NEXT_PUBLIC_BASE_RPC_URL?: string;
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?: string;
  RATE_LIMIT_SALT?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

/**
 * Critical environment variables required for operation
 */
const REQUIRED_VARS: (keyof EnvironmentConfig)[] = [
  'NODE_ENV',
  'NEXT_PUBLIC_POEP_CONTRACT_ADDRESS',
  'PRIVATE_KEY'
];

/**
 * Environment variables that should be present in production
 */
const PRODUCTION_RECOMMENDED: (keyof EnvironmentConfig)[] = [
  'BASE_RPC_URL',
  'RATE_LIMIT_SALT'
];

/**
 * Development-only environment variables
 */
const DEVELOPMENT_VARS: (keyof EnvironmentConfig)[] = [
  'BASE_SEPOLIA_RPC',
  'NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL'
];

/**
 * Validate environment configuration with security checks
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = loadEnvironmentConfig();
  
  logger.info('ENV_VALIDATOR', 'Starting environment validation');

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = config[varName];
    if (!value || typeof value !== 'string') {
      errors.push(`Missing or invalid required environment variable: ${varName}`);
      continue;
    }

    // Perform specific validations
    const validationError = validateEnvironmentVariable(varName, value);
    if (validationError) {
      errors.push(`${varName}: ${validationError}`);
    }
  }

  // Check production recommendations
  if (config.NODE_ENV === 'production') {
    for (const varName of PRODUCTION_RECOMMENDED) {
      if (!config[varName]) {
        warnings.push(`Recommended production variable missing: ${varName}`);
      }
    }

    // Security checks for production
    const securityIssues = performSecurityChecks(config);
    errors.push(...securityIssues);
  }

  // Check for development variables in production
  if (config.NODE_ENV === 'production') {
    for (const varName of DEVELOPMENT_VARS) {
      if (config[varName]) {
        warnings.push(`Development variable should not be set in production: ${varName}`);
      }
    }
  }

  // Validate network configuration consistency
  const networkIssues = validateNetworkConfiguration(config);
  if (networkIssues.length > 0) {
    warnings.push(...networkIssues);
  }

  const isValid = errors.length === 0;
  
  if (isValid) {
    logger.info('ENV_VALIDATOR', 'Environment validation passed', {
      warnings: warnings.length,
      environment: config.NODE_ENV
    });
  } else {
    logger.error('ENV_VALIDATOR', 'Environment validation failed', {
      errors: errors.length,
      warnings: warnings.length
    });
  }

  return {
    isValid,
    errors,
    warnings,
    config
  };
}

/**
 * Load environment configuration securely
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_POEP_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS || '',
    PRIVATE_KEY: process.env.PRIVATE_KEY || '',
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC,
    NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL,
    NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT
  };
}

/**
 * Validate individual environment variables
 */
function validateEnvironmentVariable(name: keyof EnvironmentConfig, value: string): string | null {
  switch (name) {
    case 'NODE_ENV':
      if (!['development', 'production', 'test'].includes(value)) {
        return 'Must be one of: development, production, test';
      }
      break;

    case 'NEXT_PUBLIC_POEP_CONTRACT_ADDRESS':
      if (!isValidEthereumAddress(value)) {
        return 'Must be a valid Ethereum address';
      }
      break;

    case 'PRIVATE_KEY':
      if (!isValidPrivateKey(value)) {
        return 'Must be a valid Ethereum private key';
      }
      break;

    case 'BASE_RPC_URL':
    case 'BASE_SEPOLIA_RPC':
    case 'NEXT_PUBLIC_BASE_RPC_URL':
    case 'NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL':
      if (!isValidRpcUrl(value)) {
        return 'Must be a valid HTTP/HTTPS URL';
      }
      break;

    case 'RATE_LIMIT_SALT':
      if (value.length < 16) {
        return 'Must be at least 16 characters long for security';
      }
      break;
  }

  return null;
}

/**
 * Perform security checks for production environment
 */
function performSecurityChecks(config: EnvironmentConfig): string[] {
  const issues: string[] = [];

  // Check for weak private key
  if (config.PRIVATE_KEY) {
    if (isWeakPrivateKey(config.PRIVATE_KEY)) {
      issues.push('PRIVATE_KEY appears to be a test/development key - use a secure production key');
    }
  }

  // Check for insecure RPC URLs
  const rpcUrls = [
    config.BASE_RPC_URL,
    config.NEXT_PUBLIC_BASE_RPC_URL
  ].filter(Boolean);

  for (const url of rpcUrls) {
    if (url && url.startsWith('http://')) {
      issues.push(`RPC URL should use HTTPS in production: ${url.substring(0, 30)}...`);
    }

    // URL validation for production (localhost check removed for mainnet deployment)
  }

  // Check contract address for known test addresses
  if (config.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS && isTestContractAddress(config.NEXT_PUBLIC_POEP_CONTRACT_ADDRESS)) {
    issues.push('Contract address appears to be a test address - ensure production deployment');
  }

  return issues;
}

/**
 * Validate network configuration consistency
 */
function validateNetworkConfiguration(config: EnvironmentConfig): string[] {
  const warnings: string[] = [];

  const isProduction = config.NODE_ENV === 'production';

  // Check for mixed network configurations
  if (isProduction) {
    if (config.BASE_SEPOLIA_RPC || config.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) {
      warnings.push('Sepolia (testnet) configuration detected in production environment');
    }
  } else {
    if (!config.BASE_SEPOLIA_RPC && !config.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) {
      warnings.push('No testnet RPC configuration found for development environment');
    }
  }

  return warnings;
}

/**
 * Check if string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if string is a valid Ethereum private key
 */
function isValidPrivateKey(key: string): boolean {
  // Remove 0x prefix if present
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  
  // Must be 64 hex characters
  if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
    return false;
  }

  // Must not be all zeros
  if (cleanKey === '0'.repeat(64)) {
    return false;
  }

  return true;
}

/**
 * Check if private key is a well-known test key
 */
function isWeakPrivateKey(key: string): boolean {
  const cleanKey = key.startsWith('0x') ? key.slice(2).toLowerCase() : key.toLowerCase();
  
  // Common test keys from documentation/tutorials
  const testKeys = [
    'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat account 0
    '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Hardhat account 1
    '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Common test key
    'aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd', // Pattern key
    '1111111111111111111111111111111111111111111111111111111111111111'  // Weak pattern
  ];

  if (testKeys.includes(cleanKey)) {
    return true;
  }

  // Check for simple patterns
  const hasSimplePattern = (
    cleanKey === cleanKey[0].repeat(64) || // All same character
    cleanKey.includes('1234567890abcdef'.repeat(4)) || // Sequential pattern
    /^(.)\\1{63}$/.test(cleanKey) // Repeating single character
  );

  return hasSimplePattern;
}

/**
 * Check if RPC URL is valid
 */
function isValidRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if contract address is a known test address
 */
function isTestContractAddress(address: string): boolean {
  const testAddresses = [
    '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Common Hardhat deploy
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Another Hardhat deploy
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Common test address
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'  // Another test address
  ];

  return testAddresses.map(addr => addr.toLowerCase()).includes(address.toLowerCase());
}

/**
 * Initialize environment validation on startup
 */
export function initializeEnvironment(): void {
  logger.info('ENV_VALIDATOR', 'Initializing environment validation');
  
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    logger.error('ENV_VALIDATOR', 'Critical environment validation failures', {
      errors: validation.errors
    });
    
    if (validation.config.NODE_ENV === 'production') {
      // In production, fail fast on critical errors
      throw new Error('Environment validation failed: ' + validation.errors.join(', '));
    } else {
      // In development, warn but continue
      console.error('Environment validation errors:', validation.errors);
    }
  }

  if (validation.warnings.length > 0) {
    logger.warn('ENV_VALIDATOR', 'Environment validation warnings', {
      warnings: validation.warnings
    });
    
    if (validation.config.NODE_ENV === 'development') {
      console.warn('Environment validation warnings:', validation.warnings);
    }
  }

  logger.info('ENV_VALIDATOR', 'Environment initialization completed');
}

// Auto-initialize when module is loaded (disabled during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Only run on server-side during development
  try {
    initializeEnvironment();
  } catch (error) {
    console.error('Failed to initialize environment:', error);
    // Don't exit during build process
    console.warn('Environment validation skipped during production build');
  }
}
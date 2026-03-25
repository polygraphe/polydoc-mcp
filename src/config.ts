/**
 * Configuration management for Polydoc MCP Server
 * Handles environment variables and application settings
 */

import * as path from 'path';
import { Logger, LogLevel } from "./common/Logger.js";
import { EnumUtils } from "./utils/EnumUtils.js";

export const POLYDOC_VERSION = "1.0.0";

export interface PolydocConfig {
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  maxFileSize: number;
  maxFilesPerScan: number;
  enableDetailedErrors: boolean;
  enableMetrics: boolean;
  cacheEnabled: boolean;
  serverName: string;
  serverVersion: string;
  timeout: number;
}

/**
 * Default configuration values
 * Note: Default to production for security when NODE_ENV is not set
 */
const DEFAULT_CONFIG: PolydocConfig = {
  nodeEnv: 'production',
  logLevel: LogLevel.Info,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerScan: 1000,
  enableDetailedErrors: false, // Default to false for production
  enableMetrics: true,
  cacheEnabled: true, // Default to true for production
  serverName: 'polydoc-database-docs',
  serverVersion: '1.0.0',
  timeout: 30000 // 30 seconds
};

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): Partial<PolydocConfig> {
  const config: Partial<PolydocConfig> = {};

  // NODE_ENV - default to production if not set or invalid
  if (process.env.NODE_ENV) {
    const env = process.env.NODE_ENV.toLowerCase();
    if (env === 'production' || env === 'development' || env === 'test') {
      config.nodeEnv = env as 'development' | 'production' | 'test';
    }
    // If NODE_ENV is set but invalid, keep default (production)
  }
  // If NODE_ENV is not set, keep default (production)

  // LOG_LEVEL
  if (process.env.POLYDOC_LOG_LEVEL) {
    try {
      config.logLevel = EnumUtils.toEnum(LogLevel, process.env.POLYDOC_LOG_LEVEL.toLowerCase());
    } catch (e) {}
  }

  // MAX_FILE_SIZE (in bytes)
  if (process.env.POLYDOC_MAX_FILE_SIZE) {
    const size = parseInt(process.env.POLYDOC_MAX_FILE_SIZE, 10);
    if (!isNaN(size) && size > 0) {
      config.maxFileSize = size;
    }
  }

  // MAX_FILES_PER_SCAN
  if (process.env.POLYDOC_MAX_FILES_PER_SCAN) {
    const maxFiles = parseInt(process.env.POLYDOC_MAX_FILES_PER_SCAN, 10);
    if (!isNaN(maxFiles) && maxFiles > 0) {
      config.maxFilesPerScan = maxFiles;
    }
  }

  // ENABLE_DETAILED_ERRORS
  if (process.env.POLYDOC_ENABLE_DETAILED_ERRORS !== undefined) {
    config.enableDetailedErrors = process.env.POLYDOC_ENABLE_DETAILED_ERRORS === 'true';
  }

  // ENABLE_METRICS
  if (process.env.POLYDOC_ENABLE_METRICS !== undefined) {
    config.enableMetrics = process.env.POLYDOC_ENABLE_METRICS === 'true';
  }

  // CACHE_ENABLED
  if (process.env.POLYDOC_CACHE_ENABLED !== undefined) {
    config.cacheEnabled = process.env.POLYDOC_CACHE_ENABLED === 'true';
  }

  // SERVER_NAME
  if (process.env.POLYDOC_SERVER_NAME) {
    config.serverName = process.env.POLYDOC_SERVER_NAME;
  }

  // TIMEOUT (in milliseconds)
  if (process.env.POLYDOC_TIMEOUT) {
    const timeout = parseInt(process.env.POLYDOC_TIMEOUT, 10);
    if (!isNaN(timeout) && timeout > 0) {
      config.timeout = timeout;
    }
  }

  return config;
}

/**
 * Apply environment-specific settings
 */
function applyEnvironmentConfig(config: PolydocConfig): PolydocConfig {
  if (config.nodeEnv === 'production') {
    return {
      ...config,
      logLevel: config.logLevel === LogLevel.Debug ? LogLevel.Info : config.logLevel,
      enableDetailedErrors: false,
      cacheEnabled: true,
    };
  } else if (config.nodeEnv === 'development') {
    return {
      ...config,
      enableDetailedErrors: true,
      cacheEnabled: false,
    };
  } else if (config.nodeEnv === 'test') {
    return {
      ...config,
      logLevel: LogLevel.Error, // Reduce noise in tests
      enableDetailedErrors: true,
      cacheEnabled: false,
    };
  }
  return config;
}

/**
 * Create and export the application configuration
 */
function createConfig(): PolydocConfig {
  const envConfig = loadConfigFromEnv();
  let config = { ...DEFAULT_CONFIG, ...envConfig };
  
  // Apply environment-specific configurations
  config = applyEnvironmentConfig(config);
  
  return config;
}

// Export the configuration instance
export const config = createConfig();

/**
 * Logger utility that respects the configured log level
 */
export const logger = new Logger(config.logLevel, path.join(process.cwd(), 'mcp-debug.log'));

/**
 * Utility to get environment-specific error messages
 */
export function getErrorMessage(error: unknown, fallbackMessage: string = 'An error occurred'): string {
  if (!config.enableDetailedErrors) {
    return fallbackMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Validate file size against configuration limits
 */
export function validateFileSize(filePath: string, size: number): { isValid: boolean; error?: string } {
  if (size > config.maxFileSize) {
    return {
      isValid: false,
      error: `File ${filePath} exceeds maximum size limit (${config.maxFileSize} bytes)`
    };
  }
  return { isValid: true };
}

/**
 * Check if metrics collection is enabled
 */
export function isMetricsEnabled(): boolean {
  return config.enableMetrics;
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): Record<string, any> {
  return {
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    serverName: config.serverName,
    enableDetailedErrors: config.enableDetailedErrors,
    enableMetrics: config.enableMetrics,
    cacheEnabled: config.cacheEnabled,
    maxFileSize: `${Math.round(config.maxFileSize / 1024 / 1024)}MB`,
    maxFilesPerScan: config.maxFilesPerScan,
    timeout: `${config.timeout}ms`
  };
}

/**
 * Optional retry configuration for wrapper methods
 * All parameters are optional - sensible defaults will be used
 */
export interface RetryOptions {
  /** Maximum number of retry attempts. Default: 3 for control operations, 2 for info operations */
  maxAttempts?: number;
  
  /** Base delay between retries in milliseconds. Default: 2000ms for control, 1000ms for info */
  baseDelay?: number;
  
  /** Retry strategy. Default: 'linear' for control operations, 'fixed' for info operations */
  strategy?: 'linear' | 'exponential' | 'fixed';
  
  /** Enable/disable retry. Default: true */
  enabled?: boolean;
}

/**
 * Internal retry configuration with all required fields
 */
export interface InternalRetryConfig {
  maxAttempts: number;
  baseDelay: number;
  strategy: 'linear' | 'exponential' | 'fixed';
  busyErrorPatterns: string[];
  sessionErrorPatterns: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

/**
 * Default retry configurations for different operation types
 */
export const DEFAULT_RETRY_CONFIGS = {
  deviceControl: {
    maxAttempts: 3,
    baseDelay: 3000,
    strategy: 'linear' as const,
    busyErrorPatterns: ['klap -1012', 'device busy', 'command timing issue'],
    sessionErrorPatterns: ['klap 1002', 'session expired', 'invalid terminal uuid']
  },
  
  infoRetrieval: {
    maxAttempts: 2,
    baseDelay: 1000,
    strategy: 'fixed' as const,
    busyErrorPatterns: ['klap -1012', 'device busy'],
    sessionErrorPatterns: ['klap 1002', 'session expired']
  },
  
  energyMonitoring: {
    maxAttempts: 2,
    baseDelay: 1500,
    strategy: 'fixed' as const,
    busyErrorPatterns: ['klap -1012', 'device busy'],
    sessionErrorPatterns: ['klap 1002', 'session expired']
  }
} as const;

/**
 * Convert user-provided RetryOptions to internal configuration
 */
export function createRetryConfig(
  operationType: keyof typeof DEFAULT_RETRY_CONFIGS,
  userOptions?: RetryOptions
): InternalRetryConfig | null {
  // If retry is explicitly disabled, return null
  if (userOptions?.enabled === false) {
    return null;
  }
  
  const defaultConfig = DEFAULT_RETRY_CONFIGS[operationType];
  
  return {
    maxAttempts: userOptions?.maxAttempts ?? defaultConfig.maxAttempts,
    baseDelay: userOptions?.baseDelay ?? defaultConfig.baseDelay,
    strategy: userOptions?.strategy ?? defaultConfig.strategy,
    busyErrorPatterns: [...defaultConfig.busyErrorPatterns],
    sessionErrorPatterns: [...defaultConfig.sessionErrorPatterns]
  };
}
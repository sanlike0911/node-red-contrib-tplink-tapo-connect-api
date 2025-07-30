/**
 * Retry utilities for Tapo device operations
 * Separated from wrapper for better separation of concerns
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  strategy: 'linear' | 'exponential' | 'fixed';
  busyErrorPatterns: string[];
  sessionErrorPatterns: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata: {
    attempts: number;
    duration: number;
    retryReasons: string[];
  };
}

export class TapoRetryHandler {
  public static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 2000,
    strategy: 'exponential',
    busyErrorPatterns: [
      'klap -1012',
      'device busy',
      'command timing issue',
      'persistently busy'
    ],
    sessionErrorPatterns: [
      'klap 1002',
      'session expired',
      'invalid terminal uuid',
      'session needs to be re-established'
    ]
  };

  constructor(private config: RetryConfig = TapoRetryHandler.DEFAULT_CONFIG) {}

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'TapoOperation'
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const retryReasons: string[] = [];
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const data = await operation();
        
        return {
          success: true,
          data,
          metadata: {
            attempts: attempt,
            duration: Date.now() - startTime,
            retryReasons
          }
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxAttempts && this.shouldRetry(lastError)) {
          const delay = this.calculateDelay(attempt);
          const reason = this.getRetryReason(lastError);
          
          retryReasons.push(`Attempt ${attempt}: ${reason}`);
          
          if (this.config.onRetry) {
            this.config.onRetry(attempt, lastError, delay);
          } else {
            console.log(`${operationName} retry ${attempt}/${this.config.maxAttempts}: ${reason} (waiting ${delay}ms)`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    return {
      success: false,
      error: lastError!,
      metadata: {
        attempts: this.config.maxAttempts,
        duration: Date.now() - startTime,
        retryReasons
      }
    };
  }

  private shouldRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Check if it's a retryable error
    const allRetryablePatterns = [
      ...this.config.busyErrorPatterns,
      ...this.config.sessionErrorPatterns
    ];
    
    return allRetryablePatterns.some(pattern => 
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  private getRetryReason(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    if (this.config.busyErrorPatterns.some(p => errorMessage.includes(p.toLowerCase()))) {
      return 'Device busy';
    }
    
    if (this.config.sessionErrorPatterns.some(p => errorMessage.includes(p.toLowerCase()))) {
      return 'Session error';
    }
    
    return 'Unknown retryable error';
  }

  private calculateDelay(attempt: number): number {
    switch (this.config.strategy) {
      case 'exponential':
        return this.config.baseDelay * Math.pow(2, attempt - 1);
      case 'linear':
        return this.config.baseDelay * attempt;
      case 'fixed':
      default:
        return this.config.baseDelay;
    }
  }

  /**
   * Create a pre-configured retry handler for common scenarios
   */
  static forDeviceControl(): TapoRetryHandler {
    const defaultConfig = TapoRetryHandler.DEFAULT_CONFIG;
    return new TapoRetryHandler({
      ...defaultConfig,
      maxAttempts: 3,
      baseDelay: 3000,
      strategy: 'linear'
    });
  }

  static forEnergyMonitoring(): TapoRetryHandler {
    const defaultConfig = TapoRetryHandler.DEFAULT_CONFIG;
    return new TapoRetryHandler({
      ...defaultConfig,
      maxAttempts: 2,
      baseDelay: 1000,
      strategy: 'fixed'
    });
  }

  static forInfoRetrieval(): TapoRetryHandler {
    const defaultConfig = TapoRetryHandler.DEFAULT_CONFIG;
    return new TapoRetryHandler({
      ...defaultConfig,
      maxAttempts: 2,
      baseDelay: 500,
      strategy: 'fixed'
    });
  }
}

/**
 * Utility function to wrap any async operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  const defaultConfig = TapoRetryHandler.DEFAULT_CONFIG;
  const handler = new TapoRetryHandler({
    ...defaultConfig,
    ...config
  });
  
  return handler.execute(operation);
}

/**
 * Decorator for automatic retry (for class methods)
 */
export function retryable(config?: Partial<RetryConfig>) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await withRetry(() => method.apply(this, args), config);
      
      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    };
  };
}
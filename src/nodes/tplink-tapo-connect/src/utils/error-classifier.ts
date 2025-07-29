/**
 * Standardized error classification and handling utilities
 */

export enum TapoErrorType {
  SESSION_EXPIRED = 'session_expired',
  DEVICE_BUSY = 'device_busy',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_FAILED = 'authentication_failed',
  FEATURE_NOT_SUPPORTED = 'feature_not_supported',
  INVALID_PARAMETER = 'invalid_parameter',
  DEVICE_OFFLINE = 'device_offline',
  PROTOCOL_ERROR = 'protocol_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface ClassifiedError {
  type: TapoErrorType;
  originalError: Error;
  isRetryable: boolean;
  retryAfterMs: number | undefined;
  suggestedAction: string | undefined;
}

export interface ErrorPatternConfig {
  sessionPatterns: string[];
  busyPatterns: string[];
  networkPatterns: string[];
  authPatterns: string[];
  featurePatterns: string[];
  parameterPatterns: string[];
  offlinePatterns: string[];
  protocolPatterns: string[];
  timeoutPatterns: string[];
}

/**
 * Centralized error classification utility
 */
export class ErrorClassifier {
  private static readonly DEFAULT_PATTERNS: ErrorPatternConfig = {
    sessionPatterns: [
      'klap 1002', 'klap -1012', 'session expired', 'invalid terminal uuid',
      'session timeout', 'authentication expired'
    ],
    busyPatterns: [
      'device busy', 'command timing issue', 'resource busy',
      'device not ready', 'operation in progress'
    ],
    networkPatterns: [
      'network error', 'connection failed', 'econnrefused', 'enotfound',
      'ehostunreach', 'enetunreach', 'connection reset'
    ],
    authPatterns: [
      'authentication failed', 'invalid credentials', 'unauthorized',
      'login failed', 'wrong username', 'wrong password'
    ],
    featurePatterns: [
      'feature not supported', 'method not found', 'not supported',
      'unsupported operation', 'capability not available'
    ],
    parameterPatterns: [
      'invalid parameter', 'parameter out of range', 'invalid value',
      'parameter missing', 'malformed request'
    ],
    offlinePatterns: [
      'device offline', 'device not found', 'device unreachable',
      'no response', 'device disconnected'
    ],
    protocolPatterns: [
      'protocol error', 'malformed response', 'invalid response',
      'handshake failed', 'encryption error'
    ],
    timeoutPatterns: [
      'timeout', 'request timeout', 'response timeout',
      'operation timeout', 'connection timeout'
    ]
  };

  private patterns: ErrorPatternConfig;

  constructor(customPatterns?: Partial<ErrorPatternConfig>) {
    this.patterns = {
      ...ErrorClassifier.DEFAULT_PATTERNS,
      ...customPatterns
    };
  }

  /**
   * Classify an error into a standard type
   */
  public classify(error: Error): ClassifiedError {
    const errorMessage = error.message.toLowerCase();
    
    // Check each pattern category
    if (this.matchesPatterns(errorMessage, this.patterns.sessionPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.SESSION_EXPIRED, true, 1000, 
        'Re-authenticate and retry the operation');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.busyPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.DEVICE_BUSY, true, 2000,
        'Wait and retry the operation');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.networkPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.NETWORK_ERROR, true, 5000,
        'Check network connectivity and device availability');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.authPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.AUTHENTICATION_FAILED, false, undefined,
        'Verify username and password credentials');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.featurePatterns)) {
      return this.createClassifiedError(error, TapoErrorType.FEATURE_NOT_SUPPORTED, false, undefined,
        'Check device capabilities before calling this method');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.parameterPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.INVALID_PARAMETER, false, undefined,
        'Check parameter values and ranges');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.offlinePatterns)) {
      return this.createClassifiedError(error, TapoErrorType.DEVICE_OFFLINE, true, 10000,
        'Check device power and network connection');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.protocolPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.PROTOCOL_ERROR, true, 3000,
        'Retry with different protocol or check device firmware');
    }
    
    if (this.matchesPatterns(errorMessage, this.patterns.timeoutPatterns)) {
      return this.createClassifiedError(error, TapoErrorType.TIMEOUT, true, 5000,
        'Increase timeout or check network stability');
    }
    
    // Default to unknown
    return this.createClassifiedError(error, TapoErrorType.UNKNOWN, true, 3000,
      'Check device status and try again');
  }

  /**
   * Check if error message matches any of the given patterns
   */
  private matchesPatterns(errorMessage: string, patterns: string[]): boolean {
    return patterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
  }

  /**
   * Create a classified error object
   */
  private createClassifiedError(
    originalError: Error,
    type: TapoErrorType,
    isRetryable: boolean,
    retryAfterMs?: number,
    suggestedAction?: string
  ): ClassifiedError {
    return {
      type,
      originalError,
      isRetryable,
      retryAfterMs,
      suggestedAction
    };
  }

  /**
   * Determine if an error is retryable
   */
  public static isRetryableError(error: Error): boolean {
    const classifier = new ErrorClassifier();
    const classified = classifier.classify(error);
    return classified.isRetryable;
  }

  /**
   * Get suggested retry delay for an error
   */
  public static getRetryDelay(error: Error): number {
    const classifier = new ErrorClassifier();
    const classified = classifier.classify(error);
    return classified.retryAfterMs ?? 3000;
  }

  /**
   * Create a user-friendly error message
   */
  public static createUserFriendlyMessage(error: Error): string {
    const classifier = new ErrorClassifier();
    const classified = classifier.classify(error);
    
    const baseMessage = `${classified.type.replace('_', ' ').toUpperCase()}: ${error.message}`;
    
    if (classified.suggestedAction) {
      return `${baseMessage}\nSuggestion: ${classified.suggestedAction}`;
    }
    
    return baseMessage;
  }
}

/**
 * Enhanced error class with classification
 */
export class ClassifiedTapoError extends Error {
  public readonly classification: ClassifiedError;
  
  constructor(originalError: Error, classifier?: ErrorClassifier) {
    const errorClassifier = classifier ?? new ErrorClassifier();
    const classification = errorClassifier.classify(originalError);
    
    super(ErrorClassifier.createUserFriendlyMessage(originalError));
    this.name = 'ClassifiedTapoError';
    this.classification = classification;
  }
  
  public isRetryable(): boolean {
    return this.classification.isRetryable;
  }
  
  public getRetryDelay(): number | undefined {
    return this.classification.retryAfterMs;
  }
  
  public getSuggestedAction(): string | undefined {
    return this.classification.suggestedAction;
  }
}
/**
 * Common type definitions for all device types
 * Consolidates and standardizes device-related types
 */

import { TapoDeviceInfo } from './base';

/**
 * Standard device operation options
 */
export interface DeviceOperationOptions {
  /** Timeout for the operation in milliseconds */
  timeout?: number;
  
  /** Whether to throw an error if the feature is not supported */
  throwOnUnsupported?: boolean;
  
  /** Whether to use cached values when available */
  useCache?: boolean;
  
  /** Force refresh of cached values */
  forceRefresh?: boolean;
}

/**
 * Extended device information with common properties
 */
export interface ExtendedDeviceInfo extends TapoDeviceInfo {
  /** Device capabilities flags */
  capabilities?: Record<string, boolean | number | string>;
  
  /** Last communication timestamp */
  lastCommunication?: number;
  
  /** Connection protocol used */
  protocol?: 'KLAP' | 'SecurePassthrough';
  
  /** Device health status */
  healthStatus?: 'online' | 'offline' | 'degraded' | 'unknown';
}

/**
 * Device feature capability definition
 */
export interface DeviceCapability {
  /** Feature identifier */
  name: string;
  
  /** Whether the feature is supported */
  supported: boolean;
  
  /** Minimum value (for numeric features) */
  minValue?: number;
  
  /** Maximum value (for numeric features) */
  maxValue?: number;
  
  /** Valid values (for enumerated features) */
  validValues?: (string | number)[];
  
  /** Feature description */
  description?: string;
}

/**
 * Device state information
 */
export interface DeviceState {
  /** Whether the device is powered on */
  isOn: boolean;
  
  /** Device operational status */
  status: 'ready' | 'busy' | 'error' | 'offline';
  
  /** Last state update timestamp */
  lastUpdate: number;
  
  /** Any error messages */
  errorMessage?: string;
}

/**
 * Device control result
 */
export interface DeviceControlResult {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Operation completion timestamp */
  timestamp: number;
  
  /** Error information if unsuccessful */
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  
  /** Additional result data */
  data?: Record<string, any>;
}

/**
 * Device method execution context
 */
export interface DeviceMethodContext {
  /** Method name being executed */
  method: string;
  
  /** Method parameters */
  parameters?: Record<string, any>;
  
  /** Operation options */
  options?: DeviceOperationOptions;
  
  /** Execution start time */
  startTime: number;
}

/**
 * Device event types
 */
export enum DeviceEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  STATE_CHANGED = 'state_changed',
  ERROR = 'error',
  CAPABILITY_CHANGED = 'capability_changed'
}

/**
 * Device event data
 */
export interface DeviceEvent {
  /** Event type */
  type: DeviceEventType;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Device identifier */
  deviceId: string;
  
  /** Event-specific data */
  data?: Record<string, any>;
  
  /** Previous state (for state change events) */
  previousState?: any;
  
  /** Current state (for state change events) */
  currentState?: any;
}

/**
 * Device metrics for monitoring
 */
export interface DeviceMetrics {
  /** Total number of successful operations */
  successfulOperations: number;
  
  /** Total number of failed operations */
  failedOperations: number;
  
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Last successful communication timestamp */
  lastSuccess?: number;
  
  /** Last failed communication timestamp */
  lastFailure?: number;
  
  /** Connection uptime in milliseconds */
  uptime: number;
  
  /** Number of reconnection attempts */
  reconnectionAttempts: number;
}

/**
 * Standard result wrapper for device operations
 */
export interface DeviceOperationResult<T = any> {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Result data if successful */
  data?: T;
  
  /** Error information if unsuccessful */
  error?: {
    type: string;
    message: string;
    code?: string;
    retryable: boolean;
    retryAfter: number | undefined;
  };
  
  /** Operation metadata */
  metadata?: {
    duration: number;
    timestamp: number;
    protocol: string;
    attempt: number;
  };
}

/**
 * Device configuration options
 */
export interface DeviceConfiguration {
  /** Device connection settings */
  connection?: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    keepAlive?: boolean;
  };
  
  /** Feature-specific settings */
  features?: {
    enableCaching?: boolean;
    cacheTimeout?: number;
    autoDiscovery?: boolean;
  };
  
  /** Logging and monitoring */
  monitoring?: {
    enableMetrics?: boolean;
    enableEvents?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}
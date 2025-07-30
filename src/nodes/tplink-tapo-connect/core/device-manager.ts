/**
 * Unified device connection and communication manager
 * Eliminates duplication between plug and bulb implementations
 */

import { TapoCredentials, TapoApiRequest, TapoApiResponse } from '../types';
import { TapoAuth } from './auth';
import { KlapAuth } from './klap-auth';

export interface DeviceConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  minRequestInterval?: number;
  enableLegacyFallback?: boolean;
}

export interface SessionErrorPatterns {
  klapSessionErrors: string[];
  generalSessionErrors: string[];
  busyErrors: string[];
}

/**
 * Centralized device communication manager
 * Handles authentication, session management, and request queuing
 */
export class DeviceManager {
  private auth: TapoAuth;
  private klapAuth: KlapAuth;
  private useKlap: boolean = false;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private isConnected: boolean = false;

  // Configuration
  private readonly options: Required<DeviceConnectionOptions>;
  private readonly sessionErrorPatterns: SessionErrorPatterns = {
    klapSessionErrors: ['klap 1002', 'klap -1012'],
    generalSessionErrors: ['session expired', 'invalid terminal uuid'],
    busyErrors: ['device busy', 'command timing issue']
  };

  constructor(
    private readonly ip: string,
    credentials: TapoCredentials,
    private readonly deviceType: string,
    options: DeviceConnectionOptions = {}
  ) {
    this.auth = new TapoAuth(ip, credentials);
    this.klapAuth = new KlapAuth(ip, credentials);
    
    // Set default options
    this.options = {
      maxRetries: options.maxRetries ?? 2,
      retryDelay: options.retryDelay ?? 2000,
      minRequestInterval: options.minRequestInterval ?? 1000,
      enableLegacyFallback: options.enableLegacyFallback ?? true
    };
  }

  /**
   * Check if device is reachable
   */
  private async checkDeviceConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.ip}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.status < 500;
    } catch (error) {
      console.log(`${this.deviceType} connectivity check failed:`, error);
      return false;
    }
  }

  /**
   * Determine if errors indicate legacy device
   */
  private isLikelyLegacyDevice(klapError: Error | null, securePassthroughError: Error | null): boolean {
    if (!this.options.enableLegacyFallback) {
      return false;
    }

    // KLAP connection refused suggests older firmware
    const klapConnectionRefused = klapError?.message.toLowerCase().includes('connection refused') || 
                                  klapError?.message.toLowerCase().includes('econnrefused');
    
    // Secure Passthrough timeout suggests newer firmware with disabled fallback
    const securePassthroughTimeout = securePassthroughError?.message.toLowerCase().includes('timeout') ||
                                     securePassthroughError?.message.toLowerCase().includes('network error');

    return Boolean(klapConnectionRefused && securePassthroughTimeout);
  }

  /**
   * Classify error types for appropriate handling
   */
  private classifyError(error: Error): 'session' | 'busy' | 'network' | 'unknown' {
    const errorMessage = error.message.toLowerCase();
    
    if (this.sessionErrorPatterns.klapSessionErrors.some(pattern => errorMessage.includes(pattern)) ||
        this.sessionErrorPatterns.generalSessionErrors.some(pattern => errorMessage.includes(pattern))) {
      return 'session';
    }
    
    if (this.sessionErrorPatterns.busyErrors.some(pattern => errorMessage.includes(pattern))) {
      return 'busy';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || 
        errorMessage.includes('connection') || errorMessage.includes('econnrefused')) {
      return 'network';
    }
    
    return 'unknown';
  }

  /**
   * Establish connection to device
   */
  public async connect(): Promise<void> {
    console.log(`${this.deviceType}.connect() called`);
    
    // Check basic connectivity first
    console.log('Checking device connectivity...');
    const isReachable = await this.checkDeviceConnectivity();
    if (!isReachable) {
      console.log('Device connectivity check failed, but proceeding with authentication...');
    } else {
      console.log('Device is reachable, proceeding with authentication...');
    }

    let klapError: Error | null = null;
    let securePassthroughError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      console.log(`Connection attempt ${attempt}/${this.options.maxRetries}`);
      
      // Try KLAP first (modern protocol)
      try {
        console.log('Trying KLAP authentication...');
        await this.klapAuth.authenticate();
        this.useKlap = true;
        this.isConnected = true;
        console.log('KLAP authentication successful');
        return;
      } catch (error) {
        klapError = error as Error;
        console.log('KLAP failed:', error);
      }

      // Fallback to Secure Passthrough
      try {
        console.log('Trying Secure Passthrough authentication...');
        await this.auth.authenticate();
        this.useKlap = false;
        this.isConnected = true;
        console.log('Secure Passthrough authentication successful');
        return;
      } catch (error) {
        securePassthroughError = error as Error;
        console.log('Secure Passthrough failed:', error);
      }

      // Check for legacy device pattern
      if (this.isLikelyLegacyDevice(klapError, securePassthroughError)) {
        console.log('Device appears to be legacy firmware - connection methods may be limited');
      }

      if (attempt < this.options.maxRetries) {
        console.log(`Both protocols failed, retrying in ${this.options.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      }
    }

    console.error('All authentication attempts failed');
    throw new Error(
      `Failed to connect to ${this.deviceType} after ${this.options.maxRetries} attempts. ` +
      `KLAP: ${klapError?.message}; Secure Passthrough: ${securePassthroughError?.message}`
    );
  }

  /**
   * Disconnect from device
   */
  public async disconnect(): Promise<void> {
    if (this.useKlap) {
      this.klapAuth.clearSession();
    }
    this.isConnected = false;
    // Note: Secure Passthrough doesn't require explicit disconnect
  }

  /**
   * Check if currently connected
   */
  public isDeviceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Send request with automatic session management and rate limiting
   */
  public async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    if (!this.isConnected) {
      throw new Error('Device not connected. Call connect() first.');
    }

    return this.requestQueue = this.requestQueue.then(async () => {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.options.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.options.minRequestInterval - timeSinceLastRequest)
        );
      }
      this.lastRequestTime = Date.now();

      try {
        const result = await this.executeRequest<T>(request);
        return { error_code: 0, result };
      } catch (error) {
        const errorType = this.classifyError(error as Error);
        
        // Handle session errors with re-authentication
        if (errorType === 'session') {
          console.log('Session error detected, attempting re-authentication...');
          try {
            await this.reconnectAfterSessionError();
            console.log('Re-authentication successful, retrying request...');
            
            // Retry the request
            const result = await this.executeRequest<T>(request);
            return { error_code: 0, result };
          } catch (reAuthError) {
            console.log('Re-authentication failed:', reAuthError);
            throw reAuthError;
          }
        }
        
        throw error;
      }
    });
  }

  /**
   * Execute the actual request using the appropriate protocol
   */
  private async executeRequest<T>(request: TapoApiRequest): Promise<T> {
    if (this.useKlap) {
      if (!this.klapAuth.isAuthenticated()) {
        throw new Error('KLAP session not authenticated');
      }
      return await this.klapAuth.secureRequest<T>(request);
    } else {
      if (!this.auth.isAuthenticated()) {
        throw new Error('Secure Passthrough session not authenticated');
      }
      return await this.auth.secureRequest<T>(request);
    }
  }

  /**
   * Handle session error by re-authenticating
   */
  private async reconnectAfterSessionError(): Promise<void> {
    if (this.useKlap) {
      this.klapAuth.clearSession();
      await this.klapAuth.authenticate();
    } else {
      await this.auth.authenticate();
    }
  }

  /**
   * Get current protocol information
   */
  public getConnectionInfo(): { protocol: 'KLAP' | 'SecurePassthrough'; connected: boolean } {
    return {
      protocol: this.useKlap ? 'KLAP' : 'SecurePassthrough',
      connected: this.isConnected
    };
  }
}
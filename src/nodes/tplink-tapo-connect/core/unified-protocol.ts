import { TapoAuth } from './auth';
import { KlapAuth } from './klap-auth';
import { TapoCredentials, TapoApiRequest } from '../types';

/**
 * Unified protocol manager similar to Rust tapo's TapoProtocol
 * This addresses the core issue of distributed session management
 */
export class UnifiedTapoProtocol {
  private auth: TapoAuth;
  private klapAuth: KlapAuth;
  private activeProtocol: 'klap' | 'passthrough' | null = null;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // Minimum 100ms between requests

  constructor(ip: string, credentials: TapoCredentials) {
    this.auth = new TapoAuth(ip, credentials);
    this.klapAuth = new KlapAuth(ip, credentials);
  }

  /**
   * Initialize connection with automatic protocol detection
   */
  public async connect(): Promise<void> {
    let klapError: Error | null = null;
    let passthroughError: Error | null = null;

    // Try KLAP first (preferred protocol)
    try {
      console.log('Attempting KLAP connection...');
      await this.klapAuth.authenticate();
      this.activeProtocol = 'klap';
      console.log('KLAP connection successful');
      return;
    } catch (error) {
      klapError = error as Error;
      console.log('KLAP failed, trying Passthrough...');
    }

    // Fallback to Secure Passthrough
    try {
      await this.auth.authenticate();
      this.activeProtocol = 'passthrough';
      console.log('Secure Passthrough connection successful');
      return;
    } catch (error) {
      passthroughError = error as Error;
    }

    throw new Error(
      `All protocols failed. KLAP: ${klapError?.message}; Passthrough: ${passthroughError?.message}`
    );
  }

  /**
   * Execute request with automatic session management (like Rust implementation)
   */
  public async executeRequest<T>(request: TapoApiRequest): Promise<T> {
    if (!this.activeProtocol) {
      throw new Error('Not connected. Call connect() first.');
    }

    // Add small delay to prevent KLAP-1012 errors on rapid requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    this.lastRequestTime = Date.now();

    // Attempt with current protocol
    try {
      const result = await this.sendWithCurrentProtocol<T>(request);
      return result;
    } catch (error) {
      // Handle session errors by trying to recover
      if (this.isSessionError(error as Error)) {
        console.log('Session error detected, attempting recovery...');
        
        try {
          // Try to refresh current protocol session
          await this.refreshCurrentSession();
          const result = await this.sendWithCurrentProtocol<T>(request);
              return result;
        } catch (refreshError) {
          console.log('Session refresh failed, trying protocol switch...');
          
          // Try switching to the other protocol
          const switchResult = await this.trySwitchProtocol<T>(request);
          if (switchResult !== null) {
                  return switchResult;
          }
        }
      }
      
      // All recovery attempts failed
      throw error;
    }
  }

  /**
   * Send request using current active protocol
   */
  private async sendWithCurrentProtocol<T>(request: TapoApiRequest): Promise<T> {
    if (this.activeProtocol === 'klap') {
      return await this.klapAuth.secureRequest<T>(request);
    } else if (this.activeProtocol === 'passthrough') {
      return await this.auth.secureRequest<T>(request);
    }
    throw new Error('No active protocol');
  }

  /**
   * Refresh session for current protocol
   */
  private async refreshCurrentSession(): Promise<void> {
    if (this.activeProtocol === 'klap') {
      await this.klapAuth.authenticate();
    } else if (this.activeProtocol === 'passthrough') {
      await this.auth.authenticate();
    }
  }

  /**
   * Try switching to alternative protocol and execute request
   */
  private async trySwitchProtocol<T>(request: TapoApiRequest): Promise<T | null> {
    const alternativeProtocol = this.activeProtocol === 'klap' ? 'passthrough' : 'klap';
    
    try {
      console.log(`Switching to ${alternativeProtocol} protocol...`);
      
      if (alternativeProtocol === 'klap') {
        this.klapAuth.clearSession();
        await this.klapAuth.authenticate();
        const result = await this.klapAuth.secureRequest<T>(request);
        this.activeProtocol = 'klap';
        return result;
      } else {
        this.auth.clearSession();
        await this.auth.authenticate();
        const result = await this.auth.secureRequest<T>(request);
        this.activeProtocol = 'passthrough';
        return result;
      }
    } catch (error) {
      console.log(`Protocol switch to ${alternativeProtocol} failed:`, error);
      return null;
    }
  }

  /**
   * Check if error indicates session issues
   */
  private isSessionError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('klap 1002') || 
           errorMessage.includes('session expired') || 
           errorMessage.includes('session needs to be re-established') ||
           errorMessage.includes('klap -1001') ||
           errorMessage.includes('tapo api error: 1003');
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    if (!this.activeProtocol) return false;
    
    if (this.activeProtocol === 'klap') {
      return this.klapAuth.isAuthenticated();
    } else {
      return this.auth.isAuthenticated();
    }
  }

  /**
   * Clear all sessions
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.activeProtocol === 'klap') {
        await this.klapAuth.clearSession();
      } else if (this.activeProtocol === 'passthrough') {
        this.auth.clearSession();
      }
    } catch (error) {
      console.warn('Warning during disconnect:', error);
    }
    this.activeProtocol = null;
  }

  /**
   * Get current active protocol
   */
  public getActiveProtocol(): string | null {
    return this.activeProtocol;
  }
}
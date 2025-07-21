/**
 * Refactored base device class with unified connection management
 */

import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse, TapoDeviceInfo } from '../types';
import { DeviceManager, DeviceConnectionOptions } from '../core/device-manager';

export interface DeviceFeatureCapabilities {
  [key: string]: boolean | number | string;
}

export interface BaseDeviceOptions extends DeviceConnectionOptions {
  enableDetailedLogging?: boolean;
  featureCacheTimeout?: number;
}

/**
 * Unified base class for all Tapo devices
 * Eliminates duplication between plugs and bulbs
 */
export abstract class BaseDeviceRefactored extends BaseTapoDevice {
  protected deviceManager: DeviceManager;
  protected featureCache: Map<string, { value: any; timestamp: number }> = new Map();
  protected deviceModel?: string;
  
  private readonly options: Required<BaseDeviceOptions>;

  constructor(ip: string, credentials: TapoCredentials, options: BaseDeviceOptions = {}) {
    super(ip, credentials);
    
    this.options = {
      maxRetries: options.maxRetries ?? 2,
      retryDelay: options.retryDelay ?? 2000,
      minRequestInterval: options.minRequestInterval ?? 1000,
      enableLegacyFallback: options.enableLegacyFallback ?? true,
      enableDetailedLogging: options.enableDetailedLogging ?? false,
      featureCacheTimeout: options.featureCacheTimeout ?? 300000 // 5 minutes
    };

    this.deviceManager = new DeviceManager(
      ip, 
      credentials, 
      this.getDeviceTypeName(),
      this.options
    );
  }

  /**
   * Get device type name for logging - to be implemented by subclasses
   */
  protected abstract getDeviceTypeName(): string;

  /**
   * Get device capabilities - to be implemented by subclasses
   */
  protected abstract getDeviceCapabilities(): DeviceFeatureCapabilities;

  /**
   * Connect to device
   */
  public async connect(): Promise<void> {
    await this.deviceManager.connect();
    
    // Cache device model on first connection
    if (!this.deviceModel) {
      try {
        const deviceInfo = await this.getDeviceInfo();
        this.deviceModel = deviceInfo.model;
        if (this.options.enableDetailedLogging) {
          console.log(`Connected to ${this.deviceModel} at ${this.ip}`);
        }
      } catch (error) {
        // Don't fail connection if device info retrieval fails
        if (this.options.enableDetailedLogging) {
          console.log('Could not retrieve device model during connection:', error);
        }
      }
    }
  }

  /**
   * Disconnect from device
   */
  public async disconnect(): Promise<void> {
    await this.deviceManager.disconnect();
    this.clearFeatureCache();
  }

  /**
   * Check if device is connected
   */
  public isConnected(): boolean {
    return this.deviceManager.isDeviceConnected();
  }

  /**
   * Send request to device
   */
  protected async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    return await this.deviceManager.sendRequest<T>(request);
  }

  /**
   * Get device information
   */
  public async getDeviceInfo(): Promise<TapoDeviceInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };

    const response = await this.sendRequest<TapoDeviceInfo>(request);
    return response.result;
  }

  /**
   * Basic device control methods
   */
  public async turnOn(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        deviceOn: true
      }
    };
    await this.sendRequest(request);
  }

  public async turnOff(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        deviceOn: false
      }
    };
    await this.sendRequest(request);
  }

  public async toggle(): Promise<void> {
    const deviceInfo = await this.getDeviceInfo();
    if (deviceInfo.deviceOn) {
      await this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  /**
   * Convenience aliases following Python API pattern
   */
  public async on(): Promise<void> {
    await this.turnOn();
  }

  public async off(): Promise<void> {
    await this.turnOff();
  }

  /**
   * Check if device is on
   */
  public async isOn(): Promise<boolean> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.deviceOn;
  }

  /**
   * Feature support checking with caching
   */
  public async supportsFeature(feature: string, useCache: boolean = true): Promise<boolean> {
    const cacheKey = `feature_${feature}`;
    
    if (useCache) {
      const cached = this.getCachedValue<boolean>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const capabilities = this.getDeviceCapabilities();
      const supported = Boolean(capabilities[feature]);
      
      this.setCachedValue(cacheKey, supported);
      return supported;
    } catch (error) {
      // If capabilities check fails, return false and don't cache
      return false;
    }
  }

  /**
   * Get cached value with timeout check
   */
  protected getCachedValue<T>(key: string): T | null {
    const cached = this.featureCache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.options.featureCacheTimeout) {
      this.featureCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  /**
   * Set cached value with timestamp
   */
  protected setCachedValue<T>(key: string, value: T): void {
    this.featureCache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear feature cache
   */
  protected clearFeatureCache(): void {
    this.featureCache.clear();
  }

  /**
   * Get connection information
   */
  public getConnectionInfo(): { 
    protocol: 'KLAP' | 'SecurePassthrough'; 
    connected: boolean; 
    deviceModel?: string;
    deviceType: string;
  } {
    const connectionInfo = this.deviceManager.getConnectionInfo();
    return {
      ...connectionInfo,
      ...(this.deviceModel && { deviceModel: this.deviceModel }),
      deviceType: this.getDeviceTypeName()
    };
  }

  /**
   * Health check method
   */
  public async healthCheck(): Promise<{
    connected: boolean;
    responsive: boolean;
    protocol: string;
    model?: string;
    lastError?: string;
  }> {
    const result: {
      connected: boolean;
      responsive: boolean;
      protocol: string;
      model?: string;
      lastError?: string;
    } = {
      connected: this.isConnected(),
      responsive: false,
      protocol: this.deviceManager.getConnectionInfo().protocol
    };

    if (this.deviceModel) {
      result.model = this.deviceModel;
    }

    if (result.connected) {
      try {
        await this.getDeviceInfo();
        result.responsive = true;
      } catch (error) {
        result.lastError = (error as Error).message;
      }
    }

    return result;
  }
}
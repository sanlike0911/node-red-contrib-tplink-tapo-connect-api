/**
 * Refactored P105 Smart Plug using unified base class
 * Eliminates code duplication and standardizes functionality
 */

import { 
  TapoCredentials, 
  TapoApiRequest, 
  P105DeviceInfo, 
  P105UsageInfo,
  DeviceMethodOptions,
  FeatureNotSupportedError
} from '../../types';
import { 
  DeviceOperationOptions, 
  DeviceCapability, 
  DeviceOperationResult 
} from '../../types/device-common';
import { BaseDeviceRefactored, DeviceFeatureCapabilities, BaseDeviceOptions } from '../base-device-refactored';
import { ErrorClassifier, ClassifiedTapoError } from '../../utils/error-classifier';

export interface P105PlugCapabilities extends DeviceFeatureCapabilities {
  basicControl: boolean;
  energyMonitoring: boolean;
  scheduling: boolean;
  childDevices: boolean;
  onTime: boolean;
}

/**
 * P105 Smart Plug with refactored architecture
 * Features: Basic on/off control, device info, on-time tracking
 */
export class P105PlugRefactored extends BaseDeviceRefactored {
  private readonly errorClassifier: ErrorClassifier;

  // P105 specific capabilities
  private static readonly CAPABILITIES: P105PlugCapabilities = {
    basicControl: true,
    energyMonitoring: false, // P105 doesn't support energy monitoring
    scheduling: true,
    childDevices: false,
    onTime: true
  };

  constructor(ip: string, credentials: TapoCredentials, options: BaseDeviceOptions = {}) {
    super(ip, credentials, options);
    this.errorClassifier = new ErrorClassifier();
  }

  protected getDeviceTypeName(): string {
    return 'P105Plug';
  }

  protected getDeviceCapabilities(): DeviceFeatureCapabilities {
    return P105PlugRefactored.CAPABILITIES;
  }

  /**
   * Get P105-specific device information
   */
  public override async getDeviceInfo(): Promise<P105DeviceInfo> {
    try {
      const request: TapoApiRequest = {
        method: 'get_device_info'
      };

      const response = await this.sendRequest<P105DeviceInfo>(request);
      return response.result;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Get device usage information (on-time tracking)
   */
  public async getUsageInfo(options: DeviceOperationOptions = {}): Promise<P105UsageInfo> {
    if (!await this.supportsFeature('onTime', options.useCache)) {
      const error = new FeatureNotSupportedError('onTime', 'P105');
      if (options.throwOnUnsupported) {
        throw error;
      }
      return { 
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0,
        onTime: 0 
      }; // Return default value
    }

    try {
      const request: TapoApiRequest = {
        method: 'get_device_usage'
      };

      const response = await this.sendRequest<P105UsageInfo>(request);
      return response.result;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Get on-time in seconds
   */
  public async getOnTime(options: DeviceOperationOptions = {}): Promise<number> {
    const cacheKey = 'on_time';
    
    if (options.useCache && !options.forceRefresh) {
      const cached = this.getCachedValue<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const usageInfo = await this.getUsageInfo(options);
      const onTime = usageInfo.onTime ?? 0;
      this.setCachedValue(cacheKey, onTime);
      return onTime;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Energy monitoring methods (not supported on P105)
   */
  public async hasEnergyMonitoring(): Promise<boolean> {
    return false;
  }

  public async getEnergyUsage(options: DeviceMethodOptions = {}): Promise<never> {
    const error = new FeatureNotSupportedError('energyMonitoring', 'P105');
    if (options.throwOnUnsupported !== false) {
      throw error;
    }
    throw error;
  }

  public async getCurrentPower(options: DeviceMethodOptions = {}): Promise<never> {
    const error = new FeatureNotSupportedError('energyMonitoring', 'P105');
    if (options.throwOnUnsupported !== false) {
      throw error;
    }
    throw error;
  }

  /**
   * Get all device capabilities
   */
  public async getCapabilities(): Promise<DeviceCapability[]> {
    const capabilities = this.getDeviceCapabilities();
    
    return Object.entries(capabilities).map(([name, supported]) => ({
      name,
      supported: Boolean(supported),
      description: this.getCapabilityDescription(name)
    }));
  }

  /**
   * Get capability description
   */
  private getCapabilityDescription(capability: string): string {
    const descriptions: Record<string, string> = {
      basicControl: 'Basic on/off device control',
      energyMonitoring: 'Real-time energy consumption monitoring',
      scheduling: 'Scheduled operations and timers',
      childDevices: 'Control of child/sub-devices',
      onTime: 'Device on-time tracking'
    };
    
    return descriptions[capability] || `${capability} capability`;
  }

  /**
   * Enhanced turn on with result tracking
   */
  public async turnOnWithResult(): Promise<DeviceOperationResult<void>> {
    const startTime = Date.now();
    
    try {
      await this.turnOn();
      
      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          protocol: this.getConnectionInfo().protocol,
          attempt: 1
        }
      };
    } catch (error) {
      const classified = this.errorClassifier.classify(error as Error);
      
      return {
        success: false,
        error: {
          type: classified.type,
          message: (error as Error).message,
          retryable: classified.isRetryable,
          retryAfter: classified.retryAfterMs
        },
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          protocol: this.getConnectionInfo().protocol,
          attempt: 1
        }
      };
    }
  }

  /**
   * Enhanced turn off with result tracking
   */
  public async turnOffWithResult(): Promise<DeviceOperationResult<void>> {
    const startTime = Date.now();
    
    try {
      await this.turnOff();
      
      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          protocol: this.getConnectionInfo().protocol,
          attempt: 1
        }
      };
    } catch (error) {
      const classified = this.errorClassifier.classify(error as Error);
      
      return {
        success: false,
        error: {
          type: classified.type,
          message: (error as Error).message,
          retryable: classified.isRetryable,
          retryAfter: classified.retryAfterMs
        },
        metadata: {
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          protocol: this.getConnectionInfo().protocol,
          attempt: 1
        }
      };
    }
  }

  /**
   * Comprehensive device status check
   */
  public async getDeviceStatus(): Promise<{
    device: P105DeviceInfo;
    usage: P105UsageInfo;
    capabilities: DeviceCapability[];
    connection: any;
    health: any;
  }> {
    const [device, usage, capabilities, connection, health] = await Promise.all([
      this.getDeviceInfo(),
      this.getUsageInfo(),
      this.getCapabilities(),
      Promise.resolve(this.getConnectionInfo()),
      this.healthCheck()
    ]);

    return {
      device,
      usage,
      capabilities,
      connection,
      health
    };
  }
}
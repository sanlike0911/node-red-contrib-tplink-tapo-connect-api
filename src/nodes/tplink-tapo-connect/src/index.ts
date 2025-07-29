// Core infrastructure exports
export * from './types';
export * from './core';

// Device exports
export * from './devices/base-device';
export * from './devices/plug-device';
export * from './devices/bulb-device';

// Controller exports
export * from './controllers/device-controller';
export * from './controllers/energy-controller';
export { LightingController, type ColorInfo, type BrightnessInfo, type LightingState } from './controllers/lighting-controller';

// Factory and services exports
export * from './factory/device-factory';
export * from './services/device-control-service';
export * from './services/batch-operation-service';

// Legacy device classes (for backward compatibility)
export * from './devices';

import { TapoCredentials } from './types';
import { DeviceFactory } from './factory/device-factory';
import { BaseDevice } from './devices/base-device';

/**
 * Main TapoConnect class with refactored architecture
 * Uses the new composition-based device architecture
 */
export class TapoConnect {
  /**
   * Create a device instance with automatic type detection
   * Recommended approach for new code
   */
  public static async createDevice(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials);
  }

  /**
   * Create a device instance with type hint
   * Useful when you know the device type in advance
   */
  public static async createDeviceWithHint(ip: string, credentials: TapoCredentials, methodHint: string): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, methodHint);
  }

  // Legacy methods for backward compatibility
  // These will create the appropriate device using the new architecture

  /**
   * Create a P100 Smart Plug instance
   * P100 is a basic smart plug without energy monitoring
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createP100Plug(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'basic_control');
  }

  /**
   * Create a P105 Smart Plug instance  
   * P105 is a basic smart plug without energy monitoring
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createP105Plug(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'basic_control');
  }

  /**
   * Create a P110 Smart Plug instance
   * P110 is a smart plug with energy monitoring capabilities
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createP110Plug(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'getEnergyUsage');
  }

  /**
   * Create a P115 Smart Plug instance
   * P115 is a smart plug with energy monitoring capabilities  
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createP115Plug(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'getEnergyUsage');
  }

  /**
   * Create an L510 Smart Bulb instance
   * L510 is a dimmable white light bulb
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createL510Bulb(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'setBrightness');
  }

  /**
   * Create an L520 Smart Bulb instance
   * L520 is a tunable white light bulb with color temperature control
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createL520Bulb(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'setColorTemperature');
  }

  /**
   * Create an L530 Smart Bulb instance
   * L530 is a full color bulb with effects support
   * @deprecated Use createDevice() for automatic type detection
   */
  public static async createL530Bulb(ip: string, credentials: TapoCredentials): Promise<BaseDevice> {
    return DeviceFactory.createDevice(ip, credentials, 'setColor');
  }
}

export default TapoConnect;

// Wrapper exports (high-level API)
export * from './wrapper/tplink-tapo-connect-wrapper';
export type { RetryOptions } from './types/retry-options';

// Retry utilities for advanced users
export {
  TapoRetryHandler,
  withRetry,
  retryable,
  type RetryConfig,
  type RetryResult
} from './utils/retry-utils';
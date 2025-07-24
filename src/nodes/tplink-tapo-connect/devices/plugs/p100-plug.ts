import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse, PlugDeviceInfo, PlugUsageInfo, FeatureNotSupportedError, DeviceCapabilityError, Result, DeviceMethodOptions } from '../../types';
import { UnifiedTapoProtocol } from '../../core/unified-protocol';

/**
 * P100 Smart Plug - Basic plug without energy monitoring
 */
export class P100Plug extends BaseTapoDevice {
  private unifiedProtocol: UnifiedTapoProtocol;
  private featureCache: Map<string, boolean> = new Map();
  private deviceModel?: string;
  private requestQueue: Promise<any> = Promise.resolve();

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
    this.unifiedProtocol = new UnifiedTapoProtocol(ip, credentials);
  }

  private async checkDeviceConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.ip}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.status !== 0;
    } catch (error) {
      console.log('Device connectivity check failed:', error);
      return false;
    }
  }

  public async connect(): Promise<void> {
    console.log('P100Plug.connect() called - using unified protocol');

    // Check basic device connectivity first
    console.log('Checking device connectivity...');
    const isReachable = await this.checkDeviceConnectivity();
    if (!isReachable) {
      throw new Error(`Device at ${this.ip} is not reachable. Check IP address and network connectivity.`);
    }
    console.log('Device is reachable, proceeding with unified protocol connection...');

    try {
      await this.unifiedProtocol.connect();
      console.log(`Connected successfully using ${this.unifiedProtocol.getActiveProtocol()} protocol`);
    } catch (error) {
      console.error('Unified protocol connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.unifiedProtocol.disconnect();
    } catch (error) {
      console.warn('Warning during disconnect:', error);
    }
  }

  /**
   * Check if device is currently authenticated
   */
  public isAuthenticated(): boolean {
    return this.unifiedProtocol.isConnected();
  }

  public override async getDeviceInfo(): Promise<PlugDeviceInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };

    const response = await this.sendRequest<any>(request);
    const rawData = response.result;

    // Transform raw data to match interface expectations
    const deviceInfo: PlugDeviceInfo = {
      ...rawData,
      // Computed properties for backward compatibility
      deviceId: rawData.device_id,
      deviceOn: rawData.device_on,
      onTime: rawData.on_time || 0,
      fwVer: rawData.fw_ver,
      hwVer: rawData.hw_ver,
      // Base interface properties
      deviceType: 'SMART.TAPOPLUG',
      type: 'SMART.TAPOPLUG',
      region: rawData.lang?.split('_')[1] || 'US',
      specs: '',
      rssi: 0,
      signalLevel: 0
    };

    // Cache device model for feature detection
    this.deviceModel = deviceInfo.model;

    return deviceInfo;
  }

  /**
   * Check if the device supports energy monitoring features
   * P100 does not support energy monitoring
   */
  public async hasEnergyMonitoring(): Promise<boolean> {
    const cacheKey = 'energy_monitoring';

    if (this.featureCache.has(cacheKey)) {
      return this.featureCache.get(cacheKey)!;
    }

    // P100 does not support energy monitoring
    this.featureCache.set(cacheKey, false);
    return false;
  }

  /**
   * Check if the device supports a specific feature
   */
  public async supportsFeature(feature: string): Promise<boolean> {
    switch (feature) {
      case 'energy_monitoring':
        return this.hasEnergyMonitoring();
      case 'schedule':
        return true; // Most Tapo devices support scheduling
      case 'countdown':
        return true; // Most Tapo devices support countdown
      default:
        return false;
    }
  }

  public async turnOn(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        device_on: true
      }
    };

    await this.sendRequest(request);
  }

  public async turnOff(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        device_on: false
      }
    };

    await this.sendRequest(request);
  }

  public async toggle(): Promise<void> {
    const deviceInfo = await this.getDeviceInfo();
    if (deviceInfo.device_on) {
      await this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  // Convenience aliases following Python API pattern
  public async on(): Promise<void> {
    await this.turnOn();
  }

  public async off(): Promise<void> {
    await this.turnOff();
  }

  public async isOn(): Promise<boolean> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.device_on;
  }

  public async getUsageInfo(options: DeviceMethodOptions = {}): Promise<PlugUsageInfo> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support energy monitoring features'
      );
    } else {
      // Return empty/default usage info when not throwing
      return {
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0
      };
    }
  }

  /**
   * Get usage info using Result pattern for better error handling
   */
  public async getUsageInfoResult(): Promise<Result<PlugUsageInfo, FeatureNotSupportedError | DeviceCapabilityError>> {
    try {
      const data = await this.getUsageInfo({ throwOnUnsupported: true });
      return { success: true, data };
    } catch (error) {
      if (error instanceof FeatureNotSupportedError || error instanceof DeviceCapabilityError) {
        return { success: false, error };
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  public async getCurrentPower(options: DeviceMethodOptions = {}): Promise<number> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support current power monitoring'
      );
    }
    return 0;
  }

  public async getTodayEnergy(options: DeviceMethodOptions = {}): Promise<number> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support energy monitoring'
      );
    }
    return 0;
  }

  public async getMonthEnergy(options: DeviceMethodOptions = {}): Promise<number> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support energy monitoring'
      );
    }
    return 0;
  }

  public async getTodayRuntime(options: DeviceMethodOptions = {}): Promise<number> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support runtime monitoring'
      );
    }
    return 0;
  }

  public async getMonthRuntime(options: DeviceMethodOptions = {}): Promise<number> {
    const { throwOnUnsupported = true } = options;

    if (throwOnUnsupported) {
      throw new FeatureNotSupportedError(
        'energy_monitoring',
        this.deviceModel || 'P100',
        'P100 devices do not support runtime monitoring'
      );
    }
    return 0;
  }

  public async isOverheated(): Promise<boolean> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.overheated || false;
  }

  public async getOnTime(): Promise<number> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.on_time || 0;
  }

  public async setDeviceInfo(params: Record<string, unknown>): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params
    };

    await this.sendRequest(request);
  }

  protected async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    // Use sequential request queue to prevent KLAP session conflicts (like Python tapo)
    return this.requestQueue = this.requestQueue.then(async () => {
      try {
        // Use unified protocol with improved session management
        const result = await this.unifiedProtocol.executeRequest<T>(request);
        return {
          error_code: 0,
          result
        };
      } catch (error) {
        console.error(`Request ${request.method} failed:`, error);
        throw error;
      }
    });
  }
}
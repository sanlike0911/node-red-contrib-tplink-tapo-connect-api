import { P105Plug } from './p105-plug';
import { TapoCredentials, TapoApiRequest, P105UsageInfo, Result, FeatureNotSupportedError, DeviceCapabilityError } from '../../types';

/**
 * P110 Smart Plug - Plug with energy monitoring capabilities
 */
export class P110Plug extends P105Plug {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Connect to the P110 device
   */
  public override async connect(): Promise<void> {
    console.log('P110Plug.connect() called');
    await super.connect();
  }

  /**
   * Check if the device supports energy monitoring features
   * P110 supports energy monitoring
   */
  public override async hasEnergyMonitoring(): Promise<boolean> {
    return true;
  }

  /**
   * Get current power consumption in watts
   */
  public override async getCurrentPower(options?: { throwOnUnsupported?: boolean }): Promise<number> {
    const request: TapoApiRequest = {
      method: 'get_current_power'
    };

    try {
      const response = await this.sendRequest<{ current_power: number }>(request);
      return response.result?.current_power || 0;
    } catch (error) {
      const throwOnUnsupported = options?.throwOnUnsupported ?? true;
      if (throwOnUnsupported) {
        throw error;
      }
      return 0;
    }
  }

  /**
   * Get energy usage data
   */
  public async getEnergyUsage(): Promise<any> {
    const request: TapoApiRequest = {
      method: 'get_energy_usage'
    };

    const response = await this.sendRequest(request);
    return response.result;
  }

  /**
   * Get energy data with detailed statistics
   */
  public async getEnergyData(): Promise<any> {
    const request: TapoApiRequest = {
      method: 'get_energy_data'
    };

    const response = await this.sendRequest(request);
    return response.result;
  }

  /**
   * Get comprehensive usage information
   */
  public override async getUsageInfo(options?: { throwOnUnsupported?: boolean }): Promise<any> {
    try {
      const [energyUsage, currentPower] = await Promise.all([
        this.getEnergyUsage(),
        this.getCurrentPower({ throwOnUnsupported: false })
      ]);

      return {
        todayRuntime: energyUsage?.today_runtime || 0,
        monthRuntime: energyUsage?.month_runtime || 0,
        todayEnergy: energyUsage?.today_energy || 0,
        monthEnergy: energyUsage?.month_energy || 0,
        currentPower: currentPower || 0,
        ...energyUsage
      };
    } catch (error) {
      const throwOnUnsupported = options?.throwOnUnsupported ?? true;
      if (throwOnUnsupported) {
        throw error;
      }
      
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
   * Get today's energy consumption in watt-hours
   */
  public override async getTodayEnergy(options?: { throwOnUnsupported?: boolean }): Promise<number> {
    try {
      const energyUsage = await this.getEnergyUsage();
      return energyUsage?.today_energy || 0;
    } catch (error) {
      const throwOnUnsupported = options?.throwOnUnsupported ?? true;
      if (throwOnUnsupported) {
        throw error;
      }
      return 0;
    }
  }

  /**
   * Get usage information with Result pattern
   */
  public override async getUsageInfoResult(): Promise<Result<P105UsageInfo, FeatureNotSupportedError | DeviceCapabilityError>> {
    try {
      const data = await this.getUsageInfo({ throwOnUnsupported: false });
      return { success: true, data };
    } catch (error) {
      if (error instanceof FeatureNotSupportedError || error instanceof DeviceCapabilityError) {
        return { success: false, error };
      }
      // Convert other errors to DeviceCapabilityError
      return { success: false, error: new DeviceCapabilityError('energy_monitoring', 'API request failed', 'Energy monitoring feature failed') };
    }
  }
}
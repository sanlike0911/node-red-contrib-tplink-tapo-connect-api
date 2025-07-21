import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse, P105DeviceInfo, P105UsageInfo, FeatureNotSupportedError, DeviceCapabilityError, Result, DeviceMethodOptions } from '../../types';
import { TapoAuth, KlapAuth } from '../../core';

export class P105Plug extends BaseTapoDevice {
  private auth: TapoAuth;
  private klapAuth: KlapAuth;
  private useKlap: boolean = false;
  private featureCache: Map<string, boolean> = new Map();
  private deviceModel?: string;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 1000; // Minimum interval between requests

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
    this.auth = new TapoAuth(ip, credentials);
    this.klapAuth = new KlapAuth(ip, credentials);
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
    console.log('P105Plug.connect() called');
    
    // Check basic device connectivity first
    console.log('Checking device connectivity...');
    const isReachable = await this.checkDeviceConnectivity();
    if (!isReachable) {
      throw new Error(`Device at ${this.ip} is not reachable. Check IP address and network connectivity.`);
    }
    console.log('Device is reachable, proceeding with authentication...');
    
    const maxRetries = 2;
    let securePassthroughError: Error | null = null;
    let klapError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Connection attempt ${attempt}/${maxRetries}`);
      
      // Try KLAP first (newer protocol, more reliable)
      try {
        console.log('Trying KLAP authentication...');
        await this.klapAuth.authenticate();
        this.useKlap = true;
        console.log('KLAP authentication successful');
        return;
      } catch (error) {
        klapError = error as Error;
        console.log('KLAP failed:', error);
        
        // Try Secure Passthrough as fallback
        try {
          console.log('Trying Secure Passthrough authentication...');
          await this.auth.authenticate();
          this.useKlap = false;
          console.log('Secure Passthrough authentication successful');
          return;
        } catch (fallbackError) {
          securePassthroughError = fallbackError as Error;
          console.log('Secure Passthrough failed:', fallbackError);
        }
      }

      if (attempt < maxRetries) {
        console.log(`Both modern protocols failed, retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.error('All authentication attempts failed');
    
    // Check if this might be a legacy device and provide helpful error message
    const isLikelyLegacyDevice = this.isLikelyLegacyDevice(klapError, securePassthroughError);
    
    if (isLikelyLegacyDevice) {
      throw new Error(
        `This device appears to be a legacy Tapo device that is not supported by this library. ` +
        `Legacy devices require older protocols that are no longer supported for security reasons. ` +
        `Please upgrade to a newer Tapo device that supports KLAP or Secure Passthrough protocols. ` +
        `Error details - KLAP: ${klapError?.message}; Secure Passthrough: ${securePassthroughError?.message}`
      );
    }
    
    throw new Error(`Authentication failed after ${maxRetries} attempts - KLAP: ${klapError?.message}; Secure Passthrough: ${securePassthroughError?.message}`);
  }

  private isLikelyLegacyDevice(klapError: Error | null, securePassthroughError: Error | null): boolean {
    // Check for patterns that indicate a legacy device
    const legacyIndicators = [
      'KLAP protocol not supported',
      'socket hang up',
      'ECONNREFUSED',
      'HTTP request failed',
      'Tapo API error: -1010',
      'Tapo API error: -1009',
      '404',
      'handshake1 failed'
    ];

    const klapMessage = klapError?.message || '';
    const passthroughMessage = securePassthroughError?.message || '';
    const combinedMessage = (klapMessage + ' ' + passthroughMessage).toLowerCase();

    // If both modern protocols fail with these specific patterns, likely legacy
    const hasLegacyPattern = legacyIndicators.some(indicator => 
      combinedMessage.includes(indicator.toLowerCase())
    );

    // Additional check: if KLAP is not supported AND Secure Passthrough has connection issues
    const klapNotSupported = klapMessage.toLowerCase().includes('not supported');
    const passthroughConnectionIssue = passthroughMessage.toLowerCase().includes('socket hang up') || 
                                      passthroughMessage.toLowerCase().includes('econnrefused');

    return hasLegacyPattern && (klapNotSupported || passthroughConnectionIssue);
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.useKlap) {
        await this.klapAuth.clearSession();
      } else {
        this.auth.clearSession();
      }
    } catch (error) {
      console.warn('Warning during disconnect:', error);
    }
  }

  public override async getDeviceInfo(): Promise<P105DeviceInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };

    const response = await this.sendRequest<any>(request);
    const rawData = response.result;
    
    // Transform raw data to match interface expectations
    const deviceInfo: P105DeviceInfo = {
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
   */
  public async hasEnergyMonitoring(): Promise<boolean> {
    const cacheKey = 'energy_monitoring';
    
    if (this.featureCache.has(cacheKey)) {
      return this.featureCache.get(cacheKey)!;
    }

    try {
      // Get device info to determine model if not cached
      if (!this.deviceModel) {
        const deviceInfo = await this.getDeviceInfo();
        this.deviceModel = deviceInfo.model;
      }

      // Check if model supports energy monitoring
      const energyMonitoringModels = ['P110', 'P115', 'KP115', 'KP125'];
      const nonEnergyMonitoringModels = ['P100', 'P105', 'KP105'];
      
      // Check if device model is known to support energy monitoring
      if (energyMonitoringModels.includes(this.deviceModel)) {
        this.featureCache.set(cacheKey, true);
        return true;
      }
      
      // Check if device model is known to NOT support energy monitoring
      if (nonEnergyMonitoringModels.includes(this.deviceModel)) {
        this.featureCache.set(cacheKey, false);
        return false;
      }
      
      // For unknown models, try to make a request to determine support
      if (!energyMonitoringModels.includes(this.deviceModel) && !nonEnergyMonitoringModels.includes(this.deviceModel)) {
        try {
          const request: TapoApiRequest = {
            method: 'get_energy_usage'
          };
          await this.sendRequest(request);
          this.featureCache.set(cacheKey, true);
          return true;
        } catch (error) {
          this.featureCache.set(cacheKey, false);
          return false;
        }
      }
      
      // If we reach here, model was not in any list - shouldn't happen but handle gracefully
      this.featureCache.set(cacheKey, false);
      return false;
    } catch (error) {
      // If we can't determine support, assume it's not supported
      this.featureCache.set(cacheKey, false);
      return false;
    }
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

  public async getUsageInfo(options: DeviceMethodOptions = {}): Promise<P105UsageInfo> {
    const { throwOnUnsupported = true } = options;
    
    const hasEnergyMonitoring = await this.hasEnergyMonitoring();
    
    if (!hasEnergyMonitoring) {
      if (throwOnUnsupported) {
        throw new FeatureNotSupportedError(
          'energy_monitoring',
          this.deviceModel || 'unknown',
          'This device does not support energy monitoring features'
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

    try {
      const request: TapoApiRequest = {
        method: 'get_energy_usage'
      };

      const response = await this.sendRequest<P105UsageInfo>(request);
      return response.result;
    } catch (error) {
      if (error instanceof FeatureNotSupportedError) {
        throw error;
      }
      
      if (!throwOnUnsupported) {
        return {
          todayRuntime: 0,
          monthRuntime: 0,
          todayEnergy: 0,
          monthEnergy: 0,
          currentPower: 0
        };
      }
      
      // If the API call fails, it might indicate lack of support
      throw new DeviceCapabilityError(
        'energy_monitoring',
        'API request failed',
        `Failed to get energy usage information: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Get usage info using Result pattern for better error handling
   */
  public async getUsageInfoResult(): Promise<Result<P105UsageInfo, FeatureNotSupportedError | DeviceCapabilityError>> {
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
    const usageInfo = await this.getUsageInfo(options);
    return usageInfo.currentPower;
  }

  public async getTodayEnergy(options: DeviceMethodOptions = {}): Promise<number> {
    const usageInfo = await this.getUsageInfo(options);
    return usageInfo.todayEnergy;
  }

  public async getMonthEnergy(options: DeviceMethodOptions = {}): Promise<number> {
    const usageInfo = await this.getUsageInfo(options);
    return usageInfo.monthEnergy;
  }

  public async getTodayRuntime(options: DeviceMethodOptions = {}): Promise<number> {
    const usageInfo = await this.getUsageInfo(options);
    return usageInfo.todayRuntime;
  }

  public async getMonthRuntime(options: DeviceMethodOptions = {}): Promise<number> {
    const usageInfo = await this.getUsageInfo(options);
    return usageInfo.monthRuntime;
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
    // Queue requests to prevent overloading the device
    return this.requestQueue = this.requestQueue.then(async () => {
      // Rate limiting: ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }
      this.lastRequestTime = Date.now();

      // First attempt: Use current protocol (KLAP or Secure Passthrough)
      let primaryError: Error | null = null;
      
      try {
        if (this.useKlap) {
          if (!this.klapAuth.isAuthenticated()) {
            throw new Error('Device not connected. Call connect() first.');
          }
          const result = await this.klapAuth.secureRequest<T>(request);
          return {
            error_code: 0,
            result
          };
        } else {
          if (!this.auth.isAuthenticated()) {
            throw new Error('Device not connected. Call connect() first.');
          }
          const result = await this.auth.secureRequest<T>(request);
          return {
            error_code: 0,
            result
          };
        }
      } catch (error) {
        primaryError = error as Error;
        console.log(`Primary API failed (${this.useKlap ? 'KLAP' : 'Secure Passthrough'}):`, error);
        
        // Check if this is a session error that requires re-authentication
        if (this.isSessionError(error as Error)) {
          console.log('Session error detected, attempting to re-authenticate...');
          try {
            if (this.useKlap) {
              await this.klapAuth.authenticate();
              console.log('KLAP re-authentication successful, retrying request...');
              const result = await this.klapAuth.secureRequest<T>(request);
              return {
                error_code: 0,
                result
              };
            } else {
              await this.auth.authenticate();
              console.log('Secure Passthrough re-authentication successful, retrying request...');
              const result = await this.auth.secureRequest<T>(request);
              return {
                error_code: 0,
                result
              };
            }
          } catch (reAuthError) {
            console.log('Re-authentication failed:', reAuthError);
            // Continue to fallback logic
          }
        }
        
        // Check if this is a recoverable error that warrants fallback
        const isRecoverableError = this.isRecoverableError(error as Error);
        const isSessionError = this.isSessionError(error as Error);
        
        // For session errors (like KLAP 1002), try re-authentication first
        if (isSessionError) {
          try {
            console.log('Session error detected, attempting re-authentication...');
            if (this.useKlap) {
              console.log('Re-authenticating KLAP session...');
              this.klapAuth.clearSession();
              await this.klapAuth.authenticate();
            } else {
              console.log('Re-authenticating Secure Passthrough session...');
              await this.auth.authenticate();
            }
            
            // Retry the original request after re-authentication
            console.log('Re-authentication successful, retrying original request...');
            if (this.useKlap) {
              const result = await this.klapAuth.secureRequest<T>(request);
              return { error_code: 0, result };
            } else {
              const result = await this.auth.secureRequest<T>(request);
              return { error_code: 0, result };
            }
          } catch (reAuthError) {
            console.log('Re-authentication failed:', reAuthError);
            // Continue to fallback logic if re-authentication fails
          }
        }
        
        if (!isRecoverableError) {
          // For non-recoverable errors (like authentication issues), don't fallback
          throw primaryError;
        }
      }

      // Fallback attempts: Try the other modern protocol
      const fallbackMethods = [
        {
          name: 'Secure Passthrough',
          auth: this.auth,
          setup: () => { this.useKlap = false; }
        },
        {
          name: 'KLAP',
          auth: this.klapAuth,
          setup: () => { this.useKlap = true; }
        }
      ];

      // Remove the current method from fallback options
      const currentMethod = this.useKlap ? 'KLAP' : 'Secure Passthrough';
      const availableFallbacks = fallbackMethods.filter(method => method.name !== currentMethod);

      for (const fallback of availableFallbacks) {
        try {
          console.log(`Attempting fallback to ${fallback.name}...`);
          
          // Clear session and re-authenticate for fallback
          console.log(`Clearing session and authenticating with ${fallback.name} for fallback...`);
          if (fallback.name === 'KLAP') {
            this.klapAuth.clearSession();
          } else {
            this.auth.clearSession();
          }
          await fallback.auth.authenticate();
          
          const result = await fallback.auth.secureRequest<T>(request);
          console.log(`Fallback to ${fallback.name} succeeded`);
          
          // Switch to the successful protocol for future requests
          fallback.setup();
          
          return {
            error_code: 0,
            result
          };
        } catch (fallbackError) {
          console.log(`Fallback to ${fallback.name} failed:`, fallbackError);
        }
      }

      // All protocols failed
      throw new Error(
        `All API protocols failed. Primary (${currentMethod}): ${primaryError?.message}; ` +
        `Tried fallbacks: ${availableFallbacks.map(f => f.name).join(', ')}`
      );
    });
  }

  /**
   * Determine if an error is recoverable and warrants attempting fallback to the other API
   */
  private isRecoverableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // KLAP-specific recoverable errors
    if (errorMessage.includes('klap -1012') || // Device busy
        errorMessage.includes('klap -1003') || // Invalid parameters  
        errorMessage.includes('klap 1002') || // Session expired/invalid
        errorMessage.includes('session expired') || // Session issues
        errorMessage.includes('session needs to be re-established') || // Session re-auth needed
        errorMessage.includes('rate limit') || // Rate limiting
        errorMessage.includes('connection reset') || // Connection issues
        errorMessage.includes('timeout') || // Timeouts
        errorMessage.includes('json')) { // JSON parsing issues
      return true;
    }
    
    // HTTP-level recoverable errors
    if (errorMessage.includes('http 429') || // Rate limit
        errorMessage.includes('econnreset') || // Connection reset
        errorMessage.includes('etimedout') || // Timeout
        errorMessage.includes('network') || // Network issues
        errorMessage.includes('socket')) { // Socket issues
      return true;
    }
    
    // Protocol-specific recoverable errors
    if (errorMessage.includes('protocol not supported') ||
        errorMessage.includes('bad decrypt') ||
        errorMessage.includes('session corruption')) {
      return true;
    }
    
    // Non-recoverable errors (don't fallback for these)
    if (errorMessage.includes('email or password incorrect') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('not connected') ||
        errorMessage.includes('device not found')) {
      return false;
    }
    
    // Default: treat unknown errors as potentially recoverable
    return true;
  }


  private isSessionError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('klap 1002') || 
           errorMessage.includes('session expired') || 
           errorMessage.includes('session needs to be re-established') ||
           errorMessage.includes('klap -1001');
  }
}
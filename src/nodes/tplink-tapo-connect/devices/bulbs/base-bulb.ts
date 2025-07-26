/**
 * Base class for Tapo Smart Bulbs
 */

import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse } from '../../types';
import { 
  TapoBulbInfo, 
  HSVColor, 
  RGBColor, 
  NamedColor, 
  LightEffectConfig,
  BulbCapabilities,
  ColorUtils,
  BULB_CAPABILITIES 
} from '../../types/bulb';
import { TapoAuth } from '../../core/auth';
import { KlapAuth } from '../../core/klap-auth';

export abstract class BaseBulb extends BaseTapoDevice {
  protected auth: TapoAuth;
  protected klapAuth: KlapAuth;
  protected useKlap: boolean = false;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 1000; // Minimum interval between requests

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
    this.auth = new TapoAuth(ip, credentials);
    this.klapAuth = new KlapAuth(ip, credentials);
  }

  /**
   * Get device model - to be implemented by subclasses
   */
  protected abstract getDeviceModel(): string;

  /**
   * Get device capabilities
   */
  public getCapabilities(): BulbCapabilities {
    const model = this.getDeviceModel();
    const capabilities = BULB_CAPABILITIES[model];
    if (!capabilities) {
      // Fallback to L510 capabilities if model not found
      return BULB_CAPABILITIES['L510']!;
    }
    return capabilities;
  }

  private async checkDeviceConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.ip}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.status < 500;
    } catch (error) {
      console.log('Device connectivity check failed:', error);
      return false;
    }
  }

  public async connect(): Promise<void> {
    console.log(`${this.getDeviceModel()}Bulb.connect() called`);
    
    // Check basic connectivity first
    console.log('Checking device connectivity...');
    const isReachable = await this.checkDeviceConnectivity();
    if (!isReachable) {
      console.log('Device connectivity check failed, but proceeding with authentication...');
    } else {
      console.log('Device is reachable, proceeding with authentication...');
    }

    const maxRetries = 2;
    let klapError: Error | undefined;
    let securePassthroughError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Connection attempt ${attempt}/${maxRetries}`);
      
      // Try KLAP first
      try {
        console.log('Trying KLAP authentication...');
        await this.klapAuth.authenticate();
        this.useKlap = true;
        console.log('KLAP authentication successful');
        return;
      } catch (error) {
        klapError = error as Error;
        console.log('KLAP failed:', error);
      }

      // If KLAP fails, try Secure Passthrough
      if (!this.useKlap) {
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
    throw new Error(
      `Failed to connect to bulb after ${maxRetries} attempts. ` +
      `KLAP: ${klapError?.message}; Secure Passthrough: ${securePassthroughError?.message}`
    );
  }

  public async disconnect(): Promise<void> {
    if (this.useKlap) {
      this.klapAuth.clearSession();
    }
    // Note: Secure Passthrough doesn't require explicit disconnect
  }

  /**
   * Send request with rate limiting and session management
   */
  protected async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    return this.requestQueue = this.requestQueue.then(async () => {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }
      this.lastRequestTime = Date.now();

      try {
        if (this.useKlap) {
          if (!this.klapAuth.isAuthenticated()) {
            throw new Error('Device not connected. Call connect() first.');
          }
          const result = await this.klapAuth.secureRequest<T>(request);
          return { error_code: 0, result };
        } else {
          if (!this.auth.isAuthenticated()) {
            throw new Error('Device not connected. Call connect() first.');
          }
          const result = await this.auth.secureRequest<T>(request);
          return { error_code: 0, result };
        }
      } catch (error) {
        // Check for session errors and attempt re-authentication
        const errorMessage = (error as Error).message.toLowerCase();
        if (errorMessage.includes('klap 1002') || errorMessage.includes('session expired')) {
          console.log('Session error detected, attempting re-authentication...');
          try {
            if (this.useKlap) {
              this.klapAuth.clearSession();
              await this.klapAuth.authenticate();
            } else {
              await this.auth.authenticate();
            }
            console.log('Re-authentication successful, retrying request...');
            
            // Retry the request
            if (this.useKlap) {
              const result = await this.klapAuth.secureRequest<T>(request);
              return { error_code: 0, result };
            } else {
              const result = await this.auth.secureRequest<T>(request);
              return { error_code: 0, result };
            }
          } catch (reAuthError) {
            console.log('Re-authentication failed:', reAuthError);
            throw reAuthError;
          }
        }
        throw error;
      }
    });
  }

  // ============================================================================
  // Basic Device Control
  // ============================================================================

  /**
   * Turn bulb on
   */
  public async turnOn(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        device_on: true
      }
    };
    await this.sendRequest(request);
  }

  /**
   * Turn bulb off
   */
  public async turnOff(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        device_on: false
      }
    };
    await this.sendRequest(request);
  }

  /**
   * Toggle bulb state
   */
  public async toggle(): Promise<void> {
    const deviceInfo = await this.getDeviceInfo();
    if (deviceInfo.device_on) {
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
   * Check if bulb is on
   */
  public async isOn(): Promise<boolean> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.device_on;
  }

  // ============================================================================
  // Device Information
  // ============================================================================

  /**
   * Get device information
   */
  public async getDeviceInfo(): Promise<TapoBulbInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };

    const response = await this.sendRequest<TapoBulbInfo>(request);
    return response.result;
  }

  // ============================================================================
  // Brightness Control
  // ============================================================================

  /**
   * Set brightness level
   */
  public async setBrightness(brightness: number): Promise<void> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.brightness) {
      throw new Error(`${this.getDeviceModel()} does not support brightness control`);
    }

    if (brightness < capabilities.minBrightness || brightness > capabilities.maxBrightness) {
      throw new Error(`Brightness must be between ${capabilities.minBrightness}-${capabilities.maxBrightness}`);
    }

    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        brightness
      }
    };

    await this.sendRequest(request);
  }

  /**
   * Get current brightness
   */
  public async getBrightness(): Promise<number> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.brightness || 0;
  }

  // ============================================================================
  // Color Control (for color-capable bulbs)
  // ============================================================================

  /**
   * Set color using HSV values
   */
  public async setColor(color: HSVColor): Promise<void> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.color) {
      throw new Error(`${this.getDeviceModel()} does not support color control`);
    }

    ColorUtils.validateHSV(color);

    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        hue: color.hue,
        saturation: color.saturation,
        brightness: color.value
      }
    };

    await this.sendRequest(request);
  }

  /**
   * Set color using RGB values
   */
  public async setColorRGB(color: RGBColor): Promise<void> {
    const hsv = ColorUtils.rgbToHsv(color);
    await this.setColor(hsv);
  }

  /**
   * Set color using named color
   */
  public async setNamedColor(color: NamedColor): Promise<void> {
    const hsv = ColorUtils.getNamedColor(color);
    await this.setColor(hsv);
  }

  /**
   * Get current color in HSV format
   */
  public async getColor(): Promise<HSVColor | null> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.color) {
      return null;
    }

    const deviceInfo = await this.getDeviceInfo();
    
    if (deviceInfo.hue !== undefined && deviceInfo.saturation !== undefined) {
      return {
        hue: deviceInfo.hue,
        saturation: deviceInfo.saturation,
        value: deviceInfo.brightness
      };
    }
    
    return null;
  }

  // ============================================================================
  // Color Temperature Control
  // ============================================================================

  /**
   * Set color temperature
   */
  public async setColorTemperature(temperature: number, brightness?: number): Promise<void> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.colorTemperature) {
      throw new Error(`${this.getDeviceModel()} does not support color temperature control`);
    }

    ColorUtils.validateColorTemperature(temperature);

    const params: any = {
      color_temp: temperature
    };

    if (brightness !== undefined) {
      if (brightness < capabilities.minBrightness || brightness > capabilities.maxBrightness) {
        throw new Error(`Brightness must be between ${capabilities.minBrightness}-${capabilities.maxBrightness}`);
      }
      params.brightness = brightness;
    }

    const request: TapoApiRequest = {
      method: 'set_device_info',
      params
    };

    await this.sendRequest(request);
  }

  /**
   * Get current color temperature
   */
  public async getColorTemperature(): Promise<number | null> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.colorTemperature) {
      return null;
    }

    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.color_temp || null;
  }

  // ============================================================================
  // Light Effects (for L530)
  // ============================================================================

  /**
   * Set light effect
   */
  public async setLightEffect(config: LightEffectConfig): Promise<void> {
    const capabilities = this.getCapabilities();
    
    if (!capabilities.effects) {
      throw new Error(`${this.getDeviceModel()} does not support light effects`);
    }

    const params: any = {
      lighting_effect: {
        name: config.effect,
        enable: config.effect !== 'off'
      }
    };

    if (config.speed !== undefined) {
      params.lighting_effect.speed = Math.min(Math.max(config.speed, 1), 10);
    }

    if (config.brightness !== undefined) {
      params.lighting_effect.brightness = Math.min(Math.max(config.brightness, 1), 100);
    }

    if (config.colors && config.colors.length > 0) {
      params.lighting_effect.colors = config.colors.map(color => {
        ColorUtils.validateHSV(color);
        return {
          hue: color.hue,
          saturation: color.saturation,
          brightness: color.value
        };
      });
    }

    const request: TapoApiRequest = {
      method: 'set_lighting_effect',
      params
    };

    await this.sendRequest(request);
  }

  /**
   * Turn off light effects
   */
  public async turnOffEffect(): Promise<void> {
    await this.setLightEffect({ effect: 'off' });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if device supports a specific feature
   */
  public supportsFeature(feature: keyof BulbCapabilities): boolean {
    const capabilities = this.getCapabilities();
    return Boolean(capabilities[feature]);
  }

  /**
   * Get device capabilities
   */
  public async hasColorSupport(): Promise<boolean> {
    return this.supportsFeature('color');
  }

  public async hasColorTemperatureSupport(): Promise<boolean> {
    return this.supportsFeature('colorTemperature');
  }

  public async hasEffectsSupport(): Promise<boolean> {
    return this.supportsFeature('effects');
  }
}
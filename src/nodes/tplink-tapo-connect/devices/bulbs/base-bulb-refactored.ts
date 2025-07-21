/**
 * Refactored base class for Tapo Smart Bulbs using unified architecture
 */

import { TapoCredentials, TapoApiRequest } from '../../types';
import { 
  TapoBulbInfo, 
  HSVColor, 
  RGBColor, 
  NamedColor, 
  LightEffectConfig,
  BulbCapabilities,
  ColorUtils 
} from '../../types/bulb';
import { 
  DeviceOperationOptions, 
  DeviceOperationResult 
} from '../../types/device-common';
import { BaseDeviceRefactored, DeviceFeatureCapabilities, BaseDeviceOptions } from '../base-device-refactored';
import { ErrorClassifier, ClassifiedTapoError } from '../../utils/error-classifier';

/**
 * Refactored base class for all smart bulbs
 * Eliminates duplication and provides consistent interface
 */
export abstract class BaseBulbRefactored extends BaseDeviceRefactored {
  protected readonly errorClassifier: ErrorClassifier;

  constructor(ip: string, credentials: TapoCredentials, options: BaseDeviceOptions = {}) {
    super(ip, credentials, options);
    this.errorClassifier = new ErrorClassifier();
  }

  /**
   * Get device model - to be implemented by subclasses
   */
  protected abstract getDeviceModel(): string;

  /**
   * Get bulb-specific capabilities - to be implemented by subclasses
   */
  protected abstract getBulbCapabilities(): BulbCapabilities;

  protected getDeviceCapabilities(): DeviceFeatureCapabilities {
    const bulbCaps = this.getBulbCapabilities();
    return {
      brightness: bulbCaps.brightness,
      color: bulbCaps.color,
      colorTemperature: bulbCaps.colorTemperature,
      effects: bulbCaps.effects,
      minBrightness: bulbCaps.minBrightness,
      maxBrightness: bulbCaps.maxBrightness,
      minColorTemp: bulbCaps.minColorTemp ?? 0,
      maxColorTemp: bulbCaps.maxColorTemp ?? 0
    };
  }

  protected getDeviceTypeName(): string {
    return `${this.getDeviceModel()}Bulb`;
  }

  /**
   * Get bulb-specific device information
   */
  public override async getDeviceInfo(): Promise<TapoBulbInfo> {
    try {
      const request: TapoApiRequest = {
        method: 'get_device_info'
      };

      const response = await this.sendRequest<TapoBulbInfo>(request);
      return response.result;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  // ============================================================================
  // Brightness Control
  // ============================================================================

  /**
   * Set brightness level with validation
   */
  public async setBrightness(brightness: number, options: DeviceOperationOptions = {}): Promise<void> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.brightness) {
      const error = new Error(`${this.getDeviceModel()} does not support brightness control`);
      if (options.throwOnUnsupported) {
        throw new ClassifiedTapoError(error, this.errorClassifier);
      }
      return;
    }

    if (brightness < capabilities.minBrightness || brightness > capabilities.maxBrightness) {
      throw new ClassifiedTapoError(
        new Error(`Brightness must be between ${capabilities.minBrightness}-${capabilities.maxBrightness}`),
        this.errorClassifier
      );
    }

    try {
      const request: TapoApiRequest = {
        method: 'set_device_info',
        params: { brightness }
      };

      await this.sendRequest(request);
      
      // Clear brightness cache
      this.setCachedValue('brightness', brightness);
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Get current brightness with caching
   */
  public async getBrightness(options: DeviceOperationOptions = {}): Promise<number> {
    const cacheKey = 'brightness';
    
    if (options.useCache && !options.forceRefresh) {
      const cached = this.getCachedValue<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const deviceInfo = await this.getDeviceInfo();
      const brightness = deviceInfo.brightness || 0;
      this.setCachedValue(cacheKey, brightness);
      return brightness;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  // ============================================================================
  // Color Control
  // ============================================================================

  /**
   * Set color using HSV values
   */
  public async setColor(color: HSVColor, options: DeviceOperationOptions = {}): Promise<void> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.color) {
      const error = new Error(`${this.getDeviceModel()} does not support color control`);
      if (options.throwOnUnsupported) {
        throw new ClassifiedTapoError(error, this.errorClassifier);
      }
      return;
    }

    try {
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
      
      // Update cache
      this.setCachedValue('current_color', color);
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Set color using RGB values
   */
  public async setColorRGB(color: RGBColor, options: DeviceOperationOptions = {}): Promise<void> {
    const hsv = ColorUtils.rgbToHsv(color);
    await this.setColor(hsv, options);
  }

  /**
   * Set color using named color
   */
  public async setNamedColor(color: NamedColor, options: DeviceOperationOptions = {}): Promise<void> {
    const hsv = ColorUtils.getNamedColor(color);
    await this.setColor(hsv, options);
  }

  /**
   * Get current color in HSV format
   */
  public async getColor(options: DeviceOperationOptions = {}): Promise<HSVColor | null> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.color) {
      return null;
    }

    const cacheKey = 'current_color';
    
    if (options.useCache && !options.forceRefresh) {
      const cached = this.getCachedValue<HSVColor>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const deviceInfo = await this.getDeviceInfo();
      
      if (deviceInfo.hue !== undefined && deviceInfo.saturation !== undefined) {
        const color: HSVColor = {
          hue: deviceInfo.hue,
          saturation: deviceInfo.saturation,
          value: deviceInfo.brightness
        };
        
        this.setCachedValue(cacheKey, color);
        return color;
      }
      
      return null;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  // ============================================================================
  // Color Temperature Control
  // ============================================================================

  /**
   * Set color temperature
   */
  public async setColorTemperature(
    temperature: number, 
    brightness?: number, 
    options: DeviceOperationOptions = {}
  ): Promise<void> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.colorTemperature) {
      const error = new Error(`${this.getDeviceModel()} does not support color temperature control`);
      if (options.throwOnUnsupported) {
        throw new ClassifiedTapoError(error, this.errorClassifier);
      }
      return;
    }

    try {
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
      
      // Update cache
      this.setCachedValue('color_temperature', temperature);
      if (brightness !== undefined) {
        this.setCachedValue('brightness', brightness);
      }
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Get current color temperature
   */
  public async getColorTemperature(options: DeviceOperationOptions = {}): Promise<number | null> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.colorTemperature) {
      return null;
    }

    const cacheKey = 'color_temperature';
    
    if (options.useCache && !options.forceRefresh) {
      const cached = this.getCachedValue<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const deviceInfo = await this.getDeviceInfo();
      const colorTemp = deviceInfo.color_temp || null;
      if (colorTemp !== null) {
        this.setCachedValue(cacheKey, colorTemp);
      }
      return colorTemp;
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  // ============================================================================
  // Light Effects
  // ============================================================================

  /**
   * Set light effect
   */
  public async setLightEffect(config: LightEffectConfig, options: DeviceOperationOptions = {}): Promise<void> {
    const capabilities = this.getBulbCapabilities();
    
    if (!capabilities.effects) {
      const error = new Error(`${this.getDeviceModel()} does not support light effects`);
      if (options.throwOnUnsupported) {
        throw new ClassifiedTapoError(error, this.errorClassifier);
      }
      return;
    }

    try {
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
      
      // Update cache
      this.setCachedValue('current_effect', config);
    } catch (error) {
      throw new ClassifiedTapoError(error as Error, this.errorClassifier);
    }
  }

  /**
   * Turn off light effects
   */
  public async turnOffEffect(options: DeviceOperationOptions = {}): Promise<void> {
    await this.setLightEffect({ effect: 'off' }, options);
  }

  // ============================================================================
  // Enhanced Operations with Result Tracking
  // ============================================================================

  /**
   * Set brightness with result tracking
   */
  public async setBrightnessWithResult(brightness: number): Promise<DeviceOperationResult<void>> {
    const startTime = Date.now();
    
    try {
      await this.setBrightness(brightness);
      
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

  // ============================================================================
  // Feature Support Checking
  // ============================================================================

  public async hasColorSupport(): Promise<boolean> {
    return this.getBulbCapabilities().color;
  }

  public async hasColorTemperatureSupport(): Promise<boolean> {
    return this.getBulbCapabilities().colorTemperature;
  }

  public async hasEffectsSupport(): Promise<boolean> {
    return this.getBulbCapabilities().effects;
  }

  public async hasBrightnessSupport(): Promise<boolean> {
    return this.getBulbCapabilities().brightness;
  }
}
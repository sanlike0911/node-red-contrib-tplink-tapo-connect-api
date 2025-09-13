/**
 * Type definitions for Tapo Smart Bulbs (L510, L520, L530)
 * Single responsibility: Bulb-specific type definitions and utilities
 */

import { TapoDeviceInfo } from './base';
import { TapoDeviceType } from './device-types';

/**
 * Extended device info for smart bulbs
 */
export interface TapoBulbInfo extends TapoDeviceInfo {
  /** Current brightness level (1-100) */
  brightness: number;
  
  /** Current hue value (0-360) - only for color bulbs */
  hue?: number;
  
  /** Current saturation value (0-100) - only for color bulbs */
  saturation?: number;
  
  /** Current color temperature in Kelvin (2500-6500) - for white/color bulbs */
  color_temp?: number;
  
  /** Preferred state when turning on */
  preferred_state?: {
    brightness: number;
    hue?: number;
    saturation?: number;
    color_temp?: number;
  };
}

/**
 * HSV color representation
 */
export interface HSVColor {
  /** Hue (0-360 degrees) */
  hue: number;
  
  /** Saturation (0-100 percent) */
  saturation: number;
  
  /** Value/Brightness (1-100 percent) */
  value: number;
}

/**
 * RGB color representation
 */
export interface RGBColor {
  /** Red component (0-255) */
  red: number;
  
  /** Green component (0-255) */
  green: number;
  
  /** Blue component (0-255) */
  blue: number;
}

/**
 * Color temperature representation
 */
export interface ColorTemperature {
  /** Temperature in Kelvin (2500-6500) */
  temperature: number;
  
  /** Brightness level (1-100) */
  brightness?: number;
}

/**
 * Named colors for convenience
 */
export type NamedColor = 
  | 'red' | 'green' | 'blue' | 'yellow' | 'orange' | 'purple' 
  | 'pink' | 'cyan' | 'white' | 'warm_white' | 'cool_white';

/**
 * Light effect types
 */
export type LightEffect = 
  | 'off'           // No effect
  | 'aurora'        // Aurora effect
  | 'bubbling'      // Bubbling effect
  | 'candlelight'   // Candle light effect
  | 'disco'         // Disco effect
  | 'flicker'       // Flicker effect
  | 'grandmas_colors' // Grandma's colors
  | 'hanukkah'      // Hanukkah effect
  | 'haunted_mansion' // Haunted mansion
  | 'holiday'       // Holiday effect
  | 'icicle'        // Icicle effect
  | 'lightning'     // Lightning effect
  | 'ocean'         // Ocean effect
  | 'rainbow'       // Rainbow effect
  | 'spring'        // Spring effect
  | 'sunset'        // Sunset effect;

/**
 * Light effect configuration
 */
export interface LightEffectConfig {
  /** Effect type */
  effect: LightEffect;
  
  /** Effect speed (1-10, where 1 is slowest) */
  speed?: number;
  
  /** Effect brightness (1-100) */
  brightness?: number;
  
  /** Custom colors for the effect (if supported) */
  colors?: HSVColor[];
}

/**
 * Bulb capabilities by model
 */
export interface BulbCapabilities {
  /** Supports brightness control */
  brightness: boolean;
  
  /** Supports color control (HSV) */
  color: boolean;
  
  /** Supports color temperature control */
  colorTemperature: boolean;
  
  /** Supports light effects */
  effects: boolean;
  
  /** Minimum brightness level */
  minBrightness: number;
  
  /** Maximum brightness level */
  maxBrightness: number;
  
  /** Minimum color temperature in Kelvin */
  minColorTemp?: number;
  
  /** Maximum color temperature in Kelvin */
  maxColorTemp?: number;
}

/**
 * Common capability configurations for bulb types
 */
const DIMMABLE_BULB_CAPABILITIES: BulbCapabilities = {
  brightness: true,
  color: false,
  colorTemperature: false,
  effects: false,
  minBrightness: 1,
  maxBrightness: 100
};

const COLOR_TEMP_BULB_CAPABILITIES: BulbCapabilities = {
  brightness: true,
  color: false,
  colorTemperature: true,
  effects: false,
  minBrightness: 1,
  maxBrightness: 100,
  minColorTemp: 2500,
  maxColorTemp: 6500
};

const FULL_COLOR_BULB_CAPABILITIES: BulbCapabilities = {
  brightness: true,
  color: true,
  colorTemperature: true,
  effects: true,
  minBrightness: 1,
  maxBrightness: 100,
  minColorTemp: 2500,
  maxColorTemp: 6500
};

/**
 * Device capabilities by model
 */
export const BULB_CAPABILITIES: Record<string, BulbCapabilities> = {
  'L510': DIMMABLE_BULB_CAPABILITIES,
  'L520': COLOR_TEMP_BULB_CAPABILITIES,
  'L530': FULL_COLOR_BULB_CAPABILITIES,
  'L535': FULL_COLOR_BULB_CAPABILITIES
};

/**
 * Check if device supports brightness control (all bulb types)
 */
export function supportsBrightnessControl(deviceType: TapoDeviceType): boolean {
  const bulbTypes: TapoDeviceType[] = ['L510', 'L520', 'L530', 'L535'];
  return bulbTypes.includes(deviceType);
}

/**
 * Check if device supports color control (L530, L535)
 */
export function supportsColorControl(deviceType: TapoDeviceType): boolean {
  return deviceType === 'L530' || deviceType === 'L535';
}

/**
 * Check if device supports color temperature control
 */
export function supportsColorTemperature(deviceType: TapoDeviceType): boolean {
  const colorTempTypes: TapoDeviceType[] = ['L520', 'L530', 'L535'];
  return colorTempTypes.includes(deviceType);
}

/**
 * Check if device supports light effects
 */
export function supportsLightEffects(deviceType: TapoDeviceType): boolean {
  const effectTypes: TapoDeviceType[] = ['L530', 'L535'];
  return effectTypes.includes(deviceType);
}

/**
 * Predefined named colors in HSV format
 */
export const NAMED_COLORS: Record<NamedColor, HSVColor> = {
  red: { hue: 0, saturation: 100, value: 100 },
  green: { hue: 120, saturation: 100, value: 100 },
  blue: { hue: 240, saturation: 100, value: 100 },
  yellow: { hue: 60, saturation: 100, value: 100 },
  orange: { hue: 30, saturation: 100, value: 100 },
  purple: { hue: 270, saturation: 100, value: 100 },
  pink: { hue: 300, saturation: 100, value: 100 },
  cyan: { hue: 180, saturation: 100, value: 100 },
  white: { hue: 0, saturation: 0, value: 100 },
  warm_white: { hue: 30, saturation: 20, value: 100 },
  cool_white: { hue: 240, saturation: 10, value: 100 }
};

/**
 * Color conversion utilities
 */
export class ColorUtils {
  /**
   * Convert RGB to HSV
   */
  static rgbToHsv(rgb: RGBColor): HSVColor {
    const r = rgb.red / 255;
    const g = rgb.green / 255;
    const b = rgb.blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let hue = 0;
    if (diff !== 0) {
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    const saturation = max === 0 ? 0 : Math.round((diff / max) * 100);
    const value = Math.round(max * 100);

    return { hue, saturation, value };
  }

  /**
   * Convert HSV to RGB
   */
  static hsvToRgb(hsv: HSVColor): RGBColor {
    const h = hsv.hue / 60;
    const s = hsv.saturation / 100;
    const v = hsv.value / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1) {
      r = c; g = x; b = 0;
    } else if (1 <= h && h < 2) {
      r = x; g = c; b = 0;
    } else if (2 <= h && h < 3) {
      r = 0; g = c; b = x;
    } else if (3 <= h && h < 4) {
      r = 0; g = x; b = c;
    } else if (4 <= h && h < 5) {
      r = x; g = 0; b = c;
    } else if (5 <= h && h < 6) {
      r = c; g = 0; b = x;
    }

    return {
      red: Math.round((r + m) * 255),
      green: Math.round((g + m) * 255),
      blue: Math.round((b + m) * 255)
    };
  }

  /**
   * Get named color HSV values
   */
  static getNamedColor(color: NamedColor): HSVColor {
    return NAMED_COLORS[color];
  }

  /**
   * Validate HSV values
   */
  static validateHSV(hsv: HSVColor): void {
    if (hsv.hue < 0 || hsv.hue > 360) {
      throw new Error(`Invalid hue value: ${hsv.hue}. Must be between 0-360.`);
    }
    if (hsv.saturation < 0 || hsv.saturation > 100) {
      throw new Error(`Invalid saturation value: ${hsv.saturation}. Must be between 0-100.`);
    }
    if (hsv.value < 1 || hsv.value > 100) {
      throw new Error(`Invalid value/brightness: ${hsv.value}. Must be between 1-100.`);
    }
  }

  /**
   * Validate color temperature
   */
  static validateColorTemperature(temp: number): void {
    if (temp < 2500 || temp > 6500) {
      throw new Error(`Invalid color temperature: ${temp}K. Must be between 2500-6500K.`);
    }
  }
}
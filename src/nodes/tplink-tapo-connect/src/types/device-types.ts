/**
 * Common device type definitions for all Tapo devices
 * Single responsibility: Device type classification and categorization
 */

/**
 * Tapo device categories
 */
export type TapoDeviceCategory = 'PLUG' | 'BULB' | 'HUB' | 'UNKNOWN';

/**
 * Supported Tapo device types
 */
export type TapoDeviceType = 'P100' | 'P105' | 'P110' | 'P110M' | 'P115' | 'P300' | 'P304' | 'TP15' | 'L510' | 'L520' | 'L530' | 'L535' | 'L610' | 'L900' | 'L920' | 'L930' | 'H100' | 'UNKNOWN';

/**
 * Device type to category mapping
 */
export const deviceTypeToCategory: Record<TapoDeviceType, TapoDeviceCategory> = {
  P100: 'PLUG',
  P105: 'PLUG',
  P110: 'PLUG',
  P110M: 'PLUG',
  P115: 'PLUG',
  P300: 'PLUG',
  P304: 'PLUG',
  TP15: 'PLUG',
  L510: 'BULB',
  L520: 'BULB',
  L530: 'BULB',
  L535: 'BULB',
  L610: 'BULB',
  L900: 'BULB',
  L920: 'BULB',
  L930: 'BULB',
  H100: 'HUB',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Device models that support energy monitoring
 */
export const energyMonitoringModels: TapoDeviceType[] = ['P110', 'P110M', 'P115'];

/**
 * Get device category from device type
 */
export function getDeviceCategory(deviceType: TapoDeviceType): TapoDeviceCategory {
  return deviceTypeToCategory[deviceType];
}

// Note: supportsBrightnessControl and supportsColorControl are implemented in bulb.ts
// for device-specific logic and maintained here for backward compatibility if needed

/**
 * Check if device supports energy monitoring
 */
export function supportsEnergyMonitoring(deviceType: TapoDeviceType): boolean {
  return energyMonitoringModels.includes(deviceType);
}

/**
 * Get all device types by category
 */
export function getDeviceTypesByCategory(category: TapoDeviceCategory): TapoDeviceType[] {
  return Object.entries(deviceTypeToCategory)
    .filter(([_, deviceCategory]) => deviceCategory === category)
    .map(([deviceType, _]) => deviceType as TapoDeviceType);
}

/**
 * Check if device type is known/supported
 */
export function isKnownDeviceType(deviceType: string): deviceType is TapoDeviceType {
  return Object.keys(deviceTypeToCategory).includes(deviceType);
}
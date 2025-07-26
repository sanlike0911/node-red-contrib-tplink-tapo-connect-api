import { TapoDeviceInfo } from './base';

export const energyMonitoringModels = ['P110', 'P115', 'KP115', 'KP125'];
export const nonEnergyMonitoringModels = ['P100', 'P105', 'KP105'];

export interface PlugDeviceInfo extends TapoDeviceInfo {
  auto_off_remain_time: number;
  auto_off_status: 'on' | 'off';
  avatar: string;
  default_states: {
    type: string;
    state: Record<string, unknown>;
  };
  device_id: string;
  device_on: boolean;
  fw_id: string;
  fw_ver: string;
  has_set_location_info: boolean;
  hw_id: string;
  hw_ver: string;
  ip: string;
  lang: string;
  latitude: number;
  location: string;
  longitude: number;
  mac: string;
  model: string;
  nickname: string;
  oem_id: string;
  on_time: number;
  overheated: boolean;

  // Computed properties for backward compatibility
  deviceId: string;
  deviceOn: boolean;
  onTime: number;
  fwVer: string;
  hwVer: string;
}

export interface PlugUsageInfo {
  todayRuntime: number;
  monthRuntime: number;
  todayEnergy: number;
  monthEnergy: number;
  currentPower: number;
  onTime?: number;
}

// Type aliases for specific plug models
export type P105DeviceInfo = PlugDeviceInfo;
export type P105UsageInfo = PlugUsageInfo;

export interface HubDeviceInfo extends TapoDeviceInfo {
  deviceType: 'SMART.TAPOHUB';
  model: 'H100';
  childDevices: string[];
}

export interface ChildDeviceListResponse {
  device_list: Array<{
    device_id: string;
    nickname: string;
    model: string;
    category: string;
    status: 'online' | 'offline';
    battery_percentage?: number;
    last_activity?: string;
  }>;
}
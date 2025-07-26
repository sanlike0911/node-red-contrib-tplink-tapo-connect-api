export interface TapoCredentials {
  username: string;
  password: string;
}

export interface TapoDeviceInfo {
  device_id: string;
  fw_ver: string;
  hw_ver: string;
  type: string;
  model: string;
  mac: string;
  hw_id: string;
  fw_id: string;
  oem_id: string;
  specs: string;
  device_on: boolean;
  on_time: number;
  overheated: boolean;
  nickname: string;
  location: string;
  avatar: string;
  longitude: number;
  latitude: number;
  has_set_location_info: boolean;
  ip: string;
  ssid?: string;  // Optional as not all devices may have WiFi info
  signal_level: number;
  rssi: number;
  region: string;
  time_diff: number;
  lang: string;
  default_states: {
    type: string;
    state: Record<string, unknown>;
  };
  auto_off_status: string;
  auto_off_remain_time: number;
}

// Helper functions for backward compatibility
export function getDeviceId(deviceInfo: TapoDeviceInfo): string {
  return deviceInfo.device_id;
}

export function getDeviceType(deviceInfo: TapoDeviceInfo): string {
  return deviceInfo.type;
}

export function getFwVer(deviceInfo: TapoDeviceInfo): string {
  return deviceInfo.fw_ver;
}

export function getHwVer(deviceInfo: TapoDeviceInfo): string {
  return deviceInfo.hw_ver;
}

export function getOnTime(deviceInfo: TapoDeviceInfo): number {
  return deviceInfo.on_time;
}

export function getSignalLevel(deviceInfo: TapoDeviceInfo): number {
  return deviceInfo.signal_level;
}

export interface TapoApiRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface TapoApiResponse<T = unknown> {
  error_code: number;
  result: T;
  msg?: string;
}

export interface TapoHandshakeResponse {
  key: string;
  session: string;
}

export interface TapoError extends Error {
  errorCode: number;
  message: string;
}

export class FeatureNotSupportedError extends Error {
  override readonly name = 'FeatureNotSupportedError';
  readonly feature: string;
  readonly deviceModel: string;

  constructor(feature: string, deviceModel: string, message?: string) {
    super(message || `Feature '${feature}' is not supported on device model '${deviceModel}'`);
    this.feature = feature;
    this.deviceModel = deviceModel;
  }
}

export class DeviceCapabilityError extends Error {
  override readonly name = 'DeviceCapabilityError';
  readonly capability: string;
  readonly reason: string;

  constructor(capability: string, reason: string, message?: string) {
    super(message || `Device capability '${capability}' unavailable: ${reason}`);
    this.capability = capability;
    this.reason = reason;
  }
}

// Result type for better error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface DeviceMethodOptions {
  throwOnUnsupported?: boolean;
  timeout?: number;
}

export abstract class BaseTapoDevice {
  protected ip: string;
  protected credentials: TapoCredentials;
  protected sessionKey?: string;
  protected sessionId?: string;

  constructor(ip: string, credentials: TapoCredentials) {
    this.ip = ip;
    this.credentials = credentials;
  }

  abstract connect(): Promise<void>;
  abstract getDeviceInfo(): Promise<TapoDeviceInfo>;
  abstract disconnect(): Promise<void>;

  protected abstract sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>>;
}
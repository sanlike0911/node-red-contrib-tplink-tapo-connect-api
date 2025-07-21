export interface TapoCredentials {
  username: string;
  password: string;
}

export interface TapoDeviceInfo {
  deviceId: string;
  nickname: string;
  model: string;
  deviceType: string;
  fwVer: string;
  hwVer: string;
  mac: string;
  type: string;
  region: string;
  specs: string;
  lang: string;
  deviceOn: boolean;
  onTime: number;
  rssi: number;
  signalLevel: number;
  latitude?: number;
  longitude?: number;
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
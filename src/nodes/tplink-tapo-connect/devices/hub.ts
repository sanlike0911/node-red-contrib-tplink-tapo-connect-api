import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse, HubDeviceInfo, ChildDeviceListResponse } from '../types';
import { TapoAuth } from '../core';

export class TapoHub extends BaseTapoDevice {
  private auth: TapoAuth;

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
    this.auth = new TapoAuth(ip, credentials);
  }

  public async connect(): Promise<void> {
    await this.auth.authenticate();
  }

  public async disconnect(): Promise<void> {
    this.auth.clearSession();
  }

  public async getDeviceInfo(): Promise<HubDeviceInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };

    const response = await this.sendRequest<HubDeviceInfo>(request);
    return response.result;
  }

  public async getChildDeviceList(): Promise<ChildDeviceListResponse> {
    const request: TapoApiRequest = {
      method: 'get_child_device_list'
    };

    const response = await this.sendRequest<ChildDeviceListResponse>(request);
    return response.result;
  }

  public async getChildDeviceComponentList(): Promise<unknown> {
    const request: TapoApiRequest = {
      method: 'get_child_device_component_list'
    };

    const response = await this.sendRequest<unknown>(request);
    return response.result;
  }

  public async controlChildDevice(deviceId: string, request: TapoApiRequest): Promise<unknown> {
    const controlRequest: TapoApiRequest = {
      method: 'control_child',
      params: {
        device_id: deviceId,
        requestData: request
      }
    };

    const response = await this.sendRequest<unknown>(controlRequest);
    return response.result;
  }

  protected async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Hub not connected. Call connect() first.');
    }

    const result = await this.auth.secureRequest<T>(request);
    return {
      error_code: 0,
      result
    };
  }
}
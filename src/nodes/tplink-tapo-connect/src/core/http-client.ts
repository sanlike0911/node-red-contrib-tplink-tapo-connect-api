import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TapoApiRequest, TapoApiResponse, TapoError } from '../types';

export class TapoHttpClient {
  private httpClient: AxiosInstance;
  private baseUrl: string;

  constructor(ip: string, timeout: number = 10000) {
    this.baseUrl = `http://${ip}`;
    
    // Use shorter timeout in test environment
    const effectiveTimeout = process.env['TAPO_CONNECTION_TIMEOUT'] 
      ? parseInt(process.env['TAPO_CONNECTION_TIMEOUT']) 
      : timeout;
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: effectiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tapo TypeScript Client'
      },
      validateStatus: (status) => status < 500
    });
  }

  public async post<T>(
    endpoint: string, 
    data: TapoApiRequest,
    headers?: Record<string, string>
  ): Promise<TapoApiResponse<T>> {
    try {
      const response: AxiosResponse<TapoApiResponse<T>> = await this.httpClient.post(
        endpoint,
        data,
        headers ? { headers } : undefined
      );

      if (!response.data) {
        throw this.createTapoError(-1, 'Received empty response from device');
      }

      if (response.data.error_code !== 0) {
        throw this.createTapoError(response.data.error_code, response.data.msg);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && 'errorCode' in error) {
        throw error;
      }
      
      throw this.createTapoError(-1, `HTTP request failed: ${error}`);
    }
  }

  public async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpClient.get(
        endpoint,
        headers ? { headers } : undefined
      );

      return response.data;
    } catch (error) {
      throw this.createTapoError(-1, `HTTP GET request failed: ${error}`);
    }
  }

  private createTapoError(errorCode: number, message?: string): TapoError {
    const error = new Error(message || `Tapo API error: ${errorCode}`) as TapoError;
    error.errorCode = errorCode;
    error.name = 'TapoError';
    return error;
  }

  public setBaseUrl(ip: string): void {
    this.baseUrl = `http://${ip}`;
    this.httpClient.defaults.baseURL = this.baseUrl;
  }

  public setTimeout(timeout: number): void {
    this.httpClient.defaults.timeout = timeout;
  }
}
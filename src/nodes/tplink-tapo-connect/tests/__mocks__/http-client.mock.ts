import { TapoApiRequest, TapoApiResponse } from '../../src/types';

export class MockTapoHttpClient {
  private mockResponses: Map<string, any> = new Map();
  private shouldThrow: boolean = false;
  private errorToThrow: Error | null = null;

  constructor(ip: string, timeout: number = 10000) {
    // Mock constructor - no actual HTTP client creation
  }

  // Mock methods for controlling test behavior
  setMockResponse(method: string, url: string, response: any): void {
    this.mockResponses.set(`${method}:${url}`, response);
  }

  setShouldThrow(error: Error): void {
    this.shouldThrow = true;
    this.errorToThrow = error;
  }

  clearMocks(): void {
    this.mockResponses.clear();
    this.shouldThrow = false;
    this.errorToThrow = null;
  }

  async post(endpoint: string, data: TapoApiRequest): Promise<TapoApiResponse> {
    if (this.shouldThrow && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const key = `POST:${endpoint}`;
    const mockResponse = this.mockResponses.get(key);
    
    if (mockResponse) {
      return mockResponse;
    }

    // Default successful response
    return {
      error_code: 0,
      result: {},
      msg: 'Success'
    };
  }

  async get(endpoint: string): Promise<any> {
    if (this.shouldThrow && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const key = `GET:${endpoint}`;
    const mockResponse = this.mockResponses.get(key);
    
    if (mockResponse) {
      return mockResponse;
    }

    return { data: {} };
  }
}
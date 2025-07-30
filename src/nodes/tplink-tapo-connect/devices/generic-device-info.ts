/**
 * Generic Device Info Retriever
 * Lightweight class for getting device information from any Tapo device
 * without needing to know the specific device type
 */

import { BaseTapoDevice, TapoCredentials, TapoApiRequest, TapoApiResponse, TapoDeviceInfo } from '../types';
import { TapoAuth } from '../core/auth';
import { KlapAuth } from '../core/klap-auth';

export class GenericDeviceInfoRetriever extends BaseTapoDevice {
  private auth: TapoAuth;
  private klapAuth: KlapAuth;
  private useKlap: boolean = false;

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
    this.auth = new TapoAuth(ip, credentials);
    this.klapAuth = new KlapAuth(ip, credentials);
  }

  /**
   * Connect to the device using either KLAP or Secure Passthrough
   */
  public async connect(): Promise<void> {
    console.log(`GenericDeviceInfoRetriever.connect() called for ${this.ip}`);
    
    const maxRetries = 2;
    let klapError: Error | undefined;
    let securePassthroughError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Connection attempt ${attempt}/${maxRetries}`);
      
      // Try KLAP first (modern devices support KLAP V2)
      try {
        console.log('Trying KLAP authentication...');
        await this.klapAuth.authenticate();
        this.useKlap = true;
        console.log('KLAP authentication successful');
        return;
      } catch (error) {
        klapError = error as Error;
        console.log('KLAP failed:', error);
        
        // Check if it's a -1010 error and provide helpful message
        if (error instanceof Error && error.message.includes('-1010')) {
          console.log('Note: Error -1010 indicates authentication issues. Consider checking credentials or device settings.');
        }
      }

      // If KLAP fails, try Secure Passthrough (older devices)
      if (!this.useKlap) {
        try {
          console.log('Trying Secure Passthrough authentication...');
          await this.auth.authenticate();
          this.useKlap = false;
          console.log('Secure Passthrough authentication successful');
          return;
        } catch (error) {
          securePassthroughError = error as Error;
          console.log('Secure Passthrough failed:', error);
          
          // Provide specific guidance for -1010 errors
          if (error instanceof Error && error.message.includes('-1010')) {
            console.log('Error -1010 troubleshooting suggestions:');
            console.log('- Verify username/password in Tapo app');
            console.log('- Check if device supports remote access');
            console.log('- Ensure device is online and reachable');
          }
        }
      }

      // If both protocols fail, wait before retry
      if (attempt < maxRetries) {
        console.log('Both protocols failed, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // If all attempts fail, throw error
    throw new Error(
      `Failed to authenticate with device ${this.ip} after ${maxRetries} attempts. ` +
      `KLAP: ${klapError?.message}, Secure Passthrough: ${securePassthroughError?.message}`
    );
  }

  /**
   * Get device information - works for all device types
   */
  public async getDeviceInfo(): Promise<TapoDeviceInfo> {
    const request: TapoApiRequest = {
      method: 'get_device_info'
    };
    const response = await this.sendRequest<TapoDeviceInfo>(request);
    console.log(`Device info retrieved for ${this.ip}: model=${response.result.model}, deviceType=${response.result.type}`);
    return response.result;
  }

  /**
   * Disconnect and cleanup session
   */
  public async disconnect(): Promise<void> {
    console.log(`GenericDeviceInfoRetriever.disconnect() called for ${this.ip}`);
    
    // Clean up session data
    delete (this as any).sessionKey;
    delete (this as any).sessionId;
    
    // Note: We don't need to send explicit disconnect requests for info retrieval
    // The session will naturally expire
  }

  /**
   * Send request using the appropriate protocol
   */
  protected async sendRequest<T>(request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    if (this.useKlap) {
      // Use KLAP protocol - need to wrap result in TapoApiResponse format
      const result = await this.klapAuth.secureRequest<T>(request);
      return {
        error_code: 0,
        result: result
      };
    } else {
      // Use Secure Passthrough protocol - need to wrap result in TapoApiResponse format
      const result = await this.auth.secureRequest<T>(request);
      return {
        error_code: 0,
        result: result
      };
    }
  }

  /**
   * Check if device is authenticated
   */
  public isAuthenticated(): boolean {
    if (this.useKlap) {
      return this.klapAuth.isAuthenticated();
    } else {
      return this.auth.isAuthenticated();
    }
  }
}
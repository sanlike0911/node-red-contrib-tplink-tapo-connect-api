import { P105Plug } from './p105-plug';
import { TapoCredentials } from '../../types';

/**
 * P100 Smart Plug - Basic plug without energy monitoring
 * Inherits all functionality from P105Plug as they share the same feature set
 */
export class P100Plug extends P105Plug {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Connect to the P100 device
   */
  public override async connect(): Promise<void> {
    console.log('P100Plug.connect() called');
    await super.connect();
  }

  /**
   * Check if the device supports energy monitoring features
   * P100 does not support energy monitoring
   */
  public override async hasEnergyMonitoring(): Promise<boolean> {
    return false;
  }
}
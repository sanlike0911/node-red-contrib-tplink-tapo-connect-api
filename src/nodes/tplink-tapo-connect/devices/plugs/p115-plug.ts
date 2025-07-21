import { P110Plug } from './p110-plug';
import { TapoCredentials } from '../../types';

/**
 * P115 Smart Plug - Enhanced plug with energy monitoring capabilities
 * Inherits all functionality from P110Plug as they share the same feature set
 */
export class P115Plug extends P110Plug {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Connect to the P115 device
   */
  public override async connect(): Promise<void> {
    console.log('P115Plug.connect() called');
    await super.connect();
  }
}
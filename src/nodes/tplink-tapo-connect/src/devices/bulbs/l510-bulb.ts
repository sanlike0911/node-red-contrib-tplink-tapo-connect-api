/**
 * Tapo L510 Smart Bulb - Dimmable white light
 */

import { BaseBulb } from './base-bulb';
import { TapoCredentials } from '../../types';

export class L510Bulb extends BaseBulb {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Get device model
   */
  protected getDeviceModel(): string {
    return 'L510';
  }
}
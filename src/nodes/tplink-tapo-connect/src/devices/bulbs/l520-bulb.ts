/**
 * Tapo L520 Smart Bulb - Tunable white light with color temperature
 */

import { BaseBulb } from './base-bulb';
import { TapoCredentials } from '../../types';

export class L520Bulb extends BaseBulb {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Get device model
   */
  protected getDeviceModel(): string {
    return 'L520';
  }
}
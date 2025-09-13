/**
 * Tapo L530 Smart Bulb - Full color with effects
 */

import { BaseBulb } from './base-bulb';
import { TapoCredentials } from '../../types';

export class L530Bulb extends BaseBulb {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Get device model
   */
  protected getDeviceModel(): string {
    return 'L530';
  }
}
/**
 * Tapo L535 Smart Bulb - Full color with effects (similar to L530)
 */

import { BaseBulb } from './base-bulb';
import { TapoCredentials } from '../../types';

export class L535Bulb extends BaseBulb {
  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  /**
   * Get device model
   */
  protected getDeviceModel(): string {
    return 'L535';
  }
}
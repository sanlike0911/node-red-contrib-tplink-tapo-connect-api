export * from './types';
export type { TapoDeviceInfo } from './wrapper/tplink-tapo-connect-wrapper';
export * from './core';
export * from './devices';

import { P100Plug, P105Plug, P110Plug } from './devices';
import { L510Bulb, L520Bulb, L530Bulb } from './devices/bulbs';
import { TapoCredentials } from './types';

export class TapoConnect {
  /**
   * Create a P100 Smart Plug instance
   * P100 is a basic smart plug without energy monitoring
   */
  public static createP100Plug(ip: string, credentials: TapoCredentials): P100Plug {
    return new P100Plug(ip, credentials);
  }

  /**
   * Create a P105 Smart Plug instance  
   * P105 is a basic smart plug without energy monitoring
   */
  public static createP105Plug(ip: string, credentials: TapoCredentials): P105Plug {
    return new P105Plug(ip, credentials);
  }

  /**
   * Create a P110 Smart Plug instance
   * P110 is a smart plug with energy monitoring capabilities
   */
  public static createP110Plug(ip: string, credentials: TapoCredentials): P110Plug {
    return new P110Plug(ip, credentials);
  }

  /**
   * Create a P115 Smart Plug instance
   * P115 is a smart plug with energy monitoring capabilities  
   */
  public static createP115Plug(ip: string, credentials: TapoCredentials): P110Plug {
    return new P110Plug(ip, credentials);
  }

  /**
   * Create an L510 Smart Bulb instance
   * L510 is a dimmable white light bulb
   */
  public static createL510Bulb(ip: string, credentials: TapoCredentials): L510Bulb {
    return new L510Bulb(ip, credentials);
  }

  /**
   * Create an L520 Smart Bulb instance
   * L520 is a tunable white light bulb with color temperature control
   */
  public static createL520Bulb(ip: string, credentials: TapoCredentials): L520Bulb {
    return new L520Bulb(ip, credentials);
  }

  /**
   * Create an L530 Smart Bulb instance
   * L530 is a full color bulb with effects support
   */
  public static createL530Bulb(ip: string, credentials: TapoCredentials): L530Bulb {
    return new L530Bulb(ip, credentials);
  }
}

export default TapoConnect;

// Wrapper exports (legacy support)
export * from './wrapper/tplink-tapo-connect-wrapper';
export type { RetryOptions } from './types/retry-options';

// Enhanced wrapper functionality is now integrated into the main wrapper

// Retry utilities for advanced users
export {
  TapoRetryHandler,
  withRetry,
  retryable,
  type RetryConfig,
  type RetryResult
} from './utils/retry-utils';
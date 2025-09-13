import { TapoDeviceInfo, TapoCredentials } from '../../src/types/base';
import { TEST_CONFIG } from '../test-config';

export class DeviceMockFactory {
  static createP100Mock() {
    return {
      turnOn: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return { success: true, data: { device_on: true } };
      }),
      
      turnOff: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return { success: true, data: { device_on: false } };
      }),
      
      getDeviceInfo: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: this.createP100DeviceInfo()
        };
      }),
      
      refreshSession: jest.fn().mockResolvedValue({ success: true }),
      
      getDeviceUsage: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: {
            time_usage: {
              today: 120,
              past7: 840,
              past30: 3600
            }
          }
        };
      })
    };
  }

  static createP105Mock() {
    const p100Mock = this.createP100Mock();
    return {
      ...p100Mock,
      getDeviceInfo: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: this.createP105DeviceInfo()
        };
      })
    };
  }

  static createP110Mock() {
    const p100Mock = this.createP100Mock();
    return {
      ...p100Mock,
      getDeviceInfo: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: this.createP110DeviceInfo()
        };
      }),
      
      getCurrentPower: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: { current_power: 15.5 }
        };
      }),
      
      getEnergyUsage: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: {
            today_runtime: 480,
            month_runtime: 14400,
            today_energy: 250,
            month_energy: 7500
          }
        };
      })
    };
  }

  static createL510Mock() {
    return {
      turnOn: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return { success: true, data: { device_on: true } };
      }),
      
      turnOff: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return { success: true, data: { device_on: false } };
      }),
      
      getDeviceInfo: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: this.createL510DeviceInfo()
        };
      }),
      
      setBrightness: jest.fn().mockImplementation(async (brightness: number) => {
        await this.simulateNetworkDelay();
        if (brightness < 1 || brightness > 100) {
          throw new Error('Brightness must be between 1 and 100');
        }
        return { success: true, data: { brightness } };
      }),
      
      refreshSession: jest.fn().mockResolvedValue({ success: true })
    };
  }

  static createL530Mock() {
    const l510Mock = this.createL510Mock();
    return {
      ...l510Mock,
      
      getDeviceInfo: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return {
          success: true,
          data: this.createL530DeviceInfo()
        };
      }),
      
      setColorTemperature: jest.fn().mockImplementation(async (colorTemp: number) => {
        await this.simulateNetworkDelay();
        if (colorTemp < 2500 || colorTemp > 6500) {
          throw new Error('Color temperature must be between 2500K and 6500K');
        }
        return { success: true, data: { color_temp: colorTemp } };
      }),
      
      setColor: jest.fn().mockImplementation(async (hue: number, saturation: number) => {
        await this.simulateNetworkDelay();
        if (hue < 0 || hue > 360 || saturation < 0 || saturation > 100) {
          throw new Error('Invalid color values');
        }
        return { success: true, data: { hue, saturation } };
      }),
      
      setHueSaturation: jest.fn().mockImplementation(async (hue: number, saturation: number) => {
        await this.simulateNetworkDelay();
        return { success: true, data: { hue, saturation } };
      }),
      
      setLightEffect: jest.fn().mockImplementation(async (effect: string) => {
        await this.simulateNetworkDelay();
        const validEffects = ['Rainbow', 'Lightning', 'Ocean', 'Sunset'];
        if (!validEffects.includes(effect)) {
          throw new Error(`Invalid effect: ${effect}`);
        }
        return { success: true, data: { effect } };
      })
    };
  }

  static createAuthMock() {
    return {
      authenticate: jest.fn().mockImplementation(async (credentials: TapoCredentials) => {
        await this.simulateNetworkDelay();
        if (!credentials.username || !credentials.password) {
          throw new Error('Invalid credentials');
        }
        return { success: true, token: 'mock-auth-token' };
      }),
      
      refreshToken: jest.fn().mockImplementation(async () => {
        await this.simulateNetworkDelay();
        return { success: true, token: 'mock-refreshed-token' };
      })
    };
  }

  static createHttpClientMock() {
    return {
      post: jest.fn().mockImplementation(async (_url: string, data: any) => {
        await this.simulateNetworkDelay();
        return {
          status: 200,
          data: { error_code: 0, result: data }
        };
      }),
      
      get: jest.fn().mockImplementation(async (_url: string) => {
        await this.simulateNetworkDelay();
        return {
          status: 200,
          data: { error_code: 0, result: {} }
        };
      })
    };
  }

  private static async simulateNetworkDelay(): Promise<void> {
    if (TEST_CONFIG.MOCK_CONFIG.ENABLE_NETWORK_DELAYS) {
      const delay = TEST_CONFIG.MOCK_CONFIG.DEFAULT_DELAY;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private static createP100DeviceInfo(): TapoDeviceInfo {
    return {
      device_id: 'test-p100-device-id',
      fw_ver: '1.0.0',
      hw_ver: '1.0.0',
      type: 'SMART.TAPOPLUG',
      model: 'P100',
      mac: '00:11:22:33:44:55',
      hw_id: 'test-hw-id',
      fw_id: 'test-fw-id',
      oem_id: 'test-oem-id',
      specs: 'EU',
      device_on: true,
      on_time: 3600,
      overheated: false,
      nickname: 'Test P100 Plug',
      location: 'Test Location',
      avatar: 'plug',
      longitude: 0,
      latitude: 0,
      has_set_location_info: false,
      ip: '192.168.1.100',
      ssid: 'TestWiFi',
      signal_level: 3,
      rssi: -45,
      region: 'Europe/Berlin',
      time_diff: 60,
      lang: 'en_US',
      default_states: {
        type: 'last_states',
        state: {}
      },
      auto_off_status: 'off',
      auto_off_remain_time: 0
    };
  }

  private static createP105DeviceInfo(): TapoDeviceInfo {
    const baseInfo = this.createP100DeviceInfo();
    return {
      ...baseInfo,
      device_id: 'test-p105-device-id',
      model: 'P105',
      nickname: 'Test P105 Plug',
      ip: '192.168.1.101'
    };
  }

  private static createP110DeviceInfo(): TapoDeviceInfo {
    const baseInfo = this.createP100DeviceInfo();
    return {
      ...baseInfo,
      device_id: 'test-p110-device-id',
      model: 'P110',
      nickname: 'Test P110 Plug',
      ip: '192.168.1.102'
    };
  }

  private static createL510DeviceInfo(): TapoDeviceInfo {
    const baseInfo = this.createP100DeviceInfo();
    return {
      ...baseInfo,
      device_id: 'test-l510-device-id',
      type: 'SMART.TAPOBULB',
      model: 'L510',
      nickname: 'Test L510 Bulb',
      ip: '192.168.1.103',
      avatar: 'bulb'
    };
  }

  private static createL530DeviceInfo(): TapoDeviceInfo {
    const baseInfo = this.createL510DeviceInfo();
    return {
      ...baseInfo,
      device_id: 'test-l530-device-id',
      model: 'L530',
      nickname: 'Test L530 Color Bulb',
      ip: '192.168.1.104'
    };
  }
}
/**
 * L920/L930 Light Strip Unit Tests
 * Tests the L920 and L930 class implementation (advanced color light strips with effects)
 */

import { BaseBulb } from '../../src/devices/bulbs/base-bulb';
import { TapoCredentials } from '../../src/types';
import { HSVColor, RGBColor, LightEffectConfig } from '../../src/types/bulb';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

// L920 implementation (light strip with full features including effects)
class L920LightStrip extends BaseBulb {
  protected getDeviceModel(): string {
    return 'L920';
  }
}

// L930 implementation (light strip with full features including effects)
class L930LightStrip extends BaseBulb {
  protected getDeviceModel(): string {
    return 'L930';
  }
}

describe('L920/L930 Light Strip Unit Tests', () => {
  describe('L920 Light Strip', () => {
    let lightStrip: L920LightStrip;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      lightStrip = new L920LightStrip('192.168.1.105', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create L920LightStrip instance', () => {
        expect(lightStrip).toBeInstanceOf(L920LightStrip);
        expect(lightStrip).toBeDefined();
      });

      test('should have correct device model', () => {
        expect((lightStrip as any).getDeviceModel()).toBe('L920');
      });
    });

    describe('Device Capabilities', () => {
      test('should have full capabilities including effects', () => {
        const capabilities = lightStrip.getCapabilities();

        expect(capabilities.brightness).toBe(true);
        expect(capabilities.color).toBe(true);
        expect(capabilities.colorTemperature).toBe(true);
        expect(capabilities.effects).toBe(true);
        expect(capabilities.minBrightness).toBe(1);
        expect(capabilities.maxBrightness).toBe(100);
        expect(capabilities.minColorTemp).toBe(2500);
        expect(capabilities.maxColorTemp).toBe(6500);
      });

      test('should support all features', () => {
        expect(lightStrip.supportsFeature('brightness')).toBe(true);
        expect(lightStrip.supportsFeature('color')).toBe(true);
        expect(lightStrip.supportsFeature('colorTemperature')).toBe(true);
        expect(lightStrip.supportsFeature('effects')).toBe(true);
      });
    });

    describe('Light Effects', () => {
      test('should set light effects correctly', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const effectConfig: LightEffectConfig = {
          effect: 'rainbow',
          speed: 7,
          brightness: 80
        };

        await lightStrip.setLightEffect(effectConfig);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_lighting_effect',
          params: {
            lighting_effect: {
              name: 'rainbow',
              enable: true,
              speed: 7,
              brightness: 80
            }
          }
        });
      });

      test('should handle custom color effects', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const customColors: HSVColor[] = [
          { hue: 0, saturation: 100, value: 90 },    // Red
          { hue: 120, saturation: 100, value: 90 },  // Green
          { hue: 240, saturation: 100, value: 90 }   // Blue
        ];

        const effectConfig: LightEffectConfig = {
          effect: 'aurora',
          speed: 5,
          brightness: 70,
          colors: customColors
        };

        await lightStrip.setLightEffect(effectConfig);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_lighting_effect',
          params: {
            lighting_effect: {
              name: 'aurora',
              enable: true,
              speed: 5,
              brightness: 70,
              colors: [
                { hue: 0, saturation: 100, brightness: 90 },
                { hue: 120, saturation: 100, brightness: 90 },
                { hue: 240, saturation: 100, brightness: 90 }
              ]
            }
          }
        });
      });

      test('should turn off effects', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        await lightStrip.turnOffEffect();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_lighting_effect',
          params: {
            lighting_effect: {
              name: 'off',
              enable: false
            }
          }
        });
      });

      test('should validate effect speed bounds', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        // Test speed clamping
        await lightStrip.setLightEffect({ effect: 'disco', speed: 15 }); // Should clamp to 10
        let call = mockSendRequest.mock.calls[mockSendRequest.mock.calls.length - 1][0];
        expect(call.params.lighting_effect.speed).toBe(10);

        await lightStrip.setLightEffect({ effect: 'disco', speed: -2 }); // Should clamp to 1
        call = mockSendRequest.mock.calls[mockSendRequest.mock.calls.length - 1][0];
        expect(call.params.lighting_effect.speed).toBe(1);
      });
    });

    describe('Capability Queries', () => {
      test('should return correct capability status', async () => {
        expect(await lightStrip.hasColorSupport()).toBe(true);
        expect(await lightStrip.hasColorTemperatureSupport()).toBe(true);
        expect(await lightStrip.hasEffectsSupport()).toBe(true);
      });
    });
  });

  describe('L930 Light Strip', () => {
    let lightStrip: L930LightStrip;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      lightStrip = new L930LightStrip('192.168.1.106', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create L930LightStrip instance', () => {
        expect(lightStrip).toBeInstanceOf(L930LightStrip);
        expect(lightStrip).toBeDefined();
      });

      test('should have correct device model', () => {
        expect((lightStrip as any).getDeviceModel()).toBe('L930');
      });
    });

    describe('Device Capabilities', () => {
      test('should have same capabilities as L920', () => {
        const capabilities = lightStrip.getCapabilities();

        expect(capabilities.brightness).toBe(true);
        expect(capabilities.color).toBe(true);
        expect(capabilities.colorTemperature).toBe(true);
        expect(capabilities.effects).toBe(true);
        expect(capabilities.minBrightness).toBe(1);
        expect(capabilities.maxBrightness).toBe(100);
        expect(capabilities.minColorTemp).toBe(2500);
        expect(capabilities.maxColorTemp).toBe(6500);
      });

      test('should support all features', () => {
        expect(lightStrip.supportsFeature('brightness')).toBe(true);
        expect(lightStrip.supportsFeature('color')).toBe(true);
        expect(lightStrip.supportsFeature('colorTemperature')).toBe(true);
        expect(lightStrip.supportsFeature('effects')).toBe(true);
      });
    });

    describe('Basic Color Control', () => {
      test('should set color correctly', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const color: HSVColor = { hue: 300, saturation: 85, value: 95 };
        await lightStrip.setColor(color);

        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            hue: 300,
            saturation: 85,
            brightness: 95
          }
        });
      });

      test('should convert RGB colors', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const rgbColor: RGBColor = { red: 255, green: 255, blue: 0 }; // Yellow
        await lightStrip.setColorRGB(rgbColor);

        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            hue: 60,
            saturation: 100,
            brightness: expect.any(Number)
          }
        });
      });
    });

    describe('Advanced Light Effects', () => {
      test('should support complex effect configurations', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const effectConfig: LightEffectConfig = {
          effect: 'lightning',
          speed: 9,
          brightness: 100
        };

        await lightStrip.setLightEffect(effectConfig);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_lighting_effect',
          params: {
            lighting_effect: {
              name: 'lightning',
              enable: true,
              speed: 9,
              brightness: 100
            }
          }
        });
      });

      test('should handle holiday effects', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const effectConfig: LightEffectConfig = {
          effect: 'holiday',
          speed: 3,
          brightness: 85
        };

        await lightStrip.setLightEffect(effectConfig);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_lighting_effect',
          params: {
            lighting_effect: {
              name: 'holiday',
              enable: true,
              speed: 3,
              brightness: 85
            }
          }
        });
      });

      test('should validate effect color arrays', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (lightStrip as any).sendRequest = mockSendRequest;

        const customColors: HSVColor[] = [
          { hue: 180, saturation: 75, value: 80 },
          { hue: 270, saturation: 90, value: 85 }
        ];

        const effectConfig: LightEffectConfig = {
          effect: 'sunset',
          speed: 4,
          brightness: 75,
          colors: customColors
        };

        await lightStrip.setLightEffect(effectConfig);

        const expectedCall = mockSendRequest.mock.calls[0][0];
        expect(expectedCall.params.lighting_effect.colors).toEqual([
          { hue: 180, saturation: 75, brightness: 80 },
          { hue: 270, saturation: 90, brightness: 85 }
        ]);
      });
    });

    describe('Capability Queries', () => {
      test('should return correct capability status', async () => {
        expect(await lightStrip.hasColorSupport()).toBe(true);
        expect(await lightStrip.hasColorTemperatureSupport()).toBe(true);
        expect(await lightStrip.hasEffectsSupport()).toBe(true);
      });
    });
  });

  describe('Shared Behavior Tests', () => {
    let l920: L920LightStrip;
    let l930: L930LightStrip;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      l920 = new L920LightStrip('192.168.1.105', mockCredentials);
      l930 = new L930LightStrip('192.168.1.106', mockCredentials);
    });

    test('both models should have identical capabilities', () => {
      const l920Capabilities = l920.getCapabilities();
      const l930Capabilities = l930.getCapabilities();

      expect(l920Capabilities).toEqual(l930Capabilities);
    });

    test('both models should support same features', () => {
      expect(l920.supportsFeature('effects')).toBe(l930.supportsFeature('effects'));
      expect(l920.supportsFeature('color')).toBe(l930.supportsFeature('color'));
      expect(l920.supportsFeature('colorTemperature')).toBe(l930.supportsFeature('colorTemperature'));
      expect(l920.supportsFeature('brightness')).toBe(l930.supportsFeature('brightness'));
    });

    test('both models should handle basic controls identically', async () => {
      const mockSendRequestL920 = jest.fn().mockResolvedValue({ error_code: 0 });
      const mockSendRequestL930 = jest.fn().mockResolvedValue({ error_code: 0 });

      (l920 as any).sendRequest = mockSendRequestL920;
      (l930 as any).sendRequest = mockSendRequestL930;

      await l920.turnOn();
      await l930.turnOn();

      expect(mockSendRequestL920).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });

      expect(mockSendRequestL930).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });
    });

    test('both models should handle error conditions identically', async () => {
      const errorMessage = 'Device not connected. Call connect() first.';

      const mockSendRequestL920 = jest.fn().mockRejectedValue(new Error(errorMessage));
      const mockSendRequestL930 = jest.fn().mockRejectedValue(new Error(errorMessage));

      (l920 as any).sendRequest = mockSendRequestL920;
      (l930 as any).sendRequest = mockSendRequestL930;

      await expect(l920.turnOn()).rejects.toThrow(errorMessage);
      await expect(l930.turnOn()).rejects.toThrow(errorMessage);
    });
  });
});
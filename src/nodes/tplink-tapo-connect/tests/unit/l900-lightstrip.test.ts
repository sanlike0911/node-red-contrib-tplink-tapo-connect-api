/**
 * L900 Light Strip Unit Tests
 * Tests the L900 class implementation (basic color light strip without effects)
 */

import { BaseBulb } from '../../src/devices/bulbs/base-bulb';
import { TapoCredentials } from '../../src/types';
import { HSVColor, RGBColor } from '../../src/types/bulb';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

// L900 implementation (light strip with color support but no effects - similar to L530 but without effects)
class L900LightStrip extends BaseBulb {
  protected getDeviceModel(): string {
    return 'L900';
  }
}

describe('L900LightStrip Unit Tests', () => {
  let lightStrip: L900LightStrip;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };

    lightStrip = new L900LightStrip('192.168.1.104', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create L900LightStrip instance', () => {
      expect(lightStrip).toBeInstanceOf(L900LightStrip);
      expect(lightStrip).toBeDefined();
    });

    test('should have correct device model', () => {
      expect((lightStrip as any).getDeviceModel()).toBe('L900');
    });
  });

  describe('Device Capabilities', () => {
    test('should have color capabilities but no effects (different from L930)', () => {
      const capabilities = lightStrip.getCapabilities();

      expect(capabilities.brightness).toBe(true);
      expect(capabilities.color).toBe(true);
      expect(capabilities.colorTemperature).toBe(true);
      expect(capabilities.effects).toBe(false); // L900 does not support effects
      expect(capabilities.minBrightness).toBe(1);
      expect(capabilities.maxBrightness).toBe(100);
      expect(capabilities.minColorTemp).toBe(2500);
      expect(capabilities.maxColorTemp).toBe(6500);
    });

    test('should support color but not effects', () => {
      expect(lightStrip.supportsFeature('brightness')).toBe(true);
      expect(lightStrip.supportsFeature('color')).toBe(true);
      expect(lightStrip.supportsFeature('colorTemperature')).toBe(true);
      expect(lightStrip.supportsFeature('effects')).toBe(false);
    });
  });

  describe('Method Availability', () => {
    test('should have basic control methods', () => {
      expect(typeof lightStrip.turnOn).toBe('function');
      expect(typeof lightStrip.turnOff).toBe('function');
      expect(typeof lightStrip.toggle).toBe('function');
      expect(typeof lightStrip.on).toBe('function');
      expect(typeof lightStrip.off).toBe('function');
      expect(typeof lightStrip.isOn).toBe('function');
    });

    test('should have brightness control methods', () => {
      expect(typeof lightStrip.setBrightness).toBe('function');
      expect(typeof lightStrip.getBrightness).toBe('function');
    });

    test('should have color control methods', () => {
      expect(typeof lightStrip.setColor).toBe('function');
      expect(typeof lightStrip.setColorRGB).toBe('function');
      expect(typeof lightStrip.setNamedColor).toBe('function');
      expect(typeof lightStrip.getColor).toBe('function');
    });

    test('should have color temperature methods', () => {
      expect(typeof lightStrip.setColorTemperature).toBe('function');
      expect(typeof lightStrip.getColorTemperature).toBe('function');
    });

    test('should have light effect methods (but they should throw errors)', () => {
      expect(typeof lightStrip.setLightEffect).toBe('function');
      expect(typeof lightStrip.turnOffEffect).toBe('function');
    });
  });

  describe('Basic Controls', () => {
    test('should turn on the light strip', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.turnOn();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });
    });

    test('should turn off the light strip', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.turnOff();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: false }
      });
    });
  });

  describe('Brightness Control', () => {
    test('should set brightness within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.setBrightness(90);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { brightness: 90 }
      });
    });

    test('should validate brightness range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      // Valid brightness values
      await expect(lightStrip.setBrightness(1)).resolves.not.toThrow();
      await expect(lightStrip.setBrightness(50)).resolves.not.toThrow();
      await expect(lightStrip.setBrightness(100)).resolves.not.toThrow();

      // Invalid brightness values
      await expect(lightStrip.setBrightness(0)).rejects.toThrow();
      await expect(lightStrip.setBrightness(101)).rejects.toThrow();
      await expect(lightStrip.setBrightness(-1)).rejects.toThrow();
    });
  });

  describe('Color Control', () => {
    test('should set HSV color correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      const color: HSVColor = { hue: 240, saturation: 80, value: 70 };
      await lightStrip.setColor(color);

      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 240,
          saturation: 80,
          brightness: 70
        }
      });
    });

    test('should validate HSV color values', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      const validColor: HSVColor = { hue: 180, saturation: 75, value: 85 };
      await expect(lightStrip.setColor(validColor)).resolves.not.toThrow();

      // Invalid hue
      const invalidHue: HSVColor = { hue: 400, saturation: 50, value: 75 };
      await expect(lightStrip.setColor(invalidHue)).rejects.toThrow();

      // Invalid saturation
      const invalidSaturation: HSVColor = { hue: 180, saturation: -10, value: 75 };
      await expect(lightStrip.setColor(invalidSaturation)).rejects.toThrow();

      // Invalid value
      const invalidValue: HSVColor = { hue: 180, saturation: 50, value: 0 };
      await expect(lightStrip.setColor(invalidValue)).rejects.toThrow();
    });

    test('should convert RGB to HSV correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      const rgbColor: RGBColor = { red: 255, green: 0, blue: 255 }; // Magenta
      await lightStrip.setColorRGB(rgbColor);

      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 300,
          saturation: 100,
          brightness: expect.any(Number)
        }
      });
    });

    test('should set named colors correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.setNamedColor('green');
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 120,
          saturation: 100,
          brightness: 100
        }
      });
    });

    test('should get current color', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: {
          device_on: true,
          brightness: 80,
          hue: 60,
          saturation: 90
        }
      });
      (lightStrip as any).sendRequest = mockSendRequest;

      const color = await lightStrip.getColor();
      expect(color).toEqual({
        hue: 60,
        saturation: 90,
        value: 80
      });
    });
  });

  describe('Color Temperature Control', () => {
    test('should set color temperature within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.setColorTemperature(5500);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { color_temp: 5500 }
      });
    });

    test('should set color temperature with brightness', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      await lightStrip.setColorTemperature(3000, 75);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          color_temp: 3000,
          brightness: 75
        }
      });
    });

    test('should validate color temperature range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      // Valid color temperatures
      await expect(lightStrip.setColorTemperature(2500)).resolves.not.toThrow();
      await expect(lightStrip.setColorTemperature(4500)).resolves.not.toThrow();
      await expect(lightStrip.setColorTemperature(6500)).resolves.not.toThrow();

      // Invalid color temperatures
      await expect(lightStrip.setColorTemperature(1500)).rejects.toThrow();
      await expect(lightStrip.setColorTemperature(8000)).rejects.toThrow();
    });

    test('should get current color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: {
          device_on: true,
          brightness: 85,
          color_temp: 4000
        }
      });
      (lightStrip as any).sendRequest = mockSendRequest;

      const colorTemp = await lightStrip.getColorTemperature();
      expect(colorTemp).toBe(4000);
    });
  });

  describe('Unsupported Features - Light Effects', () => {
    test('should throw error when setting light effects', async () => {
      await expect(lightStrip.setLightEffect({ effect: 'rainbow' }))
        .rejects.toThrow('L900 does not support light effects');
    });

    test('should throw error when turning off effects', async () => {
      await expect(lightStrip.turnOffEffect())
        .rejects.toThrow('L900 does not support light effects');
    });
  });

  describe('Capability Queries', () => {
    test('should return correct capability status', async () => {
      expect(await lightStrip.hasColorSupport()).toBe(true);
      expect(await lightStrip.hasColorTemperatureSupport()).toBe(true);
      expect(await lightStrip.hasEffectsSupport()).toBe(false);
    });
  });

  describe('Device Info', () => {
    test('should get device information', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l900-device-id',
        device_on: true,
        brightness: 95,
        hue: 330,
        saturation: 85,
        color_temp: 4500,
        model: 'L900'
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (lightStrip as any).sendRequest = mockSendRequest;

      const deviceInfo = await lightStrip.getDeviceInfo();
      expect(deviceInfo).toEqual(mockDeviceInfo);

      const isOn = await lightStrip.isOn();
      expect(isOn).toBe(true);

      const brightness = await lightStrip.getBrightness();
      expect(brightness).toBe(95);

      const color = await lightStrip.getColor();
      expect(color).toEqual({
        hue: 330,
        saturation: 85,
        value: 95
      });

      const colorTemp = await lightStrip.getColorTemperature();
      expect(colorTemp).toBe(4500);
    });

    test('should handle missing color info gracefully', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l900-device-id',
        device_on: false,
        brightness: 50,
        model: 'L900'
        // No hue/saturation/color_temp
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (lightStrip as any).sendRequest = mockSendRequest;

      const color = await lightStrip.getColor();
      expect(color).toBeNull();

      const colorTemp = await lightStrip.getColorTemperature();
      expect(colorTemp).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection requirements', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Device not connected. Call connect() first.')
      );
      (lightStrip as any).sendRequest = mockSendRequest;

      await expect(lightStrip.turnOn()).rejects.toThrow('Device not connected');
      await expect(lightStrip.setColor({ hue: 180, saturation: 50, value: 75 }))
        .rejects.toThrow('Device not connected');
    });

    test('should handle network timeouts', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      (lightStrip as any).sendRequest = mockSendRequest;

      await expect(lightStrip.setColorTemperature(4000))
        .rejects.toThrow('Network timeout');
    });

    test('should validate brightness when setting color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (lightStrip as any).sendRequest = mockSendRequest;

      // Invalid brightness with color temperature
      await expect(lightStrip.setColorTemperature(4000, 0)).rejects.toThrow();
      await expect(lightStrip.setColorTemperature(4000, 101)).rejects.toThrow();
    });
  });
});
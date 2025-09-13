/**
 * L530 Smart Bulb Unit Tests
 * Tests the L530 class implementation without real device connectivity
 */

import { L530Bulb } from '../../src/devices/bulbs/l530-bulb';
import { TapoCredentials } from '../../src/types';
import { HSVColor, RGBColor, LightEffectConfig } from '../../src/types/bulb';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

describe('L530Bulb Unit Tests', () => {
  let bulb: L530Bulb;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };
    
    bulb = new L530Bulb('192.168.1.100', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create L530Bulb instance', () => {
      expect(bulb).toBeInstanceOf(L530Bulb);
      // Note: ip and credentials are protected properties, so we test via other methods
      expect(bulb).toBeDefined();
    });

    test('should have correct device model', () => {
      expect((bulb as any).getDeviceModel()).toBe('L530');
    });
  });

  describe('Device Capabilities', () => {
    test('should have full color capabilities', () => {
      const capabilities = bulb.getCapabilities();
      
      expect(capabilities.brightness).toBe(true);
      expect(capabilities.color).toBe(true);
      expect(capabilities.colorTemperature).toBe(true);
      expect(capabilities.effects).toBe(true);
      expect(capabilities.minBrightness).toBe(1);
      expect(capabilities.maxBrightness).toBe(100);
    });

    test('should support all features', () => {
      expect(bulb.supportsFeature('brightness')).toBe(true);
      expect(bulb.supportsFeature('color')).toBe(true);
      expect(bulb.supportsFeature('colorTemperature')).toBe(true);
      expect(bulb.supportsFeature('effects')).toBe(true);
    });
  });

  describe('Method Availability', () => {
    test('should have basic control methods', () => {
      expect(typeof bulb.turnOn).toBe('function');
      expect(typeof bulb.turnOff).toBe('function');
      expect(typeof bulb.toggle).toBe('function');
      expect(typeof bulb.on).toBe('function');
      expect(typeof bulb.off).toBe('function');
      expect(typeof bulb.isOn).toBe('function');
    });

    test('should have brightness control methods', () => {
      expect(typeof bulb.setBrightness).toBe('function');
      expect(typeof bulb.getBrightness).toBe('function');
    });

    test('should have color control methods', () => {
      expect(typeof bulb.setColor).toBe('function');
      expect(typeof bulb.setColorRGB).toBe('function');
      expect(typeof bulb.setNamedColor).toBe('function');
      expect(typeof bulb.getColor).toBe('function');
    });

    test('should have color temperature methods', () => {
      expect(typeof bulb.setColorTemperature).toBe('function');
      expect(typeof bulb.getColorTemperature).toBe('function');
    });

    test('should have light effect methods', () => {
      expect(typeof bulb.setLightEffect).toBe('function');
      expect(typeof bulb.turnOffEffect).toBe('function');
    });

    test('should have capability check methods', () => {
      expect(typeof bulb.hasColorSupport).toBe('function');
      expect(typeof bulb.hasColorTemperatureSupport).toBe('function');
      expect(typeof bulb.hasEffectsSupport).toBe('function');
    });
  });

  describe('Input Validation', () => {
    test('should validate brightness range', async () => {
      // Mock sendRequest to avoid actual network calls
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      // Valid brightness values
      await expect(bulb.setBrightness(1)).resolves.not.toThrow();
      await expect(bulb.setBrightness(50)).resolves.not.toThrow();
      await expect(bulb.setBrightness(100)).resolves.not.toThrow();

      // Invalid brightness values
      await expect(bulb.setBrightness(0)).rejects.toThrow();
      await expect(bulb.setBrightness(101)).rejects.toThrow();
      await expect(bulb.setBrightness(-1)).rejects.toThrow();
    });

    test('should validate HSV color values', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const validColor: HSVColor = { hue: 180, saturation: 50, value: 75 };
      await expect(bulb.setColor(validColor)).resolves.not.toThrow();

      // Invalid hue
      const invalidHue: HSVColor = { hue: 361, saturation: 50, value: 75 };
      await expect(bulb.setColor(invalidHue)).rejects.toThrow();

      // Invalid saturation
      const invalidSaturation: HSVColor = { hue: 180, saturation: 101, value: 75 };
      await expect(bulb.setColor(invalidSaturation)).rejects.toThrow();

      // Invalid value
      const invalidValue: HSVColor = { hue: 180, saturation: 50, value: 101 };
      await expect(bulb.setColor(invalidValue)).rejects.toThrow();
    });

    test('should validate color temperature range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      // Valid color temperatures
      await expect(bulb.setColorTemperature(2500)).resolves.not.toThrow();
      await expect(bulb.setColorTemperature(4000)).resolves.not.toThrow();
      await expect(bulb.setColorTemperature(6500)).resolves.not.toThrow();

      // Invalid color temperatures
      await expect(bulb.setColorTemperature(2000)).rejects.toThrow();
      await expect(bulb.setColorTemperature(7000)).rejects.toThrow();
    });
  });

  describe('Request Parameter Generation', () => {
    test('should generate correct parameters for basic controls', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.turnOn();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });

      await bulb.turnOff();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: false }
      });
    });

    test('should generate correct parameters for brightness', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setBrightness(75);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { brightness: 75 }
      });
    });

    test('should generate correct parameters for HSV color', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const color: HSVColor = { hue: 240, saturation: 80, value: 90 };
      await bulb.setColor(color);
      
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 240,
          saturation: 80,
          brightness: 90
        }
      });
    });

    test('should generate correct parameters for color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setColorTemperature(3000, 85);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          color_temp: 3000,
          brightness: 85
        }
      });
    });

    test('should generate correct parameters for light effects', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const effectConfig: LightEffectConfig = {
        effect: 'rainbow',
        speed: 5,
        brightness: 80
      };

      await bulb.setLightEffect(effectConfig);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_lighting_effect',
        params: {
          lighting_effect: {
            name: 'rainbow',
            enable: true,
            speed: 5,
            brightness: 80
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported features gracefully', async () => {
      // Mock a device without color support
      const mockGetCapabilities = jest.fn().mockReturnValue({
        brightness: true,
        color: false,
        colorTemperature: false,
        effects: false
      });
      bulb.getCapabilities = mockGetCapabilities;

      await expect(bulb.setColor({ hue: 180, saturation: 50, value: 75 }))
        .rejects.toThrow('L530 does not support color control');

      await expect(bulb.setColorTemperature(3000))
        .rejects.toThrow('L530 does not support color temperature control');

      await expect(bulb.setLightEffect({ effect: 'rainbow' }))
        .rejects.toThrow('L530 does not support light effects');
    });

    test('should handle connection requirements', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Device not connected. Call connect() first.')
      );
      (bulb as any).sendRequest = mockSendRequest;

      await expect(bulb.turnOn()).rejects.toThrow('Device not connected');
      await expect(bulb.getDeviceInfo()).rejects.toThrow('Device not connected');
    });
  });

  describe('RGB to HSV Conversion', () => {
    test('should convert RGB to HSV correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const rgbColor: RGBColor = { red: 255, green: 0, blue: 0 }; // Pure red
      await bulb.setColorRGB(rgbColor);

      // Should convert to HSV and call setColor
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 0,
          saturation: 100,
          brightness: expect.any(Number)
        }
      });
    });
  });

  describe('Capability Queries', () => {
    test('should return correct capability status', async () => {
      expect(await bulb.hasColorSupport()).toBe(true);
      expect(await bulb.hasColorTemperatureSupport()).toBe(true);
      expect(await bulb.hasEffectsSupport()).toBe(true);
    });
  });

  describe('Device Info Parsing', () => {
    test('should handle device info responses correctly', async () => {
      const mockDeviceInfo = {
        device_id: 'test-device-id',
        device_on: true,
        brightness: 75,
        hue: 180,
        saturation: 80,
        color_temp: 3000,
        model: 'L530'
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (bulb as any).sendRequest = mockSendRequest;

      const deviceInfo = await bulb.getDeviceInfo();
      expect(deviceInfo).toEqual(mockDeviceInfo);

      const color = await bulb.getColor();
      expect(color).toEqual({
        hue: 180,
        saturation: 80,
        value: 75
      });

      const brightness = await bulb.getBrightness();
      expect(brightness).toBe(75);

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBe(3000);

      const isOn = await bulb.isOn();
      expect(isOn).toBe(true);
    });
  });
});
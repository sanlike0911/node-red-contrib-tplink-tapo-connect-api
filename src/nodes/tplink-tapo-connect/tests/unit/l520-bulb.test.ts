/**
 * L520 Smart Bulb Unit Tests
 * Tests the L520 class implementation (tunable white light with color temperature)
 */

import { L520Bulb } from '../../src/devices/bulbs/l520-bulb';
import { TapoCredentials } from '../../src/types';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

describe('L520Bulb Unit Tests', () => {
  let bulb: L520Bulb;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };

    bulb = new L520Bulb('192.168.1.102', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create L520Bulb instance', () => {
      expect(bulb).toBeInstanceOf(L520Bulb);
      expect(bulb).toBeDefined();
    });

    test('should have correct device model', () => {
      expect((bulb as any).getDeviceModel()).toBe('L520');
    });
  });

  describe('Device Capabilities', () => {
    test('should have brightness and color temperature but no color', () => {
      const capabilities = bulb.getCapabilities();

      expect(capabilities.brightness).toBe(true);
      expect(capabilities.color).toBe(false);
      expect(capabilities.colorTemperature).toBe(true);
      expect(capabilities.effects).toBe(false);
      expect(capabilities.minBrightness).toBe(1);
      expect(capabilities.maxBrightness).toBe(100);
      expect(capabilities.minColorTemp).toBe(2500);
      expect(capabilities.maxColorTemp).toBe(6500);
    });

    test('should support brightness and color temperature features', () => {
      expect(bulb.supportsFeature('brightness')).toBe(true);
      expect(bulb.supportsFeature('color')).toBe(false);
      expect(bulb.supportsFeature('colorTemperature')).toBe(true);
      expect(bulb.supportsFeature('effects')).toBe(false);
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

    test('should have color temperature methods', () => {
      expect(typeof bulb.setColorTemperature).toBe('function');
      expect(typeof bulb.getColorTemperature).toBe('function');
    });

    test('should have capability check methods', () => {
      expect(typeof bulb.hasColorSupport).toBe('function');
      expect(typeof bulb.hasColorTemperatureSupport).toBe('function');
      expect(typeof bulb.hasEffectsSupport).toBe('function');
    });
  });

  describe('Basic Controls', () => {
    test('should turn on the bulb', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.turnOn();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });
    });

    test('should turn off the bulb', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.turnOff();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: false }
      });
    });
  });

  describe('Brightness Control', () => {
    test('should set brightness within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setBrightness(85);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { brightness: 85 }
      });
    });

    test('should validate brightness range', async () => {
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
  });

  describe('Color Temperature Control', () => {
    test('should set color temperature within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setColorTemperature(4000);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { color_temp: 4000 }
      });
    });

    test('should set color temperature with brightness', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setColorTemperature(3500, 90);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          color_temp: 3500,
          brightness: 90
        }
      });
    });

    test('should validate color temperature range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      // Valid color temperatures
      await expect(bulb.setColorTemperature(2500)).resolves.not.toThrow();
      await expect(bulb.setColorTemperature(4500)).resolves.not.toThrow();
      await expect(bulb.setColorTemperature(6500)).resolves.not.toThrow();

      // Invalid color temperatures
      await expect(bulb.setColorTemperature(1500)).rejects.toThrow();
      await expect(bulb.setColorTemperature(8000)).rejects.toThrow();
    });

    test('should get current color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: {
          device_on: true,
          brightness: 75,
          color_temp: 4200
        }
      });
      (bulb as any).sendRequest = mockSendRequest;

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBe(4200);
    });

    test('should return null when color temperature not available', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: {
          device_on: true,
          brightness: 75
          // No color_temp property
        }
      });
      (bulb as any).sendRequest = mockSendRequest;

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBeNull();
    });
  });

  describe('Unsupported Features', () => {
    test('should throw error when setting color', async () => {
      const color = { hue: 120, saturation: 75, value: 80 };
      await expect(bulb.setColor(color))
        .rejects.toThrow('L520 does not support color control');
    });

    test('should throw error when setting light effects', async () => {
      await expect(bulb.setLightEffect({ effect: 'rainbow' }))
        .rejects.toThrow('L520 does not support light effects');
    });

    test('should return null for color queries', async () => {
      const color = await bulb.getColor();
      expect(color).toBeNull();
    });
  });

  describe('Capability Queries', () => {
    test('should return correct capability status', async () => {
      expect(await bulb.hasColorSupport()).toBe(false);
      expect(await bulb.hasColorTemperatureSupport()).toBe(true);
      expect(await bulb.hasEffectsSupport()).toBe(false);
    });
  });

  describe('Device Info', () => {
    test('should get device information', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l520-device-id',
        device_on: true,
        brightness: 65,
        color_temp: 5000,
        model: 'L520'
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (bulb as any).sendRequest = mockSendRequest;

      const deviceInfo = await bulb.getDeviceInfo();
      expect(deviceInfo).toEqual(mockDeviceInfo);

      const isOn = await bulb.isOn();
      expect(isOn).toBe(true);

      const brightness = await bulb.getBrightness();
      expect(brightness).toBe(65);

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBe(5000);
    });
  });

  describe('Error Handling', () => {
    test('should handle connection requirements', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Device not connected. Call connect() first.')
      );
      (bulb as any).sendRequest = mockSendRequest;

      await expect(bulb.turnOn()).rejects.toThrow('Device not connected');
      await expect(bulb.setColorTemperature(4000)).rejects.toThrow('Device not connected');
    });

    test('should handle network timeouts', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      (bulb as any).sendRequest = mockSendRequest;

      await expect(bulb.setColorTemperature(4000))
        .rejects.toThrow('Network timeout');
    });

    test('should validate brightness when setting color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      // Invalid brightness with color temperature
      await expect(bulb.setColorTemperature(4000, 0)).rejects.toThrow();
      await expect(bulb.setColorTemperature(4000, 101)).rejects.toThrow();
    });
  });
});
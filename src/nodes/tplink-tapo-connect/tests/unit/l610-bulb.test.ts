/**
 * L610 Smart Bulb Unit Tests
 * Tests the L610 class implementation (dimmable white light - similar to L510)
 */

import { BaseBulb } from '../../src/devices/bulbs/base-bulb';
import { TapoCredentials } from '../../src/types';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

// L610 implementation (similar to L510 - dimmable white only)
class L610Bulb extends BaseBulb {
  protected getDeviceModel(): string {
    return 'L610';
  }
}

describe('L610Bulb Unit Tests', () => {
  let bulb: L610Bulb;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };

    bulb = new L610Bulb('192.168.1.103', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create L610Bulb instance', () => {
      expect(bulb).toBeInstanceOf(L610Bulb);
      expect(bulb).toBeDefined();
    });

    test('should have correct device model', () => {
      expect((bulb as any).getDeviceModel()).toBe('L610');
    });
  });

  describe('Device Capabilities', () => {
    test('should have brightness but no color capabilities (like L510)', () => {
      const capabilities = bulb.getCapabilities();

      // L610 should have the same capabilities as L510 (brightness only)
      expect(capabilities.brightness).toBe(true);
      expect(capabilities.color).toBe(false);
      expect(capabilities.colorTemperature).toBe(false);
      expect(capabilities.effects).toBe(false);
      expect(capabilities.minBrightness).toBe(1);
      expect(capabilities.maxBrightness).toBe(100);
    });

    test('should support only brightness feature', () => {
      expect(bulb.supportsFeature('brightness')).toBe(true);
      expect(bulb.supportsFeature('color')).toBe(false);
      expect(bulb.supportsFeature('colorTemperature')).toBe(false);
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

    test('should have color methods (but they should throw errors)', () => {
      expect(typeof bulb.setColor).toBe('function');
      expect(typeof bulb.setColorRGB).toBe('function');
      expect(typeof bulb.setNamedColor).toBe('function');
      expect(typeof bulb.getColor).toBe('function');
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

    test('should toggle the bulb state', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      const mockGetDeviceInfo = jest.fn()
        .mockResolvedValueOnce({ device_on: false })
        .mockResolvedValueOnce({ device_on: true });

      (bulb as any).sendRequest = mockSendRequest;
      bulb.getDeviceInfo = mockGetDeviceInfo;

      // First toggle: off -> on
      await bulb.toggle();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });

      // Second toggle: on -> off
      await bulb.toggle();
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

      await bulb.setBrightness(60);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { brightness: 60 }
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

    test('should get current brightness', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: { brightness: 85, device_on: true }
      });
      (bulb as any).sendRequest = mockSendRequest;

      const brightness = await bulb.getBrightness();
      expect(brightness).toBe(85);
    });
  });

  describe('Unsupported Features', () => {
    test('should throw error when setting color', async () => {
      const color = { hue: 180, saturation: 50, value: 75 };
      await expect(bulb.setColor(color))
        .rejects.toThrow('L610 does not support color control');
    });

    test('should throw error when setting color temperature', async () => {
      await expect(bulb.setColorTemperature(4000))
        .rejects.toThrow('L610 does not support color temperature control');
    });

    test('should throw error when setting light effects', async () => {
      await expect(bulb.setLightEffect({ effect: 'rainbow' }))
        .rejects.toThrow('L610 does not support light effects');
    });

    test('should return null for color queries', async () => {
      const color = await bulb.getColor();
      expect(color).toBeNull();

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBeNull();
    });
  });

  describe('Capability Queries', () => {
    test('should return correct capability status', async () => {
      expect(await bulb.hasColorSupport()).toBe(false);
      expect(await bulb.hasColorTemperatureSupport()).toBe(false);
      expect(await bulb.hasEffectsSupport()).toBe(false);
    });
  });

  describe('Device Info', () => {
    test('should get device information', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l610-device-id',
        device_on: true,
        brightness: 70,
        model: 'L610'
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
    });

    test('should handle missing brightness gracefully', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l610-device-id',
        device_on: false,
        model: 'L610'
        // No brightness property
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (bulb as any).sendRequest = mockSendRequest;

      const brightness = await bulb.getBrightness();
      expect(brightness).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle connection requirements', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Device not connected. Call connect() first.')
      );
      (bulb as any).sendRequest = mockSendRequest;

      await expect(bulb.turnOn()).rejects.toThrow('Device not connected');
      await expect(bulb.getDeviceInfo()).rejects.toThrow('Device not connected');
    });

    test('should handle network timeouts', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      (bulb as any).sendRequest = mockSendRequest;

      await expect(bulb.setBrightness(50))
        .rejects.toThrow('Network timeout');
    });
  });
});
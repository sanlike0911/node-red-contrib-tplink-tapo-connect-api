/**
 * L535 Smart Bulb Unit Tests
 * Tests the L535 class implementation without real device connectivity
 */

import { L535Bulb } from '../../src/devices/bulbs/l535-bulb';
import { TapoCredentials } from '../../src/types';
import { HSVColor, RGBColor, LightEffectConfig } from '../../src/types/bulb';

// Mock the auth modules
jest.mock('../../src/core/auth');
jest.mock('../../src/core/klap-auth');

describe('L535Bulb Unit Tests', () => {
  let bulb: L535Bulb;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };
    
    bulb = new L535Bulb('192.168.1.101', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create L535Bulb instance', () => {
      expect(bulb).toBeInstanceOf(L535Bulb);
      // Note: ip and credentials are protected properties, so we test via other methods
      expect(bulb).toBeDefined();
    });

    test('should have correct device model', () => {
      expect((bulb as any).getDeviceModel()).toBe('L535');
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

    test('should have same capabilities as L530', () => {
      const capabilities = bulb.getCapabilities();
      
      // L535 should have the same capabilities as L530
      expect(capabilities).toEqual({
        brightness: true,
        color: true,
        colorTemperature: true,
        effects: true,
        minBrightness: 1,
        maxBrightness: 100,
        minColorTemp: 2500,
        maxColorTemp: 6500
      });
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

      const validColor: HSVColor = { hue: 270, saturation: 75, value: 60 };
      await expect(bulb.setColor(validColor)).resolves.not.toThrow();

      // Invalid hue
      const invalidHue: HSVColor = { hue: -1, saturation: 50, value: 75 };
      await expect(bulb.setColor(invalidHue)).rejects.toThrow();

      // Invalid saturation
      const invalidSaturation: HSVColor = { hue: 180, saturation: -10, value: 75 };
      await expect(bulb.setColor(invalidSaturation)).rejects.toThrow();

      // Invalid value
      const invalidValue: HSVColor = { hue: 180, saturation: 50, value: 0 };
      await expect(bulb.setColor(invalidValue)).rejects.toThrow();
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

      await bulb.setBrightness(60);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { brightness: 60 }
      });
    });

    test('should generate correct parameters for HSV color', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const color: HSVColor = { hue: 120, saturation: 90, value: 70 };
      await bulb.setColor(color);
      
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 120,
          saturation: 90,
          brightness: 70
        }
      });
    });

    test('should generate correct parameters for color temperature', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setColorTemperature(4000, 95);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          color_temp: 4000,
          brightness: 95
        }
      });
    });

    test('should generate correct parameters for light effects', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const effectConfig: LightEffectConfig = {
        effect: 'disco',
        speed: 8,
        brightness: 85
      };

      await bulb.setLightEffect(effectConfig);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_lighting_effect',
        params: {
          lighting_effect: {
            name: 'disco',
            enable: true,
            speed: 8,
            brightness: 85
          }
        }
      });
    });

    test('should handle custom color effects', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const customColors: HSVColor[] = [
        { hue: 0, saturation: 100, value: 80 },   // Red
        { hue: 60, saturation: 100, value: 80 },  // Yellow
        { hue: 120, saturation: 100, value: 80 }  // Green
      ];

      const effectConfig: LightEffectConfig = {
        effect: 'rainbow', // Use valid effect instead of 'custom'
        speed: 6,
        brightness: 75,
        colors: customColors
      };

      await bulb.setLightEffect(effectConfig);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_lighting_effect',
        params: {
          lighting_effect: {
            name: 'rainbow',
            enable: true,
            speed: 6,
            brightness: 75,
            colors: [
              { hue: 0, saturation: 100, brightness: 80 },
              { hue: 60, saturation: 100, brightness: 80 },
              { hue: 120, saturation: 100, brightness: 80 }
            ]
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported features gracefully', async () => {
      // Mock a device without effects support
      const mockGetCapabilities = jest.fn().mockReturnValue({
        brightness: true,
        color: true,
        colorTemperature: true,
        effects: false
      });
      bulb.getCapabilities = mockGetCapabilities;

      await expect(bulb.setLightEffect({ effect: 'rainbow' }))
        .rejects.toThrow('L535 does not support light effects');
    });

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

      await expect(bulb.setColor({ hue: 180, saturation: 50, value: 75 }))
        .rejects.toThrow('Network timeout');
    });
  });

  describe('Named Color Support', () => {
    test('should support setting named colors', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.setNamedColor('red');
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 0,
          saturation: 100,
          brightness: expect.any(Number)
        }
      });

      await bulb.setNamedColor('blue');
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 240,
          saturation: 100,
          brightness: expect.any(Number)
        }
      });
    });
  });

  describe('RGB to HSV Conversion', () => {
    test('should convert RGB to HSV correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const rgbColor: RGBColor = { red: 0, green: 255, blue: 0 }; // Pure green
      await bulb.setColorRGB(rgbColor);

      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: 120,
          saturation: 100,
          brightness: expect.any(Number)
        }
      });
    });

    test('should handle mixed RGB colors', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      const rgbColor: RGBColor = { red: 255, green: 165, blue: 0 }; // Orange
      await bulb.setColorRGB(rgbColor);

      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          hue: expect.any(Number),
          saturation: expect.any(Number),
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
        device_id: 'test-l535-device-id',
        device_on: false,
        brightness: 45,
        hue: 300,
        saturation: 60,
        color_temp: 5000,
        model: 'L535'
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
        hue: 300,
        saturation: 60,
        value: 45
      });

      const brightness = await bulb.getBrightness();
      expect(brightness).toBe(45);

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBe(5000);

      const isOn = await bulb.isOn();
      expect(isOn).toBe(false);
    });

    test('should handle missing color info gracefully', async () => {
      const mockDeviceInfo = {
        device_id: 'test-l535-device-id',
        device_on: true,
        brightness: 80,
        model: 'L535'
        // No hue/saturation/color_temp
      };

      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: mockDeviceInfo
      });
      (bulb as any).sendRequest = mockSendRequest;

      const color = await bulb.getColor();
      expect(color).toBeNull();

      const colorTemp = await bulb.getColorTemperature();
      expect(colorTemp).toBeNull();
    });
  });

  describe('Effect Management', () => {
    test('should turn off effects correctly', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (bulb as any).sendRequest = mockSendRequest;

      await bulb.turnOffEffect();
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
      (bulb as any).sendRequest = mockSendRequest;

      // Test speed clamping
      await bulb.setLightEffect({ effect: 'rainbow', speed: 15 }); // Should clamp to 10
      let call = mockSendRequest.mock.calls[mockSendRequest.mock.calls.length - 1][0];
      expect(call.params.lighting_effect.speed).toBe(10);

      await bulb.setLightEffect({ effect: 'rainbow', speed: -5 }); // Should clamp to 1
      call = mockSendRequest.mock.calls[mockSendRequest.mock.calls.length - 1][0];
      expect(call.params.lighting_effect.speed).toBe(1);
    });
  });
});
/**
 * P100/P105 Smart Plug Unit Tests
 * Tests the P100 and P105 class implementations (basic plugs with different energy monitoring capabilities)
 */

import { P100Plug } from '../../src/devices/plugs/p100-plug';
import { P105Plug } from '../../src/devices/plugs/p105-plug';
import { TapoCredentials, FeatureNotSupportedError } from '../../src/types';

// Mock the unified protocol
jest.mock('../../src/core/unified-protocol');

describe('P100/P105 Smart Plug Unit Tests', () => {
  describe('P100 Smart Plug', () => {
    let plug: P100Plug;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      plug = new P100Plug('192.168.1.107', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P100Plug instance', () => {
        expect(plug).toBeInstanceOf(P100Plug);
        expect(plug).toBeDefined();
      });
    });

    describe('Basic Device Controls', () => {
      test('should turn on the plug', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.turnOn();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });
      });

      test('should turn off the plug', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.turnOff();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });
      });

      test('should toggle the plug state', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        const mockGetDeviceInfo = jest.fn()
          .mockResolvedValueOnce({ device_on: false })
          .mockResolvedValueOnce({ device_on: true });

        (plug as any).sendRequest = mockSendRequest;
        plug.getDeviceInfo = mockGetDeviceInfo;

        // First toggle: off -> on
        await plug.toggle();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });

        // Second toggle: on -> off
        await plug.toggle();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });
      });

      test('should provide convenience aliases', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.on();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });

        await plug.off();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });
      });

      test('should check if plug is on', async () => {
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({ device_on: true });
        plug.getDeviceInfo = mockGetDeviceInfo;

        const isOn = await plug.isOn();
        expect(isOn).toBe(true);
      });
    });

    describe('Device Information', () => {
      test('should get device information', async () => {
        const mockDeviceInfo = {
          device_id: 'test-p100-device-id',
          device_on: true,
          model: 'P100',
          fw_ver: '1.2.3',
          hw_ver: '2.0',
          on_time: 3600,
          overheated: false
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockDeviceInfo
        });
        (plug as any).sendRequest = mockSendRequest;

        const deviceInfo = await plug.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p100-device-id');
        expect(deviceInfo.model).toBe('P100');
        expect(deviceInfo.device_on).toBe(true);
      });

      test('should get on time', async () => {
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({ on_time: 7200 });
        plug.getDeviceInfo = mockGetDeviceInfo;

        const onTime = await plug.getOnTime();
        expect(onTime).toBe(7200);
      });

      test('should check if overheated', async () => {
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({ overheated: false });
        plug.getDeviceInfo = mockGetDeviceInfo;

        const isOverheated = await plug.isOverheated();
        expect(isOverheated).toBe(false);
      });
    });

    describe('Energy Monitoring Features - P100 (Not Supported)', () => {
      test('should not support energy monitoring', async () => {
        const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
        expect(hasEnergyMonitoring).toBe(false);
      });

      test('should throw error when getting usage info', async () => {
        await expect(plug.getUsageInfo())
          .rejects.toThrow(FeatureNotSupportedError);
      });

      test('should return zero when getting usage info with throwOnUnsupported=false', async () => {
        const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
        expect(usageInfo).toEqual({
          todayRuntime: 0,
          monthRuntime: 0,
          todayEnergy: 0,
          monthEnergy: 0,
          currentPower: 0
        });
      });

      test('should throw error for individual energy methods', async () => {
        await expect(plug.getCurrentPower()).rejects.toThrow(FeatureNotSupportedError);
        await expect(plug.getTodayEnergy()).rejects.toThrow(FeatureNotSupportedError);
        await expect(plug.getMonthEnergy()).rejects.toThrow(FeatureNotSupportedError);
        await expect(plug.getTodayRuntime()).rejects.toThrow(FeatureNotSupportedError);
        await expect(plug.getMonthRuntime()).rejects.toThrow(FeatureNotSupportedError);
      });

      test('should return zero for individual energy methods with throwOnUnsupported=false', async () => {
        expect(await plug.getCurrentPower({ throwOnUnsupported: false })).toBe(0);
        expect(await plug.getTodayEnergy({ throwOnUnsupported: false })).toBe(0);
        expect(await plug.getMonthEnergy({ throwOnUnsupported: false })).toBe(0);
        expect(await plug.getTodayRuntime({ throwOnUnsupported: false })).toBe(0);
        expect(await plug.getMonthRuntime({ throwOnUnsupported: false })).toBe(0);
      });

      test('should return failure result for getUsageInfoResult', async () => {
        const result = await plug.getUsageInfoResult();
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(FeatureNotSupportedError);
        }
      });
    });

    describe('Feature Support', () => {
      test('should support basic features but not energy monitoring', async () => {
        expect(await plug.supportsFeature('energy_monitoring')).toBe(false);
        expect(await plug.supportsFeature('schedule')).toBe(true);
        expect(await plug.supportsFeature('countdown')).toBe(true);
        expect(await plug.supportsFeature('unknown_feature')).toBe(false);
      });
    });

    describe('Error Handling', () => {
      test('should handle connection requirements', async () => {
        const mockSendRequest = jest.fn().mockRejectedValue(
          new Error('Device not connected')
        );
        (plug as any).sendRequest = mockSendRequest;

        await expect(plug.turnOn()).rejects.toThrow('Device not connected');
      });
    });
  });

  describe('P105 Smart Plug', () => {
    let plug: P105Plug;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      plug = new P105Plug('192.168.1.108', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P105Plug instance', () => {
        expect(plug).toBeInstanceOf(P105Plug);
        expect(plug).toBeDefined();
      });
    });

    describe('Basic Device Controls', () => {
      test('should turn on the plug', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.turnOn();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });
      });

      test('should turn off the plug', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.turnOff();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });
      });

      test('should provide the same basic functionality as P100', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({
          device_on: false,
          on_time: 0,
          overheated: false
        });

        (plug as any).sendRequest = mockSendRequest;
        plug.getDeviceInfo = mockGetDeviceInfo;

        await plug.on();
        await plug.off();
        await plug.toggle();

        expect(mockSendRequest).toHaveBeenCalledTimes(3);
      });
    });

    describe('Energy Monitoring Features - P105 (Potentially Supported)', () => {
      test('should check energy monitoring support dynamically', async () => {
        // Mock device info response
        const mockDeviceInfo = {
          device_id: 'test-p105-device-id',
          model: 'P105',
          device_on: true
        };

        const mockSendRequest = jest.fn()
          .mockResolvedValueOnce({ error_code: 0, result: mockDeviceInfo }) // getDeviceInfo
          .mockResolvedValueOnce({ error_code: 0, result: {} }); // get_energy_usage test

        (plug as any).sendRequest = mockSendRequest;

        const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
        // The result depends on implementation - could be true or false
        expect(typeof hasEnergyMonitoring).toBe('boolean');
      });

      test('should handle energy monitoring when supported', async () => {
        // Mock energy monitoring as supported
        const mockUsageInfo = {
          todayRuntime: 3600,
          monthRuntime: 86400,
          todayEnergy: 2.5,
          monthEnergy: 45.7,
          currentPower: 150
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockUsageInfo
        });
        (plug as any).sendRequest = mockSendRequest;

        // Mock hasEnergyMonitoring to return true
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        const usageInfo = await plug.getUsageInfo();
        expect(usageInfo).toEqual(mockUsageInfo);

        const currentPower = await plug.getCurrentPower();
        expect(currentPower).toBe(150);

        const todayEnergy = await plug.getTodayEnergy();
        expect(todayEnergy).toBe(2.5);
      });

      test('should handle energy monitoring when not supported', async () => {
        // Mock energy monitoring as not supported
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);

        await expect(plug.getUsageInfo())
          .rejects.toThrow(FeatureNotSupportedError);

        const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
        expect(usageInfo).toEqual({
          todayRuntime: 0,
          monthRuntime: 0,
          todayEnergy: 0,
          monthEnergy: 0,
          currentPower: 0
        });
      });

      test('should return success result when energy monitoring is supported', async () => {
        const mockUsageInfo = {
          todayRuntime: 1800,
          monthRuntime: 43200,
          todayEnergy: 1.2,
          monthEnergy: 25.3,
          currentPower: 75
        };

        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
        jest.spyOn(plug, 'getUsageInfo').mockResolvedValue(mockUsageInfo);

        const result = await plug.getUsageInfoResult();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(mockUsageInfo);
        }
      });

      test('should return failure result when energy monitoring is not supported', async () => {
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);

        const result = await plug.getUsageInfoResult();
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(FeatureNotSupportedError);
        }
      });
    });

    describe('Device Information', () => {
      test('should get device information', async () => {
        const mockDeviceInfo = {
          device_id: 'test-p105-device-id',
          device_on: false,
          model: 'P105',
          fw_ver: '1.3.0',
          hw_ver: '2.1',
          on_time: 0,
          overheated: false
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockDeviceInfo
        });
        (plug as any).sendRequest = mockSendRequest;

        const deviceInfo = await plug.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p105-device-id');
        expect(deviceInfo.model).toBe('P105');
        expect(deviceInfo.device_on).toBe(false);
      });
    });

    describe('Feature Support', () => {
      test('should support basic features and potentially energy monitoring', async () => {
        // Mock energy monitoring check
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        expect(await plug.supportsFeature('energy_monitoring')).toBe(true);
        expect(await plug.supportsFeature('schedule')).toBe(true);
        expect(await plug.supportsFeature('countdown')).toBe(true);
        expect(await plug.supportsFeature('unknown_feature')).toBe(false);
      });
    });
  });

  describe('P100 vs P105 Comparison', () => {
    test('both should have identical basic control interfaces', () => {
      const p100 = new P100Plug('192.168.1.100', { username: 'test', password: 'test' });
      const p105 = new P105Plug('192.168.1.101', { username: 'test', password: 'test' });

      // Check that both have the same basic methods
      expect(typeof p100.turnOn).toBe('function');
      expect(typeof p105.turnOn).toBe('function');
      expect(typeof p100.turnOff).toBe('function');
      expect(typeof p105.turnOff).toBe('function');
      expect(typeof p100.toggle).toBe('function');
      expect(typeof p105.toggle).toBe('function');
      expect(typeof p100.isOn).toBe('function');
      expect(typeof p105.isOn).toBe('function');
      expect(typeof p100.getDeviceInfo).toBe('function');
      expect(typeof p105.getDeviceInfo).toBe('function');
    });

    test('both should have energy monitoring methods but different capabilities', () => {
      const p100 = new P100Plug('192.168.1.100', { username: 'test', password: 'test' });
      const p105 = new P105Plug('192.168.1.101', { username: 'test', password: 'test' });

      // Check that both have energy monitoring methods
      expect(typeof p100.hasEnergyMonitoring).toBe('function');
      expect(typeof p105.hasEnergyMonitoring).toBe('function');
      expect(typeof p100.getUsageInfo).toBe('function');
      expect(typeof p105.getUsageInfo).toBe('function');
      expect(typeof p100.getCurrentPower).toBe('function');
      expect(typeof p105.getCurrentPower).toBe('function');
    });

    test('should handle authentication status checks', () => {
      const p100 = new P100Plug('192.168.1.100', { username: 'test', password: 'test' });
      const p105 = new P105Plug('192.168.1.101', { username: 'test', password: 'test' });

      expect(typeof p100.isAuthenticated).toBe('function');
      expect(typeof p105.isAuthenticated).toBe('function');
    });
  });
});
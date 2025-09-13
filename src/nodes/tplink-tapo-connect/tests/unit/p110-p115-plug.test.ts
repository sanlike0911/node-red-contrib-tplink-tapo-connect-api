/**
 * P110/P115 Smart Plug Unit Tests
 * Tests the P110 and P115 class implementations (energy monitoring plugs)
 */

import { P110Plug } from '../../src/devices/plugs/p110-plug';
import { TapoCredentials, FeatureNotSupportedError, DeviceCapabilityError } from '../../src/types';

// Mock the unified protocol
jest.mock('../../src/core/unified-protocol');

// P115 is similar to P110 with energy monitoring
class P115Plug extends P110Plug {
  // P115 is essentially the same as P110 but may have different hardware
  // In our implementation, they share the same functionality
}

describe('P110/P115 Energy Monitoring Smart Plug Unit Tests', () => {
  describe('P110 Smart Plug', () => {
    let plug: P110Plug;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      plug = new P110Plug('192.168.1.109', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P110Plug instance', () => {
        expect(plug).toBeInstanceOf(P110Plug);
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
          .mockResolvedValueOnce({ device_on: true })
          .mockResolvedValueOnce({ device_on: false });

        (plug as any).sendRequest = mockSendRequest;
        plug.getDeviceInfo = mockGetDeviceInfo;

        // First toggle: on -> off
        await plug.toggle();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });

        // Second toggle: off -> on
        await plug.toggle();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });
      });
    });

    describe('Energy Monitoring Features - P110 (Supported)', () => {
      test('should support energy monitoring', async () => {
        // Mock device info and energy monitoring support check
        const mockDeviceInfo = {
          device_id: 'test-p110-device-id',
          model: 'P110',
          device_on: true
        };

        const mockSendRequest = jest.fn()
          .mockResolvedValueOnce({ error_code: 0, result: mockDeviceInfo }) // getDeviceInfo
          .mockResolvedValueOnce({ error_code: 0, result: {} }); // get_energy_usage test

        (plug as any).sendRequest = mockSendRequest;

        const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
        expect(hasEnergyMonitoring).toBe(true);
      });

      test('should get current power consumption', async () => {
        const mockCurrentPowerResponse = { current_power: 125.5 };
        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockCurrentPowerResponse
        });

        (plug as any).sendRequest = mockSendRequest;
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        const currentPower = await plug.getCurrentPower();
        expect(currentPower).toBe(125.5);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'get_current_power'
        });
      });

      test('should get energy usage data', async () => {
        const mockEnergyUsageResponse = {
          today_runtime: 7200,
          month_runtime: 216000,
          today_energy: 2.5,
          month_energy: 75.3
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockEnergyUsageResponse
        });

        (plug as any).sendRequest = mockSendRequest;

        const energyUsage = await plug.getEnergyUsage();
        expect(energyUsage).toEqual(mockEnergyUsageResponse);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'get_energy_usage'
        });
      });

      test('should get energy data with detailed statistics', async () => {
        const mockEnergyDataResponse = {
          energy_data: {
            today: 2.5,
            month: 75.3,
            year: 900.0
          }
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockEnergyDataResponse
        });

        (plug as any).sendRequest = mockSendRequest;

        const energyData = await plug.getEnergyData();
        expect(energyData).toEqual(mockEnergyDataResponse);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'get_energy_data'
        });
      });

      test('should get comprehensive usage info', async () => {
        const mockEnergyUsageResponse = {
          today_runtime: 3600,
          month_runtime: 108000,
          today_energy: 1.8,
          month_energy: 54.2
        };

        const mockCurrentPowerResponse = { current_power: 75.0 };

        const mockSendRequest = jest.fn()
          .mockResolvedValueOnce({ error_code: 0, result: mockEnergyUsageResponse }) // getEnergyUsage
          .mockResolvedValueOnce({ error_code: 0, result: mockCurrentPowerResponse }); // getCurrentPower

        (plug as any).sendRequest = mockSendRequest;
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        const usageInfo = await plug.getUsageInfo();
        expect(usageInfo).toEqual({
          todayRuntime: 3600,
          monthRuntime: 108000,
          todayEnergy: 1.8,
          monthEnergy: 54.2,
          currentPower: 75.0
        });
      });

      test('should get individual energy metrics', async () => {
        const mockUsageInfo = {
          todayRuntime: 1800,
          monthRuntime: 54000,
          todayEnergy: 0.9,
          monthEnergy: 27.1,
          currentPower: 50.0
        };

        jest.spyOn(plug, 'getUsageInfo').mockResolvedValue(mockUsageInfo);

        expect(await plug.getTodayEnergy()).toBe(0.9);
        expect(await plug.getMonthEnergy()).toBe(27.1);
        expect(await plug.getTodayRuntime()).toBe(1800);
        expect(await plug.getMonthRuntime()).toBe(54000);
      });

      test('should handle energy monitoring errors gracefully', async () => {
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);

        await expect(plug.getCurrentPower())
          .rejects.toThrow(FeatureNotSupportedError);

        // With throwOnUnsupported = false
        const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
        expect(currentPower).toBe(0);
      });

      test('should return success result for getUsageInfoResult', async () => {
        const mockUsageInfo = {
          todayRuntime: 2400,
          monthRuntime: 72000,
          todayEnergy: 1.2,
          monthEnergy: 36.0,
          currentPower: 60.0
        };

        jest.spyOn(plug, 'getUsageInfo').mockResolvedValue(mockUsageInfo);

        const result = await plug.getUsageInfoResult();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(mockUsageInfo);
        }
      });

      test('should handle API failures for energy monitoring', async () => {
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
        const mockSendRequest = jest.fn().mockRejectedValue(new Error('API Error'));
        (plug as any).sendRequest = mockSendRequest;

        await expect(plug.getCurrentPower())
          .rejects.toThrow(DeviceCapabilityError);

        // With throwOnUnsupported = false
        const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
        expect(currentPower).toBe(0);
      });
    });

    describe('Device Information', () => {
      test('should get device information', async () => {
        const mockDeviceInfo = {
          device_id: 'test-p110-device-id',
          device_on: true,
          model: 'P110',
          fw_ver: '1.4.0',
          hw_ver: '3.0',
          on_time: 1800,
          overheated: false
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockDeviceInfo
        });
        (plug as any).sendRequest = mockSendRequest;

        const deviceInfo = await plug.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p110-device-id');
        expect(deviceInfo.model).toBe('P110');
        expect(deviceInfo.device_on).toBe(true);
      });

      test('should get on time', async () => {
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({ on_time: 5400 });
        plug.getDeviceInfo = mockGetDeviceInfo;

        const onTime = await plug.getOnTime();
        expect(onTime).toBe(5400);
      });

      test('should check if overheated', async () => {
        const mockGetDeviceInfo = jest.fn().mockResolvedValue({ overheated: true });
        plug.getDeviceInfo = mockGetDeviceInfo;

        const isOverheated = await plug.isOverheated();
        expect(isOverheated).toBe(true);
      });
    });

    describe('Feature Support', () => {
      test('should support energy monitoring features', async () => {
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        expect(await plug.supportsFeature('energy_monitoring')).toBe(true);
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

        // Mock hasEnergyMonitoring to return true so we can test connection errors
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        await expect(plug.turnOn()).rejects.toThrow('Device not connected');
        await expect(plug.getCurrentPower()).rejects.toThrow('Device not connected');
      });

      test('should handle network timeouts', async () => {
        const mockSendRequest = jest.fn().mockRejectedValue(
          new Error('Network timeout')
        );
        (plug as any).sendRequest = mockSendRequest;

        await expect(plug.getEnergyUsage()).rejects.toThrow('Network timeout');
      });
    });
  });

  describe('P115 Smart Plug', () => {
    let plug: P115Plug;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      plug = new P115Plug('192.168.1.110', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P115Plug instance', () => {
        expect(plug).toBeInstanceOf(P115Plug);
        expect(plug).toBeInstanceOf(P110Plug); // P115 extends P110
        expect(plug).toBeDefined();
      });
    });

    describe('Basic Device Controls', () => {
      test('should have same functionality as P110', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (plug as any).sendRequest = mockSendRequest;

        await plug.turnOn();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: true }
        });

        await plug.turnOff();
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_on: false }
        });
      });
    });

    describe('Energy Monitoring Features - P115 (Supported)', () => {
      test('should support energy monitoring like P110', async () => {
        // Mock device info and energy monitoring support check
        const mockDeviceInfo = {
          device_id: 'test-p115-device-id',
          model: 'P115',
          device_on: true
        };

        const mockSendRequest = jest.fn()
          .mockResolvedValueOnce({ error_code: 0, result: mockDeviceInfo }) // getDeviceInfo
          .mockResolvedValueOnce({ error_code: 0, result: {} }); // get_energy_usage test

        (plug as any).sendRequest = mockSendRequest;

        const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
        expect(hasEnergyMonitoring).toBe(true);
      });

      test('should get current power like P110', async () => {
        const mockCurrentPowerResponse = { current_power: 200.0 };
        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockCurrentPowerResponse
        });

        (plug as any).sendRequest = mockSendRequest;
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        const currentPower = await plug.getCurrentPower();
        expect(currentPower).toBe(200.0);
      });

      test('should get comprehensive usage info like P110', async () => {
        const mockEnergyUsageResponse = {
          today_runtime: 14400,
          month_runtime: 432000,
          today_energy: 4.8,
          month_energy: 144.0
        };

        const mockCurrentPowerResponse = { current_power: 180.0 };

        const mockSendRequest = jest.fn()
          .mockResolvedValueOnce({ error_code: 0, result: mockEnergyUsageResponse }) // getEnergyUsage
          .mockResolvedValueOnce({ error_code: 0, result: mockCurrentPowerResponse }); // getCurrentPower

        (plug as any).sendRequest = mockSendRequest;
        jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

        const usageInfo = await plug.getUsageInfo();
        expect(usageInfo).toEqual({
          todayRuntime: 14400,
          monthRuntime: 432000,
          todayEnergy: 4.8,
          monthEnergy: 144.0,
          currentPower: 180.0
        });
      });
    });

    describe('Device Information', () => {
      test('should get device information with P115 model', async () => {
        const mockDeviceInfo = {
          device_id: 'test-p115-device-id',
          device_on: false,
          model: 'P115',
          fw_ver: '1.4.1',
          hw_ver: '3.1',
          on_time: 0,
          overheated: false
        };

        const mockSendRequest = jest.fn().mockResolvedValue({
          error_code: 0,
          result: mockDeviceInfo
        });
        (plug as any).sendRequest = mockSendRequest;

        const deviceInfo = await plug.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p115-device-id');
        expect(deviceInfo.model).toBe('P115');
        expect(deviceInfo.device_on).toBe(false);
      });
    });
  });

  describe('P110 vs P115 Comparison', () => {
    test('both should have identical interfaces', () => {
      const p110 = new P110Plug('192.168.1.110', { username: 'test', password: 'test' });
      const p115 = new P115Plug('192.168.1.115', { username: 'test', password: 'test' });

      // Check that both have the same basic methods
      expect(typeof p110.turnOn).toBe('function');
      expect(typeof p115.turnOn).toBe('function');
      expect(typeof p110.getCurrentPower).toBe('function');
      expect(typeof p115.getCurrentPower).toBe('function');
      expect(typeof p110.getEnergyUsage).toBe('function');
      expect(typeof p115.getEnergyUsage).toBe('function');
      expect(typeof p110.getEnergyData).toBe('function');
      expect(typeof p115.getEnergyData).toBe('function');
    });

    test('both should support energy monitoring', async () => {
      const p110 = new P110Plug('192.168.1.110', { username: 'test', password: 'test' });
      const p115 = new P115Plug('192.168.1.115', { username: 'test', password: 'test' });

      // Mock device info for both
      const mockDeviceInfoP110 = { device_id: 'p110', model: 'P110', device_on: true };
      const mockDeviceInfoP115 = { device_id: 'p115', model: 'P115', device_on: true };

      const mockSendRequestP110 = jest.fn()
        .mockResolvedValueOnce({ error_code: 0, result: mockDeviceInfoP110 })
        .mockResolvedValueOnce({ error_code: 0, result: {} });

      const mockSendRequestP115 = jest.fn()
        .mockResolvedValueOnce({ error_code: 0, result: mockDeviceInfoP115 })
        .mockResolvedValueOnce({ error_code: 0, result: {} });

      (p110 as any).sendRequest = mockSendRequestP110;
      (p115 as any).sendRequest = mockSendRequestP115;

      const p110HasEnergyMonitoring = await p110.hasEnergyMonitoring();
      const p115HasEnergyMonitoring = await p115.hasEnergyMonitoring();

      expect(p110HasEnergyMonitoring).toBe(true);
      expect(p115HasEnergyMonitoring).toBe(true);
    });

    test('both should handle authentication status checks', () => {
      const p110 = new P110Plug('192.168.1.110', { username: 'test', password: 'test' });
      const p115 = new P115Plug('192.168.1.115', { username: 'test', password: 'test' });

      expect(typeof p110.isAuthenticated).toBe('function');
      expect(typeof p115.isAuthenticated).toBe('function');
    });

    test('both should handle error conditions identically', async () => {
      const p110 = new P110Plug('192.168.1.110', { username: 'test', password: 'test' });
      const p115 = new P115Plug('192.168.1.115', { username: 'test', password: 'test' });

      const errorMessage = 'Device not connected';

      const mockSendRequestP110 = jest.fn().mockRejectedValue(new Error(errorMessage));
      const mockSendRequestP115 = jest.fn().mockRejectedValue(new Error(errorMessage));

      (p110 as any).sendRequest = mockSendRequestP110;
      (p115 as any).sendRequest = mockSendRequestP115;

      await expect(p110.turnOn()).rejects.toThrow(errorMessage);
      await expect(p115.turnOn()).rejects.toThrow(errorMessage);
    });
  });

  describe('Advanced Energy Monitoring Features', () => {
    let plug: P110Plug;

    beforeEach(() => {
      jest.clearAllMocks();
      plug = new P110Plug('192.168.1.109', {
        username: 'test@example.com',
        password: 'test-password'
      });
    });

    test('should handle missing current power data gracefully', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({
        error_code: 0,
        result: {} // No current_power field
      });

      (plug as any).sendRequest = mockSendRequest;
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

      const currentPower = await plug.getCurrentPower();
      expect(currentPower).toBe(0);
    });

    test('should handle missing energy usage data gracefully', async () => {
      const mockSendRequest = jest.fn()
        .mockResolvedValueOnce({ error_code: 0, result: {} }) // getEnergyUsage - empty
        .mockResolvedValueOnce({ error_code: 0, result: {} }); // getCurrentPower - empty

      (plug as any).sendRequest = mockSendRequest;
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

      const usageInfo = await plug.getUsageInfo();
      expect(usageInfo).toEqual({
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0
      });
    });

    test('should handle partial energy usage data', async () => {
      const mockEnergyUsageResponse = {
        today_runtime: 1800,
        // month_runtime missing
        today_energy: 0.75,
        month_energy: 22.5
      };

      const mockCurrentPowerResponse = { current_power: 45.0 };

      const mockSendRequest = jest.fn()
        .mockResolvedValueOnce({ error_code: 0, result: mockEnergyUsageResponse })
        .mockResolvedValueOnce({ error_code: 0, result: mockCurrentPowerResponse });

      (plug as any).sendRequest = mockSendRequest;
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);

      const usageInfo = await plug.getUsageInfo();
      expect(usageInfo).toEqual({
        todayRuntime: 1800,
        monthRuntime: 0, // Should default to 0 when missing
        todayEnergy: 0.75,
        monthEnergy: 22.5,
        currentPower: 45.0
      });
    });
  });
});
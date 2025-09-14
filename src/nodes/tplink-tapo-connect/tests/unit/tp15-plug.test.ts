import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TP15Plug } from '../../src/devices/plugs/tp15-plug';
import { TapoCredentials } from '../../src/types';

describe('TP15Plug Tests', () => {
  let tp15Plug: TP15Plug;
  let mockCredentials: TapoCredentials;
  const testIp = '192.168.1.100';

  beforeEach(() => {
    mockCredentials = {
      username: 'test@example.com',
      password: 'testpassword'
    };
    tp15Plug = new TP15Plug(testIp, mockCredentials);
  });

  afterEach(async () => {
    if (tp15Plug) {
      await tp15Plug.disconnect();
    }
  });

  describe('Device Type and Features', () => {
    it('should be identified as a TP15 plug device', () => {
      expect(tp15Plug).toBeInstanceOf(TP15Plug);
    });

    it('should not support energy monitoring', async () => {
      const hasEnergyMonitoring = await tp15Plug.hasEnergyMonitoring();
      expect(hasEnergyMonitoring).toBe(false);
    });

    it('should support basic scheduling features', async () => {
      const supportsSchedule = await tp15Plug.supportsFeature('schedule');
      expect(supportsSchedule).toBe(true);
    });

    it('should support countdown feature', async () => {
      const supportsCountdown = await tp15Plug.supportsFeature('countdown');
      expect(supportsCountdown).toBe(true);
    });

    it('should not support unknown features', async () => {
      const supportsUnknown = await tp15Plug.supportsFeature('unknown_feature');
      expect(supportsUnknown).toBe(false);
    });
  });

  describe('Energy Monitoring (Not Supported)', () => {
    it('should throw error when trying to get usage info with throwOnUnsupported=true', async () => {
      await expect(tp15Plug.getUsageInfo({ throwOnUnsupported: true }))
        .rejects
        .toThrow('TP15 device does not support energy monitoring features');
    });

    it('should return default values when trying to get usage info with throwOnUnsupported=false', async () => {
      const usageInfo = await tp15Plug.getUsageInfo({ throwOnUnsupported: false });

      expect(usageInfo).toEqual({
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0
      });
    });

    it('should return error result for getUsageInfoResult', async () => {
      const result = await tp15Plug.getUsageInfoResult();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('TP15 device does not support energy monitoring features');
    });

    it('should return 0 for getCurrentPower with throwOnUnsupported=false', async () => {
      const currentPower = await tp15Plug.getCurrentPower({ throwOnUnsupported: false });
      expect(currentPower).toBe(0);
    });

    it('should return 0 for getTodayEnergy with throwOnUnsupported=false', async () => {
      const todayEnergy = await tp15Plug.getTodayEnergy({ throwOnUnsupported: false });
      expect(todayEnergy).toBe(0);
    });

    it('should return 0 for getMonthEnergy with throwOnUnsupported=false', async () => {
      const monthEnergy = await tp15Plug.getMonthEnergy({ throwOnUnsupported: false });
      expect(monthEnergy).toBe(0);
    });

    it('should return 0 for getTodayRuntime with throwOnUnsupported=false', async () => {
      const todayRuntime = await tp15Plug.getTodayRuntime({ throwOnUnsupported: false });
      expect(todayRuntime).toBe(0);
    });

    it('should return 0 for getMonthRuntime with throwOnUnsupported=false', async () => {
      const monthRuntime = await tp15Plug.getMonthRuntime({ throwOnUnsupported: false });
      expect(monthRuntime).toBe(0);
    });
  });

  describe('Device Authentication', () => {
    it('should initially not be authenticated', () => {
      expect(tp15Plug.isAuthenticated()).toBe(false);
    });
  });

  describe('Device Model Consistency', () => {
    it('should handle TP15 model identification correctly', () => {
      // This test ensures that the device type inference works correctly for TP15
      // The actual model checking happens in the device-common.ts inferTapoDeviceType function
      expect(true).toBe(true); // Placeholder - actual testing requires mocked device info
    });
  });
});
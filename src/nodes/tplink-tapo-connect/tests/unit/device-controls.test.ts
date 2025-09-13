describe('Device Control Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Device Method Signatures', () => {
    test('should have P100 plug control methods', () => {
      const { P100Plug } = require('../../src/devices/plugs/p100-plug');
      expect(P100Plug).toBeDefined();
      expect(typeof P100Plug.prototype.on).toBe('function');
      expect(typeof P100Plug.prototype.off).toBe('function');
      expect(typeof P100Plug.prototype.getDeviceInfo).toBe('function');
    });

    test('should have L510 bulb control methods', () => {
      const { L510Bulb } = require('../../src/devices/bulbs/l510-bulb');
      expect(L510Bulb).toBeDefined();
      expect(typeof L510Bulb.prototype.setBrightness).toBe('function');
      expect(typeof L510Bulb.prototype.on).toBe('function');
      expect(typeof L510Bulb.prototype.off).toBe('function');
    });

    test('should have P110 plug energy monitoring methods', () => {
      const { P110Plug } = require('../../src/devices/plugs/p110-plug');
      expect(P110Plug).toBeDefined();
      expect(typeof P110Plug.prototype.getEnergyUsage).toBe('function');
      expect(typeof P110Plug.prototype.getCurrentPower).toBe('function');
    });
  });

  describe('Device Capability Validation', () => {
    test('should validate device capabilities structure', () => {
      const { BaseDevice } = require('../../src/devices/base-device');
      expect(BaseDevice).toBeDefined();
      expect(typeof BaseDevice.prototype.getCapabilities).toBe('function');
    });

    test('should have proper device model identification', () => {
      const { BaseDevice } = require('../../src/devices/base-device');
      expect(BaseDevice).toBeDefined();
      expect(typeof BaseDevice.prototype.getDeviceModel).toBe('function');
    });
  });

  describe('Device Type Validation', () => {
    test('should have device common utilities', () => {
      const deviceCommon = require('../../src/types/device-common');
      expect(typeof deviceCommon.inferTapoDeviceType).toBe('function');
    });

    test('should have base types available', () => {
      const baseTypes = require('../../src/types/base');
      expect(baseTypes).toBeDefined();
    });
  });
});
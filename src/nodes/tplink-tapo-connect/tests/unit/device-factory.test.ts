import { TapoConnect, TapoCredentials } from '../../src';

describe('DeviceFactory Unit Tests', () => {
  let credentials: TapoCredentials;

  beforeEach(() => {
    credentials = {
      username: 'test-user',
      password: 'test-password'
    };
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Factory Method Validation', () => {
    test('should have TapoConnect factory methods', () => {
      expect(typeof TapoConnect.createP100Plug).toBe('function');
      expect(typeof TapoConnect.createP105Plug).toBe('function');
      expect(typeof TapoConnect.createP110Plug).toBe('function');
      expect(typeof TapoConnect.createL510Bulb).toBe('function');
    });

    test('should return promises from factory methods', () => {
      const p100Promise = TapoConnect.createP100Plug('192.168.1.100', credentials);
      const l510Promise = TapoConnect.createL510Bulb('192.168.1.100', credentials);
      
      expect(p100Promise).toBeInstanceOf(Promise);
      expect(l510Promise).toBeInstanceOf(Promise);
    });
  });

  describe('Device Class Validation', () => {
    test('should have P100 plug class with required methods', () => {
      const { P100Plug } = require('../../src/devices/plugs/p100-plug');
      expect(P100Plug).toBeDefined();
      expect(P100Plug.prototype.on).toBeDefined();
      expect(P100Plug.prototype.off).toBeDefined();
    });

    test('should have L510 bulb class with required methods', () => {
      const { L510Bulb } = require('../../src/devices/bulbs/l510-bulb');
      expect(L510Bulb).toBeDefined();
      expect(L510Bulb.prototype.setBrightness).toBeDefined();
      expect(L510Bulb.prototype.on).toBeDefined();
    });

    test('should have P110 plug class with energy monitoring', () => {
      const { P110Plug } = require('../../src/devices/plugs/p110-plug');
      expect(P110Plug).toBeDefined();
      expect(P110Plug.prototype.getEnergyUsage).toBeDefined();
      expect(P110Plug.prototype.getCurrentPower).toBeDefined();
    });
  });
});
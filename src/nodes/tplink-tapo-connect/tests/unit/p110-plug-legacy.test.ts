import { TapoConnect, TapoCredentials } from '../../src';

describe('P110Plug Factory Tests', () => {
  let credentials: TapoCredentials;

  beforeAll(() => {
    credentials = {
      username: 'test-user',
      password: 'test-password'
    };
  });

  describe('Factory Method Tests', () => {
    test('should create P110 plug instance promise', () => {
      const plugPromise = TapoConnect.createP110Plug('192.168.0.110', credentials);
      expect(plugPromise).toBeInstanceOf(Promise);
    });
  });

  describe('Device Type Support', () => {
    test('should have P110 device capabilities', () => {
      // Test that P110 plug class exists and has expected methods
      const { P110Plug } = require('../../src/devices/plugs/p110-plug');
      expect(P110Plug).toBeDefined();
      
      // Check prototype methods including energy monitoring
      expect(P110Plug.prototype.on).toBeDefined();
      expect(P110Plug.prototype.off).toBeDefined();
      expect(P110Plug.prototype.getEnergyUsage).toBeDefined();
      expect(P110Plug.prototype.getCurrentPower).toBeDefined();
    });
  });
});
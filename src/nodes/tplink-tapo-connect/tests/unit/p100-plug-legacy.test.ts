import { TapoConnect, TapoCredentials } from '../../src';

describe('P100Plug Factory Tests', () => {
  let credentials: TapoCredentials;

  beforeAll(() => {
    credentials = {
      username: 'test-user',
      password: 'test-password'
    };
  });

  describe('Factory Method Tests', () => {
    test('should create P100 plug instance promise', () => {
      const plugPromise = TapoConnect.createP100Plug('192.168.0.78', credentials);
      expect(plugPromise).toBeInstanceOf(Promise);
    });
  });

  describe('Device Type Support', () => {
    test('should have P100 device capabilities', () => {
      // Test that P100 plug class exists and has expected methods
      const { P100Plug } = require('../../src/devices/plugs/p100-plug');
      expect(P100Plug).toBeDefined();
      
      // Check prototype methods
      expect(P100Plug.prototype.on).toBeDefined();
      expect(P100Plug.prototype.off).toBeDefined();
      expect(P100Plug.prototype.getDeviceInfo).toBeDefined();
    });
  });
});
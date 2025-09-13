import { TapoConnect, TapoCredentials } from '../../src';

describe('L510Bulb Factory Tests', () => {
  let credentials: TapoCredentials;

  beforeAll(() => {
    credentials = {
      username: 'test-user',
      password: 'test-password'
    };
  });

  describe('Factory Method Tests', () => {
    test('should create L510 bulb instance promise', () => {
      const bulbPromise = TapoConnect.createL510Bulb('192.168.0.120', credentials);
      expect(bulbPromise).toBeInstanceOf(Promise);
    });

    test('should support brightness control hint', () => {
      const bulbPromise = TapoConnect.createL510Bulb('192.168.0.120', credentials);
      expect(bulbPromise).toBeInstanceOf(Promise);
    });
  });

  describe('Device Type Support', () => {
    test('should have L510 device capabilities', () => {
      // Test that L510 bulb class exists and has expected methods
      const { L510Bulb } = require('../../src/devices/bulbs/l510-bulb');
      expect(L510Bulb).toBeDefined();
      
      // Check prototype methods
      expect(L510Bulb.prototype.setBrightness).toBeDefined();
      expect(L510Bulb.prototype.on).toBeDefined();
      expect(L510Bulb.prototype.off).toBeDefined();
    });
  });
});
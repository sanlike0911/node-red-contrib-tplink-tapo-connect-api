import { TapoConnect, TapoCredentials } from '../src';

describe('TapoConnect Factory Methods', () => {
  const mockCredentials: TapoCredentials = {
    username: 'test-user',
    password: 'test-password'
  };

  describe('Factory method availability', () => {
    test('should have static factory methods', () => {
      expect(typeof TapoConnect.createDevice).toBe('function');
      expect(typeof TapoConnect.createDeviceWithHint).toBe('function');
      expect(typeof TapoConnect.createP100Plug).toBe('function');
      expect(typeof TapoConnect.createP105Plug).toBe('function');
      expect(typeof TapoConnect.createP110Plug).toBe('function');
      expect(typeof TapoConnect.createL510Bulb).toBe('function');
    });

    test('should return promises from factory methods', () => {
      const p100Promise = TapoConnect.createP100Plug('192.168.1.100', mockCredentials);
      const p105Promise = TapoConnect.createP105Plug('192.168.1.100', mockCredentials);
      const p110Promise = TapoConnect.createP110Plug('192.168.1.100', mockCredentials);
      
      expect(p100Promise).toBeInstanceOf(Promise);
      expect(p105Promise).toBeInstanceOf(Promise);
      expect(p110Promise).toBeInstanceOf(Promise);
    });
  });

  describe('Protocol support', () => {
    test('should support KLAP V1/V2 protocols', () => {
      // Test that the KLAP authentication classes are available
      const { KlapAuth } = require('../src/core/klap-auth');
      const { UnifiedTapoProtocol } = require('../src/core/unified-protocol');
      
      expect(KlapAuth).toBeDefined();
      expect(UnifiedTapoProtocol).toBeDefined();
    });
  });
});

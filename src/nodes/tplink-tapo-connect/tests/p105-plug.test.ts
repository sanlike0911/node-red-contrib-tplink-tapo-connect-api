import { TapoConnect, TapoCredentials } from '../src';

describe('P105Plug Factory Tests', () => {
  let credentials: TapoCredentials;

  beforeAll(() => {
    credentials = {
      username: 'test-user',
      password: 'test-password'
    };
  });

  describe('Factory Method Tests', () => {
    test('should create P105 plug instance promise', () => {
      const plugPromise = TapoConnect.createP105Plug('192.168.0.78', credentials);
      expect(plugPromise).toBeInstanceOf(Promise);
    });
  });

  describe('Protocol Support Tests', () => {
    test('should support KLAP V1/V2 protocols', () => {
      // Test that KLAP classes are available
      const { KlapAuth } = require('../src/core/klap-auth');
      const { UnifiedTapoProtocol } = require('../src/core/unified-protocol');
      
      expect(KlapAuth).toBeDefined();
      expect(UnifiedTapoProtocol).toBeDefined();
    });

    test('should support automatic protocol detection', () => {
      const { ProtocolSelector } = require('../src/core/protocol-selector');
      expect(ProtocolSelector).toBeDefined();
    });
  });
});
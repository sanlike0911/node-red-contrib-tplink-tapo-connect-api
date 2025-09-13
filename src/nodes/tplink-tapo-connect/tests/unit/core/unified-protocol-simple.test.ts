import { UnifiedTapoProtocol } from '../../../src/core/unified-protocol';
import { TEST_CREDENTIALS } from '../../test-config';

// Mock dependencies
jest.mock('../../../src/core/klap-auth');
jest.mock('../../../src/core/auth');

describe('UnifiedTapoProtocol Basic Tests', () => {
  let protocol: UnifiedTapoProtocol;

  beforeEach(() => {
    protocol = new UnifiedTapoProtocol('192.168.1.100', TEST_CREDENTIALS);
  });

  describe('Initialization', () => {
    test('should create instance', () => {
      expect(protocol).toBeDefined();
      expect(protocol).toBeInstanceOf(UnifiedTapoProtocol);
    });

    test('should have protocol info method', () => {
      const info = protocol.getProtocolInfo();
      expect(info).toHaveProperty('protocol');
      expect(info.protocol).toBeNull(); // Not connected yet
    });

    test('should have connection status method', () => {
      const connected = protocol.isConnected();
      expect(typeof connected).toBe('boolean');
      expect(connected).toBe(false); // Not connected yet
    });
  });

  describe('Mock Tests', () => {
    test('should handle mocked operations', async () => {
      // Mock the internal methods to avoid actual network calls
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockExecuteRequest = jest.fn().mockResolvedValue({ error_code: 0, result: {} });
      
      protocol.connect = mockConnect;
      protocol.executeRequest = mockExecuteRequest as any;

      await protocol.connect();
      expect(mockConnect).toHaveBeenCalled();

      const request = { method: 'get_device_info' };
      const result = await protocol.executeRequest(request);
      expect(mockExecuteRequest).toHaveBeenCalledWith(request);
      expect((result as any).error_code).toBe(0);
    });
  });
});
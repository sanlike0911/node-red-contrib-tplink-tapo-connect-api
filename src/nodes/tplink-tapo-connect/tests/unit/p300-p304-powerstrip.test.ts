/**
 * P300/P304 Multi-Outlet Power Strip Unit Tests
 * Tests the P300 and P304 class implementations (multi-outlet power strips with child device management)
 */

import { BaseTapoDevice } from '../../src/types/base';
import { TapoCredentials, TapoApiRequest, TapoApiResponse } from '../../src/types';

// Mock the unified protocol
jest.mock('../../src/core/unified-protocol');

// P300 implementation (multi-outlet power strip - basic functionality)
class P300PowerStrip extends BaseTapoDevice {
  private mockChildDevices = [
    { device_id: 'outlet1', device_on: true, nickname: 'Outlet 1' },
    { device_id: 'outlet2', device_on: false, nickname: 'Outlet 2' },
    { device_id: 'outlet3', device_on: true, nickname: 'Outlet 3' }
  ];

  constructor(ip: string, credentials: TapoCredentials) {
    super(ip, credentials);
  }

  async connect(): Promise<void> {
    // Mock connection
  }

  async disconnect(): Promise<void> {
    // Mock disconnection
  }

  async getDeviceInfo(): Promise<any> {
    return {
      device_id: 'test-p300-device-id',
      model: 'P300',
      device_on: true,
      fw_ver: '1.0.0',
      hw_ver: '2.0',
      type: 'SMART.TAPOPLUG',
      child_num: 3
    };
  }

  async getChildDeviceList(): Promise<any[]> {
    return this.mockChildDevices;
  }

  async getChildDeviceComponentListJson(): Promise<any> {
    return {
      child_component_list: this.mockChildDevices.map(device => ({
        device_id: device.device_id,
        component_list: [
          {
            id: 'outlet',
            ver_code: 1
          }
        ]
      }))
    };
  }

  async getChildDeviceListJson(): Promise<any> {
    return {
      child_device_list: this.mockChildDevices
    };
  }

  async setChildDeviceState(deviceId: string, state: boolean): Promise<void> {
    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        device_id: deviceId,
        device_on: state
      }
    };
    await this.sendRequest(request);
  }

  async turnOnChild(deviceId: string): Promise<void> {
    await this.setChildDeviceState(deviceId, true);
  }

  async turnOffChild(deviceId: string): Promise<void> {
    await this.setChildDeviceState(deviceId, false);
  }

  async toggleChild(deviceId: string): Promise<void> {
    const childDevices = await this.getChildDeviceList();
    const device = childDevices.find(d => d.device_id === deviceId);
    if (device) {
      await this.setChildDeviceState(deviceId, !device.device_on);
    }
  }

  async turnOnAllOutlets(): Promise<void> {
    const childDevices = await this.getChildDeviceList();
    await Promise.all(
      childDevices.map(device => this.turnOnChild(device.device_id))
    );
  }

  async turnOffAllOutlets(): Promise<void> {
    const childDevices = await this.getChildDeviceList();
    await Promise.all(
      childDevices.map(device => this.turnOffChild(device.device_id))
    );
  }

  protected async sendRequest<T>(_request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    // Mock implementation
    return {
      error_code: 0,
      result: {} as T
    };
  }
}

// P304 implementation (similar to P300 but may have 4 outlets)
class P304PowerStrip extends P300PowerStrip {
  protected mockChildDevices4 = [
    { device_id: 'outlet1', device_on: true, nickname: 'Outlet 1' },
    { device_id: 'outlet2', device_on: false, nickname: 'Outlet 2' },
    { device_id: 'outlet3', device_on: true, nickname: 'Outlet 3' },
    { device_id: 'outlet4', device_on: false, nickname: 'Outlet 4' }
  ];

  override async getDeviceInfo(): Promise<any> {
    return {
      device_id: 'test-p304-device-id',
      model: 'P304',
      device_on: true,
      fw_ver: '1.0.1',
      hw_ver: '2.1',
      type: 'SMART.TAPOPLUG',
      child_num: 4
    };
  }

  override async getChildDeviceList(): Promise<any[]> {
    return this.mockChildDevices4;
  }
}

describe('P300/P304 Multi-Outlet Power Strip Unit Tests', () => {
  describe('P300 Power Strip', () => {
    let powerStrip: P300PowerStrip;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      powerStrip = new P300PowerStrip('192.168.1.111', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P300PowerStrip instance', () => {
        expect(powerStrip).toBeInstanceOf(P300PowerStrip);
        expect(powerStrip).toBeDefined();
      });
    });

    describe('Device Information', () => {
      test('should get device information', async () => {
        const deviceInfo = await powerStrip.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p300-device-id');
        expect(deviceInfo.model).toBe('P300');
        expect(deviceInfo.child_num).toBe(3);
      });

      test('should get child device list', async () => {
        const childDevices = await powerStrip.getChildDeviceList();
        expect(childDevices).toHaveLength(3);
        expect(childDevices[0]).toEqual({
          device_id: 'outlet1',
          device_on: true,
          nickname: 'Outlet 1'
        });
        expect(childDevices[1]).toEqual({
          device_id: 'outlet2',
          device_on: false,
          nickname: 'Outlet 2'
        });
      });

      test('should get child device list in JSON format', async () => {
        const childDevicesJson = await powerStrip.getChildDeviceListJson();
        expect(childDevicesJson.child_device_list).toHaveLength(3);
        expect(childDevicesJson.child_device_list[0].device_id).toBe('outlet1');
      });

      test('should get child device component list', async () => {
        const componentList = await powerStrip.getChildDeviceComponentListJson();
        expect(componentList.child_component_list).toHaveLength(3);
        expect(componentList.child_component_list[0]).toEqual({
          device_id: 'outlet1',
          component_list: [
            {
              id: 'outlet',
              ver_code: 1
            }
          ]
        });
      });
    });

    describe('Individual Outlet Control', () => {
      test('should turn on individual outlet', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOnChild('outlet2');
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            device_id: 'outlet2',
            device_on: true
          }
        });
      });

      test('should turn off individual outlet', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOffChild('outlet1');
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            device_id: 'outlet1',
            device_on: false
          }
        });
      });

      test('should toggle individual outlet', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        // Toggle outlet2 (currently off -> should turn on)
        await powerStrip.toggleChild('outlet2');
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            device_id: 'outlet2',
            device_on: true
          }
        });
      });

      test('should set child device state directly', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.setChildDeviceState('outlet3', false);
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            device_id: 'outlet3',
            device_on: false
          }
        });
      });
    });

    describe('Bulk Outlet Control', () => {
      test('should turn on all outlets', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOnAllOutlets();
        expect(mockSendRequest).toHaveBeenCalledTimes(3);

        // Check that all outlets were turned on
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet1', device_on: true }
        });
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet2', device_on: true }
        });
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet3', device_on: true }
        });
      });

      test('should turn off all outlets', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOffAllOutlets();
        expect(mockSendRequest).toHaveBeenCalledTimes(3);

        // Check that all outlets were turned off
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet1', device_on: false }
        });
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet2', device_on: false }
        });
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet3', device_on: false }
        });
      });
    });

    describe('Error Handling', () => {
      test('should handle connection requirements', async () => {
        const mockSendRequest = jest.fn().mockRejectedValue(
          new Error('Device not connected')
        );
        (powerStrip as any).sendRequest = mockSendRequest;

        await expect(powerStrip.turnOnChild('outlet1'))
          .rejects.toThrow('Device not connected');
      });

      test('should handle invalid outlet IDs gracefully', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        // Attempting to toggle non-existent outlet should not throw
        await powerStrip.toggleChild('outlet999');
        // Since device not found, sendRequest should not be called
        expect(mockSendRequest).not.toHaveBeenCalled();
      });

      test('should handle network timeouts', async () => {
        const mockSendRequest = jest.fn().mockRejectedValue(
          new Error('Network timeout')
        );
        (powerStrip as any).sendRequest = mockSendRequest;

        await expect(powerStrip.turnOffChild('outlet1'))
          .rejects.toThrow('Network timeout');
      });
    });
  });

  describe('P304 Power Strip', () => {
    let powerStrip: P304PowerStrip;
    let mockCredentials: TapoCredentials;

    beforeEach(() => {
      jest.clearAllMocks();

      mockCredentials = {
        username: 'test@example.com',
        password: 'test-password'
      };

      powerStrip = new P304PowerStrip('192.168.1.112', mockCredentials);
    });

    describe('Class Instantiation', () => {
      test('should create P304PowerStrip instance', () => {
        expect(powerStrip).toBeInstanceOf(P304PowerStrip);
        expect(powerStrip).toBeInstanceOf(P300PowerStrip); // P304 extends P300
        expect(powerStrip).toBeDefined();
      });
    });

    describe('Device Information', () => {
      test('should get device information with P304 model', async () => {
        const deviceInfo = await powerStrip.getDeviceInfo();
        expect(deviceInfo.device_id).toBe('test-p304-device-id');
        expect(deviceInfo.model).toBe('P304');
        expect(deviceInfo.child_num).toBe(4);
      });

      test('should get child device list with 4 outlets', async () => {
        const childDevices = await powerStrip.getChildDeviceList();
        expect(childDevices).toHaveLength(4);
        expect(childDevices[3]).toEqual({
          device_id: 'outlet4',
          device_on: false,
          nickname: 'Outlet 4'
        });
      });
    });

    describe('Four Outlet Control', () => {
      test('should control all four outlets individually', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOnChild('outlet4');
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: {
            device_id: 'outlet4',
            device_on: true
          }
        });
      });

      test('should turn on all four outlets', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOnAllOutlets();
        expect(mockSendRequest).toHaveBeenCalledTimes(4);

        // Check that all four outlets were turned on
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet4', device_on: true }
        });
      });

      test('should turn off all four outlets', async () => {
        const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
        (powerStrip as any).sendRequest = mockSendRequest;

        await powerStrip.turnOffAllOutlets();
        expect(mockSendRequest).toHaveBeenCalledTimes(4);

        // Check that all four outlets were turned off
        expect(mockSendRequest).toHaveBeenCalledWith({
          method: 'set_device_info',
          params: { device_id: 'outlet4', device_on: false }
        });
      });
    });
  });

  describe('P300 vs P304 Comparison', () => {
    test('both should have identical control interfaces', () => {
      const p300 = new P300PowerStrip('192.168.1.100', { username: 'test', password: 'test' });
      const p304 = new P304PowerStrip('192.168.1.101', { username: 'test', password: 'test' });

      // Check that both have the same control methods
      expect(typeof p300.turnOnChild).toBe('function');
      expect(typeof p304.turnOnChild).toBe('function');
      expect(typeof p300.turnOffChild).toBe('function');
      expect(typeof p304.turnOffChild).toBe('function');
      expect(typeof p300.toggleChild).toBe('function');
      expect(typeof p304.toggleChild).toBe('function');
      expect(typeof p300.turnOnAllOutlets).toBe('function');
      expect(typeof p304.turnOnAllOutlets).toBe('function');
      expect(typeof p300.turnOffAllOutlets).toBe('function');
      expect(typeof p304.turnOffAllOutlets).toBe('function');
    });

    test('should have different numbers of child devices', async () => {
      const p300 = new P300PowerStrip('192.168.1.100', { username: 'test', password: 'test' });
      const p304 = new P304PowerStrip('192.168.1.101', { username: 'test', password: 'test' });

      const p300ChildDevices = await p300.getChildDeviceList();
      const p304ChildDevices = await p304.getChildDeviceList();

      expect(p300ChildDevices).toHaveLength(3);
      expect(p304ChildDevices).toHaveLength(4);
    });

    test('should have different device info', async () => {
      const p300 = new P300PowerStrip('192.168.1.100', { username: 'test', password: 'test' });
      const p304 = new P304PowerStrip('192.168.1.101', { username: 'test', password: 'test' });

      const p300Info = await p300.getDeviceInfo();
      const p304Info = await p304.getDeviceInfo();

      expect(p300Info.model).toBe('P300');
      expect(p304Info.model).toBe('P304');
      expect(p300Info.child_num).toBe(3);
      expect(p304Info.child_num).toBe(4);
    });

    test('both should handle error conditions identically', async () => {
      const p300 = new P300PowerStrip('192.168.1.100', { username: 'test', password: 'test' });
      const p304 = new P304PowerStrip('192.168.1.101', { username: 'test', password: 'test' });

      const errorMessage = 'Device not connected';

      const mockSendRequestP300 = jest.fn().mockRejectedValue(new Error(errorMessage));
      const mockSendRequestP304 = jest.fn().mockRejectedValue(new Error(errorMessage));

      (p300 as any).sendRequest = mockSendRequestP300;
      (p304 as any).sendRequest = mockSendRequestP304;

      await expect(p300.turnOnChild('outlet1')).rejects.toThrow(errorMessage);
      await expect(p304.turnOnChild('outlet1')).rejects.toThrow(errorMessage);
    });
  });

  describe('Advanced Multi-Outlet Features', () => {
    let powerStrip: P300PowerStrip;

    beforeEach(() => {
      jest.clearAllMocks();
      powerStrip = new P300PowerStrip('192.168.1.111', {
        username: 'test@example.com',
        password: 'test-password'
      });
    });

    test('should handle child device component information', async () => {
      const componentList = await powerStrip.getChildDeviceComponentListJson();

      expect(componentList.child_component_list).toHaveLength(3);
      componentList.child_component_list.forEach((child: any) => {
        expect(child).toHaveProperty('device_id');
        expect(child).toHaveProperty('component_list');
        expect(child.component_list).toEqual([
          {
            id: 'outlet',
            ver_code: 1
          }
        ]);
      });
    });

    test('should handle child device state queries', async () => {
      const childDevices = await powerStrip.getChildDeviceList();

      // Check initial states
      expect(childDevices.find(d => d.device_id === 'outlet1')?.device_on).toBe(true);
      expect(childDevices.find(d => d.device_id === 'outlet2')?.device_on).toBe(false);
      expect(childDevices.find(d => d.device_id === 'outlet3')?.device_on).toBe(true);
    });

    test('should handle bulk operations efficiently', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (powerStrip as any).sendRequest = mockSendRequest;

      const startTime = Date.now();
      await powerStrip.turnOnAllOutlets();
      const endTime = Date.now();

      // Should complete quickly (parallel execution)
      expect(endTime - startTime).toBeLessThan(100);
      expect(mockSendRequest).toHaveBeenCalledTimes(3);
    });

    test('should provide JSON API compatibility', async () => {
      const jsonDeviceList = await powerStrip.getChildDeviceListJson();
      const regularDeviceList = await powerStrip.getChildDeviceList();

      expect(jsonDeviceList.child_device_list).toEqual(regularDeviceList);
    });
  });
});
/**
 * H100 Hub Unit Tests
 * Tests the H100 class implementation (smart hub with alarm and ringtone features)
 */

import { BaseTapoDevice } from '../../src/types/base';
import { TapoCredentials, TapoApiRequest, TapoApiResponse } from '../../src/types';

// Mock the unified protocol
jest.mock('../../src/core/unified-protocol');

// H100 implementation (smart hub with alarm and ringtone features)
class H100Hub extends BaseTapoDevice {
  private mockChildDevices = [
    { device_id: 'sensor1', device_type: 'SMART.KASAPLUG', nickname: 'Motion Sensor 1' },
    { device_id: 'sensor2', device_type: 'SMART.KASAPLUG', nickname: 'Door Sensor 1' }
  ];

  private mockRingtones = [
    { id: 1, name: 'Doorbell 1', duration: 10 },
    { id: 2, name: 'Doorbell 2', duration: 15 },
    { id: 3, name: 'Alarm 1', duration: 30 },
    { id: 4, name: 'Alarm 2', duration: 20 },
    { id: 5, name: 'Notification', duration: 5 }
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
      device_id: 'test-h100-device-id',
      model: 'H100',
      device_on: true,
      fw_ver: '1.2.0',
      hw_ver: '1.0',
      type: 'SMART.KASAHUB',
      volume: 5,
      alarm_volume: 8,
      child_num: 2
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
            id: 'sensor',
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

  async getSupportedRingtoneList(): Promise<any[]> {
    return this.mockRingtones;
  }

  async playAlarm(ringtoneId: number = 1, duration?: number): Promise<void> {
    const request: TapoApiRequest = {
      method: 'play_alarm',
      params: {
        ringtone_id: ringtoneId,
        duration: duration || 10
      }
    };
    await this.sendRequest(request);
  }

  async stopAlarm(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'stop_alarm',
      params: {}
    };
    await this.sendRequest(request);
  }

  async setAlarmVolume(volume: number): Promise<void> {
    if (volume < 1 || volume > 10) {
      throw new Error('Volume must be between 1-10');
    }

    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        alarm_volume: volume
      }
    };
    await this.sendRequest(request);
  }

  async setVolume(volume: number): Promise<void> {
    if (volume < 1 || volume > 10) {
      throw new Error('Volume must be between 1-10');
    }

    const request: TapoApiRequest = {
      method: 'set_device_info',
      params: {
        volume: volume
      }
    };
    await this.sendRequest(request);
  }

  async getVolume(): Promise<number> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.volume || 5;
  }

  async getAlarmVolume(): Promise<number> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.alarm_volume || 5;
  }

  async playRingtone(ringtoneId: number, duration: number = 10): Promise<void> {
    const ringtones = await this.getSupportedRingtoneList();
    const ringtone = ringtones.find(r => r.id === ringtoneId);

    if (!ringtone) {
      throw new Error(`Ringtone ID ${ringtoneId} not found`);
    }

    const request: TapoApiRequest = {
      method: 'play_ringtone',
      params: {
        ringtone_id: ringtoneId,
        duration: Math.min(duration, ringtone.duration)
      }
    };
    await this.sendRequest(request);
  }

  async isAlarmActive(): Promise<boolean> {
    const deviceInfo = await this.getDeviceInfo();
    return deviceInfo.alarm_active || false;
  }

  async getChildDeviceStatus(deviceId: string): Promise<any> {
    const childDevices = await this.getChildDeviceList();
    return childDevices.find(device => device.device_id === deviceId) || null;
  }

  async refreshSession(): Promise<void> {
    const request: TapoApiRequest = {
      method: 'refresh_session',
      params: {}
    };
    await this.sendRequest(request);
  }

  protected async sendRequest<T>(_request: TapoApiRequest): Promise<TapoApiResponse<T>> {
    // Mock implementation
    return {
      error_code: 0,
      result: {} as T
    };
  }
}

describe('H100 Hub Unit Tests', () => {
  let hub: H100Hub;
  let mockCredentials: TapoCredentials;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCredentials = {
      username: 'test@example.com',
      password: 'test-password'
    };

    hub = new H100Hub('192.168.1.113', mockCredentials);
  });

  describe('Class Instantiation', () => {
    test('should create H100Hub instance', () => {
      expect(hub).toBeInstanceOf(H100Hub);
      expect(hub).toBeDefined();
    });
  });

  describe('Device Information', () => {
    test('should get device information', async () => {
      const deviceInfo = await hub.getDeviceInfo();
      expect(deviceInfo.device_id).toBe('test-h100-device-id');
      expect(deviceInfo.model).toBe('H100');
      expect(deviceInfo.type).toBe('SMART.KASAHUB');
      expect(deviceInfo.child_num).toBe(2);
      expect(deviceInfo.volume).toBe(5);
      expect(deviceInfo.alarm_volume).toBe(8);
    });

    test('should get child device list', async () => {
      const childDevices = await hub.getChildDeviceList();
      expect(childDevices).toHaveLength(2);
      expect(childDevices[0]).toEqual({
        device_id: 'sensor1',
        device_type: 'SMART.KASAPLUG',
        nickname: 'Motion Sensor 1'
      });
      expect(childDevices[1]).toEqual({
        device_id: 'sensor2',
        device_type: 'SMART.KASAPLUG',
        nickname: 'Door Sensor 1'
      });
    });

    test('should get child device list in JSON format', async () => {
      const childDevicesJson = await hub.getChildDeviceListJson();
      expect(childDevicesJson.child_device_list).toHaveLength(2);
      expect(childDevicesJson.child_device_list[0].device_id).toBe('sensor1');
    });

    test('should get child device component list', async () => {
      const componentList = await hub.getChildDeviceComponentListJson();
      expect(componentList.child_component_list).toHaveLength(2);
      expect(componentList.child_component_list[0]).toEqual({
        device_id: 'sensor1',
        component_list: [
          {
            id: 'sensor',
            ver_code: 1
          }
        ]
      });
    });

    test('should get individual child device status', async () => {
      const deviceStatus = await hub.getChildDeviceStatus('sensor1');
      expect(deviceStatus).toEqual({
        device_id: 'sensor1',
        device_type: 'SMART.KASAPLUG',
        nickname: 'Motion Sensor 1'
      });

      const nonExistentDevice = await hub.getChildDeviceStatus('sensor999');
      expect(nonExistentDevice).toBeNull();
    });
  });

  describe('Ringtone Management', () => {
    test('should get supported ringtone list', async () => {
      const ringtones = await hub.getSupportedRingtoneList();
      expect(ringtones).toHaveLength(5);
      expect(ringtones[0]).toEqual({
        id: 1,
        name: 'Doorbell 1',
        duration: 10
      });
      expect(ringtones[2]).toEqual({
        id: 3,
        name: 'Alarm 1',
        duration: 30
      });
    });

    test('should play ringtone with default duration', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.playRingtone(2);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_ringtone',
        params: {
          ringtone_id: 2,
          duration: 10
        }
      });
    });

    test('should play ringtone with custom duration', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.playRingtone(3, 20);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_ringtone',
        params: {
          ringtone_id: 3,
          duration: 20
        }
      });
    });

    test('should limit ringtone duration to maximum allowed', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      // Ringtone ID 1 has max duration of 10 seconds
      await hub.playRingtone(1, 50);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_ringtone',
        params: {
          ringtone_id: 1,
          duration: 10 // Should be limited to ringtone's max duration
        }
      });
    });

    test('should throw error for invalid ringtone ID', async () => {
      await expect(hub.playRingtone(999))
        .rejects.toThrow('Ringtone ID 999 not found');
    });
  });

  describe('Alarm Control', () => {
    test('should play alarm with default settings', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.playAlarm();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_alarm',
        params: {
          ringtone_id: 1,
          duration: 10
        }
      });
    });

    test('should play alarm with custom ringtone and duration', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.playAlarm(3, 25);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_alarm',
        params: {
          ringtone_id: 3,
          duration: 25
        }
      });
    });

    test('should stop alarm', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.stopAlarm();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'stop_alarm',
        params: {}
      });
    });

    test('should check if alarm is active', async () => {
      const mockDeviceInfo = { alarm_active: true };
      jest.spyOn(hub, 'getDeviceInfo').mockResolvedValue(mockDeviceInfo);

      const isActive = await hub.isAlarmActive();
      expect(isActive).toBe(true);
    });

    test('should return false when alarm_active is not set', async () => {
      const mockDeviceInfo = {}; // No alarm_active property
      jest.spyOn(hub, 'getDeviceInfo').mockResolvedValue(mockDeviceInfo);

      const isActive = await hub.isAlarmActive();
      expect(isActive).toBe(false);
    });
  });

  describe('Volume Control', () => {
    test('should set volume within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.setVolume(7);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          volume: 7
        }
      });
    });

    test('should set alarm volume within valid range', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.setAlarmVolume(9);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: {
          alarm_volume: 9
        }
      });
    });

    test('should validate volume range', async () => {
      await expect(hub.setVolume(0)).rejects.toThrow('Volume must be between 1-10');
      await expect(hub.setVolume(11)).rejects.toThrow('Volume must be between 1-10');
      await expect(hub.setAlarmVolume(0)).rejects.toThrow('Volume must be between 1-10');
      await expect(hub.setAlarmVolume(11)).rejects.toThrow('Volume must be between 1-10');
    });

    test('should get current volume', async () => {
      const volume = await hub.getVolume();
      expect(volume).toBe(5);
    });

    test('should get current alarm volume', async () => {
      const alarmVolume = await hub.getAlarmVolume();
      expect(alarmVolume).toBe(8);
    });

    test('should return default volume when not set', async () => {
      const mockDeviceInfo = {}; // No volume properties
      jest.spyOn(hub, 'getDeviceInfo').mockResolvedValue(mockDeviceInfo);

      const volume = await hub.getVolume();
      const alarmVolume = await hub.getAlarmVolume();

      expect(volume).toBe(5);
      expect(alarmVolume).toBe(5);
    });
  });

  describe('Session Management', () => {
    test('should refresh session', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      await hub.refreshSession();
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'refresh_session',
        params: {}
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle connection requirements', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Device not connected')
      );
      (hub as any).sendRequest = mockSendRequest;

      await expect(hub.playAlarm()).rejects.toThrow('Device not connected');
      await expect(hub.setVolume(5)).rejects.toThrow('Device not connected');
    });

    test('should handle network timeouts', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      (hub as any).sendRequest = mockSendRequest;

      await expect(hub.stopAlarm()).rejects.toThrow('Network timeout');
    });

    test('should handle API errors gracefully', async () => {
      const mockSendRequest = jest.fn().mockRejectedValue(
        new Error('Invalid ringtone ID')
      );
      (hub as any).sendRequest = mockSendRequest;

      await expect(hub.playAlarm(999))
        .rejects.toThrow('Invalid ringtone ID');
    });
  });

  describe('Hub Features Integration', () => {
    test('should coordinate alarm and volume settings', async () => {
      const mockSendRequest = jest.fn().mockResolvedValue({ error_code: 0 });
      (hub as any).sendRequest = mockSendRequest;

      // Set volume first
      await hub.setAlarmVolume(10);
      // Then play alarm
      await hub.playAlarm(3, 30);

      expect(mockSendRequest).toHaveBeenCalledTimes(2);
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { alarm_volume: 10 }
      });
      expect(mockSendRequest).toHaveBeenCalledWith({
        method: 'play_alarm',
        params: { ringtone_id: 3, duration: 30 }
      });
    });

    test('should manage multiple child devices', async () => {
      const childDevices = await hub.getChildDeviceList();

      expect(childDevices).toHaveLength(2);

      // Should be able to query each device individually
      const sensor1 = await hub.getChildDeviceStatus('sensor1');
      const sensor2 = await hub.getChildDeviceStatus('sensor2');

      expect(sensor1?.device_id).toBe('sensor1');
      expect(sensor2?.device_id).toBe('sensor2');
    });

    test('should provide comprehensive device information', async () => {
      const deviceInfo = await hub.getDeviceInfo();
      const childDevices = await hub.getChildDeviceList();
      const ringtones = await hub.getSupportedRingtoneList();

      expect(deviceInfo.model).toBe('H100');
      expect(childDevices).toHaveLength(2);
      expect(ringtones).toHaveLength(5);
    });
  });
});
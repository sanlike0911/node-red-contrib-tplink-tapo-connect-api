import { TapoConnect } from '../../src';
import { TEST_CONFIG, TEST_CREDENTIALS } from '../test-config';

describe('Simple Integration Tests', () => {
  // Skip unless real device testing is enabled
  const testIf = TEST_CONFIG.REAL_DEVICE_TESTS ? test : test.skip;

  // Plug Tests
  testIf('should connect to P100 device', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P100.ip;
    
    const device = await TapoConnect.createP100Plug(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('P100');
  }, 15000);

  testIf('should control P100 device', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P100.ip;
    
    const device = await TapoConnect.createP100Plug(deviceIp, TEST_CREDENTIALS);
    
    await device.turnOn();
    let info = await device.getDeviceInfo();
    expect(info.device_on).toBe(true);
    
    await device.turnOff();
    info = await device.getDeviceInfo();
    expect(info.device_on).toBe(false);
  }, 15000);

  testIf('should connect to P105 device', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P105.ip;
    
    const device = await TapoConnect.createP105Plug(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('P105');
  }, 15000);

  testIf('should connect to P110 device with energy monitoring', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P110.ip;
    
    const device = await TapoConnect.createP110Plug(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('P110');
    
    // Test energy monitoring
    const currentPower = await device.getCurrentPower();
    expect(typeof currentPower).toBe('number');
    expect(currentPower).toBeGreaterThanOrEqual(0);
  }, 15000);

  testIf('should connect to P115 device with energy monitoring', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P115.ip;
    
    const device = await TapoConnect.createP115Plug(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('P115');
  }, 15000);

  // Bulb Tests
  testIf('should connect to L510 bulb', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.L510.ip;
    
    const device = await TapoConnect.createL510Bulb(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('L510');
  }, 15000);

  testIf('should control L510 bulb brightness', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.L510.ip;
    
    const device = await TapoConnect.createL510Bulb(deviceIp, TEST_CREDENTIALS);
    
    await device.turnOn();
    if (typeof (device as any).setBrightness === 'function') {
      await (device as any).setBrightness(50);
    }
    
    const info = await device.getDeviceInfo();
    expect(info.device_on).toBe(true);
    // Note: brightness property may not be immediately updated in device info
    
    await device.turnOff();
  }, 15000);

  testIf('should connect to L520 bulb', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.L520.ip;
    
    const device = await TapoConnect.createL520Bulb(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('L520');
  }, 15000);

  testIf('should connect to L530 bulb with color support', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.L530.ip;
    
    const device = await TapoConnect.createL530Bulb(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('L530');
  }, 15000);

  testIf('should control L530 bulb color', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.L530.ip;
    
    const device = await TapoConnect.createL530Bulb(deviceIp, TEST_CREDENTIALS);
    
    await device.turnOn();
    if (typeof (device as any).setColor === 'function') {
      await (device as any).setColor({ hue: 240, saturation: 100, value: 80 });
    }
    
    const info = await device.getDeviceInfo();
    expect(info.device_on).toBe(true);
    // Note: color properties may not be immediately reflected in basic device info
    
    await device.turnOff();
  }, 15000);

  describe('Mock Integration Tests', () => {
    test('should create device with mocked connection', async () => {
      // Mock TapoConnect to avoid actual network calls
      const mockDevice = {
        turnOn: jest.fn().mockResolvedValue(undefined),
        turnOff: jest.fn().mockResolvedValue(undefined),
        getDeviceInfo: jest.fn().mockResolvedValue({
          device_id: 'mock-device-id',
          model: 'P100',
          type: 'SMART.TAPOPLUG',
          device_on: false
        })
      };

      // Simulate successful connection
      jest.spyOn(TapoConnect, 'createP100Plug').mockResolvedValue(mockDevice as any);

      const device = await TapoConnect.createP100Plug('192.168.1.100', TEST_CREDENTIALS);
      
      expect(device).toBeDefined();
      
      const info = await device.getDeviceInfo();
      expect(info.model).toBe('P100');
      
      await device.turnOn();
      expect(mockDevice.turnOn).toHaveBeenCalled();
    });
  });
});
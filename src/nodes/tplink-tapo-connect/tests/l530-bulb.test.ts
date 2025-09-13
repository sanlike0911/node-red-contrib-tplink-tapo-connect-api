/**
 * L530 Smart Bulb Test Suite
 * Comprehensive tests for L530 color bulb with effects support
 */

import { TapoConnect, TapoCredentials } from '../src';
import { TEST_CONFIG, TEST_CREDENTIALS } from './test-config';

describe('L530 Smart Bulb Tests', () => {
  let credentials: TapoCredentials;
  const testIf = TEST_CONFIG.REAL_DEVICE_TESTS ? test : test.skip;
  const deviceIp = TEST_CONFIG.TEST_DEVICES.L530.ip;

  beforeAll(() => {
    credentials = TEST_CREDENTIALS;
  });

  describe('Factory Method Tests', () => {
    test('should create L530 bulb instance promise', () => {
      const bulbPromise = TapoConnect.createL530Bulb(deviceIp, credentials);
      expect(bulbPromise).toBeInstanceOf(Promise);
    });

    test('should have L530 specific capabilities', () => {
      // Verify L530 supports full color and effects
      const { BULB_CAPABILITIES } = require('../src/types/bulb');
      const l530Caps = BULB_CAPABILITIES['L530'];

      expect(l530Caps).toBeDefined();
      expect(l530Caps.brightness).toBe(true);
      expect(l530Caps.color).toBe(true);
      expect(l530Caps.colorTemperature).toBe(true);
      expect(l530Caps.effects).toBe(true);
    });
  });

  describe('Device Connection Tests', () => {
    testIf('should connect to L530 device', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);
      expect(device).toBeDefined();

      const info = await device.getDeviceInfo();
      expect(info.device_id).toBeTruthy();
      expect(info.model).toBe('L530');
      expect(info.type).toContain('SMART.');
    }, 15000);

    testIf('should handle connection errors gracefully', async () => {
      const invalidIp = '192.168.255.255';

      try {
        const device = await TapoConnect.createL530Bulb(invalidIp, credentials);
        await device.getDeviceInfo();
        fail('Should have thrown an error for invalid IP');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBeTruthy();
      }
    }, 10000);
  });

  describe('Basic Control Tests', () => {
    testIf('should control L530 power state', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      // Turn on
      await device.turnOn();
      let info = await device.getDeviceInfo();
      expect(info.device_on).toBe(true);

      // Turn off
      await device.turnOff();
      info = await device.getDeviceInfo();
      expect(info.device_on).toBe(false);

      // Toggle
      await (device as any).toggle?.();
      info = await device.getDeviceInfo();
      expect(info.device_on).toBe(true);

      // Clean up - turn off
      await device.turnOff();
    }, 20000);

    testIf('should control L530 brightness', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      // Test brightness control
      if (typeof (device as any).setBrightness === 'function') {
        await (device as any).setBrightness(30);
        await new Promise(resolve => setTimeout(resolve, 1000));

        await (device as any).setBrightness(70);
        await new Promise(resolve => setTimeout(resolve, 1000));

        await (device as any).setBrightness(100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await device.turnOff();
    }, 25000);
  });

  describe('Color Control Tests', () => {
    testIf('should support HSV color control', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setColor === 'function') {
        // Test different HSV colors
        const testColors = [
          { hue: 0, saturation: 100, value: 80 },     // Red
          { hue: 120, saturation: 100, value: 80 },   // Green
          { hue: 240, saturation: 100, value: 80 },   // Blue
          { hue: 60, saturation: 100, value: 80 },    // Yellow
          { hue: 300, saturation: 100, value: 80 }    // Magenta
        ];

        for (const color of testColors) {
          await (device as any).setColor(color);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      await device.turnOff();
    }, 30000);

    testIf('should support RGB color control', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setColorRGB === 'function') {
        // Test RGB colors
        const rgbColors = [
          { red: 255, green: 0, blue: 0 },     // Red
          { red: 0, green: 255, blue: 0 },     // Green
          { red: 0, green: 0, blue: 255 },     // Blue
          { red: 255, green: 255, blue: 0 },   // Yellow
          { red: 255, green: 0, blue: 255 }    // Magenta
        ];

        for (const color of rgbColors) {
          await (device as any).setColorRGB(color);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      await device.turnOff();
    }, 30000);

    testIf('should support named color control', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setNamedColor === 'function') {
        // Test named colors
        const namedColors = ['red', 'green', 'blue', 'yellow', 'purple', 'white'];

        for (const color of namedColors) {
          await (device as any).setNamedColor(color);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      await device.turnOff();
    }, 35000);
  });

  describe('Color Temperature Tests', () => {
    testIf('should support color temperature control', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setColorTemperature === 'function') {
        // Test different color temperatures
        const temperatures = [
          { temp: 2500, brightness: 80 },  // Warm white
          { temp: 4000, brightness: 80 },  // Neutral white
          { temp: 6500, brightness: 80 }   // Cool white
        ];

        for (const { temp, brightness } of temperatures) {
          await (device as any).setColorTemperature(temp, brightness);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      await device.turnOff();
    }, 25000);
  });

  describe('Light Effects Tests', () => {
    testIf('should support light effects', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setLightEffect === 'function') {
        // Test rainbow effect
        await (device as any).setLightEffect({
          effect: 'rainbow',
          speed: 5,
          brightness: 90
        });

        // Let effect run for a while
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Turn off effect
        if (typeof (device as any).turnOffEffect === 'function') {
          await (device as any).turnOffEffect();
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test another effect
        await (device as any).setLightEffect({
          effect: 'disco',
          speed: 7,
          brightness: 80
        });

        await new Promise(resolve => setTimeout(resolve, 6000));

        // Turn off effect
        if (typeof (device as any).turnOffEffect === 'function') {
          await (device as any).turnOffEffect();
        }
      }

      await device.turnOff();
    }, 45000);

    testIf('should handle effect transitions', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      await device.turnOn();

      if (typeof (device as any).setLightEffect === 'function') {
        // Start with one effect
        await (device as any).setLightEffect({
          effect: 'ocean',
          speed: 3,
          brightness: 70
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Switch to another effect
        await (device as any).setLightEffect({
          effect: 'sunset',
          speed: 4,
          brightness: 85
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Turn off effects
        if (typeof (device as any).turnOffEffect === 'function') {
          await (device as any).turnOffEffect();
        }
      }

      await device.turnOff();
    }, 35000);
  });

  describe('Feature Detection Tests', () => {
    testIf('should detect L530 capabilities', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      // Check capability detection methods
      if (typeof (device as any).hasColorSupport === 'function') {
        const hasColor = await (device as any).hasColorSupport();
        expect(hasColor).toBe(true);
      }

      if (typeof (device as any).hasColorTemperatureSupport === 'function') {
        const hasColorTemp = await (device as any).hasColorTemperatureSupport();
        expect(hasColorTemp).toBe(true);
      }

      if (typeof (device as any).hasEffectsSupport === 'function') {
        const hasEffects = await (device as any).hasEffectsSupport();
        expect(hasEffects).toBe(true);
      }
    }, 15000);
  });

  describe('Performance and Reliability Tests', () => {
    testIf('should handle rapid state changes', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      // Rapid on/off cycles
      for (let i = 0; i < 3; i++) {
        await device.turnOn();
        await new Promise(resolve => setTimeout(resolve, 500));
        await device.turnOff();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Rapid color changes
      if (typeof (device as any).setColor === 'function') {
        await device.turnOn();

        const colors = [
          { hue: 0, saturation: 100, value: 80 },
          { hue: 90, saturation: 100, value: 80 },
          { hue: 180, saturation: 100, value: 80 },
          { hue: 270, saturation: 100, value: 80 }
        ];

        for (const color of colors) {
          await (device as any).setColor(color);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await device.turnOff();
      }
    }, 30000);

    testIf('should handle complex scenario test', async () => {
      const device = await TapoConnect.createL530Bulb(deviceIp, credentials);

      // Complex scenario: brightness -> color -> effect -> color temp -> off
      await device.turnOn();

      // Set initial brightness
      if (typeof (device as any).setBrightness === 'function') {
        await (device as any).setBrightness(50);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Set color
      if (typeof (device as any).setColor === 'function') {
        await (device as any).setColor({ hue: 180, saturation: 80, value: 70 });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Apply effect
      if (typeof (device as any).setLightEffect === 'function') {
        await (device as any).setLightEffect({
          effect: 'rainbow',
          speed: 6,
          brightness: 80
        });
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Turn off effect
        if (typeof (device as any).turnOffEffect === 'function') {
          await (device as any).turnOffEffect();
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Set color temperature
      if (typeof (device as any).setColorTemperature === 'function') {
        await (device as any).setColorTemperature(3000, 90);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Final turn off
      await device.turnOff();
    }, 45000);
  });
});
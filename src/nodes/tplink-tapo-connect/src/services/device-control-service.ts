import { TapoCredentials } from '../types';
import { RetryOptions, createRetryConfig } from '../types/retry-options';
import { TapoRetryHandler } from '../utils/retry-utils';
import { DeviceFactory } from '../factory/device-factory';
import { tplinkTapoConnectWrapperType } from '../types/wrapper-types';
import { inferTapoDeviceType } from '../types/device-common';
import { energyMonitoringModels } from '../types/device-types';
import { supportsBrightnessControl, supportsColorControl } from '../types/bulb';

/**
 * Service class for handling individual device control operations
 * Encapsulates device interaction logic with proper error handling and resource management
 */
export class DeviceControlService {
    /** Device instance cache for session continuity */
    private static deviceCache: Map<string, { device: any; lastUsed: number; credentials: TapoCredentials }> = new Map();
    /** Cache TTL in milliseconds (5 minutes) */
    private static readonly DEVICE_CACHE_TTL = 300000;
    /** Cleanup interval for cached devices */
    private static cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Get or create a cached device instance for session continuity
     */
    private static async getOrCreateDevice(targetIp: string, credentials: TapoCredentials, methodHint?: string): Promise<any> {
        const cacheKey = `${targetIp}-${credentials.username}`;
        const now = Date.now();

        // Start cleanup timer if not already running
        if (!this.cleanupInterval) {
            this.startCleanupTimer();
        }

        // Check if we have a valid cached device
        const cached = this.deviceCache.get(cacheKey);
        if (cached && (now - cached.lastUsed) < this.DEVICE_CACHE_TTL) {
            // Update last used time
            cached.lastUsed = now;
            
            // Verify device is still connected
            try {
                if (cached.device.isConnected && cached.device.isConnected()) {
                    console.log(`Using cached device for ${targetIp}`);
                    return cached.device;
                }
            } catch (error) {
                console.log(`Cached device connection invalid, creating new one: ${error}`);
            }
        }

        // Create new device instance
        console.log(`Creating new device instance for ${targetIp}`);
        const device = await DeviceFactory.createDevice(targetIp, credentials, methodHint);
        await device.connect();

        // Cache the device
        this.deviceCache.set(cacheKey, {
            device: device,
            lastUsed: now,
            credentials: credentials
        });

        return device;
    }

    /**
     * Start cleanup timer for expired cached devices
     */
    private static startCleanupTimer(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredDevices();
        }, 60000); // Check every minute
    }

    /**
     * Clean up expired cached devices
     */
    private static cleanupExpiredDevices(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, cached] of this.deviceCache.entries()) {
            if ((now - cached.lastUsed) >= this.DEVICE_CACHE_TTL) {
                expiredKeys.push(key);
                
                // Safely disconnect the device
                this.safeDisconnect(cached.device).catch(() => {
                    // Ignore disconnect errors during cleanup
                });
            }
        }

        // Remove expired entries
        for (const key of expiredKeys) {
            this.deviceCache.delete(key);
            console.log(`Cleaned up expired device cache for ${key}`);
        }

        // Stop cleanup timer if no cached devices remain
        if (this.deviceCache.size === 0 && this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Clear all cached devices (useful for testing or cleanup)
     */
    static clearDeviceCache(): void {
        for (const [_, cached] of this.deviceCache.entries()) {
            this.safeDisconnect(cached.device).catch(() => {
                // Ignore disconnect errors during cleanup
            });
        }
        this.deviceCache.clear();
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get device information including energy usage data for supported devices
     */
    static async getDeviceInfo(
        email: string,
        password: string,
        targetIp: string,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('infoRetrieval', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: email, password: password };

                // Use lightweight generic method to get device info directly
                const tapoDeviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                // Check if device supports energy monitoring and add energy usage data
                let tapoEnergyUsage: any = undefined;
                const deviceType = inferTapoDeviceType(tapoDeviceInfo);

                console.log(`Device model: "${tapoDeviceInfo.model}", Inferred type: "${deviceType}", Energy monitoring models: [${energyMonitoringModels.join(', ')}]`);

                if (deviceType !== 'UNKNOWN' && energyMonitoringModels.includes(deviceType)) {
                    try {
                        const device = await DeviceFactory.createDevice(targetIp, credentials, 'getEnergyUsage');
                        await device.connect();
                        tapoEnergyUsage = await device.getEnergyUsage();
                        await device.disconnect();
                    } catch (energyError) {
                        // Energy usage retrieval failed, but don't fail the entire operation
                        console.log(`Warning: Could not retrieve energy usage for ${tapoDeviceInfo.model}: ${energyError}`);
                    }
                }

                return {
                    result: true,
                    tapoDeviceInfo: tapoDeviceInfo,
                    tapoEnergyUsage: tapoEnergyUsage
                };
            } catch (error: any) {
                throw error;
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'getDeviceInfo');
    }

    /**
     * Get energy usage information for devices that support energy monitoring
     */
    static async getEnergyUsage(
        email: string,
        password: string,
        targetIp: string,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('energyMonitoring', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: email, password: password };

                // First, get device information to check energy monitoring support
                const deviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                // Check if device supports energy monitoring
                const deviceType = inferTapoDeviceType(deviceInfo);

                if (deviceType === 'UNKNOWN') {
                    return {
                        result: false,
                        tapoDeviceInfo: deviceInfo,
                        errorInf: new Error(`Unknown device type. Cannot determine energy monitoring support for device model: ${deviceInfo.model}`)
                    };
                }

                if (!energyMonitoringModels.includes(deviceType)) {
                    return {
                        result: false,
                        tapoDeviceInfo: deviceInfo,
                        errorInf: new Error(`Device type ${deviceType} does not support energy monitoring. Supported models: ${energyMonitoringModels.join(', ')}`)
                    };
                }

                // Device supports energy monitoring, proceed to get energy data
                const device = await DeviceFactory.createDevice(targetIp, credentials, 'getEnergyUsage');
                await device.connect();

                try {
                    const tapoEnergyUsage = await device.getEnergyUsage();
                    if (this.isEmpty(tapoEnergyUsage)) {
                        return {
                            result: false,
                            tapoDeviceInfo: deviceInfo,
                            errorInf: new Error("Energy usage data not found.")
                        };
                    }
                    return {
                        result: true,
                        tapoDeviceInfo: deviceInfo,
                        tapoEnergyUsage: tapoEnergyUsage
                    };
                } finally {
                    await this.safeDisconnect(device);
                }
            } catch (error: any) {
                // Handle unexpected errors (network, authentication, etc.)
                try {
                    const credentials: TapoCredentials = { username: email, password: password };
                    const deviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);
                    return {
                        result: false,
                        tapoDeviceInfo: deviceInfo,
                        errorInf: error
                    };
                } catch (deviceInfoError) {
                    return {
                        result: false,
                        errorInf: error
                    };
                }
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'getEnergyUsage');
    }

    /**
     * Turn device on
     */
    static async turnOn(
        email: string,
        password: string,
        targetIp: string,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('deviceControl', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: email, password: password };
                const device = await this.getOrCreateDevice(targetIp, credentials, 'turnOn');

                await device.turnOn();
                const tapoDeviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                return { result: true, tapoDeviceInfo: tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'turnOn');
    }

    /**
     * Turn device off
     */
    static async turnOff(
        email: string,
        password: string,
        targetIp: string,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('deviceControl', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: email, password: password };
                const device = await this.getOrCreateDevice(targetIp, credentials, 'turnOff');

                await device.turnOff();
                const tapoDeviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                return { result: true, tapoDeviceInfo: tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'turnOff');
    }

    /**
     * Set device brightness
     */
    static async setBrightness(
        email: string,
        password: string,
        targetIp: string,
        brightness: number,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('deviceControl', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                if (brightness < 1 || brightness > 100) {
                    throw new Error("Brightness must be between 1-100");
                }

                const credentials: TapoCredentials = { username: email, password: password };
                
                // Get device type and check capability
                const deviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);
                const deviceType = inferTapoDeviceType(deviceInfo);

                if (deviceType === 'UNKNOWN') {
                    throw new Error(`Unknown device type. Cannot determine brightness control support for device model: ${deviceInfo.model} at ${targetIp}`);
                }

                if (!supportsBrightnessControl(deviceType)) {
                    throw new Error(`Device type ${deviceType} at ${targetIp} does not support brightness control. This feature is only available for bulb devices.`);
                }

                const device = await this.getOrCreateDevice(targetIp, credentials, 'setBrightness');
                await device.setBrightness(brightness);
                const tapoDeviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                return { result: true, tapoDeviceInfo: tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'setBrightness');
    }

    /**
     * Set device color using named color
     */
    static async setColor(
        email: string,
        password: string,
        targetIp: string,
        colour: string,
        retryOptions?: RetryOptions
    ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        const retryConfig = createRetryConfig('deviceControl', retryOptions);

        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                if (colour === "") {
                    throw new Error("Color value cannot be empty");
                }

                const credentials: TapoCredentials = { username: email, password: password };
                
                // Get device type and check capability
                const deviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);
                const deviceType = inferTapoDeviceType(deviceInfo);

                if (deviceType === 'UNKNOWN') {
                    throw new Error(`Unknown device type. Cannot determine color control support for device model: ${deviceInfo.model} at ${targetIp}`);
                }

                if (!supportsColorControl(deviceType)) {
                    throw new Error(`Device type ${deviceType} at ${targetIp} does not support color control. This feature is only available for color bulb devices.`);
                }

                const device = await this.getOrCreateDevice(targetIp, credentials, 'setColor');
                
                // Check if colour is a hex code (starts with # or is 6 hex digits)
                if (colour.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(colour)) {
                    // Convert hex to RGB, then to HSV
                    const hex = colour.replace('#', '');
                    const red = parseInt(hex.substring(0, 2), 16);
                    const green = parseInt(hex.substring(2, 4), 16);
                    const blue = parseInt(hex.substring(4, 6), 16);
                    
                    // Convert RGB to HSV using existing ColorUtils
                    const { ColorUtils } = await import('../types/bulb');
                    const hsv = ColorUtils.rgbToHsv({ red, green, blue });
                    
                    // Send HSV values directly to device
                    const request = {
                        method: 'set_device_info',
                        params: {
                            hue: hsv.hue,
                            saturation: hsv.saturation,
                            brightness: hsv.value
                        }
                    };
                    await device.sendRequest(request);
                } else {
                    // Use named color
                    await device.setNamedColor(colour);
                }
                
                const tapoDeviceInfo = await DeviceFactory.getDeviceInfo(targetIp, credentials);

                return { result: true, tapoDeviceInfo: tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            }
        };

        return this.executeWithRetry(operation, retryConfig, 'setColor');
    }

    /**
     * Execute operation with retry logic
     */
    private static async executeWithRetry<T>(
        operation: () => Promise<T>,
        retryConfig: any,
        operationName: string
    ): Promise<T> {
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, operationName);

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! } as T;
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error } as T;
            }
        }
    }

    /**
     * Safely disconnect device
     */
    private static async safeDisconnect(device: any): Promise<void> {
        if (device && typeof device.disconnect === 'function') {
            try {
                await device.disconnect();
            } catch (disconnectError) {
                // Ignore disconnect errors
            }
        }
    }

    /**
     * Check if object is empty
     */
    private static isEmpty(obj: object): boolean {
        return !Object.keys(obj).length;
    }
}
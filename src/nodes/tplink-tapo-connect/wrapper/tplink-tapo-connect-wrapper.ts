import { TapoConnect, TapoCredentials } from '../index';
import { TapoDeviceInfo as P105DeviceInfo } from '../types';
import { RetryOptions, createRetryConfig } from '../types/retry-options';
import { TapoRetryHandler } from '../utils/retry-utils';
import { GenericDeviceInfoRetriever } from '../devices/generic-device-info';


// Import energy monitoring models from plugs types to avoid duplication
import { energyMonitoringModels } from '../types/plugs';

/**
 * Supported Tapo device types for internal use
 * Used by the device factory for automatic device type detection and instantiation
 */
export type TapoDeviceType = 'P100' | 'P105' | 'P110' | 'P110M' | 'P115' | 'L510' | 'L520' | 'L530' | 'UNKNOWN';


/**
 * Factory class for creating appropriate Tapo device instances
 * Handles automatic device type detection and caching for optimal performance
 */
class DeviceFactory {
    /** Device information cache to minimize redundant API calls */
    private static genericInfoCache: Map<string, { info: P105DeviceInfo; timestamp: number }> = new Map();
    /** Cache TTL in milliseconds (30 seconds) */
    private static readonly CACHE_TTL = 30000;

    /**
     * Get device information using lightweight generic retriever
     * @param ip Device IP address
     * @param credentials Authentication credentials
     * @param useCache Whether to use cached results (default: true)
     * @returns Device information
     */
    static async getDeviceInfo(ip: string, credentials: TapoCredentials, useCache: boolean = true): Promise<P105DeviceInfo> {
        const cacheKey = `${ip}-${credentials.username}`;

        // Check cache for existing device info
        if (useCache && this.genericInfoCache.has(cacheKey)) {
            const cached = this.genericInfoCache.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.info;
            }
            this.genericInfoCache.delete(cacheKey);
        }

        // Retrieve device information using generic retriever
        const infoRetriever = new GenericDeviceInfoRetriever(ip, credentials);
        try {
            await infoRetriever.connect();
            const deviceInfo = await infoRetriever.getDeviceInfo();

            // Cache the retrieved device information
            if (useCache) {
                this.genericInfoCache.set(cacheKey, {
                    info: deviceInfo,
                    timestamp: Date.now()
                });
            }

            return deviceInfo;
        } finally {
            await infoRetriever.disconnect();
        }
    }

    /**
     * Infer device type from device information
     * @param deviceInfo Device information obtained from the device
     * @returns Inferred device type
     */
    static inferDeviceTypeFromInfo(deviceInfo: P105DeviceInfo): TapoDeviceType {
        const model = deviceInfo.model;
        const deviceType = deviceInfo.type;

        switch (deviceType) {
            case 'SMART.TAPOPLUG':
                if (model.startsWith('P100')) return 'P100';
                if (model.startsWith('P105')) return 'P105';
                if (model.startsWith('P110')) return 'P110';
                if (model.startsWith('P110M')) return 'P110M';
                if (model.startsWith('P115')) return 'P115';
                break;
            case "SMART.TAPOBULB":
                if (model.startsWith('L510')) return 'L510';
                if (model.startsWith('L520')) return 'L520';
                if (model.startsWith('L530')) return 'L530';
                break;
            default:
                return 'UNKNOWN';
        }

        // Default to P105 for unknown devices
        return 'UNKNOWN';
    }

    /**
     * Create device instance with automatic device type detection
     * Always detects the device type first, then creates the appropriate device instance
     * @param ip Device IP address
     * @param credentials Authentication credentials
     * @param methodHint Optional method hint for better type inference (fallback only)
     * @returns Device instance
     */
    static async createDevice(ip: string, credentials: TapoCredentials, methodHint?: string): Promise<any> {
        try {
            // Always get device info first to determine the correct device type
            const deviceInfo = await this.getDeviceInfo(ip, credentials);
            const actualDeviceType = this.inferDeviceTypeFromInfo(deviceInfo);

            return this.createSpecificDevice(actualDeviceType, ip, credentials);
        } catch (error) {
            // Fallback to method hint or default P105 if device info retrieval fails
            const fallbackType = methodHint ? this.getDeviceTypeForMethod(methodHint) : 'P105';
            return this.createSpecificDevice(fallbackType, ip, credentials);
        }
    }

    /**
     * Create specific device instance based on device type
     * @param deviceType Specific device type
     * @param ip Device IP address
     * @param credentials Authentication credentials
     * @returns Device instance
     */
    private static createSpecificDevice(deviceType: TapoDeviceType, ip: string, credentials: TapoCredentials): any {
        switch (deviceType) {
            case 'P100':
                return TapoConnect.createP100Plug(ip, credentials);
            case 'P105':
                return TapoConnect.createP105Plug(ip, credentials);
            case 'P110':
                return TapoConnect.createP110Plug(ip, credentials);
            case 'P110M':
                return TapoConnect.createP110Plug(ip, credentials);
            case 'P115':
                return TapoConnect.createP115Plug(ip, credentials);
            case 'L510':
                return TapoConnect.createL510Bulb(ip, credentials);
            case 'L520':
                return TapoConnect.createL520Bulb(ip, credentials);
            case 'L530':
                return TapoConnect.createL530Bulb(ip, credentials);
            default:
                // Fallback to P105
                return TapoConnect.createP105Plug(ip, credentials);
        }
    }

    /**
     * Clear the device info cache
     */
    static clearDeviceInfoCache(): void {
        this.genericInfoCache.clear();
    }

    static getDeviceTypeForMethod(method: string): TapoDeviceType {
        // Energy monitoring methods require P110/P115
        if (method === 'getEnergyUsage' || method === 'getCurrentPower') {
            return 'P110';
        }
        // Brightness/color methods require bulb devices
        if (method === 'setBrightness') {
            return 'L510'; // L510 supports brightness
        }
        if (method === 'setColor' || method === 'setColorRGB' || method === 'setNamedColor') {
            return 'L530'; // L530 supports full color
        }
        if (method === 'setColorTemperature') {
            return 'L520'; // L520/L530 support color temperature
        }
        if (method === 'setLightEffect') {
            return 'L530'; // Only L530 supports effects
        }
        // Default to P105 for basic operations
        return 'P105';
    }
}


export namespace tplinkTapoConnectWrapperType {
    export type tapoConnectResults = {
        result: boolean;
        tapoDeviceInfo?: TapoDeviceInfo;
        tapoEnergyUsage?: any | undefined;
        errorInf?: Error;
    }
}


// Type for the device control interface returned by TapoDevice factory
export type TapoDeviceControlInterface = {
    turnOn: (deviceId?: string) => Promise<void>;
    turnOff: (deviceId?: string) => Promise<void>;
    setBrightness: (brightnessLevel?: number) => Promise<void>;
    setColour: (colour?: string) => Promise<void>;
    setHSL: (hue: number, sat: number, lum: number) => Promise<void>;
    getDeviceInfo: () => Promise<TapoDeviceInfo>;
    getChildDevicesInfo: () => Promise<Array<TapoDeviceInfo>>;
    getEnergyUsage: () => Promise<any>;
    // Convenience methods following Python API pattern
    on: () => Promise<void>;
    off: () => Promise<void>;
    getCurrentPower?: () => Promise<any>;
    // Cleanup method for session management
    close?: () => Promise<void>;
}

export type TapoDeviceInfo = P105DeviceInfo;

export type TapoProtocol = {
    send: (request: any) => any
    close?: () => Promise<void>
}

export type TapoDeviceKey = {
    key: Buffer;
    iv: Buffer;
    deviceIp: string;
    sessionCookie: string;
    token?: string;
    sessionUUID?: string;  // Add session UUID for consistency
}

export type TapoVideoImage = {
    uri: string;
    length: number;
    uriExpiresAt: number;
}

export type TapoVideo = {
    uri: string;
    duration: number;
    m3u8: string;
    startTimestamp: number;
    uriExpiresAt: number;
}

export type TapoVideoPageItem = {
    uuid: string;
    video: TapoVideo[];
    image: TapoVideoImage[];
    createdTime: number;
    eventLocalTime: string;
}

export type TapoVideoList = {
    deviceId: string;
    total: number;
    page: number;
    pageSize: number;
    index: TapoVideoPageItem[];
}

/**
 *
 *
 * @export
 * @class tplinkTapoConnectWrapper
 */
export class tplinkTapoConnectWrapper {

    readonly currentWorkingDirectory: string = process.cwd();
    private static _instance: tplinkTapoConnectWrapper;

    /**
     *
     *
     * @static
     * @returns {tplinkTapoConnectWrapper}
     * @memberof tplinkTapoConnectWrapper
     */
    public static getInstance(): tplinkTapoConnectWrapper {
        if (!this._instance)
            this._instance = new tplinkTapoConnectWrapper();
        return this._instance;
    }

    /**
     *Creates an instance of tplinkTapoConnectWrapper.
    * @memberof tplinkTapoConnectWrapper
    */
    constructor() {
        // Initialization completed
    }


    /**
     * Clear all cached clients and their devices
     */
    public clearCache(): void {
        // Clear the device info cache
        DeviceFactory.clearDeviceInfoCache();
    }



    /**
     *
     *
     * @private
     * @param {object} obj
     * @returns {boolean}
     * @memberof tplinkTapoConnectWrapper
     */
    private isEmpty(obj: object): boolean {
        return !Object.keys(obj).length;
    }










    /**
     * Get device information including energy usage data for supported devices
     * The method will automatically detect the device type and retrieve basic device information
     * Energy usage data is included automatically for supported devices (P110, P115, etc.)
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >} - Contains device information and energy usage (if supported)
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfo(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('infoRetrieval', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: _email, password: _password };

                // Use lightweight generic method to get device info directly
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                // Check if device supports energy monitoring and add energy usage data
                let _tapoEnergyUsage: any = undefined;
                if (energyMonitoringModels.includes(_tapoDeviceInfo.model)) {
                    try {
                        const device = await DeviceFactory.createDevice(_targetIp, credentials, 'getEnergyUsage');
                        await device.connect();
                        _tapoEnergyUsage = await device.getEnergyUsage();
                        await device.disconnect();
                    } catch (energyError) {
                        // Energy usage retrieval failed, but don't fail the entire operation
                        console.log(`Warning: Could not retrieve energy usage for ${_tapoDeviceInfo.model}: ${energyError}`);
                    }
                }

                return {
                    result: true,
                    tapoDeviceInfo: _tapoDeviceInfo,
                    tapoEnergyUsage: _tapoEnergyUsage
                };
            } catch (error: any) {
                throw error;
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'getTapoDeviceInfo');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     * Get energy usage information for devices that support energy monitoring
     * First checks if the device supports energy monitoring, then retrieves energy data
     *
     * @deprecated Use getTapoDeviceInfo() instead, which now includes energy usage data for supported devices
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @return {*}  {Promise<tplinkTapoConnectWrapperType.tapoConnectResults>}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoEnergyUsage(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('energyMonitoring', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            try {
                const credentials: TapoCredentials = { username: _email, password: _password };

                // First, get device information to check energy monitoring support
                const deviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                // Check if device supports energy monitoring
                if (!energyMonitoringModels.includes(deviceInfo.model)) {
                    return {
                        result: false,
                        tapoDeviceInfo: deviceInfo,  // Include basic device info even for unsupported devices
                        errorInf: new Error(`Device model ${deviceInfo.model} does not support energy monitoring. Supported models: ${energyMonitoringModels.join(', ')}`)
                    };
                }

                // Device supports energy monitoring, proceed to get energy data
                const device = await DeviceFactory.createDevice(_targetIp, credentials, 'getEnergyUsage');
                await device.connect();

                try {
                    const _tapoEnergyUsage = await device.getEnergyUsage();
                    if (this.isEmpty(_tapoEnergyUsage)) {
                        return {
                            result: false,
                            tapoDeviceInfo: deviceInfo,
                            errorInf: new Error("Energy usage data not found.")
                        };
                    }
                    return {
                        result: true,
                        tapoDeviceInfo: deviceInfo,  // Include basic device info
                        tapoEnergyUsage: _tapoEnergyUsage  // Include energy usage data
                    };
                } finally {
                    // Disconnect the device
                    if (device && typeof device.disconnect === 'function') {
                        try {
                            await device.disconnect();
                        } catch (disconnectError) {
                            // Ignore disconnect errors
                        }
                    }
                }
            } catch (error: any) {
                // Handle unexpected errors (network, authentication, etc.)
                try {
                    const credentials: TapoCredentials = { username: _email, password: _password };
                    const deviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);
                    return {
                        result: false,
                        tapoDeviceInfo: deviceInfo,
                        errorInf: error
                    };
                } catch (deviceInfoError) {
                    // Even device info retrieval failed
                    return {
                        result: false,
                        errorInf: error
                    };
                }
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'getTapoEnergyUsage');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     *
     *
     * @param {string} _targetIp
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOn(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Create device with proper session management
                const credentials: TapoCredentials = { username: _email, password: _password };
                device = await DeviceFactory.createDevice(_targetIp, credentials, 'turnOn');
                await device.connect();

                // Device is connected, execute command
                await device.on();

                // Get device info for successful response
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            } finally {
                // Disconnect the device
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (disconnectError) {
                        // Ignore disconnect errors
                    }
                }
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'setTapoTurnOn');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     * set turn off
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOff(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Create device with proper session management
                const credentials: TapoCredentials = { username: _email, password: _password };
                device = await DeviceFactory.createDevice(_targetIp, credentials, 'turnOff');
                await device.connect();

                // Device is connected, execute command
                await device.off();

                // Get device info for successful response
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            } finally {
                // Disconnect the device
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (disconnectError) {
                        // Ignore disconnect errors
                    }
                }
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'setTapoTurnOff');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     * set brightness
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {number} _brightness
     * Note: Device type is automatically detected
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightness(_email: string, _password: string, _targetIp: string, _brightness: number, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                if (_brightness < 1 || _brightness > 100) {
                    throw new Error("Brightness must be between 1-100");
                }

                const credentials: TapoCredentials = { username: _email, password: _password };
                device = await DeviceFactory.createDevice(_targetIp, credentials, 'setBrightness');
                await device.connect();

                // Device is connected

                // Check if device supports brightness control
                if (typeof device.setBrightness !== 'function') {
                    throw new Error(`Device at ${_targetIp} does not support brightness control. This feature is only available for bulb devices (L510, L520, L530).`);
                }

                // Set brightness
                await device.setBrightness(_brightness);

                // Get device info for successful response
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            } finally {
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (closeError) {
                        // Ignore close errors
                    }
                }
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'setTapoBrightness');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     * Set color using named color
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {string} _colour - Named color (red, green, blue, etc.)
     * Note: Device type is automatically detected
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColour(_email: string, _password: string, _targetIp: string, _colour: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                if (_colour === "") {
                    throw new Error("Color value cannot be empty");
                }

                const credentials: TapoCredentials = { username: _email, password: _password };
                device = await DeviceFactory.createDevice(_targetIp, credentials, 'setColor');
                await device.connect();

                // Device is connected

                // Check if device supports color control
                if (typeof device.setNamedColor !== 'function') {
                    throw new Error(`Device at ${_targetIp} does not support color control. This feature is only available for color bulb devices (L530).`);
                }

                // Set named color
                await device.setNamedColor(_colour);

                // Get device info for successful response
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
            } catch (error: any) {
                throw error;
            } finally {
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (closeError) {
                        // Ignore close errors
                    }
                }
            }
        };

        // Execute with or without retry
        if (retryConfig) {
            const retryHandler = new TapoRetryHandler(retryConfig);
            const result = await retryHandler.execute(operation, 'setTapoColour');

            if (result.success) {
                return result.data!;
            } else {
                return { result: false, errorInf: result.error! };
            }
        } else {
            try {
                return await operation();
            } catch (error: any) {
                return { result: false, errorInf: error };
            }
        }
    }

    /**
     * Batch operations with smart delays to prevent KLAP -1012 errors
     * Migrated from Enhanced Wrapper for consistency
     */
    public async executeBatch(
        operations: Array<{
            operation: () => Promise<tplinkTapoConnectWrapperType.tapoConnectResults>;
            name: string;
            delayAfter?: number;
        }>,
        options: {
            defaultDelay?: number;
            retryOptions?: RetryOptions;
        } = {}
    ): Promise<Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }>> {
        const results: Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }> = [];
        const defaultDelay = options.defaultDelay || 2000;

        for (let i = 0; i < operations.length; i++) {
            const operationItem = operations[i];
            if (!operationItem) continue;

            const { operation, name, delayAfter } = operationItem;
            const startTime = Date.now();

            try {
                console.log(`\n--- Executing batch operation: ${name} ---`);

                const data = await operation();
                const duration = Date.now() - startTime;

                const result: { name: string; success: boolean; data?: any; error?: Error; duration?: number } = {
                    name,
                    success: data.result,
                    duration
                };

                if (data.result) {
                    result.data = data;
                } else if (data.errorInf) {
                    result.error = data.errorInf;
                }

                results.push(result);

                // Add delay after operation (except for the last one)
                if (i < operations.length - 1) {
                    const delay = delayAfter !== undefined ? delayAfter : defaultDelay;
                    if (delay > 0) {
                        console.log(`⏳ Waiting ${delay}ms before next operation...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }

            } catch (error) {
                const duration = Date.now() - startTime;
                results.push({
                    name,
                    success: false,
                    error: error as Error,
                    duration
                });
            }
        }

        return results;
    }
}
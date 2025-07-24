import { TapoConnect, TapoCredentials } from '../index';
import { TapoDeviceInfo as P105DeviceInfo } from '../types';
import { RetryOptions, createRetryConfig } from '../types/retry-options';
import { TapoRetryHandler } from '../utils/retry-utils';
import find from 'local-devices';

/* Device list that supports energy usage */
const supportEnergyUsage = [
    "P110",
    "P115",
    "KP115",
    "KP125"
];

// Supported device types
export type TapoDeviceType = 'P100' | 'P105' | 'P110' | 'P115' | 'L510' | 'L520' | 'L530' | 'auto';

// Device factory to create appropriate device instances
class DeviceFactory {
    static createDevice(deviceType: TapoDeviceType, ip: string, credentials: TapoCredentials, methodHint?: string): any {
        let actualDeviceType = deviceType;

        // Auto-select device type based on method hint
        if (deviceType === 'auto' && methodHint) {
            actualDeviceType = this.getDeviceTypeForMethod(methodHint);
        } else if (deviceType === 'auto') {
            // Default to P105 for basic operations
            actualDeviceType = 'P105';
        }

        switch (actualDeviceType) {
            case 'P100':
                return TapoConnect.createP100Plug(ip, credentials);
            case 'P105':
                return TapoConnect.createP100Plug(ip, credentials);
            case 'P110':
                return TapoConnect.createP110Plug(ip, credentials);
            case 'P115':
                return TapoConnect.createP110Plug(ip, credentials);
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

// Simple ApiClient replacement for cloud device list functionality
class ApiClient {
    private username: string;
    private password: string;
    private deviceCache: Map<string, any> = new Map();

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    async getDeviceList(): Promise<TapoDevice[]> {
        // Note: This is a placeholder implementation
        // The original cloud API functionality would require reverse engineering
        // For now, return empty array - users should use device discovery instead
        throw new Error("Cloud device list API not implemented. Use device discovery instead.");
    }

    async p105(ip: string, deviceType: TapoDeviceType = 'P105'): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        return DeviceFactory.createDevice(deviceType, ip, credentials);
    }

    async l530(ip: string, deviceType: TapoDeviceType = 'P105'): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        // For now, use specified device type as fallback - L530 bulb support can be added later
        return DeviceFactory.createDevice(deviceType, ip, credentials);
    }

    async createDevice(ip: string, deviceType: TapoDeviceType, methodHint?: string, autoConnect: boolean = true): Promise<any> {
        // Use IP and deviceType as primary cache key, ignore methodHint for session reuse
        const primaryCacheKey = `${ip}-${deviceType}`;

        // Check if we already have a connected device for this IP and type
        if (this.deviceCache.has(primaryCacheKey)) {
            const cachedDevice = this.deviceCache.get(primaryCacheKey);
            // Check if device is still authenticated
            try {
                if (cachedDevice && typeof cachedDevice.isAuthenticated === 'function' && cachedDevice.isAuthenticated()) {
                    console.log(`Using cached connected device for ${ip} (session reuse)`);
                    return cachedDevice;
                }
            } catch (error) {
                console.log(`Cached device invalid, removing from cache:`, error);
                this.deviceCache.delete(primaryCacheKey);
            }
        }

        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };

        const device = DeviceFactory.createDevice(deviceType, ip, credentials, methodHint);

        // Auto-connect if requested
        if (autoConnect) {
            try {
                await device.connect();
                console.log(`New device connected and cached for ${ip}`);
            } catch (error) {
                console.log(`Failed to connect device ${ip}:`, error);
                throw error;
            }
        }

        this.deviceCache.set(primaryCacheKey, device);
        return device;
    }

    clearDeviceCache(): void {
        // Disconnect all cached devices
        for (const device of this.deviceCache.values()) {
            if (device && typeof device.disconnect === 'function') {
                try {
                    device.disconnect();
                } catch (error) {
                    // Ignore disconnect errors
                }
            }
        }
        this.deviceCache.clear();
    }
}

export namespace tplinkTapoConnectWrapperType {
    export type tapoConnectResults = {
        result: boolean;
        tapoDeviceInfo?: TapoDeviceInfo;
        tapoDevice?: TapoDevice[];
        tapoEnergyUsage?: TapoDeviceInfo | undefined;
        errorInf?: Error;
    }
}

export type TapoDevice = {
    deviceType: string;
    fwVer: string;
    appServerUrl: string;
    deviceRegion: string;
    deviceId: string;
    deviceName: string;
    deviceHwVer: string;
    alias: string;
    deviceMac: string;
    oemId: string;
    deviceModel: string;
    hwId: string;
    fwId: string;
    isSameRegion: boolean;
    status: number;

    ip?: string
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
    private clientCache: Map<string, ApiClient> = new Map();

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
     * Get or create a cached ApiClient for given credentials
     */
    private getApiClient(email: string, password: string): ApiClient {
        const clientKey = `${email}:${password}`;

        if (!this.clientCache.has(clientKey)) {
            const client = new ApiClient(email, password);
            this.clientCache.set(clientKey, client);
        }

        return this.clientCache.get(clientKey)!;
    }

    /**
     * Clear all cached clients and their devices
     */
    public clearCache(): void {
        for (const client of this.clientCache.values()) {
            if (client && typeof client.clearDeviceCache === 'function') {
                client.clearDeviceCache();
            }
        }
        this.clientCache.clear();
    }

    /**
     *
     *
     * @private
     * @param {string} _macAddress
     * @returns {string}
     * @memberof tplinkTapoConnectWrapper
     */
    private replaceMacAddress(_macAddress: string): string {
        return _macAddress.replace(/[:-]/g, '').toUpperCase();
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
     *
     *
     * @private
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns
     * @memberof tplinkTapoConnectWrapper
     */
    private async getDeviceIpFromAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string) {
        let _deviceIp: string = "";
        const _devices: TapoDevice[] | undefined = await this.getTapoDevicesList(_email, _password) || undefined;
        if (_devices !== undefined) {
            for (const _items of _devices) {
                if (_items.alias === _alias) {
                    const _discover = await find({ address: _rangeOfIp });
                    _deviceIp = _discover?.find((_device) =>
                        this.replaceMacAddress(_device.mac) === this.replaceMacAddress(_items.deviceMac))?.ip || "";
                    break;
                }
            }
        } else {
            throw new Error("Failed to get tapo device list.");
        }
        return _deviceIp;
    }

    /**
     * getDeviceIp
     *
     * @private
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns
     * @memberof tplinkTapoConnectWrapper
     */
    private async getDeviceIp(_email: string, _password: string, _alias: string, _rangeOfIp: string) {
        const _targetIp: string = await this.getDeviceIpFromAlias(_email, _password, _alias, _rangeOfIp) || "";
        if (_targetIp === "") {
            throw new Error("Failed to get tapo ip address.");
        }
        return _targetIp;
    }

    /**
     *
     *
     * @param {string} [_email=process.env.TAPO_USERNAME || ""]
     * @param {string} _password
     * @returns {(Promise< tapo.TapoDevice[] | undefined >)}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDevicesList(_email: string = process.env['TAPO_USERNAME'] || "", _password: string): Promise<TapoDevice[] | undefined> {
        try {
            const client = this.getApiClient(_email, _password);
            const _devices = await client.getDeviceList();
            return _devices;
        } catch (error) {
            throw new Error("Failed to get tapo device list.");
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOnAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp) || ""
            if (_targetIp === "") {
                throw new Error("Failed to get tapo ip address.");
            }
            return await this.setTapoTurnOn(_email, _password, _targetIp);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOffAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            return await this.setTapoTurnOff(_email, _password, _targetIp);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @param {number} _brightness
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightnessAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string, _brightness: number): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            return await this.setTapoBrightness(_email, _password, _targetIp, _brightness);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     * 
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @param {string} _colour
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColourAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string, _colour: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            if (_colour === "") {
                throw "Incorrect colour value";
            }
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            await this.setTapoColour(_email, _password, _targetIp, _colour);
            return { result: true };
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfoAlias(_email: string, _password: string, _alias: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const client = this.getApiClient(_email, _password);
            const _devices = await client.getDeviceList();
            for (const _items of _devices) {
                if (_items.alias === _alias) {
                    if (!_items.ip) {
                        throw new Error("Device IP not found.");
                    }
                    return await this.getTapoDeviceInfo(_email, _password, _items.ip);
                }
            }
            throw new Error("Device with alias not found.");
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {TapoDeviceType} _deviceType - Device type identifier (P100, P105, P110, P115, auto)
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfo(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('infoRetrieval', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                let _tapoConnectResults: tplinkTapoConnectWrapperType.tapoConnectResults = { result: false };

                // Use cached ApiClient with proper session management
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'getDeviceInfo', true); // autoConnect=true

                // Device is already connected

                // get DeviceInfo
                const _tapoDeviceInfo: TapoDeviceInfo = await device.getDeviceInfo();
                if (this.isEmpty(_tapoDeviceInfo)) {
                    throw new Error("tapo device info not found.");
                }
                _tapoConnectResults.tapoDeviceInfo = _tapoDeviceInfo;

                // get EnergyUsage
                if (supportEnergyUsage.includes(_tapoDeviceInfo.model)) {
                    const _tapoEnergyUsage = await device.getEnergyUsage();
                    if (this.isEmpty(_tapoEnergyUsage)) {
                        throw new Error("tapo device energy not found.");
                    }
                    _tapoConnectResults.tapoEnergyUsage = _tapoEnergyUsage;
                }
                _tapoConnectResults.result = true;
                return _tapoConnectResults;
            } catch (error: any) {
                throw error;
            } finally {
                // Keep session alive for reuse - don't disconnect
                // Device will manage its own session lifecycle
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
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @return {*}  {Promise<tplinkTapoConnectWrapperType.tapoConnectResults>}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoEnergyUsage(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'P110', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('energyMonitoring', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Use cached ApiClient for energy monitoring functionality
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'getEnergyUsage', true); // autoConnect=true

                // Device is already connected via createDevice

                // get EnergyUsage
                const _tapoEnergyUsage = await device.getEnergyUsage();
                if (this.isEmpty(_tapoEnergyUsage)) {
                    throw new Error("tapo device energy not found.");
                }
                return { result: true, tapoDeviceInfo: _tapoEnergyUsage };
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
    public async setTapoTurnOn(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Use cached ApiClient with proper session management
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'turnOn', true); // autoConnect=true

                // Device is already connected, just execute command
                await device.on();
                return { result: true };
            } catch (error: any) {
                throw error;
            } finally {
                // Keep session alive for reuse - don't disconnect immediately
                // Session will be managed by device cache
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
    public async setTapoTurnOff(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Use cached ApiClient with proper session management
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'turnOff', true); // autoConnect=true

                // Device is already connected, just execute command
                await device.off();
                return { result: true };
            } catch (error: any) {
                throw error;
            } finally {
                // Keep session alive for reuse - don't disconnect immediately
                // Session will be managed by device cache
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
     * @param {TapoDeviceType} _deviceType - Device type identifier (auto-detects bulb type)
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightness(_email: string, _password: string, _targetIp: string, _brightness: number, _deviceType: TapoDeviceType = 'auto', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                if (_brightness < 1 || _brightness > 100) {
                    throw new Error("Brightness must be between 1-100");
                }

                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'setBrightness', true); // autoConnect=true

                // Device is already connected via createDevice

                // Set brightness
                await device.setBrightness(_brightness);
                return { result: true };
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
     * @param {TapoDeviceType} _deviceType - Device type identifier (auto-detects to L530)
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColour(_email: string, _password: string, _targetIp: string, _colour: string, _deviceType: TapoDeviceType = 'auto', _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                if (_colour === "") {
                    throw new Error("Color value cannot be empty");
                }

                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'setColor', true); // autoConnect=true

                // Device is already connected via createDevice

                // Set named color
                await device.setNamedColor(_colour);
                return { result: true };
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
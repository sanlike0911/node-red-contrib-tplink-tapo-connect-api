import { TapoConnect, TapoCredentials } from '../index';
import { TapoDeviceInfo as P105DeviceInfo } from '../types';
import { RetryOptions, createRetryConfig } from '../types/retry-options';
import { TapoRetryHandler } from '../utils/retry-utils';
import { GenericDeviceInfoRetriever } from '../devices/generic-device-info';
import find from 'local-devices';

/**
 * Regional cloud endpoints for Tapo cloud API access
 * Multiple endpoints are provided as fallback options
 */
const cloudEndpoints = [
    'https://wap.tplinkcloud.com',
    'https://eu-wap.tplinkcloud.com',
    'https://use1-wap.tplinkcloud.com',
    'https://n-euw1-wap-gw.tplinkcloud.com'
];

/**
 * Disable SSL certificate verification for cloud API calls
 * Required for some corporate environments and older certificates
 */
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Import energy monitoring models from plugs types to avoid duplication
import { energyMonitoringModels } from '../types/plugs';

/**
 * Supported Tapo device types for internal use
 * Used by the device factory for automatic device type detection and instantiation
 */
export type TapoDeviceType = 'P100' | 'P105' | 'P110' | 'P115' | 'L510' | 'L520' | 'L530' | 'UNKNOWN';

// Cloud API response types
interface CloudAuthResponse {
    error_code: number;
    msg?: string;
    result: {
        regTime: string;
        email: string;
        token: string;
    };
}

interface CloudDevice {
    appServerUrl: string;
    isSameRegion: boolean;
    deviceMac: string;
    status: number;
    hwId: string;
    deviceId: string;
    oemId: string;
    fwVer: string;
    deviceType: string;
    alias: string;
    fwId: string;
    deviceName: string;
    deviceHwVer: string;
    role: number;
    deviceModel: string;
    deviceRegion?: string;
}

interface CloudDeviceListResponse {
    error_code: number;
    msg?: string;
    result: {
        deviceList: CloudDevice[];
    };
}

interface CloudToken {
    token: string;
    listDevices: () => Promise<TapoDevice[]>;
    listDevicesByType: (deviceType: string) => Promise<TapoDevice[]>;
}

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

        // Infer device type based on model and device type strings
        if (deviceType === 'SMART.TAPOPLUG') {
            if (energyMonitoringModels.includes(model)) {
                return model.startsWith('P110') ? 'P110' : 'P115';
            }
            return 'UNKNOWN';
        }

        // Detect bulb devices
        if (deviceType === 'SMART.TAPOBULB' || deviceType?.includes('BULB')) {
            if (model.startsWith('L510')) return 'L510';
            if (model.startsWith('L520')) return 'L520';
            if (model.startsWith('L530')) return 'L530';
        }

        // Fallback detection based on model name
        if (model.startsWith('L510')) return 'L510';
        if (model.startsWith('L520')) return 'L520';
        if (model.startsWith('L530')) return 'L530';
        if (model.startsWith('P110')) return 'P110';
        if (model.startsWith('P115')) return 'P115';

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

// Simple ApiClient replacement for cloud device list functionality
class ApiClient {
    private username: string;
    private password: string;
    private deviceCache: Map<string, any> = new Map();

    // Rate limiting and cooldown management
    private static rateLimitCooldowns: Map<string, number> = new Map();
    private static readonly RATE_LIMIT_COOLDOWN = 300000; // 5 minutes
    private static readonly AUTH_FAILURE_COOLDOWN = 60000; // 1 minute for auth failures

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    async getDeviceList(): Promise<TapoDevice[]> {
        // Check rate limiting before attempting API calls
        const cooldownKey = this.username.toLowerCase();
        const now = Date.now();
        const cooldownUntil = ApiClient.rateLimitCooldowns.get(cooldownKey);

        if (cooldownUntil && now < cooldownUntil) {
            const remainingTime = Math.ceil((cooldownUntil - now) / 1000);
            throw new Error(
                `⏳ Rate limit cooldown active. Please wait ${remainingTime} seconds before trying again.\n` +
                `   This cooldown prevents API abuse and account blocking.`
            );
        }

        try {
            console.log('🔍 Attempting Tapo Cloud API connection...');

            // Use the working implementation pattern from test_src
            const cloudToken = await this.authenticateAndGetToken();

            if (!cloudToken) {
                throw new Error("Failed to get tapo cloud token.");
            }

            const devices = await this.fetchDevicesFromCloud(cloudToken);

            if (!devices || devices.length === 0) {
                console.log('📋 No Tapo devices found in cloud account');
                console.log('💡 Trying local network discovery as fallback...');

                // Fallback to local network discovery using MAC filtering
                return await this.discoverLocalDevicesWithMacFilter();
            }

            console.log(`✅ Found ${devices.length} Tapo device(s) via cloud API`);
            ApiClient.rateLimitCooldowns.delete(cooldownKey);
            return devices;

        } catch (error) {
            console.error('Cloud API failed, trying local discovery:', error);

            // Apply cooldown based on error type
            this.handleErrorCooldown(error as Error, cooldownKey);

            // Fallback to local network discovery
            try {
                return await this.discoverLocalDevicesWithMacFilter();
            } catch (localError) {
                throw new Error(`Both cloud and local discovery failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    /**
     * Discover Tapo devices using MAC address filtering (test_src pattern)
     */
    private async discoverLocalDevicesWithMacFilter(): Promise<TapoDevice[]> {
        console.log('🔍 Scanning local network for Tapo devices using MAC filtering...');

        try {
            // Get list of devices on local network with MAC resolution
            const localDevices = await find({ skipNameResolution: true });

            console.log(`📡 Found ${localDevices.length} devices on local network`);

            // Filter devices by Tapo MAC address prefix (from test_src)
            const tapoDevices = localDevices.filter(device => this.isTapoMac(device.mac));

            console.log(`🎯 Found ${tapoDevices.length} potential Tapo device(s) by MAC filtering`);

            if (tapoDevices.length === 0) {
                console.log('💡 No Tapo devices found by MAC filtering. This could mean:');
                console.log('   - No Tapo devices on this network');
                console.log('   - Devices have different MAC prefixes');
                console.log('   - Network discovery limitations');
                return [];
            }

            // Try to authenticate and get device info for filtered devices
            const devicePromises = tapoDevices.map(async (device) => {
                if (!device.ip) return null;

                try {
                    console.log(`🔗 Attempting to connect to Tapo device at ${device.ip} (MAC: ${device.mac})`);

                    const credentials = { username: this.username, password: this.password };
                    const deviceInfo = await this.tryGetDeviceInfo(device.ip, credentials);

                    if (deviceInfo) {
                        console.log(`✅ Successfully connected to ${deviceInfo.model} at ${device.ip}`);

                        return {
                            deviceType: this.mapLocalDeviceType(deviceInfo.type || deviceInfo.model),
                            fwVer: deviceInfo.fw_ver || 'Unknown',
                            appServerUrl: 'local',
                            deviceRegion: 'local',
                            deviceId: deviceInfo.device_id || device.ip,
                            deviceName: deviceInfo.nickname || device.name || 'Unknown Device',
                            deviceHwVer: deviceInfo.hw_ver || 'Unknown',
                            alias: deviceInfo.nickname || device.name || device.ip,
                            deviceMac: device.mac,
                            oemId: deviceInfo.oem_id || 'Unknown',
                            deviceModel: deviceInfo.model || 'Unknown',
                            hwId: deviceInfo.hw_id || 'Unknown',
                            fwId: deviceInfo.fw_id || 'Unknown',
                            isSameRegion: true,
                            status: deviceInfo.device_on ? 1 : 0,
                            ip: device.ip
                        } as TapoDevice;
                    }
                } catch (error) {
                    console.log(`❌ Failed to connect to device at ${device.ip}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return null;
                }
                return null;
            });

            const results = await Promise.all(devicePromises);
            const validDevices = results.filter(device => device !== null) as TapoDevice[];

            console.log(`🎉 Successfully discovered ${validDevices.length} accessible Tapo device(s)`);

            return validDevices;

        } catch (error) {
            console.error('Local device discovery with MAC filtering failed:', error);
            throw new Error(`MAC-filtered discovery failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check if MAC address is from a Tapo device (from test_src pattern)
     */
    private isTapoMac(mac: string): boolean {
        if (!mac) return false;
        return mac.toLowerCase().startsWith("84:d8:1b");
    }

    /**
     * Map local device type to cloud device type format
     */
    private mapLocalDeviceType(deviceType: string): string {
        if (!deviceType) return 'UNKNOWN';

        // Map device models to cloud types
        const typeMapping: Record<string, string> = {
            'P100': 'SMART.TAPOPLUG',
            'P105': 'SMART.TAPOPLUG',
            'P110': 'SMART.TAPOPLUG',
            'P115': 'SMART.TAPOPLUG',
            'L510': 'SMART.TAPOBULB',
            'L520': 'SMART.TAPOBULB',
            'L530': 'SMART.TAPOBULB',
            'L535': 'SMART.TAPOBULB',
            'L610': 'SMART.TAPOBULB',
            'L630': 'SMART.TAPOBULB'
        };

        // Check if deviceType contains known model
        for (const [model, cloudType] of Object.entries(typeMapping)) {
            if (deviceType.includes(model)) {
                return cloudType;
            }
        }

        // Default mapping based on type string
        if (deviceType.includes('TAPOPLUG') || deviceType.includes('plug')) {
            return 'SMART.TAPOPLUG';
        } else if (deviceType.includes('TAPOBULB') || deviceType.includes('bulb')) {
            return 'SMART.TAPOBULB';
        }

        return deviceType;
    }

    /**
     * Try to get device info from a specific IP to identify Tapo devices
     */
    private async tryGetDeviceInfo(ip: string, credentials: any): Promise<any | null> {
        try {
            const deviceInfoRetriever = new GenericDeviceInfoRetriever(ip, credentials);
            await deviceInfoRetriever.connect();
            const deviceInfo = await deviceInfoRetriever.getDeviceInfo();
            await deviceInfoRetriever.disconnect();

            // Check if this looks like a Tapo device
            if (deviceInfo && (deviceInfo.model?.includes('P1') ||
                deviceInfo.model?.includes('L5') ||
                deviceInfo.model?.includes('L6') ||
                deviceInfo.type?.includes('TAPO'))) {
                return deviceInfo;
            }

            return null;
        } catch (error) {
            // Not a Tapo device or not accessible with these credentials
            return null;
        }
    }

    /**
     * Authenticate using the working pattern from test_src
     */
    private async authenticateAndGetToken(): Promise<CloudToken | null> {
        const uuid = this.generateUUID();

        // Use the older API format that doesn't require signature
        const authPayload = {
            method: "login",
            params: {
                appType: "Kasa_Android",
                cloudUserName: this.username.toLowerCase(),
                cloudPassword: this.password,
                terminalUUID: uuid
            }
        };

        const requestBody = JSON.stringify(authPayload);

        try {
            const cloudLoginUrl = cloudEndpoints[0]!;
            console.log(`🔐 Authenticating with ${cloudLoginUrl}...`);

            const response = await fetch(cloudLoginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Tapo TypeScript Client'
                },
                body: requestBody
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as CloudAuthResponse;

            if (data.error_code !== 0) {
                throw new Error(`Authentication error: ${data.msg || 'Unknown error'} (code: ${data.error_code})`);
            }

            if (!data.result || !data.result.token) {
                throw new Error('No token received from authentication');
            }

            console.log('✅ Cloud authentication successful');

            // Return cloud token object similar to test_src pattern
            return {
                token: data.result.token,
                listDevices: () => this.listDevicesWithToken(data.result.token),
                listDevicesByType: (deviceType: string) => this.listDevicesByTypeWithToken(data.result.token, deviceType)
            };

        } catch (error) {
            console.log(`❌ Cloud authentication failed: ${error}`);
            throw error;
        }
    }

    /**
     * List devices using cloud token
     */
    private async listDevicesWithToken(token: string): Promise<TapoDevice[]> {
        const getDeviceRequest = {
            method: "getDeviceList"
        };

        const response = await fetch(`https://eu-wap.tplinkcloud.com/?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Tapo TypeScript Client'
            },
            body: JSON.stringify(getDeviceRequest)
        });

        if (!response.ok) {
            throw new Error(`Failed to get device list: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as CloudDeviceListResponse;

        if (data.error_code !== 0) {
            throw new Error(`Device list error: ${data.msg || 'Unknown error'} (code: ${data.error_code})`);
        }

        if (!data.result || !data.result.deviceList) {
            return [];
        }

        return data.result.deviceList.map((cloudDevice: CloudDevice) => ({
            deviceType: this.mapCloudDeviceType(cloudDevice.deviceType),
            fwVer: cloudDevice.fwVer,
            appServerUrl: cloudDevice.appServerUrl,
            deviceRegion: cloudDevice.deviceRegion || 'unknown',
            deviceId: cloudDevice.deviceId,
            deviceName: cloudDevice.deviceName,
            deviceHwVer: cloudDevice.deviceHwVer,
            alias: cloudDevice.alias,
            deviceMac: cloudDevice.deviceMac,
            oemId: cloudDevice.oemId,
            deviceModel: cloudDevice.deviceModel,
            hwId: cloudDevice.hwId,
            fwId: cloudDevice.fwId,
            isSameRegion: cloudDevice.isSameRegion,
            status: cloudDevice.status
        }));
    }

    /**
     * List devices by type using cloud token (like test_src pattern)
     */
    private async listDevicesByTypeWithToken(token: string, deviceType: string): Promise<TapoDevice[]> {
        const devices = await this.listDevicesWithToken(token);
        return devices.filter(d => d.deviceType === deviceType);
    }

    /**
     * Fetch devices from cloud using token object
     */
    private async fetchDevicesFromCloud(cloudToken: CloudToken): Promise<TapoDevice[]> {
        try {
            // Use listDevicesByType like test_src implementation
            return await cloudToken.listDevicesByType('SMART.TAPOPLUG');
        } catch (error) {
            console.log('Failed to fetch devices by type, trying all devices...');
            return await cloudToken.listDevices();
        }
    }


    /**
     * Map cloud API device types to our internal TapoDeviceType
     */
    private mapCloudDeviceType(cloudDeviceType: string): string {
        const typeMapping: Record<string, string> = {
            'IOT.SMARTPLUGSWITCH': 'SMART.TAPOPLUG',
            'IOT.SMARTBULB': 'SMART.TAPOBULB',
            'IOT.LIGHTSTRIP': 'SMART.TAPOSTRIP',
            'SMART.TAPOHUB': 'SMART.TAPOHUB',
            'SMART.TAPOSWITCH': 'SMART.TAPOSWITCH'
        };

        return typeMapping[cloudDeviceType] || cloudDeviceType;
    }

    /**
     * Handle error-based cooldowns to prevent API abuse
     */
    private handleErrorCooldown(error: Error, cooldownKey: string): void {
        const now = Date.now();
        const errorMessage = error.message.toLowerCase();

        // Check for specific error types that require cooldowns
        if (errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('-20665') || // Rate limit error code
            errorMessage.includes('-20671')) { // API limit error code

            // Apply longer cooldown for rate limit errors
            ApiClient.rateLimitCooldowns.set(cooldownKey, now + ApiClient.RATE_LIMIT_COOLDOWN);
            console.log(`🛑 Rate limit detected. Cooldown applied for 5 minutes.`);

        } else if (errorMessage.includes('account not found') ||
            errorMessage.includes('-20600') ||
            errorMessage.includes('authentication failed')) {

            // Apply shorter cooldown for authentication failures
            ApiClient.rateLimitCooldowns.set(cooldownKey, now + ApiClient.AUTH_FAILURE_COOLDOWN);
            console.log(`⏸️  Authentication failure detected. Cooldown applied for 1 minute.`);

        } else if (errorMessage.includes('server error') ||
            errorMessage.includes('503') ||
            errorMessage.includes('502')) {

            // Apply moderate cooldown for server errors
            ApiClient.rateLimitCooldowns.set(cooldownKey, now + (ApiClient.AUTH_FAILURE_COOLDOWN * 2));
            console.log(`🔧 Server error detected. Cooldown applied for 2 minutes.`);
        }

        // Note: Other errors don't trigger cooldowns to allow immediate retry for transient issues
    }

    /**
     * Get remaining cooldown time for debugging
     */
    public static getRemainingCooldown(username: string): number {
        const cooldownKey = username.toLowerCase();
        const cooldownUntil = ApiClient.rateLimitCooldowns.get(cooldownKey);

        if (!cooldownUntil) return 0;

        const remaining = Math.max(0, cooldownUntil - Date.now());
        return Math.ceil(remaining / 1000); // Return seconds
    }

    /**
     * Clear cooldown for a specific user (for testing or manual override)
     */
    public static clearCooldown(username: string): void {
        const cooldownKey = username.toLowerCase();
        ApiClient.rateLimitCooldowns.delete(cooldownKey);
        console.log(`🔄 Cooldown cleared for ${username}`);
    }

    /**
     * Generate UUID v4 for authentication
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create device instance for any supported Tapo device
     * Device type is automatically detected
     * @param ip Device IP address
     * @returns Device instance
     */
    async createDeviceByIp(ip: string): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        return DeviceFactory.createDevice(ip, credentials);
    }

    async createDevice(ip: string, methodHint?: string, autoConnect: boolean = true): Promise<any> {
        // Use IP as primary cache key for session reuse
        const primaryCacheKey = `${ip}-auto`;

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

        const device = await DeviceFactory.createDevice(ip, credentials, methodHint);

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

        // Also clear the device info cache
        DeviceFactory.clearDeviceInfoCache();
    }

    /**
     * Check if cloud API is in cooldown for given credentials
     */
    public isCloudApiInCooldown(email: string): boolean {
        return ApiClient.getRemainingCooldown(email) > 0;
    }

    /**
     * Get remaining cooldown time for cloud API
     */
    public getCloudApiCooldownTime(email: string): number {
        return ApiClient.getRemainingCooldown(email);
    }

    /**
     * Clear cloud API cooldown (use with caution)
     */
    public clearCloudApiCooldown(email: string): void {
        ApiClient.clearCooldown(email);
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
            console.log(`🔍 Getting Tapo devices list for ${_email}...`);

            const client = this.getApiClient(_email, _password);
            const _devices = await client.getDeviceList();

            if (_devices && _devices.length > 0) {
                console.log(`✅ Found ${_devices.length} Tapo device(s)`);
                _devices.forEach((device, index) => {
                    console.log(`   ${index + 1}. ${device.alias} (${device.deviceModel}) - ${device.ip || device.appServerUrl}`);
                });
            } else {
                console.log('ℹ️  No Tapo devices found');
            }

            return _devices;
        } catch (error) {
            console.error('getTapoDevicesList error:', error);

            // For compatibility, return empty array instead of throwing
            // This allows the caller to handle the empty result gracefully
            console.log('📋 Returning empty device list due to error');
            return [];
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
            return await this.setTapoColour(_email, _password, _targetIp, _colour);
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
     * Get device information without needing to specify device type
     * The method will automatically detect the device type and retrieve basic device information only
     * For energy usage information, use getTapoEnergyUsage() separately
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >} - Contains only basic device information
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

                return {
                    result: true,
                    tapoDeviceInfo: _tapoDeviceInfo
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
                const client = this.getApiClient(_email, _password);
                const device = await client.createDevice(_targetIp, 'getEnergyUsage', true);

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
                    // Energy device session is managed by cache - cleanup handled automatically
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
                // Use cached ApiClient with proper session management
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, 'turnOn', true); // autoConnect=true

                // Device is already connected, just execute command
                await device.on();

                // Get device info for successful response
                const credentials: TapoCredentials = { username: _email, password: _password };
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
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
    public async setTapoTurnOff(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Create retry configuration
        const retryConfig = createRetryConfig('deviceControl', _retryOptions);

        // Define the operation to potentially retry
        const operation = async (): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> => {
            let device = null;
            try {
                // Use cached ApiClient with proper session management
                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, 'turnOff', true); // autoConnect=true

                // Device is already connected, just execute command
                await device.off();

                // Get device info for successful response
                const credentials: TapoCredentials = { username: _email, password: _password };
                const _tapoDeviceInfo = await DeviceFactory.getDeviceInfo(_targetIp, credentials);

                return { result: true, tapoDeviceInfo: _tapoDeviceInfo };
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

                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, 'setBrightness', true); // autoConnect=true

                // Device is already connected via createDevice

                // Check if device supports brightness control
                if (typeof device.setBrightness !== 'function') {
                    throw new Error(`Device at ${_targetIp} does not support brightness control. This feature is only available for bulb devices (L510, L520, L530).`);
                }

                // Set brightness
                await device.setBrightness(_brightness);

                // Get device info for successful response
                const credentials: TapoCredentials = { username: _email, password: _password };
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

                const client = this.getApiClient(_email, _password);
                device = await client.createDevice(_targetIp, 'setColor', true); // autoConnect=true

                // Device is already connected via createDevice

                // Check if device supports color control
                if (typeof device.setNamedColor !== 'function') {
                    throw new Error(`Device at ${_targetIp} does not support color control. This feature is only available for color bulb devices (L530).`);
                }

                // Set named color
                await device.setNamedColor(_colour);

                // Get device info for successful response
                const credentials: TapoCredentials = { username: _email, password: _password };
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
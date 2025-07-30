import { TapoCredentials } from '../types';
import { TapoDeviceInfo } from '../types';
import { GenericDeviceInfoRetriever } from '../devices/generic-device-info';
import { inferTapoDeviceType } from '../types/device-common';
import { TapoDeviceType } from '../types/device-types';
import { BaseDevice } from '../devices/base-device';
import { PlugDevice } from '../devices/plug-device';
import { BulbDevice } from '../devices/bulb-device';

/**
 * Factory class for creating appropriate Tapo device instances
 * Handles automatic device type detection and caching for optimal performance
 */
export class DeviceFactory {
    /** Device information cache to minimize redundant API calls */
    private static genericInfoCache: Map<string, { info: TapoDeviceInfo; timestamp: number }> = new Map();
    /** Cache TTL in milliseconds (30 seconds) */
    private static readonly CACHE_TTL = 30000;

    /**
     * Get device information using lightweight generic retriever
     * @param ip Device IP address
     * @param credentials Authentication credentials
     * @param useCache Whether to use cached results (default: true)
     * @returns Device information
     */
    static async getDeviceInfo(ip: string, credentials: TapoCredentials, useCache: boolean = true): Promise<TapoDeviceInfo> {
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
     * Create device instance with automatic device type detection
     * Always detects the device type first, then creates the appropriate device instance
     * @param ip Device IP address
     * @param credentials Authentication credentials
     * @param methodHint Optional method hint for better type inference (fallback only)
     * @returns Device instance
     */
    static async createDevice(ip: string, credentials: TapoCredentials, methodHint?: string): Promise<BaseDevice> {
        try {
            // Always get device info first to determine the correct device type
            const deviceInfo = await this.getDeviceInfo(ip, credentials);
            const actualDeviceType = inferTapoDeviceType(deviceInfo);

            return this.createSpecificDevice(actualDeviceType, ip, credentials);
        } catch (error) {
            // Fallback to method hint or UNKNOWN if device info retrieval fails
            const fallbackType = methodHint ? this.getDeviceTypeForMethod(methodHint) : 'UNKNOWN';
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
    private static createSpecificDevice(deviceType: TapoDeviceType, ip: string, credentials: TapoCredentials): BaseDevice {
        // Handle unknown device type
        if (deviceType === 'UNKNOWN') {
            throw new Error(`Unknown device type for device at ${ip}. Device model could not be determined. Please check device compatibility or update the device model mapping.`);
        }

        // Determine if device is a bulb or plug
        const bulbModels = ['L510', 'L520', 'L530', 'L535', 'L610', 'L630', 'L900', 'L920', 'L930'];
        const isBulb = bulbModels.includes(deviceType);

        if (isBulb) {
            return new BulbDevice(ip, credentials, deviceType);
        } else {
            // All other known devices are treated as plugs (P100, P105, P110, P115, etc.)
            return new PlugDevice(ip, credentials, deviceType);
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
        // Default to UNKNOWN for unknown methods
        return 'UNKNOWN';
    }
}
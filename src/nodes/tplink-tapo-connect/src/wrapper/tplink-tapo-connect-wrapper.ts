import { RetryOptions } from '../types/retry-options';
import { DeviceFactory } from '../factory/device-factory';
import { DeviceControlService } from '../services/device-control-service';
import { BatchOperationService } from '../services/batch-operation-service';
import { tplinkTapoConnectWrapperType } from '../types/wrapper-types';

// Export types from wrapper-types module
export { tplinkTapoConnectWrapperType, TapoDeviceControlInterface, TapoProtocol, TapoDeviceKey, TapoVideoImage, TapoVideo, TapoVideoPageItem, TapoVideoList } from '../types/wrapper-types';

/**
 * Main wrapper class for TP-Link Tapo device operations
 * Provides a simplified interface for device control with proper error handling and retry logic
 * 
 * @export
 * @class tplinkTapoConnectWrapper
 */
export class tplinkTapoConnectWrapper {

    readonly currentWorkingDirectory: string = process.cwd();
    private static _instance: tplinkTapoConnectWrapper;

    /**
     * Get singleton instance
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
     * Creates an instance of tplinkTapoConnectWrapper.
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
        // Clear the device control service cache for session continuity
        DeviceControlService.clearDeviceCache();
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
        return DeviceControlService.getDeviceInfo(_email, _password, _targetIp, _retryOptions);
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
        return DeviceControlService.getEnergyUsage(_email, _password, _targetIp, _retryOptions);
    }

    /**
     * Turn device on
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOn(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        return DeviceControlService.turnOn(_email, _password, _targetIp, _retryOptions);
    }

    /**
     * Turn device off
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOff(_email: string, _password: string, _targetIp: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        return DeviceControlService.turnOff(_email, _password, _targetIp, _retryOptions);
    }

    /**
     * Set device brightness
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {number} _brightness - Brightness level (1-100)
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightness(_email: string, _password: string, _targetIp: string, _brightness: number, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        return DeviceControlService.setBrightness(_email, _password, _targetIp, _brightness, _retryOptions);
    }

    /**
     * Set color using named color
     *
     * @param {string} _email - Tapo account email
     * @param {string} _password - Tapo account password
     * @param {string} _targetIp - Device IP address
     * @param {string} _colour - Named color (red, green, blue, etc.)
     * @param {RetryOptions} _retryOptions - Optional retry configuration
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColour(_email: string, _password: string, _targetIp: string, _colour: string, _retryOptions?: RetryOptions): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        return DeviceControlService.setColor(_email, _password, _targetIp, _colour, _retryOptions);
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
        return BatchOperationService.executeBatch(operations, options);
    }
}
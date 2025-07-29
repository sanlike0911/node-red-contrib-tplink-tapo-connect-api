import { TapoApiRequest, TapoApiResponse, TapoDeviceInfo } from '../types';

export interface DeviceUsage {
    time_usage?: {
        today?: number;
        past7?: number[];
        past30?: number[];
    };
}

/**
 * Controller for basic device operations (on/off, info, usage)
 * Single responsibility: Basic device control and information
 */
export class DeviceController {
    constructor(
        private readonly sendRequest: (request: TapoApiRequest) => Promise<TapoApiResponse>
    ) {}

    /**
     * Turn device on
     */
    async turnOn(): Promise<void> {
        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: {
                device_on: true
            }
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to turn on device: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to turn on device: ${response.error_code}`);
        }
    }

    /**
     * Turn device off
     */
    async turnOff(): Promise<void> {
        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: {
                device_on: false
            }
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to turn off device: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to turn off device: ${response.error_code}`);
        }
    }

    /**
     * Get device information
     */
    async getDeviceInfo(): Promise<TapoDeviceInfo> {
        const request: TapoApiRequest = {
            method: 'get_device_info',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to get device info: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to get device info: ${response.error_code}`);
        }

        return response.result as TapoDeviceInfo;
    }

    /**
     * Get device usage information
     */
    async getDeviceUsage(): Promise<DeviceUsage> {
        const request: TapoApiRequest = {
            method: 'get_device_usage',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to get device usage: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to get device usage: ${response.error_code}`);
        }

        return response.result as DeviceUsage;
    }

    /**
     * Set device alias/name
     */
    async setAlias(alias: string): Promise<void> {
        if (!alias || alias.trim().length === 0) {
            throw new Error('Alias cannot be empty');
        }

        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: {
                alias: alias.trim()
            }
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set alias: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set alias: ${response.error_code}`);
        }
    }

    /**
     * Reset device to factory settings
     */
    async resetDevice(): Promise<void> {
        const request: TapoApiRequest = {
            method: 'device_reset',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to reset device: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to reset device: ${response.error_code}`);
        }
    }

    /**
     * Reboot device
     */
    async rebootDevice(): Promise<void> {
        const request: TapoApiRequest = {
            method: 'device_reboot',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to reboot device: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to reboot device: ${response.error_code}`);
        }
    }

    /**
     * Check if device is online and responsive
     */
    async ping(): Promise<boolean> {
        try {
            await this.getDeviceInfo();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get device status summary
     */
    async getStatusSummary(): Promise<{
        isOnline: boolean;
        isOn: boolean;
        alias: string;
        model: string;
        rssi?: number;
    }> {
        try {
            const deviceInfo = await this.getDeviceInfo();
            
            return {
                isOnline: true,
                isOn: deviceInfo.device_on || false,
                alias: (deviceInfo as any).alias || (deviceInfo as any).nickname || 'Unknown',
                model: deviceInfo.model || 'Unknown',
                rssi: (deviceInfo as any).rssi
            };
        } catch (error) {
            return {
                isOnline: false,
                isOn: false,
                alias: 'Unknown',
                model: 'Unknown'
            };
        }
    }

    /**
     * Set device location
     */
    async setLocation(latitude: number, longitude: number): Promise<void> {
        if (latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: {
                latitude: latitude,
                longitude: longitude
            }
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set location: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set location: ${response.error_code}`);
        }
    }

    /**
     * Validate device model for specific features
     */
    static validateDeviceModel(deviceModel: string, requiredFeatures: string[]): boolean {
        const modelFeatures = this.getModelFeatures(deviceModel);
        
        return requiredFeatures.every(feature => 
            modelFeatures.includes(feature)
        );
    }

    /**
     * Get supported features for a device model
     */
    static getModelFeatures(deviceModel: string): string[] {
        const model = deviceModel.toUpperCase();
        const features: string[] = ['basic_control', 'device_info'];

        // Energy monitoring
        if (['P110', 'P110M', 'P115'].some(m => model.includes(m))) {
            features.push('energy_monitoring');
        }

        // Brightness control
        if (['L510', 'L520', 'L530', 'L535', 'L610', 'L630', 'L900', 'L920', 'L930'].some(m => model.includes(m))) {
            features.push('brightness_control');
        }

        // Color control
        if (['L530', 'L535', 'L630', 'L900', 'L920', 'L930'].some(m => model.includes(m))) {
            features.push('color_control');
        }

        // Color temperature
        if (['L520', 'L530', 'L535', 'L630', 'L920', 'L930'].some(m => model.includes(m))) {
            features.push('color_temperature');
        }

        // Light effects
        if (['L530', 'L535', 'L630', 'L920', 'L930'].some(m => model.includes(m))) {
            features.push('light_effects');
        }

        return features;
    }
}
import { TapoApiRequest, TapoApiResponse } from '../types';

export interface EnergyUsageData {
    current_power?: number;
    today_runtime?: number;
    month_runtime?: number;
    today_energy?: number;
    month_energy?: number;
    local_time?: string;
    electricity_charge?: number[];
}

export interface EnergyStatistics {
    power_usage?: {
        today?: number;
        past7?: number[];
        past30?: number[];
    };
    time_usage?: {
        today?: number;
        past7?: number[];
        past30?: number[];
    };
}

/**
 * Controller for energy monitoring functionality
 * Single responsibility: Energy data retrieval and management
 */
export class EnergyController {
    constructor(
        private readonly sendRequest: (request: TapoApiRequest) => Promise<TapoApiResponse>
    ) {}

    /**
     * Get current energy usage information
     */
    async getEnergyUsage(): Promise<EnergyUsageData> {
        const request: TapoApiRequest = {
            method: 'get_energy_usage',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        // Handle different response formats
        if (response.error_code !== undefined) {
            // Standard TAPO API response format: {error_code: 0, result: {...}}
            if (response.error_code !== 0) {
                throw new Error(`Failed to get energy usage: ${response.error_code}`);
            }
            return response.result as EnergyUsageData;
        } else {
            // Direct energy data response format (KLAP protocol)
            return response as EnergyUsageData;
        }
    }

    /**
     * Get current power consumption
     */
    async getCurrentPower(): Promise<number> {
        const request: TapoApiRequest = {
            method: 'get_current_power',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        // Handle different response formats
        if (response.error_code !== undefined) {
            // Standard TAPO API response format: {error_code: 0, result: {...}}
            if (response.error_code !== 0) {
                throw new Error(`Failed to get current power: ${response.error_code}`);
            }
            return (response.result as any)?.current_power ?? 0;
        } else {
            // Direct response format (KLAP protocol) - response itself contains current_power
            return (response as any)?.current_power ?? 0;
        }
    }

    /**
     * Get energy statistics for specified period
     */
    async getEnergyStatistics(interval: 'day' | 'week' | 'month' = 'day'): Promise<EnergyStatistics> {
        const request: TapoApiRequest = {
            method: 'get_energy_data',
            params: {
                interval,
                start_timestamp: this.getStartTimestamp(interval)
            }
        };

        const response = await this.sendRequest(request);
        
        // Handle different response formats
        if (response.error_code !== undefined) {
            // Standard TAPO API response format: {error_code: 0, result: {...}}
            if (response.error_code !== 0) {
                throw new Error(`Failed to get energy statistics: ${response.error_code}`);
            }
            return response.result as EnergyStatistics;
        } else {
            // Direct response format (KLAP protocol)
            return response as EnergyStatistics;
        }
    }

    /**
     * Check if device supports energy monitoring
     */
    static supportsEnergyMonitoring(deviceModel: string): boolean {
        const supportedModels = [
            'P110', 'P110M', 'P115', // Plugs with energy monitoring
            'HS110', // Legacy models
            'KP115', 'KP125' // Kasa models
        ];

        return supportedModels.some(model => 
            deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Validate energy usage data
     */
    validateEnergyData(data: EnergyUsageData): boolean {
        // Check if essential fields are present
        const hasRequiredFields = data.current_power !== undefined || 
                                 data.today_energy !== undefined ||
                                 data.today_runtime !== undefined;

        // Check for reasonable values
        const hasValidValues = (data.current_power === undefined || data.current_power >= 0) &&
                              (data.today_energy === undefined || data.today_energy >= 0) &&
                              (data.today_runtime === undefined || data.today_runtime >= 0);

        return hasRequiredFields && hasValidValues;
    }

    /**
     * Format energy data for display
     */
    formatEnergyData(data: EnergyUsageData): string {
        const parts: string[] = [];

        if (data.current_power !== undefined) {
            parts.push(`Current Power: ${data.current_power}W`);
        }

        if (data.today_energy !== undefined) {
            parts.push(`Today Energy: ${data.today_energy}Wh`);
        }

        if (data.today_runtime !== undefined) {
            const hours = Math.floor(data.today_runtime / 60);
            const minutes = data.today_runtime % 60;
            parts.push(`Today Runtime: ${hours}h ${minutes}m`);
        }

        if (data.month_energy !== undefined) {
            parts.push(`Month Energy: ${data.month_energy}Wh`);
        }

        return parts.join(', ');
    }

    /**
     * Get start timestamp for statistics query
     */
    private getStartTimestamp(interval: 'day' | 'week' | 'month'): number {
        const now = new Date();
        const start = new Date(now);

        switch (interval) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                start.setHours(0, 0, 0, 0);
                break;
        }

        return Math.floor(start.getTime() / 1000);
    }
}
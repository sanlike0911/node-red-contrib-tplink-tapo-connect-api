import { TapoApiRequest, TapoApiResponse } from '../types';

export interface ColorInfo {
    hue?: number;
    saturation?: number;
    color_temp?: number;
}

export interface BrightnessInfo {
    brightness?: number;
}

export interface LightingState {
    on?: boolean;
    brightness?: number;
    hue?: number;
    saturation?: number;
    color_temp?: number;
}

export interface LightEffect {
    name: string;
    enable: boolean;
    brightness?: number;
    custom?: number;
    segments?: number[];
    expansion_strategy?: number;
}

/**
 * Controller for lighting functionality (brightness, color, effects)
 * Single responsibility: Lighting control and color management
 */
export class LightingController {
    constructor(
        private readonly sendRequest: (request: TapoApiRequest) => Promise<TapoApiResponse>
    ) {}

    /**
     * Set device brightness (1-100)
     */
    async setBrightness(brightness: number): Promise<void> {
        if (brightness < 1 || brightness > 100) {
            throw new Error('Brightness must be between 1 and 100');
        }

        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: {
                brightness: brightness
            }
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set brightness: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set brightness: ${response.error_code}`);
        }
    }

    /**
     * Set color using HSV values
     */
    async setColorHSV(hue: number, saturation: number, brightness?: number): Promise<void> {
        if (hue < 0 || hue > 360) {
            throw new Error('Hue must be between 0 and 360');
        }
        if (saturation < 0 || saturation > 100) {
            throw new Error('Saturation must be between 0 and 100');
        }
        if (brightness !== undefined && (brightness < 1 || brightness > 100)) {
            throw new Error('Brightness must be between 1 and 100');
        }

        const params: any = {
            hue: hue,
            saturation: saturation
        };

        if (brightness !== undefined) {
            params.brightness = brightness;
        }

        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: params
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set color: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set color: ${response.error_code}`);
        }
    }

    /**
     * Set color using RGB values
     */
    async setColorRGB(red: number, green: number, blue: number, brightness?: number): Promise<void> {
        if ([red, green, blue].some(val => val < 0 || val > 255)) {
            throw new Error('RGB values must be between 0 and 255');
        }

        const { hue, saturation } = this.rgbToHsv(red, green, blue);
        await this.setColorHSV(hue, saturation, brightness);
    }

    /**
     * Set color using predefined color names
     */
    async setNamedColor(colorName: string, brightness?: number): Promise<void> {
        const colorMap = this.getNamedColorMap();
        const color = colorMap[colorName.toLowerCase()];
        
        if (!color) {
            throw new Error(`Unknown color name: ${colorName}. Available colors: ${Object.keys(colorMap).join(', ')}`);
        }

        await this.setColorHSV(color.hue, color.saturation, brightness);
    }

    /**
     * Set color temperature (2500K - 6500K)
     */
    async setColorTemperature(temperature: number, brightness?: number): Promise<void> {
        if (temperature < 2500 || temperature > 6500) {
            throw new Error('Color temperature must be between 2500K and 6500K');
        }

        const params: any = {
            color_temp: temperature
        };

        if (brightness !== undefined) {
            params.brightness = brightness;
        }

        const request: TapoApiRequest = {
            method: 'set_device_info',
            params: params
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set color temperature: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set color temperature: ${response.error_code}`);
        }
    }

    /**
     * Set lighting effect
     */
    async setLightEffect(effect: LightEffect): Promise<void> {
        const request: TapoApiRequest = {
            method: 'set_lighting_effect',
            params: effect as unknown as Record<string, unknown>
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to set light effect: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to set light effect: ${response.error_code}`);
        }
    }

    /**
     * Get current lighting state
     */
    async getLightingState(): Promise<LightingState> {
        const request: TapoApiRequest = {
            method: 'get_device_info',
            params: {}
        };

        const response = await this.sendRequest(request);
        
        if (!response) {
            throw new Error('Failed to get lighting state: No response received');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to get lighting state: ${response.error_code}`);
        }

        const result = response.result as any;
        return {
            on: result?.device_on,
            brightness: result?.brightness,
            hue: result?.hue,
            saturation: result?.saturation,
            color_temp: result?.color_temp
        };
    }

    /**
     * Check if device supports brightness control
     */
    static supportsBrightnessControl(deviceModel: string): boolean {
        const supportedModels = [
            'L510', 'L520', 'L530', 'L535', 'L610', 'L630', // Bulbs
            'L900', 'L920', 'L930', // Light strips
            'KL110', 'KL120', 'KL125', 'KL130' // Kasa bulbs
        ];

        return supportedModels.some(model => 
            deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Check if device supports color control
     */
    static supportsColorControl(deviceModel: string): boolean {
        const supportedModels = [
            'L530', 'L535', 'L630', // Color bulbs
            'L900', 'L920', 'L930', // Light strips
            'KL125', 'KL130' // Kasa color bulbs
        ];

        return supportedModels.some(model => 
            deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Check if device supports color temperature control
     */
    static supportsColorTemperature(deviceModel: string): boolean {
        const supportedModels = [
            'L520', 'L530', 'L535', 'L630', // Variable white bulbs
            'L920', 'L930', // Light strips with white control
            'KL120', 'KL125', 'KL130' // Kasa variable white bulbs
        ];

        return supportedModels.some(model => 
            deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Convert RGB to HSV
     */
    private rgbToHsv(r: number, g: number, b: number): { hue: number; saturation: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let hue = 0;
        let saturation = max === 0 ? 0 : diff / max;

        if (diff !== 0) {
            switch (max) {
                case r:
                    hue = (g - b) / diff + (g < b ? 6 : 0);
                    break;
                case g:
                    hue = (b - r) / diff + 2;
                    break;
                case b:
                    hue = (r - g) / diff + 4;
                    break;
            }
            hue /= 6;
        }

        return {
            hue: Math.round(hue * 360),
            saturation: Math.round(saturation * 100)
        };
    }

    /**
     * Get predefined color map
     */
    private getNamedColorMap(): Record<string, { hue: number; saturation: number }> {
        return {
            'red': { hue: 0, saturation: 100 },
            'orange': { hue: 30, saturation: 100 },
            'yellow': { hue: 60, saturation: 100 },
            'green': { hue: 120, saturation: 100 },
            'cyan': { hue: 180, saturation: 100 },
            'blue': { hue: 240, saturation: 100 },
            'purple': { hue: 270, saturation: 100 },
            'magenta': { hue: 300, saturation: 100 },
            'pink': { hue: 330, saturation: 70 },
            'white': { hue: 0, saturation: 0 },
            'warm_white': { hue: 30, saturation: 20 },
            'cool_white': { hue: 210, saturation: 20 }
        };
    }
}
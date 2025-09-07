import { TapoCredentials } from '../types';
import { BaseDevice } from './base-device';
import { ProtocolType } from '../core/protocol-selector';
import { TapoAuth } from '../core/auth';
import { KlapAuth } from '../core/klap-auth';
import { LightEffect } from '../controllers/lighting-controller';

/**
 * Bulb device implementation using composition pattern
 * Single responsibility: Bulb-specific device behavior
 */
export class BulbDevice extends BaseDevice {
    private auth?: TapoAuth;
    private klapAuth?: KlapAuth;

    constructor(
        ip: string,
        credentials: TapoCredentials,
        deviceModel: string
    ) {
        super(ip, credentials, deviceModel);
    }

    /**
     * Initialize session based on selected protocol
     */
    protected async initializeSession(protocol: ProtocolType): Promise<void> {
        try {
            if (protocol === ProtocolType.KLAP) {
                await this.initializeKlapSession();
            } else {
                await this.initializePassthroughSession();
            }
        } catch (error) {
            throw new Error(`Failed to initialize ${protocol} session: ${(error as Error).message}`);
        }
    }

    /**
     * Initialize KLAP session
     */
    private async initializeKlapSession(): Promise<void> {
        if (!this.klapAuth) {
            this.klapAuth = new KlapAuth(this.ip, this.credentials);
        }

        await this.klapAuth.authenticate();
        
        // Add small delay after authentication to prevent immediate -1012 errors
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Configure request executor to use KLAP auth
        this.setRequestExecutor(async (request) => {
            if (!this.klapAuth) {
                throw new Error('KLAP authentication not initialized');
            }
            return this.klapAuth.secureRequest(request);
        });
        
        // Get session data from KLAP auth
        const sessionData = {
            sessionId: (this.klapAuth as any).getSessionId?.() || undefined,
            token: (this.klapAuth as any).getToken?.() || undefined,
            expiresAt: Date.now() + 1800000 // 30 minutes
        };

        await this.sessionManager.initializeSession(sessionData);
    }

    /**
     * Initialize Passthrough session
     */
    private async initializePassthroughSession(): Promise<void> {
        if (!this.auth) {
            this.auth = new TapoAuth(this.ip, this.credentials);
        }

        const session = await this.auth.authenticate();
        
        // Configure request executor to use Passthrough auth
        this.setRequestExecutor(async (request) => {
            if (!this.auth) {
                throw new Error('Passthrough authentication not initialized');
            }
            return this.auth.secureRequest(request);
        });
        
        // Get session data from passthrough auth
        const sessionData = {
            sessionId: session.sessionId,
            token: session.token,
            cookies: (this.auth as any).getCookies?.() || undefined,
            expiresAt: Date.now() + 1800000 // 30 minutes
        };

        await this.sessionManager.initializeSession(sessionData);
    }

    /**
     * Set light effect (if supported)
     */
    async setLightEffect(effect: LightEffect): Promise<void> {
        if (!this.capabilities.hasLightEffects) {
            throw new Error('Light effects not supported by this device');
        }

        if (!this.lightingController) {
            throw new Error('Lighting controller not available');
        }

        return this.lightingController.setLightEffect(effect);
    }

    /**
     * Get predefined light effects
     */
    getPredefinedEffects(): LightEffect[] {
        if (!this.capabilities.hasLightEffects) {
            return [];
        }

        return [
            {
                name: 'Aurora',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Bubbling Cauldron',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Candy Cane',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Flicker',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Grandma\'s Christmas Lights',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Hanukkah',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Haunted Mansion',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Icicle',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Lightning',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Ocean',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Rainbow',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            },
            {
                name: 'Spring',
                enable: true,
                brightness: 100,
                custom: 0,
                segments: [0]
            }
        ];
    }

    /**
     * Turn off light effect
     */
    async turnOffLightEffect(): Promise<void> {
        if (!this.capabilities.hasLightEffects) {
            throw new Error('Light effects not supported by this device');
        }

        await this.setLightEffect({
            name: 'Off',
            enable: false
        });
    }

    /**
     * Get bulb-specific status
     */
    async getBulbStatus(): Promise<{
        isOn: boolean;
        brightness?: number;
        colorMode?: 'white' | 'color';
        hue?: number;
        saturation?: number;
        colorTemp?: number;
        hasEffectActive?: boolean;
    }> {
        const deviceInfo = await this.getDeviceInfo();
        
        const deviceInfoAny = deviceInfo as any;
        const status: {
            isOn: boolean;
            brightness?: number;
            colorMode?: 'white' | 'color';  
            hue?: number;
            saturation?: number;
            colorTemp?: number;
            hasEffectActive?: boolean;
        } = {
            isOn: deviceInfo.device_on || false
        };

        if (deviceInfoAny.brightness !== undefined) {
            status.brightness = deviceInfoAny.brightness;
        }
        
        const colorMode = this.determineColorMode(deviceInfoAny);
        if (colorMode) {
            status.colorMode = colorMode;
        }
        
        if (deviceInfoAny.hue !== undefined) {
            status.hue = deviceInfoAny.hue;
        }
        
        if (deviceInfoAny.saturation !== undefined) {
            status.saturation = deviceInfoAny.saturation;
        }
        
        if (deviceInfoAny.color_temp !== undefined) {
            status.colorTemp = deviceInfoAny.color_temp;
        }
        
        if (this.capabilities.hasLightEffects) {
            status.hasEffectActive = this.hasActiveEffect(deviceInfoAny);
        }

        return status;
    }

    /**
     * Determine current color mode
     */
    private determineColorMode(deviceInfo: any): 'white' | 'color' | undefined {
        if (!this.capabilities.hasColorControl) {
            return undefined;
        }

        // If hue and saturation are present and saturation > 0, it's color mode
        if (deviceInfo.hue !== undefined && deviceInfo.saturation !== undefined && deviceInfo.saturation > 0) {
            return 'color';
        }

        // If color temperature is set, it's white mode
        if (deviceInfo.color_temp !== undefined) {
            return 'white';
        }

        return undefined;
    }

    /**
     * Check if there's an active light effect
     */
    private hasActiveEffect(deviceInfo: any): boolean {
        if (!this.capabilities.hasLightEffects) {
            return false;
        }

        // Check if lighting_effect is present and enabled
        return deviceInfo.lighting_effect && deviceInfo.lighting_effect.enable === true;
    }

    /**
     * Set bulb to white mode with specific temperature
     */
    async setWhiteMode(temperature: number = 4000, brightness?: number): Promise<void> {
        if (!this.capabilities.hasColorTemperature) {
            throw new Error('Color temperature control not supported by this device');
        }

        await this.setColorTemperature(temperature, brightness);
    }

    /**
     * Set bulb to color mode with specific color
     */
    async setColorMode(hue: number, saturation: number = 100, brightness?: number): Promise<void> {
        if (!this.capabilities.hasColorControl) {
            throw new Error('Color control not supported by this device');
        }

        await this.setColorHSV(hue, saturation, brightness);
    }
}
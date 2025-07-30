import { TapoCredentials } from '../types';
import { BaseDevice } from './base-device';
import { ProtocolType } from '../core/protocol-selector';
import { TapoAuth } from '../core/auth';
import { KlapAuth } from '../core/klap-auth';

/**
 * Plug device implementation using composition pattern
 * Single responsibility: Plug-specific device behavior
 */
export class PlugDevice extends BaseDevice {
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
     * Get child devices (for multi-outlet plugs like P300)
     */
    async getChildDevices(): Promise<any[]> {
        if (!this.supportsChildDevices()) {
            return [];
        }

        try {
            const response = await this.sendRequest({
                method: 'get_child_device_list',
                params: {}
            });

            if (!response) {
                throw new Error('Failed to get child devices: empty response');
            }
            
            if (response.error_code !== 0) {
                throw new Error(`Failed to get child devices: ${response.error_code}`);
            }

            return (response.result as any)?.child_device_list || [];
        } catch (error) {
            console.warn('Failed to get child devices:', error);
            return [];
        }
    }

    /**
     * Control child device (for multi-outlet plugs)
     */
    async controlChildDevice(deviceId: string, turnOn: boolean): Promise<void> {
        if (!this.supportsChildDevices()) {
            throw new Error('Child device control not supported by this device');
        }

        const response = await this.sendRequest({
            method: 'set_child_device_info',
            params: {
                device_id: deviceId,
                device_on: turnOn
            }
        });

        if (!response) {
            throw new Error('Failed to control child device: empty response');
        }
        
        if (response.error_code !== 0) {
            throw new Error(`Failed to control child device: ${response.error_code}`);
        }
    }

    /**
     * Check if device supports child devices
     */
    private supportsChildDevices(): boolean {
        const supportedModels = ['P300', 'P304', 'KP303', 'KP400'];
        return supportedModels.some(model => 
            this.deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Get plug-specific status
     */
    async getPlugStatus(): Promise<{
        isOn: boolean;
        hasEnergyMonitoring: boolean;
        currentPower?: number;
        childDevices?: any[];
    }> {
        const deviceInfo = await this.getDeviceInfo();
        const status: {
            isOn: boolean;
            hasEnergyMonitoring: boolean;
            currentPower?: number;
            childDevices?: any[];
        } = {
            isOn: deviceInfo.device_on || false,
            hasEnergyMonitoring: this.capabilities.hasEnergyMonitoring
        };

        // Get current power if supported
        if (this.capabilities.hasEnergyMonitoring && this.energyController) {
            try {
                status.currentPower = await this.energyController.getCurrentPower();
            } catch (error) {
                // Ignore energy reading errors
            }
        }

        // Get child devices if supported
        if (this.supportsChildDevices()) {
            try {
                status.childDevices = await this.getChildDevices();
            } catch (error) {
                // Ignore child device errors
            }
        }

        return status;
    }
}
import { TapoCredentials, TapoApiRequest, TapoApiResponse, TapoDeviceInfo } from '../types';
import { ConnectionManager } from '../core/connection-manager';
import { SessionManager } from '../core/session-manager';
import { ProtocolSelector, ProtocolType } from '../core/protocol-selector';
import { RequestManager } from '../core/request-manager';
import { DeviceController } from '../controllers/device-controller';
import { EnergyController } from '../controllers/energy-controller';
import { LightingController } from '../controllers/lighting-controller';

export interface DeviceCapabilities {
    hasEnergyMonitoring: boolean;
    hasBrightnessControl: boolean;
    hasColorControl: boolean;
    hasColorTemperature: boolean;
    hasLightEffects: boolean;
}

/**
 * Base device class using composition pattern
 * Single responsibility: Device lifecycle and controller coordination
 */
export abstract class BaseDevice {
    protected connectionManager: ConnectionManager;
    protected sessionManager: SessionManager;
    protected protocolSelector: ProtocolSelector;
    protected requestManager: RequestManager;

    // Feature controllers (composition)
    protected deviceController: DeviceController;
    protected energyController?: EnergyController;
    protected lightingController?: LightingController;

    protected capabilities: DeviceCapabilities;
    protected isInitialized: boolean = false;

    constructor(
        protected readonly ip: string,
        protected readonly credentials: TapoCredentials,
        protected readonly deviceModel: string
    ) {
        // Initialize core managers
        this.connectionManager = new ConnectionManager(ip, credentials);
        this.sessionManager = new SessionManager();
        this.protocolSelector = new ProtocolSelector(ip, credentials);
        this.requestManager = new RequestManager();

        // Initialize controllers
        this.deviceController = new DeviceController(this.sendRequest.bind(this));

        // Determine capabilities based on device model
        this.capabilities = this.determineCapabilities(deviceModel);

        // Initialize feature controllers based on capabilities
        if (this.capabilities.hasEnergyMonitoring) {
            this.energyController = new EnergyController(this.sendRequest.bind(this));
        }

        if (this.capabilities.hasBrightnessControl || this.capabilities.hasColorControl) {
            this.lightingController = new LightingController(this.sendRequest.bind(this));
        }
    }

    /**
     * Connect to the device
     */
    async connect(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Select best protocol
            const protocol = await this.protocolSelector.selectProtocol();
            
            // Establish connection
            await this.connectionManager.connect();
            
            // Initialize session based on protocol
            await this.initializeSession(protocol);

            this.isInitialized = true;
        } catch (error) {
            await this.cleanup();
            throw error;
        }
    }

    /**
     * Disconnect from the device
     */
    async disconnect(): Promise<void> {
        await this.cleanup();
        this.isInitialized = false;
    }


    /**
     * Send request through the request manager
     */
    protected async sendRequest(request: TapoApiRequest): Promise<TapoApiResponse> {
        if (!this.isInitialized) {
            throw new Error('Device not connected. Call connect() first.');
        }

        return this.requestManager.queueRequest(request);
    }

    /**
     * Configure request executor for the request manager
     */
    protected setRequestExecutor(executor: (request: TapoApiRequest) => Promise<TapoApiResponse>): void {
        this.requestManager.setRequestExecutor(executor);
    }

    // Device Controller Methods (delegation)
    async turnOn(): Promise<void> {
        return this.deviceController.turnOn();
    }

    async turnOff(): Promise<void> {
        return this.deviceController.turnOff();
    }

    async getDeviceInfo(): Promise<TapoDeviceInfo> {
        return this.deviceController.getDeviceInfo();
    }

    async setAlias(alias: string): Promise<void> {
        return this.deviceController.setAlias(alias);
    }

    async ping(): Promise<boolean> {
        return this.deviceController.ping();
    }

    // Energy Controller Methods (if supported)
    async getEnergyUsage(): Promise<any> {
        if (!this.energyController) {
            throw new Error('Energy monitoring not supported by this device');
        }
        return this.energyController.getEnergyUsage();
    }

    async getCurrentPower(): Promise<number> {
        if (!this.energyController) {
            throw new Error('Energy monitoring not supported by this device');
        }
        return this.energyController.getCurrentPower();
    }

    // Lighting Controller Methods (if supported)
    async setBrightness(brightness: number): Promise<void> {
        if (!this.lightingController) {
            throw new Error('Brightness control not supported by this device');
        }
        return this.lightingController.setBrightness(brightness);
    }

    async setColorHSV(hue: number, saturation: number, brightness?: number): Promise<void> {
        if (!this.lightingController) {
            throw new Error('Color control not supported by this device');
        }
        return this.lightingController.setColorHSV(hue, saturation, brightness);
    }

    async setColorRGB(red: number, green: number, blue: number, brightness?: number): Promise<void> {
        if (!this.lightingController) {
            throw new Error('Color control not supported by this device');
        }
        return this.lightingController.setColorRGB(red, green, blue, brightness);
    }

    async setNamedColor(colorName: string, brightness?: number): Promise<void> {
        if (!this.lightingController) {
            throw new Error('Color control not supported by this device');
        }
        return this.lightingController.setNamedColor(colorName, brightness);
    }

    async setColorTemperature(temperature: number, brightness?: number): Promise<void> {
        if (!this.lightingController) {
            throw new Error('Color temperature control not supported by this device');
        }
        return this.lightingController.setColorTemperature(temperature, brightness);
    }

    // Utility Methods
    getCapabilities(): DeviceCapabilities {
        return { ...this.capabilities };
    }

    isConnected(): boolean {
        return this.isInitialized && this.connectionManager.isConnected();
    }

    getDeviceModel(): string {
        return this.deviceModel;
    }

    getDeviceIP(): string {
        return this.ip;
    }

    /**
     * Determine device capabilities based on model
     */
    protected determineCapabilities(deviceModel: string): DeviceCapabilities {
        return {
            hasEnergyMonitoring: EnergyController.supportsEnergyMonitoring(deviceModel),
            hasBrightnessControl: LightingController.supportsBrightnessControl(deviceModel),
            hasColorControl: LightingController.supportsColorControl(deviceModel),
            hasColorTemperature: LightingController.supportsColorTemperature(deviceModel),
            hasLightEffects: this.supportsLightEffects(deviceModel)
        };
    }

    /**
     * Check if device supports light effects
     */
    protected supportsLightEffects(deviceModel: string): boolean {
        const supportedModels = ['L530', 'L535', 'L630', 'L920', 'L930'];
        return supportedModels.some(model => 
            deviceModel.toUpperCase().includes(model.toUpperCase())
        );
    }

    /**
     * Initialize session based on protocol type
     */
    protected abstract initializeSession(protocol: ProtocolType): Promise<void>;

    /**
     * Cleanup resources
     */
    protected async cleanup(): Promise<void> {
        try {
            // Clear request queue
            this.requestManager.clearQueue();
            
            // Invalidate session
            this.sessionManager.invalidateSession();
            
            // Disconnect
            await this.connectionManager.disconnect();
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Handle session refresh
     */
    protected async refreshSession(): Promise<void> {
        const protocol = this.protocolSelector.getActiveProtocol();
        if (protocol) {
            await this.initializeSession(protocol);
        }
    }
}
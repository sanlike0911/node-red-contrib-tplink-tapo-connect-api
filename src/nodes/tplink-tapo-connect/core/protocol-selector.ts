import { TapoCredentials } from '../types';

export enum ProtocolType {
    KLAP = 'klap',
    PASSTHROUGH = 'passthrough'
}

export interface ProtocolOptions {
    preferredProtocol?: ProtocolType;
    enableFallback?: boolean;
    connectionTimeout?: number;
    minRequestInterval?: number;
}

export interface ProtocolInfo {
    type: ProtocolType;
    isSupported: boolean;
    priority: number;
    lastUsed?: number;
    errorCount: number;
}

/**
 * Manages protocol selection and fallback logic
 * Single responsibility: Protocol detection and selection
 */
export class ProtocolSelector {
    private protocols: Map<ProtocolType, ProtocolInfo> = new Map();
    private activeProtocol: ProtocolType | null = null;
    private readonly options: Required<ProtocolOptions>;

    constructor(
        protected readonly ip: string,
        protected readonly credentials: TapoCredentials,
        options: ProtocolOptions = {}
    ) {
        this.options = {
            preferredProtocol: options.preferredProtocol ?? ProtocolType.KLAP,
            enableFallback: options.enableFallback ?? true,
            connectionTimeout: options.connectionTimeout ?? 10000,
            minRequestInterval: options.minRequestInterval ?? 100
        };

        // Initialize protocol info
        this.protocols.set(ProtocolType.KLAP, {
            type: ProtocolType.KLAP,
            isSupported: true,
            priority: 1,
            errorCount: 0
        });

        this.protocols.set(ProtocolType.PASSTHROUGH, {
            type: ProtocolType.PASSTHROUGH,
            isSupported: true,
            priority: 2,
            errorCount: 0
        });
    }

    /**
     * Select the best available protocol
     */
    async selectProtocol(): Promise<ProtocolType> {
        // If we already have an active protocol, use it
        if (this.activeProtocol && this.isProtocolHealthy(this.activeProtocol)) {
            return this.activeProtocol;
        }

        // Try preferred protocol first
        if (await this.testProtocol(this.options.preferredProtocol)) {
            this.activeProtocol = this.options.preferredProtocol;
            return this.activeProtocol;
        }

        // If preferred protocol failed and fallback is enabled, try alternatives
        if (this.options.enableFallback) {
            const alternativeProtocols = this.getAlternativeProtocols();
            
            for (const protocol of alternativeProtocols) {
                if (await this.testProtocol(protocol)) {
                    this.activeProtocol = protocol;
                    return this.activeProtocol;
                }
            }
        }

        throw new Error('No suitable protocol found for device communication');
    }

    /**
     * Get currently active protocol
     */
    getActiveProtocol(): ProtocolType | null {
        return this.activeProtocol;
    }

    /**
     * Test if a specific protocol works with the device
     */
    async testProtocol(protocol: ProtocolType): Promise<boolean> {
        try {
            const protocolInfo = this.protocols.get(protocol);
            if (!protocolInfo || !protocolInfo.isSupported) {
                return false;
            }

            // Perform actual protocol test (to be implemented by concrete protocols)
            const isWorking = await this.performProtocolTest(protocol);
            
            if (isWorking) {
                protocolInfo.lastUsed = Date.now();
                protocolInfo.errorCount = 0;
                this.protocols.set(protocol, protocolInfo);
                return true;
            } else {
                this.recordProtocolError(protocol);
                return false;
            }
        } catch (error) {
            this.recordProtocolError(protocol);
            return false;
        }
    }

    /**
     * Record a protocol error and update its health status
     */
    recordProtocolError(protocol: ProtocolType): void {
        const protocolInfo = this.protocols.get(protocol);
        if (protocolInfo) {
            protocolInfo.errorCount++;
            
            // Disable protocol if too many errors
            if (protocolInfo.errorCount >= 5) {
                protocolInfo.isSupported = false;
            }
            
            this.protocols.set(protocol, protocolInfo);
        }

        // Reset active protocol if it's the one with errors
        if (this.activeProtocol === protocol) {
            this.activeProtocol = null;
        }
    }

    /**
     * Reset protocol error counts (useful for recovery)
     */
    resetProtocolErrors(): void {
        for (const [type, info] of this.protocols) {
            info.errorCount = 0;
            info.isSupported = true;
            this.protocols.set(type, info);
        }
    }

    /**
     * Get protocol information for debugging
     */
    getProtocolInfo(): Map<ProtocolType, ProtocolInfo> {
        return new Map(this.protocols);
    }

    /**
     * Check if a protocol is healthy (low error count, recently used)
     */
    private isProtocolHealthy(protocol: ProtocolType): boolean {
        const protocolInfo = this.protocols.get(protocol);
        if (!protocolInfo || !protocolInfo.isSupported) {
            return false;
        }

        // Consider unhealthy if too many recent errors
        if (protocolInfo.errorCount >= 3) {
            return false;
        }

        return true;
    }

    /**
     * Get alternative protocols ordered by priority
     */
    private getAlternativeProtocols(): ProtocolType[] {
        const alternatives = Array.from(this.protocols.values())
            .filter(info => info.type !== this.options.preferredProtocol && info.isSupported)
            .sort((a, b) => a.priority - b.priority)
            .map(info => info.type);

        return alternatives;
    }

    /**
     * Perform actual protocol test (to be implemented by subclasses or injected)
     */
    protected async performProtocolTest(_protocol: ProtocolType): Promise<boolean> {
        // This should be implemented by concrete protocol implementations
        // For now, return true as a placeholder
        return true;
    }

    /**
     * Force switch to a specific protocol
     */
    forceProtocol(protocol: ProtocolType): void {
        const protocolInfo = this.protocols.get(protocol);
        if (!protocolInfo) {
            throw new Error(`Unknown protocol: ${protocol}`);
        }

        this.activeProtocol = protocol;
        protocolInfo.lastUsed = Date.now();
        protocolInfo.errorCount = 0;
        this.protocols.set(protocol, protocolInfo);
    }

    /**
     * Get minimum request interval for the active protocol
     */
    getMinRequestInterval(): number {
        // KLAP might need longer intervals than passthrough
        if (this.activeProtocol === ProtocolType.KLAP) {
            return Math.max(this.options.minRequestInterval, 200);
        }
        return this.options.minRequestInterval;
    }
}
import { TapoCredentials } from '../types';

export interface ConnectionOptions {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
}

export interface ConnectionState {
    isConnected: boolean;
    connectionTime?: number;
    lastActivity: number;
    retryCount: number;
}

/**
 * Manages device connections and connection state
 * Single responsibility: Connection lifecycle management
 */
export class ConnectionManager {
    private connectionState: ConnectionState = {
        isConnected: false,
        lastActivity: Date.now(),
        retryCount: 0
    };

    private readonly options: Required<ConnectionOptions>;

    constructor(
        protected readonly ip: string,
        protected readonly credentials: TapoCredentials,
        options: ConnectionOptions = {}
    ) {
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 1000,
            timeout: options.timeout ?? 10000
        };
    }

    /**
     * Establish connection to device
     */
    async connect(): Promise<void> {
        if (this.connectionState.isConnected) {
            return;
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
            try {
                await this.performConnection();
                this.connectionState = {
                    isConnected: true,
                    connectionTime: Date.now(),
                    lastActivity: Date.now(),
                    retryCount: 0
                };
                return;
            } catch (error) {
                lastError = error as Error;
                this.connectionState.retryCount = attempt + 1;

                if (attempt < this.options.maxRetries) {
                    await this.delay(this.options.retryDelay * (attempt + 1));
                }
            }
        }

        throw new Error(`Failed to connect after ${this.options.maxRetries + 1} attempts: ${lastError?.message}`);
    }

    /**
     * Disconnect from device
     */
    async disconnect(): Promise<void> {
        if (!this.connectionState.isConnected) {
            return;
        }

        try {
            await this.performDisconnection();
        } finally {
            this.connectionState = {
                isConnected: false,
                lastActivity: Date.now(),
                retryCount: 0
            };
        }
    }

    /**
     * Check if connection is active and healthy
     */
    isConnected(): boolean {
        return this.connectionState.isConnected;
    }

    /**
     * Get current connection state
     */
    getConnectionState(): Readonly<ConnectionState> {
        return { ...this.connectionState };
    }

    /**
     * Update last activity timestamp
     */
    updateActivity(): void {
        this.connectionState.lastActivity = Date.now();
    }

    /**
     * Check if connection has been idle for too long
     */
    isIdle(maxIdleTime: number = 300000): boolean { // 5 minutes default
        return Date.now() - this.connectionState.lastActivity > maxIdleTime;
    }

    /**
     * Reset connection state (useful for error recovery)
     */
    reset(): void {
        this.connectionState = {
            isConnected: false,
            lastActivity: Date.now(),
            retryCount: 0
        };
    }

    /**
     * Actual connection implementation - no-op as connection is handled by protocol-specific auth classes
     */
    protected async performConnection(): Promise<void> {
        // Connection is handled by the protocol-specific authentication classes
        // This is just for tracking connection state
        return Promise.resolve();
    }

    /**
     * Actual disconnection implementation - no-op as disconnection is handled by protocol-specific auth classes
     */
    protected async performDisconnection(): Promise<void> {
        // Disconnection is handled by the protocol-specific authentication classes
        // This is just for tracking connection state
        return Promise.resolve();
    }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
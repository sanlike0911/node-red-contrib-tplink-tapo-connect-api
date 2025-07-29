export interface SessionData {
    sessionId?: string;
    token?: string;
    cookies?: string[];
    expiresAt?: number;
    deviceId?: string;
    terminalUuid?: string;
}

export interface SessionOptions {
    sessionTimeout?: number;
    refreshThreshold?: number;
    maxRefreshAttempts?: number;
}

export enum SessionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    EXPIRED = 'expired',
    ERROR = 'error'
}

/**
 * Manages device sessions and session lifecycle
 * Single responsibility: Session state and lifecycle management
 */
export class SessionManager {
    private sessionData: SessionData = {};
    private sessionState: SessionState = SessionState.DISCONNECTED;
    private refreshPromise: Promise<void> | null = null;
    private readonly options: Required<SessionOptions>;

    constructor(options: SessionOptions = {}) {
        this.options = {
            sessionTimeout: options.sessionTimeout ?? 1800000, // 30 minutes
            refreshThreshold: options.refreshThreshold ?? 300000, // 5 minutes before expiry
            maxRefreshAttempts: options.maxRefreshAttempts ?? 3
        };
    }

    /**
     * Initialize a new session
     */
    async initializeSession(sessionData: SessionData): Promise<void> {
        this.sessionState = SessionState.CONNECTING;
        
        try {
            this.sessionData = {
                ...sessionData,
                expiresAt: sessionData.expiresAt ?? (Date.now() + this.options.sessionTimeout)
            };
            
            this.sessionState = SessionState.CONNECTED;
        } catch (error) {
            this.sessionState = SessionState.ERROR;
            throw error;
        }
    }

    /**
     * Get current session data
     */
    getSessionData(): Readonly<SessionData> {
        return { ...this.sessionData };
    }

    /**
     * Get current session state
     */
    getSessionState(): SessionState {
        return this.sessionState;
    }

    /**
     * Check if session is valid and not expired
     */
    isSessionValid(): boolean {
        if (this.sessionState !== SessionState.CONNECTED) {
            return false;
        }

        if (this.sessionData.expiresAt && Date.now() >= this.sessionData.expiresAt) {
            this.sessionState = SessionState.EXPIRED;
            return false;
        }

        return true;
    }

    /**
     * Check if session needs refresh (close to expiry)
     */
    needsRefresh(): boolean {
        if (!this.isSessionValid()) {
            return true;
        }

        if (this.sessionData.expiresAt) {
            const timeUntilExpiry = this.sessionData.expiresAt - Date.now();
            return timeUntilExpiry <= this.options.refreshThreshold;
        }

        return false;
    }

    /**
     * Refresh session if needed
     */
    async refreshSessionIfNeeded(refreshFunction: () => Promise<SessionData>): Promise<void> {
        if (!this.needsRefresh()) {
            return;
        }

        // Prevent concurrent refresh attempts
        if (this.refreshPromise) {
            await this.refreshPromise;
            return;
        }

        this.refreshPromise = this.performRefresh(refreshFunction);
        
        try {
            await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Update session data
     */
    updateSession(sessionData: Partial<SessionData>): void {
        this.sessionData = {
            ...this.sessionData,
            ...sessionData
        };

        // Update expiry if not provided
        if (!sessionData.expiresAt && sessionData.token) {
            this.sessionData.expiresAt = Date.now() + this.options.sessionTimeout;
        }
    }

    /**
     * Invalidate current session
     */
    invalidateSession(): void {
        this.sessionData = {};
        this.sessionState = SessionState.DISCONNECTED;
    }

    /**
     * Mark session as expired
     */
    markExpired(): void {
        this.sessionState = SessionState.EXPIRED;
    }

    /**
     * Check if specific session error indicates session expiry
     */
    isSessionError(error: Error): boolean {
        const sessionErrorPatterns = [
            'session expired',
            'invalid terminal uuid',
            'klap 1002',
            'klap -1012',
            'terminal uuid mismatch'
        ];

        const errorMessage = error.message.toLowerCase();
        return sessionErrorPatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Handle session error and update state accordingly
     */
    handleSessionError(error: Error): void {
        if (this.isSessionError(error)) {
            this.sessionState = SessionState.EXPIRED;
        } else {
            this.sessionState = SessionState.ERROR;
        }
    }

    /**
     * Get session headers for requests
     */
    getSessionHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};

        if (this.sessionData.cookies && this.sessionData.cookies.length > 0) {
            headers['Cookie'] = this.sessionData.cookies.join('; ');
        }

        if (this.sessionData.token) {
            headers['Authorization'] = `Bearer ${this.sessionData.token}`;
        }

        return headers;
    }

    /**
     * Perform session refresh
     */
    private async performRefresh(refreshFunction: () => Promise<SessionData>): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.options.maxRefreshAttempts; attempt++) {
            try {
                const newSessionData = await refreshFunction();
                await this.initializeSession(newSessionData);
                return;
            } catch (error) {
                lastError = error as Error;
                
                if (attempt < this.options.maxRefreshAttempts - 1) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        this.sessionState = SessionState.ERROR;
        throw new Error(`Failed to refresh session after ${this.options.maxRefreshAttempts} attempts: ${lastError?.message}`);
    }
}
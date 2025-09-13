import { TapoApiRequest, TapoApiResponse } from '../types';

export interface RequestOptions {
    timeout?: number;
    retries?: number;
    priority?: RequestPriority;
}

export enum RequestPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

interface QueuedRequest {
    id: string;
    request: TapoApiRequest;
    options: RequestOptions;
    priority: RequestPriority;
    timestamp: number;
    resolve: (response: TapoApiResponse) => void;
    reject: (error: Error) => void;
}

/**
 * Manages request queuing, rate limiting, and request lifecycle
 * Single responsibility: Request queue management and rate limiting
 */
export class RequestManager {
    private requestQueue: QueuedRequest[] = [];
    private isProcessing: boolean = false;
    private lastRequestTime: number = 0;
    private requestCounter: number = 0;
    private requestExecutor?: (request: TapoApiRequest) => Promise<TapoApiResponse>;
    
    constructor(
        private readonly minRequestInterval: number = 100
    ) {}

    /**
     * Queue a request for execution
     */
    async queueRequest(
        request: TapoApiRequest, 
        options: RequestOptions = {}
    ): Promise<TapoApiResponse> {
        return new Promise((resolve, reject) => {
            const queuedRequest: QueuedRequest = {
                id: this.generateRequestId(),
                request,
                options: {
                    timeout: 10000,
                    retries: 3,
                    priority: RequestPriority.NORMAL,
                    ...options
                },
                priority: options.priority ?? RequestPriority.NORMAL,
                timestamp: Date.now(),
                resolve,
                reject
            };

            this.addToQueue(queuedRequest);
            this.processQueue();
        });
    }

    /**
     * Add request to queue with priority ordering
     */
    private addToQueue(request: QueuedRequest): void {
        // Insert request in priority order (higher priority first)
        let insertIndex = this.requestQueue.length;
        
        for (let i = 0; i < this.requestQueue.length; i++) {
            const queuedItem = this.requestQueue[i];
            if (queuedItem && queuedItem.priority < request.priority) {
                insertIndex = i;
                break;
            }
        }
        
        this.requestQueue.splice(insertIndex, 0, request);
    }

    /**
     * Process the request queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.requestQueue.length > 0) {
                const queuedRequest = this.requestQueue.shift();
                if (!queuedRequest) continue;
                
                try {
                    // Enforce rate limiting
                    await this.enforceRateLimit();
                    
                    // Execute the request
                    const response = await this.executeRequest(queuedRequest);
                    if (queuedRequest) {
                        queuedRequest.resolve(response);
                    }
                    
                } catch (error) {
                    // Handle retries
                    if (this.shouldRetry(queuedRequest, error as Error)) {
                        // Reduce retry count and re-queue
                        queuedRequest.options.retries!--;
                        this.addToQueue(queuedRequest);
                    } else {
                        queuedRequest.reject(error as Error);
                    }
                }
                
                this.lastRequestTime = Date.now();
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Set the request executor function
     */
    setRequestExecutor(executor: (request: TapoApiRequest) => Promise<TapoApiResponse>): void {
        this.requestExecutor = executor;
    }

    /**
     * Execute a single request using the configured executor
     */
    protected async executeRequest(queuedRequest: QueuedRequest): Promise<TapoApiResponse> {
        if (!this.requestExecutor) {
            throw new Error('Request executor not configured. Call setRequestExecutor() first.');
        }
        return this.requestExecutor(queuedRequest.request);
    }

    /**
     * Enforce rate limiting between requests
     */
    private async enforceRateLimit(): Promise<void> {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const delayTime = this.minRequestInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }
    }

    /**
     * Determine if a request should be retried
     */
    private shouldRetry(queuedRequest: QueuedRequest, error: Error): boolean {
        const retriesLeft = queuedRequest.options.retries ?? 0;
        
        if (retriesLeft <= 0) {
            return false;
        }

        // Don't retry certain types of errors
        const nonRetryableErrors = [
            'authentication failed',
            'invalid credentials',
            'device not found',
            'permission denied'
        ];

        const errorMessage = error.message.toLowerCase();
        const isNonRetryable = nonRetryableErrors.some(pattern => 
            errorMessage.includes(pattern)
        );

        return !isNonRetryable;
    }

    /**
     * Generate unique request ID
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${++this.requestCounter}`;
    }

    /**
     * Get current queue status
     */
    getQueueStatus(): {
        queueLength: number;
        isProcessing: boolean;
        lastRequestTime: number;
    } {
        return {
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessing,
            lastRequestTime: this.lastRequestTime
        };
    }

    /**
     * Clear the request queue (useful for cleanup)
     */
    clearQueue(): void {
        // Reject all pending requests
        for (const queuedRequest of this.requestQueue) {
            queuedRequest.reject(new Error('Request queue cleared'));
        }
        
        this.requestQueue = [];
        this.isProcessing = false;
    }

    /**
     * Cancel a specific request by ID
     */
    cancelRequest(requestId: string): boolean {
        const index = this.requestQueue.findIndex(req => req.id === requestId);
        
        if (index !== -1) {
            const cancelledRequest = this.requestQueue.splice(index, 1)[0];
            if (cancelledRequest) {
                cancelledRequest.reject(new Error('Request cancelled'));
            }
            return true;
        }
        
        return false;
    }

    /**
     * Get requests by priority
     */
    getRequestsByPriority(priority: RequestPriority): QueuedRequest[] {
        return this.requestQueue.filter(req => req.priority === priority);
    }

    /**
     * Update minimum request interval (useful for different protocols)
     */
    updateMinRequestInterval(interval: number): void {
        if (interval > 0) {
            // Cast to access private field for updating
            (this as any).minRequestInterval = interval;
        }
    }
}
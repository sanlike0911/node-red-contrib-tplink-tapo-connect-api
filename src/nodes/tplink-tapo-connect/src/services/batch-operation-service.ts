import { RetryOptions } from '../types/retry-options';
import { tplinkTapoConnectWrapperType } from '../types/wrapper-types';

/**
 * Service class for handling batch operations with smart delays and error handling
 */
export class BatchOperationService {

    /**
     * Execute multiple operations in sequence with smart delays to prevent KLAP -1012 errors
     * @param operations Array of operations to execute
     * @param options Configuration options for batch execution
     * @returns Array of results for each operation
     */
    static async executeBatch(
        operations: Array<{
            operation: () => Promise<tplinkTapoConnectWrapperType.tapoConnectResults>;
            name: string;
            delayAfter?: number;
        }>,
        options: {
            defaultDelay?: number;
            retryOptions?: RetryOptions;
        } = {}
    ): Promise<Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }>> {
        const results: Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }> = [];
        const defaultDelay = options.defaultDelay || 2000;

        for (let i = 0; i < operations.length; i++) {
            const operationItem = operations[i];
            if (!operationItem) continue;

            const { operation, name, delayAfter } = operationItem;
            const startTime = Date.now();

            try {
                console.log(`\n--- Executing batch operation: ${name} ---`);

                const data = await operation();
                const duration = Date.now() - startTime;

                const result: { name: string; success: boolean; data?: any; error?: Error; duration?: number } = {
                    name,
                    success: data.result,
                    duration
                };

                if (data.result) {
                    result.data = data;
                } else if (data.errorInf) {
                    result.error = data.errorInf;
                }

                results.push(result);

                // Add delay after operation (except for the last one)
                if (i < operations.length - 1) {
                    const delay = delayAfter !== undefined ? delayAfter : defaultDelay;
                    if (delay > 0) {
                        console.log(`⏳ Waiting ${delay}ms before next operation...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }

            } catch (error) {
                const duration = Date.now() - startTime;
                results.push({
                    name,
                    success: false,
                    error: error as Error,
                    duration
                });
            }
        }

        return results;
    }

    /**
     * Execute operations in parallel (use with caution for device operations)
     * @param operations Array of operations to execute in parallel
     * @param options Configuration options
     * @returns Array of results for each operation
     */
    static async executeParallel(
        operations: Array<{
            operation: () => Promise<tplinkTapoConnectWrapperType.tapoConnectResults>;
            name: string;
        }>,
        options: {
            maxConcurrency?: number;
        } = {}
    ): Promise<Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }>> {
        const maxConcurrency = options.maxConcurrency || 3;
        const results: Array<{ name: string; success: boolean; data?: any; error?: Error; duration?: number }> = [];
        
        // Process operations in chunks to limit concurrency
        for (let i = 0; i < operations.length; i += maxConcurrency) {
            const chunk = operations.slice(i, i + maxConcurrency);
            
            const chunkPromises = chunk.map(async (operationItem) => {
                const { operation, name } = operationItem;
                const startTime = Date.now();

                try {
                    console.log(`\n--- Executing parallel operation: ${name} ---`);
                    
                    const data = await operation();
                    const duration = Date.now() - startTime;

                    const result: { name: string; success: boolean; data?: any; error?: Error; duration?: number } = {
                        name,
                        success: data.result,
                        duration
                    };

                    if (data.result) {
                        result.data = data;
                    } else if (data.errorInf) {
                        result.error = data.errorInf;
                    }

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    return {
                        name,
                        success: false,
                        error: error as Error,
                        duration
                    };
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }

        return results;
    }
}
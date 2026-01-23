/**
 * Progressive Timeout Strategy
 *
 * Implements adaptive timeout progression for CLI commands:
 * - Start with 30s, increase to 60s then 120s on retries
 * - Max timeout capped at 5 minutes (300s)
 * - Support for cancellation via AbortController
 *
 * Architecture Decision: Resilient CLI execution with adaptive timeouts
 */

/**
 * Configuration for progressive timeout behavior
 */
export interface ProgressiveTimeoutConfig {
	/** Initial timeout in milliseconds. Default: 30000 (30s) */
	initialTimeout: number;
	/** Multiplier applied on each retry. Default: 2 */
	multiplier: number;
	/** Maximum timeout in milliseconds. Default: 300000 (5 min) */
	maxTimeout: number;
	/** Maximum number of retry attempts. Default: 3 */
	maxRetries: number;
	/** Optional AbortSignal for external cancellation */
	signal?: AbortSignal;
}

/**
 * Default configuration values
 */
export const DEFAULT_PROGRESSIVE_TIMEOUT_CONFIG: Omit<ProgressiveTimeoutConfig, 'signal'> = {
	initialTimeout: 30000, // 30 seconds
	multiplier: 2,
	maxTimeout: 300000, // 5 minutes
	maxRetries: 3
};

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends Error {
	readonly name = 'TimeoutError';
	readonly timeoutMs: number;
	readonly attempt: number;

	constructor(timeoutMs: number, attempt: number) {
		super(`Operation timed out after ${timeoutMs}ms (attempt ${attempt})`);
		this.timeoutMs = timeoutMs;
		this.attempt = attempt;
	}
}

/**
 * Error thrown when max retries are exhausted
 */
export class MaxRetriesError extends Error {
	readonly name = 'MaxRetriesError';
	readonly attempts: number;
	readonly totalTimeMs: number;

	constructor(attempts: number, totalTimeMs: number) {
		super(`Operation failed after ${attempts} attempts (total time: ${totalTimeMs}ms)`);
		this.attempts = attempts;
		this.totalTimeMs = totalTimeMs;
	}
}

/**
 * Error thrown when operation is cancelled
 */
export class CancellationError extends Error {
	readonly name = 'CancellationError';

	constructor(message: string) {
		super(message);
	}
}

/**
 * Calculate timeout for a given retry attempt
 *
 * @param attempt - Zero-based attempt number (0 = first attempt)
 * @param config - Optional partial configuration
 * @returns Timeout in milliseconds
 */
export function calculateTimeout(
	attempt: number,
	config?: Partial<ProgressiveTimeoutConfig>
): number {
	// Validate attempt number
	if (attempt < 0) {
		throw new Error('Attempt number must be non-negative');
	}
	if (!Number.isInteger(attempt)) {
		throw new Error('Attempt number must be an integer');
	}

	// Merge with defaults
	const mergedConfig = { ...DEFAULT_PROGRESSIVE_TIMEOUT_CONFIG, ...config };

	// Validate config
	if (mergedConfig.initialTimeout <= 0) {
		throw new Error('initialTimeout must be positive');
	}
	if (mergedConfig.multiplier <= 1) {
		throw new Error('multiplier must be greater than 1');
	}
	if (mergedConfig.maxTimeout <= mergedConfig.initialTimeout) {
		throw new Error('maxTimeout must be greater than initialTimeout');
	}

	// Calculate timeout: initial * multiplier^attempt
	const calculatedTimeout = mergedConfig.initialTimeout * Math.pow(mergedConfig.multiplier, attempt);

	// Cap at maxTimeout
	return Math.min(calculatedTimeout, mergedConfig.maxTimeout);
}

/**
 * Execute an operation with progressive timeout and retry
 *
 * @param operation - Async function that receives an AbortSignal
 * @param config - Optional partial configuration
 * @returns Promise resolving to operation result
 */
export async function executeWithProgressiveTimeout<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	config?: Partial<ProgressiveTimeoutConfig>
): Promise<T> {
	const mergedConfig = { ...DEFAULT_PROGRESSIVE_TIMEOUT_CONFIG, ...config };
	let attempt = 0;
	let totalTimeMs = 0;

	while (attempt <= mergedConfig.maxRetries) {
		const timeout = calculateTimeout(attempt, mergedConfig);
		totalTimeMs += timeout;

		const controller = new AbortController();

		// Link external signal to internal controller
		if (mergedConfig.signal) {
			if (mergedConfig.signal.aborted) {
				throw new CancellationError('Operation cancelled');
			}
			mergedConfig.signal.addEventListener('abort', () => {
				controller.abort();
			});
		}

		// Set up timeout
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, timeout);

		try {
			const result = await operation(controller.signal);
			clearTimeout(timeoutId);
			return result;
		} catch (error) {
			clearTimeout(timeoutId);

			// Check if externally cancelled
			if (mergedConfig.signal?.aborted) {
				throw new CancellationError('Operation cancelled');
			}

			// Check if this is a timeout (aborted signal)
			if (error instanceof TimeoutError || controller.signal.aborted) {
				attempt++;
				if (attempt > mergedConfig.maxRetries) {
					throw new MaxRetriesError(attempt, totalTimeMs);
				}
				// Continue to next retry
				continue;
			}

			// Non-timeout error - don't retry
			throw error;
		}
	}

	throw new MaxRetriesError(attempt, totalTimeMs);
}

/**
 * Error thrown when SSE reconnection parameters are invalid.
 */
export class SSEReconnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SSEReconnectionError';
	}
}

/**
 * Configuration for SSE reconnection behavior.
 */
export interface SSEReconnectionConfig {
	initialDelayMs: number;
	maxDelayMs: number;
	fullRefreshThresholdMs: number;
	backoffMultiplier?: number;
}

/**
 * State tracking for SSE reconnection attempts.
 */
export interface SSEReconnectionState {
	lastEventId: string | null;
	attemptCount: number;
	disconnectedAt: number | null;
	lastAttemptAt: number | null;
}

/**
 * Calculate exponential backoff delay for reconnection attempt.
 */
export function calculateBackoff(attemptCount: number, config: SSEReconnectionConfig): number {
	if (attemptCount < 0) {
		throw new SSEReconnectionError('Attempt count cannot be negative');
	}
	if (config.initialDelayMs <= 0) {
		throw new SSEReconnectionError('Initial delay must be positive');
	}
	if (config.maxDelayMs <= 0) {
		throw new SSEReconnectionError('Max delay must be positive');
	}

	const multiplier = config.backoffMultiplier ?? 2;
	const delay = config.initialDelayMs * Math.pow(multiplier, attemptCount);
	return Math.min(delay, config.maxDelayMs);
}

/**
 * Determine if a full refresh is needed based on disconnect duration.
 */
export function shouldFullRefresh(
	state: SSEReconnectionState,
	config: SSEReconnectionConfig
): boolean {
	if (config.fullRefreshThresholdMs <= 0) {
		throw new SSEReconnectionError('Full refresh threshold must be positive');
	}
	if (state.disconnectedAt === null) {
		return false;
	}
	const elapsed = Date.now() - state.disconnectedAt;
	return elapsed >= config.fullRefreshThresholdMs;
}

/**
 * Create initial reconnection state.
 */
export function createReconnectionState(lastEventId?: string): SSEReconnectionState {
	return {
		lastEventId: lastEventId ?? null,
		attemptCount: 0,
		disconnectedAt: null,
		lastAttemptAt: null
	};
}

type UpdateEvent =
	| { type: 'attempt' }
	| { type: 'disconnect' }
	| { type: 'event'; eventId?: string };

/**
 * Update reconnection state based on event type.
 */
export function updateReconnectionState(
	state: SSEReconnectionState,
	event: UpdateEvent
): SSEReconnectionState {
	if (event.type === 'attempt') {
		return {
			...state,
			attemptCount: state.attemptCount + 1,
			lastAttemptAt: Date.now()
		};
	}
	if (event.type === 'disconnect') {
		return {
			...state,
			disconnectedAt: state.disconnectedAt ?? Date.now()
		};
	}
	if (event.type === 'event') {
		return {
			...state,
			lastEventId: event.eventId ?? state.lastEventId
		};
	}
	return state;
}

/**
 * Reset reconnection state after successful reconnect.
 */
export function resetReconnectionState(state: SSEReconnectionState): SSEReconnectionState {
	return {
		lastEventId: state.lastEventId,
		attemptCount: 0,
		disconnectedAt: null,
		lastAttemptAt: null
	};
}

/**
 * Network Partition Detection and Recovery Store
 *
 * Provides:
 * - Real-time offline/online detection within 1s
 * - Request queueing for offline scenarios
 * - FIFO queue processing on reconnection
 * - Polling pause integration
 */

// Browser detection
const browser = typeof window !== 'undefined';

/**
 * Error thrown for network-related failures
 */
export class NetworkError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NetworkError';
	}
}

/**
 * Queued request structure
 */
export interface QueuedRequest {
	id: string;
	type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	endpoint: string;
	payload?: unknown;
	timestamp: number;
}

/**
 * Network state structure
 */
export interface NetworkState {
	isOnline: boolean;
	isOffline: boolean;
	queuedRequests: QueuedRequest[];
	queuedCount: number;
	shouldPausePolling: boolean;
	lastOfflineAt: number | null;
	lastOnlineAt: number | null;
	lastOfflineDuration: number | null;
}

/**
 * Request configuration for queueing
 */
export interface QueueRequestConfig {
	type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	endpoint: string;
	payload?: unknown;
}

type StatusChangeCallback = (isOnline: boolean) => void;
type QueueProcessor = (request: QueuedRequest) => Promise<boolean>;

/**
 * Create a network store instance
 */
export function createNetworkStore() {
	// State
	let isOnline = browser ? navigator.onLine : true;
	let queuedRequests: QueuedRequest[] = [];
	let callbacks: StatusChangeCallback[] = [];
	let autoProcessor: QueueProcessor | null = null;
	let lastOfflineAt: number | null = null;
	let lastOnlineAt: number | null = isOnline ? Date.now() : null;
	let lastOfflineDuration: number | null = null;
	let destroyed = false;

	// Event handlers
	const handleOnline = () => {
		if (destroyed) return;
		const wasOffline = !isOnline;
		isOnline = true;

		if (wasOffline) {
			const now = Date.now();
			if (lastOfflineAt !== null) {
				lastOfflineDuration = now - lastOfflineAt;
			}
			lastOnlineAt = now;

			// Notify callbacks
			for (const callback of callbacks) {
				try {
					callback(true);
				} catch {
					// Ignore callback errors
				}
			}

			// Auto-process queue if enabled
			if (autoProcessor) {
				processQueueInternal(autoProcessor);
			}
		}
	};

	const handleOffline = () => {
		if (destroyed) return;
		const wasOnline = isOnline;
		isOnline = false;

		if (wasOnline) {
			lastOfflineAt = Date.now();

			// Notify callbacks
			for (const callback of callbacks) {
				try {
					callback(false);
				} catch {
					// Ignore callback errors
				}
			}
		}
	};

	// Initialize event listeners
	if (browser) {
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	}

	// Internal queue processor
	async function processQueueInternal(processor: QueueProcessor) {
		if (!isOnline || queuedRequests.length === 0) return;

		const toProcess = [...queuedRequests];
		for (const request of toProcess) {
			try {
				const success = await processor(request);
				if (success) {
					queuedRequests = queuedRequests.filter((r) => r.id !== request.id);
				}
			} catch {
				// Keep failed requests in queue
			}
		}
	}

	return {
		/**
		 * Current network state
		 */
		get state(): NetworkState {
			return {
				isOnline,
				isOffline: !isOnline,
				queuedRequests: [...queuedRequests],
				queuedCount: queuedRequests.length,
				shouldPausePolling: !isOnline,
				lastOfflineAt,
				lastOnlineAt,
				lastOfflineDuration
			};
		},

		/**
		 * Assert that the network is online
		 * @throws NetworkError if offline
		 */
		assertOnline(): void {
			if (!isOnline) {
				throw new NetworkError('Network is offline');
			}
		},

		/**
		 * Subscribe to status changes
		 */
		onStatusChange(callback: StatusChangeCallback): () => void {
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
			};
		},

		/**
		 * Queue a request for later processing
		 */
		queueRequest(config: QueueRequestConfig): string {
			if (!config.endpoint || config.endpoint.trim() === '') {
				throw new NetworkError('Endpoint cannot be empty');
			}

			const request: QueuedRequest = {
				id: crypto.randomUUID(),
				type: config.type,
				endpoint: config.endpoint,
				payload: config.payload,
				timestamp: Date.now()
			};

			queuedRequests = [...queuedRequests, request];
			return request.id;
		},

		/**
		 * Remove a request from the queue
		 */
		removeRequest(id: string): void {
			queuedRequests = queuedRequests.filter((r) => r.id !== id);
		},

		/**
		 * Clear all queued requests
		 */
		clearQueue(): void {
			queuedRequests = [];
		},

		/**
		 * Process the queue with a custom processor
		 */
		async processQueue(processor: QueueProcessor): Promise<void> {
			await processQueueInternal(processor);
		},

		/**
		 * Set auto-process handler for reconnection
		 */
		setAutoProcessQueue(processor: QueueProcessor | null): void {
			autoProcessor = processor;
		},

		/**
		 * Cleanup and destroy the store
		 */
		destroy(): void {
			destroyed = true;
			callbacks = [];

			if (browser) {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			}
		}
	};
}

// Singleton instance for convenience
export const networkStore = createNetworkStore();

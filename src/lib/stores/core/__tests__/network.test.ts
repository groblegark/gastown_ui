/**
 * Network Partition Detection and Recovery Tests
 *
 * Tests for:
 * - Offline detection within 1s
 * - Online recovery
 * - Request queueing
 * - Queue processing order (FIFO)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock browser APIs before importing the module
const mockNavigator = {
	onLine: true
};

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Setup global mocks
vi.stubGlobal('navigator', mockNavigator);
vi.stubGlobal('window', {
	addEventListener: mockAddEventListener,
	removeEventListener: mockRemoveEventListener
});
vi.stubGlobal('crypto', {
	randomUUID: () => `uuid-${Date.now()}-${Math.random()}`
});

// Import after mocks are set up
import {
	createNetworkStore,
	type NetworkState,
	type QueuedRequest,
	NetworkError
} from '../network.svelte';

describe('Network Partition Detection', () => {
	let networkStore: ReturnType<typeof createNetworkStore>;
	let onlineHandler: (() => void) | null = null;
	let offlineHandler: (() => void) | null = null;

	beforeEach(() => {
		vi.useFakeTimers();
		mockNavigator.onLine = true;

		// Capture event handlers
		mockAddEventListener.mockImplementation((event: string, handler: () => void) => {
			if (event === 'online') onlineHandler = handler;
			if (event === 'offline') offlineHandler = handler;
		});

		networkStore = createNetworkStore();
	});

	afterEach(() => {
		networkStore.destroy();
		vi.useRealTimers();
		vi.clearAllMocks();
		onlineHandler = null;
		offlineHandler = null;
	});

	describe('Offline Detection', () => {
		it('detects offline state within 1 second', () => {
			expect(networkStore.state.isOnline).toBe(true);

			// Simulate going offline
			mockNavigator.onLine = false;
			offlineHandler?.();

			// Should detect within 1s (we check immediately after event)
			vi.advanceTimersByTime(1000);

			expect(networkStore.state.isOnline).toBe(false);
			expect(networkStore.state.isOffline).toBe(true);
		});

		it('initializes with correct online state', () => {
			mockNavigator.onLine = true;
			const store = createNetworkStore();

			expect(store.state.isOnline).toBe(true);
			expect(store.state.isOffline).toBe(false);

			store.destroy();
		});

		it('initializes with correct offline state', () => {
			mockNavigator.onLine = false;
			const store = createNetworkStore();

			expect(store.state.isOnline).toBe(false);
			expect(store.state.isOffline).toBe(true);

			store.destroy();
		});

		it('throws NetworkError when accessing network-dependent features while offline', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			expect(() => networkStore.assertOnline()).toThrow(NetworkError);
			expect(() => networkStore.assertOnline()).toThrow('Network is offline');
		});
	});

	describe('Online Recovery', () => {
		it('detects online recovery', () => {
			// Start offline
			mockNavigator.onLine = false;
			offlineHandler?.();
			expect(networkStore.state.isOnline).toBe(false);

			// Go back online
			mockNavigator.onLine = true;
			onlineHandler?.();

			expect(networkStore.state.isOnline).toBe(true);
			expect(networkStore.state.isOffline).toBe(false);
		});

		it('calls onOnline callback when recovering', () => {
			const onOnline = vi.fn();
			networkStore.onStatusChange(onOnline);

			// Go offline then online
			mockNavigator.onLine = false;
			offlineHandler?.();
			mockNavigator.onLine = true;
			onlineHandler?.();

			expect(onOnline).toHaveBeenCalledWith(true);
		});

		it('calls onOffline callback when going offline', () => {
			const onOffline = vi.fn();
			networkStore.onStatusChange(onOffline);

			mockNavigator.onLine = false;
			offlineHandler?.();

			expect(onOffline).toHaveBeenCalledWith(false);
		});

		it('returns unsubscribe function from onStatusChange', () => {
			const callback = vi.fn();
			const unsubscribe = networkStore.onStatusChange(callback);

			mockNavigator.onLine = false;
			offlineHandler?.();
			expect(callback).toHaveBeenCalledTimes(1);

			unsubscribe();

			mockNavigator.onLine = true;
			onlineHandler?.();
			// Should not be called again after unsubscribe
			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	describe('Request Queueing', () => {
		it('queues requests when offline', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			const requestId = networkStore.queueRequest({
				type: 'POST',
				endpoint: '/api/test',
				payload: { data: 'test' }
			});

			expect(requestId).toBeDefined();
			expect(networkStore.state.queuedRequests.length).toBe(1);
		});

		it('returns queued request with correct properties', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			const requestId = networkStore.queueRequest({
				type: 'POST',
				endpoint: '/api/test',
				payload: { data: 'test' }
			});

			const queued = networkStore.state.queuedRequests[0];
			expect(queued.id).toBe(requestId);
			expect(queued.type).toBe('POST');
			expect(queued.endpoint).toBe('/api/test');
			expect(queued.payload).toEqual({ data: 'test' });
			expect(queued.timestamp).toBeDefined();
		});

		it('throws NetworkError when queueing empty endpoint', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			expect(() =>
				networkStore.queueRequest({
					type: 'GET',
					endpoint: ''
				})
			).toThrow(NetworkError);
			expect(() =>
				networkStore.queueRequest({
					type: 'GET',
					endpoint: ''
				})
			).toThrow('Endpoint cannot be empty');
		});

		it('allows queueing requests when online (for retry scenarios)', () => {
			// Online state
			expect(networkStore.state.isOnline).toBe(true);

			const requestId = networkStore.queueRequest({
				type: 'POST',
				endpoint: '/api/retry',
				payload: { retry: true }
			});

			expect(requestId).toBeDefined();
			expect(networkStore.state.queuedRequests.length).toBe(1);
		});

		it('tracks queue count correctly', () => {
			expect(networkStore.state.queuedCount).toBe(0);

			networkStore.queueRequest({ type: 'GET', endpoint: '/api/1' });
			expect(networkStore.state.queuedCount).toBe(1);

			networkStore.queueRequest({ type: 'GET', endpoint: '/api/2' });
			expect(networkStore.state.queuedCount).toBe(2);

			networkStore.queueRequest({ type: 'GET', endpoint: '/api/3' });
			expect(networkStore.state.queuedCount).toBe(3);
		});

		it('removes request from queue by id', () => {
			const id1 = networkStore.queueRequest({ type: 'GET', endpoint: '/api/1' });
			const id2 = networkStore.queueRequest({ type: 'GET', endpoint: '/api/2' });

			expect(networkStore.state.queuedCount).toBe(2);

			networkStore.removeRequest(id1);

			expect(networkStore.state.queuedCount).toBe(1);
			expect(networkStore.state.queuedRequests[0].id).toBe(id2);
		});

		it('clears all queued requests', () => {
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/1' });
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/2' });
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/3' });

			expect(networkStore.state.queuedCount).toBe(3);

			networkStore.clearQueue();

			expect(networkStore.state.queuedCount).toBe(0);
			expect(networkStore.state.queuedRequests).toEqual([]);
		});
	});

	describe('Queue Processing Order (FIFO)', () => {
		it('processes queue in FIFO order', async () => {
			const processedOrder: string[] = [];

			// Queue requests
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/first' });
			vi.advanceTimersByTime(10);
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/second' });
			vi.advanceTimersByTime(10);
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/third' });

			// Process queue
			await networkStore.processQueue(async (request) => {
				processedOrder.push(request.endpoint);
				return true;
			});

			expect(processedOrder).toEqual(['/api/first', '/api/second', '/api/third']);
		});

		it('removes successfully processed requests from queue', async () => {
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/1' });
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/2' });

			await networkStore.processQueue(async () => true);

			expect(networkStore.state.queuedCount).toBe(0);
		});

		it('keeps failed requests in queue', async () => {
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/success' });
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/fail' });

			await networkStore.processQueue(async (request) => {
				return request.endpoint !== '/api/fail';
			});

			expect(networkStore.state.queuedCount).toBe(1);
			expect(networkStore.state.queuedRequests[0].endpoint).toBe('/api/fail');
		});

		it('does not process queue when offline', async () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			networkStore.queueRequest({ type: 'GET', endpoint: '/api/test' });

			const processor = vi.fn().mockResolvedValue(true);
			await networkStore.processQueue(processor);

			expect(processor).not.toHaveBeenCalled();
			expect(networkStore.state.queuedCount).toBe(1);
		});

		it('auto-processes queue on reconnection when enabled', async () => {
			const processor = vi.fn().mockResolvedValue(true);
			networkStore.setAutoProcessQueue(processor);

			// Queue while offline
			mockNavigator.onLine = false;
			offlineHandler?.();
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/test' });

			expect(processor).not.toHaveBeenCalled();

			// Go online
			mockNavigator.onLine = true;
			onlineHandler?.();

			// Need to wait for async processing
			await vi.runAllTimersAsync();

			expect(processor).toHaveBeenCalled();
		});

		it('handles processor throwing error gracefully', async () => {
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/1' });
			networkStore.queueRequest({ type: 'GET', endpoint: '/api/2' });

			const processor = vi.fn().mockImplementation(async (request: QueuedRequest) => {
				if (request.endpoint === '/api/1') {
					throw new Error('Processing failed');
				}
				return true;
			});

			// Should not throw
			await expect(networkStore.processQueue(processor)).resolves.not.toThrow();

			// First request should be kept (failed), second processed
			expect(networkStore.state.queuedCount).toBe(1);
			expect(networkStore.state.queuedRequests[0].endpoint).toBe('/api/1');
		});
	});

	describe('Polling Pause Integration', () => {
		it('provides shouldPausePolling flag when offline', () => {
			expect(networkStore.state.shouldPausePolling).toBe(false);

			mockNavigator.onLine = false;
			offlineHandler?.();

			expect(networkStore.state.shouldPausePolling).toBe(true);
		});

		it('provides shouldPausePolling false when online', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();
			expect(networkStore.state.shouldPausePolling).toBe(true);

			mockNavigator.onLine = true;
			onlineHandler?.();
			expect(networkStore.state.shouldPausePolling).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('handles rapid online/offline transitions', () => {
			const callback = vi.fn();
			networkStore.onStatusChange(callback);

			// Rapid transitions
			mockNavigator.onLine = false;
			offlineHandler?.();
			mockNavigator.onLine = true;
			onlineHandler?.();
			mockNavigator.onLine = false;
			offlineHandler?.();
			mockNavigator.onLine = true;
			onlineHandler?.();

			expect(callback).toHaveBeenCalledTimes(4);
			expect(networkStore.state.isOnline).toBe(true);
		});

		it('handles removing non-existent request gracefully', () => {
			// Should not throw
			expect(() => networkStore.removeRequest('non-existent-id')).not.toThrow();
		});

		it('handles processing empty queue', async () => {
			const processor = vi.fn();
			await networkStore.processQueue(processor);

			expect(processor).not.toHaveBeenCalled();
		});

		it('tracks last offline timestamp', () => {
			expect(networkStore.state.lastOfflineAt).toBeNull();

			mockNavigator.onLine = false;
			offlineHandler?.();

			expect(networkStore.state.lastOfflineAt).toBeDefined();
			expect(typeof networkStore.state.lastOfflineAt).toBe('number');
		});

		it('tracks last online timestamp', () => {
			expect(networkStore.state.lastOnlineAt).toBeDefined();

			mockNavigator.onLine = false;
			offlineHandler?.();
			const beforeOnline = networkStore.state.lastOnlineAt;

			vi.advanceTimersByTime(1000);

			mockNavigator.onLine = true;
			onlineHandler?.();

			expect(networkStore.state.lastOnlineAt).toBeGreaterThan(beforeOnline!);
		});

		it('calculates offline duration correctly', () => {
			mockNavigator.onLine = false;
			offlineHandler?.();

			vi.advanceTimersByTime(5000);

			mockNavigator.onLine = true;
			onlineHandler?.();

			expect(networkStore.state.lastOfflineDuration).toBeGreaterThanOrEqual(5000);
		});
	});

	describe('Cleanup', () => {
		it('removes event listeners on destroy', () => {
			networkStore.destroy();

			expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
			expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
		});

		it('clears callbacks on destroy', () => {
			const callback = vi.fn();
			networkStore.onStatusChange(callback);

			networkStore.destroy();

			// After destroy, callbacks should not fire
			mockNavigator.onLine = false;
			offlineHandler?.();

			// Callback count should remain at 0 (not called after destroy)
			expect(callback).not.toHaveBeenCalled();
		});
	});
});

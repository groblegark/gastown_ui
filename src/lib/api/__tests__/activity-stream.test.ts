/**
 * Unit Tests: Activity Stream SSE Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivityStream, type StreamEvent } from '../activity-stream';

class MockEventSource {
	url: string;
	onopen: (() => void) | null = null;
	onmessage: ((event: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	readyState = 0;
	static instances: MockEventSource[] = [];

	constructor(url: string) {
		this.url = url;
		MockEventSource.instances.push(this);
	}

	open() {
		this.readyState = 1;
		this.onopen?.();
	}

	close() {
		this.readyState = 2;
	}

	simulateMessage(data: unknown) {
		this.onmessage?.({ data: JSON.stringify(data) });
	}

	simulateError() {
		this.onerror?.();
	}

	static clear() {
		MockEventSource.instances = [];
	}
}

describe('ActivityStream', () => {
	let originalEventSource: typeof EventSource;

	beforeEach(() => {
		originalEventSource = globalThis.EventSource;
		MockEventSource.clear();

		globalThis.EventSource = vi.fn((url: string) => {
			return new MockEventSource(url) as unknown as EventSource;
		}) as unknown as typeof EventSource;
	});

	afterEach(() => {
		globalThis.EventSource = originalEventSource;
	});

	describe('constructor', () => {
		it('creates instance with url', () => {
			const stream = new ActivityStream('/api/feed');
			expect(stream).toBeDefined();
			expect(stream.isConnected).toBe(false);
		});

		it('accepts custom options', () => {
			const stream = new ActivityStream('/api/feed', {
				reconnectDelay: 2000,
				maxReconnectDelay: 60000,
				reconnectMultiplier: 3
			});
			expect(stream).toBeDefined();
		});
	});

	describe('connect()', () => {
		it('creates EventSource connection', () => {
			const stream = new ActivityStream('/api/feed');
			stream.connect();

			expect(globalThis.EventSource).toHaveBeenCalledWith('/api/feed');
			expect(MockEventSource.instances).toHaveLength(1);
		});

		it('sets isConnected on open', () => {
			const stream = new ActivityStream('/api/feed');
			const onConnect = vi.fn();
			stream.onConnect(onConnect);

			stream.connect();
			MockEventSource.instances[0].open();

			expect(stream.isConnected).toBe(true);
			expect(onConnect).toHaveBeenCalled();
		});

		it('does not create duplicate connections', () => {
			const stream = new ActivityStream('/api/feed');
			stream.connect();
			stream.connect();

			expect(MockEventSource.instances).toHaveLength(1);
		});
	});

	describe('disconnect()', () => {
		it('closes EventSource', () => {
			const stream = new ActivityStream('/api/feed');
			stream.connect();
			MockEventSource.instances[0].open();

			stream.disconnect();

			expect(stream.isConnected).toBe(false);
			expect(MockEventSource.instances[0].readyState).toBe(2);
		});
	});

	describe('event handling', () => {
		it('parses and emits events', () => {
			const stream = new ActivityStream('/api/feed');
			const events: StreamEvent[] = [];

			stream.on('work_changed', (e) => events.push(e));
			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({
				type: 'work_changed',
				timestamp: '2026-01-14T00:00:00Z',
				data: { id: 'test' }
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('work_changed');
			expect(events[0].data.id).toBe('test');
		});

		it('emits to wildcard listeners', () => {
			const stream = new ActivityStream('/api/feed');
			const events: StreamEvent[] = [];

			stream.on('*', (e) => events.push(e));
			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({
				type: 'any_event',
				timestamp: '2026-01-14T00:00:00Z',
				data: {}
			});

			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('any_event');
		});

		it('supports multiple listeners per event', () => {
			const stream = new ActivityStream('/api/feed');
			const calls: number[] = [];

			stream.on('test', () => calls.push(1));
			stream.on('test', () => calls.push(2));
			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({
				type: 'test',
				timestamp: '2026-01-14T00:00:00Z',
				data: {}
			});

			expect(calls).toEqual([1, 2]);
		});

		it('ignores invalid JSON', () => {
			const stream = new ActivityStream('/api/feed');
			const callback = vi.fn();

			stream.on('*', callback);
			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].onmessage?.({ data: 'not json' });

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('unsubscribe', () => {
		it('returns unsubscribe function from on()', () => {
			const stream = new ActivityStream('/api/feed');
			const calls: number[] = [];

			const unsub = stream.on('test', () => calls.push(1));
			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({ type: 'test', timestamp: '', data: {} });
			expect(calls).toHaveLength(1);

			unsub();

			MockEventSource.instances[0].simulateMessage({ type: 'test', timestamp: '', data: {} });
			expect(calls).toHaveLength(1);
		});

		it('off() removes specific listener', () => {
			const stream = new ActivityStream('/api/feed');
			const callback = vi.fn();

			stream.on('test', callback);
			stream.off('test', callback);

			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({ type: 'test', timestamp: '', data: {} });
			expect(callback).not.toHaveBeenCalled();
		});

		it('off() removes all listeners for event type', () => {
			const stream = new ActivityStream('/api/feed');
			const cb1 = vi.fn();
			const cb2 = vi.fn();

			stream.on('test', cb1);
			stream.on('test', cb2);
			stream.off('test');

			stream.connect();
			MockEventSource.instances[0].open();

			MockEventSource.instances[0].simulateMessage({ type: 'test', timestamp: '', data: {} });
			expect(cb1).not.toHaveBeenCalled();
			expect(cb2).not.toHaveBeenCalled();
		});

		it('removeAllListeners() clears everything', () => {
			const stream = new ActivityStream('/api/feed');
			stream.on('a', vi.fn());
			stream.on('b', vi.fn());
			stream.onError(vi.fn());
			stream.onConnect(vi.fn());

			stream.removeAllListeners();
		});
	});

	describe('error handling', () => {
		it('calls onDisconnect on error', () => {
			const stream = new ActivityStream('/api/feed');
			const onDisconnect = vi.fn();
			stream.onDisconnect(onDisconnect);

			stream.connect();
			MockEventSource.instances[0].open();
			MockEventSource.instances[0].simulateError();

			expect(onDisconnect).toHaveBeenCalled();
			expect(stream.isConnected).toBe(false);
		});

		it('onError listener can be unsubscribed', () => {
			const stream = new ActivityStream('/api/feed');
			const onError = vi.fn();

			const unsub = stream.onError(onError);
			unsub();
		});

		it('onConnect listener can be unsubscribed', () => {
			const stream = new ActivityStream('/api/feed');
			const onConnect = vi.fn();

			const unsub = stream.onConnect(onConnect);
			unsub();

			stream.connect();
			MockEventSource.instances[0].open();

			expect(onConnect).not.toHaveBeenCalled();
		});

		it('onDisconnect listener can be unsubscribed', () => {
			const stream = new ActivityStream('/api/feed');
			const onDisconnect = vi.fn();

			const unsub = stream.onDisconnect(onDisconnect);
			unsub();

			stream.connect();
			MockEventSource.instances[0].open();
			MockEventSource.instances[0].simulateError();

			expect(onDisconnect).not.toHaveBeenCalled();
		});
	});
});

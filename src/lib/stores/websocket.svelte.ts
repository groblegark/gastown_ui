/**
 * WebSocket client store using Svelte 5 runes
 *
 * Provides:
 * - Connection to Gas Town daemon
 * - Automatic reconnection with exponential backoff
 * - Heartbeat/ping-pong handling
 * - Connection state management
 * - Event dispatch to stores
 */

import { networkState } from './network.svelte';

// Browser detection without SvelteKit dependency (works in all contexts)
const browser = typeof window !== 'undefined';

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Message types from the daemon
export type MessageType =
	| 'ping'
	| 'pong'
	| 'agent_status'
	| 'log_entry'
	| 'queue_update'
	| 'workflow_update'
	| 'error';

// Base message structure
export interface WSMessage {
	type: MessageType;
	timestamp: number;
	payload?: unknown;
}

// Typed message payloads
// Note: No 'idle' status - agents are working, blocked, error, or offline
export interface AgentStatusPayload {
	agentId: string;
	status: 'working' | 'blocked' | 'error' | 'offline';
	currentTask?: string;
}

export interface LogEntryPayload {
	agentId: string;
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	timestamp: number;
}

export interface QueueUpdatePayload {
	queueId: string;
	action: 'added' | 'removed' | 'updated';
	item?: unknown;
}

export interface WorkflowUpdatePayload {
	workflowId: string;
	status: 'started' | 'completed' | 'failed' | 'step_completed';
	step?: string;
	error?: string;
}

// Event handler types
type MessageHandler<T = unknown> = (payload: T) => void;
type ConnectionHandler = (state: ConnectionState) => void;

// Configuration
interface WebSocketConfig {
	url: string;
	reconnectBaseDelay: number;
	reconnectMaxDelay: number;
	heartbeatInterval: number;
	heartbeatTimeout: number;
}

const DEFAULT_CONFIG: WebSocketConfig = {
	url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
	reconnectBaseDelay: 1000,
	reconnectMaxDelay: 30000,
	heartbeatInterval: 30000,
	heartbeatTimeout: 5000
};

class WebSocketClient {
	// Configuration
	#config: WebSocketConfig;

	// Connection state
	#state = $state<ConnectionState>('disconnected');
	#socket: WebSocket | null = null;
	#reconnectAttempt = 0;
	#reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	// Heartbeat state
	#heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	#heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
	#lastPong = 0;

	// Event handlers
	#messageHandlers = new Map<MessageType, Set<MessageHandler>>();
	#connectionHandlers: ConnectionHandler[] = [];

	// Network state integration
	#networkUnsubscribe: (() => void) | null = null;

	constructor(config: Partial<WebSocketConfig> = {}) {
		this.#config = { ...DEFAULT_CONFIG, ...config };

		if (browser) {
			this.#setupNetworkListener();
		}
	}

	// Public getters
	get state() {
		return this.#state;
	}

	get isConnected() {
		return this.#state === 'connected';
	}

	get reconnectAttempt() {
		return this.#reconnectAttempt;
	}

	// Connect to the WebSocket server
	connect() {
		if (!browser) return;
		if (this.#socket?.readyState === WebSocket.OPEN) return;
		if (this.#state === 'connecting') return;

		// Don't connect if offline
		if (networkState.isOffline) {
			this.#setState('disconnected');
			return;
		}

		this.#setState('connecting');
		this.#createSocket();
	}

	// Disconnect from the server
	disconnect() {
		this.#cleanup();
		this.#setState('disconnected');
		this.#reconnectAttempt = 0;
	}

	// Send a message to the server
	send(type: MessageType, payload?: unknown): boolean {
		if (!this.#socket || this.#socket.readyState !== WebSocket.OPEN) {
			return false;
		}

		const message: WSMessage = {
			type,
			timestamp: Date.now(),
			payload
		};

		try {
			this.#socket.send(JSON.stringify(message));
			return true;
		} catch {
			return false;
		}
	}

	// Subscribe to specific message types
	on<T = unknown>(type: MessageType, handler: MessageHandler<T>): () => void {
		if (!this.#messageHandlers.has(type)) {
			this.#messageHandlers.set(type, new Set());
		}
		this.#messageHandlers.get(type)!.add(handler as MessageHandler);

		return () => {
			this.#messageHandlers.get(type)?.delete(handler as MessageHandler);
		};
	}

	// Subscribe to connection state changes
	onStateChange(handler: ConnectionHandler): () => void {
		this.#connectionHandlers.push(handler);

		return () => {
			const index = this.#connectionHandlers.indexOf(handler);
			if (index > -1) {
				this.#connectionHandlers.splice(index, 1);
			}
		};
	}

	// Private methods

	#createSocket() {
		try {
			this.#socket = new WebSocket(this.#config.url);
			this.#socket.onopen = this.#handleOpen;
			this.#socket.onclose = this.#handleClose;
			this.#socket.onerror = this.#handleError;
			this.#socket.onmessage = this.#handleMessage;
		} catch {
			this.#scheduleReconnect();
		}
	}

	#handleOpen = () => {
		this.#setState('connected');
		this.#reconnectAttempt = 0;
		this.#startHeartbeat();
	};

	#handleClose = () => {
		this.#stopHeartbeat();

		if (this.#state !== 'disconnected') {
			this.#scheduleReconnect();
		}
	};

	#handleError = () => {
		// Error events are followed by close events, so we don't need special handling
	};

	#handleMessage = (event: MessageEvent) => {
		try {
			const message = JSON.parse(event.data) as WSMessage;

			// Handle ping-pong
			if (message.type === 'ping') {
				this.send('pong');
				return;
			}

			if (message.type === 'pong') {
				this.#lastPong = Date.now();
				this.#clearHeartbeatTimeout();
				return;
			}

			// Dispatch to handlers
			const handlers = this.#messageHandlers.get(message.type);
			if (handlers) {
				for (const handler of handlers) {
					try {
						handler(message.payload);
					} catch (e) {
						console.error(`WebSocket handler error for ${message.type}:`, e);
					}
				}
			}
		} catch {
			console.error('Failed to parse WebSocket message');
		}
	};

	#setState(state: ConnectionState) {
		const previous = this.#state;
		this.#state = state;

		if (previous !== state) {
			for (const handler of this.#connectionHandlers) {
				try {
					handler(state);
				} catch (e) {
					console.error('Connection state handler error:', e);
				}
			}
		}
	}

	#scheduleReconnect() {
		if (this.#state === 'disconnected') return;
		if (networkState.isOffline) {
			this.#setState('disconnected');
			return;
		}

		this.#setState('reconnecting');
		this.#reconnectAttempt++;

		// Exponential backoff with jitter
		const baseDelay = this.#config.reconnectBaseDelay;
		const maxDelay = this.#config.reconnectMaxDelay;
		const delay = Math.min(baseDelay * Math.pow(2, this.#reconnectAttempt - 1), maxDelay);
		const jitter = delay * 0.2 * Math.random();
		const totalDelay = delay + jitter;

		this.#reconnectTimeout = setTimeout(() => {
			this.#reconnectTimeout = null;
			this.connect();
		}, totalDelay);
	}

	#startHeartbeat() {
		this.#stopHeartbeat();
		this.#lastPong = Date.now();

		this.#heartbeatInterval = setInterval(() => {
			if (this.#socket?.readyState === WebSocket.OPEN) {
				this.send('ping');
				this.#startHeartbeatTimeout();
			}
		}, this.#config.heartbeatInterval);
	}

	#stopHeartbeat() {
		if (this.#heartbeatInterval) {
			clearInterval(this.#heartbeatInterval);
			this.#heartbeatInterval = null;
		}
		this.#clearHeartbeatTimeout();
	}

	#startHeartbeatTimeout() {
		this.#clearHeartbeatTimeout();

		this.#heartbeatTimeout = setTimeout(() => {
			// No pong received, connection may be dead
			console.warn('WebSocket heartbeat timeout, reconnecting...');
			this.#socket?.close();
		}, this.#config.heartbeatTimeout);
	}

	#clearHeartbeatTimeout() {
		if (this.#heartbeatTimeout) {
			clearTimeout(this.#heartbeatTimeout);
			this.#heartbeatTimeout = null;
		}
	}

	#setupNetworkListener() {
		this.#networkUnsubscribe = networkState.onStatusChange((isOnline) => {
			if (isOnline && this.#state === 'disconnected') {
				// Network came back, try to reconnect
				this.connect();
			} else if (!isOnline && this.#state !== 'disconnected') {
				// Network went away, disconnect cleanly
				this.disconnect();
			}
		});
	}

	#cleanup() {
		this.#stopHeartbeat();

		if (this.#reconnectTimeout) {
			clearTimeout(this.#reconnectTimeout);
			this.#reconnectTimeout = null;
		}

		if (this.#socket) {
			this.#socket.onopen = null;
			this.#socket.onclose = null;
			this.#socket.onerror = null;
			this.#socket.onmessage = null;

			if (this.#socket.readyState === WebSocket.OPEN) {
				this.#socket.close();
			}
			this.#socket = null;
		}
	}

	// Cleanup for hot reload or unmount
	destroy() {
		this.disconnect();

		if (this.#networkUnsubscribe) {
			this.#networkUnsubscribe();
			this.#networkUnsubscribe = null;
		}

		this.#messageHandlers.clear();
		this.#connectionHandlers = [];
	}
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Factory function for custom configurations
export function createWebSocketClient(config: Partial<WebSocketConfig> = {}) {
	return new WebSocketClient(config);
}

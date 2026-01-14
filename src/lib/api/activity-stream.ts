/**
 * Activity Stream SSE Client
 *
 * Client for consuming Server-Sent Events from /api/gastown/feed/stream
 */

export interface StreamEvent {
	type: string;
	timestamp: string;
	data: Record<string, unknown>;
}

export type EventCallback = (event: StreamEvent) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionCallback = () => void;

export interface ActivityStreamOptions {
	reconnectDelay?: number;
	maxReconnectDelay?: number;
	reconnectMultiplier?: number;
}

export class ActivityStream {
	private url: string;
	private eventSource: EventSource | null = null;
	private listeners: Map<string, Set<EventCallback>> = new Map();
	private errorListeners: Set<ErrorCallback> = new Set();
	private connectListeners: Set<ConnectionCallback> = new Set();
	private disconnectListeners: Set<ConnectionCallback> = new Set();
	private reconnectDelay: number;
	private maxReconnectDelay: number;
	private reconnectMultiplier: number;
	private currentDelay: number;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private _isConnected = false;
	private _shouldReconnect = true;

	constructor(url: string, options: ActivityStreamOptions = {}) {
		this.url = url;
		this.reconnectDelay = options.reconnectDelay ?? 1000;
		this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
		this.reconnectMultiplier = options.reconnectMultiplier ?? 2;
		this.currentDelay = this.reconnectDelay;
	}

	get isConnected(): boolean {
		return this._isConnected;
	}

	connect(): void {
		if (this.eventSource) {
			return;
		}

		this._shouldReconnect = true;

		try {
			this.eventSource = new EventSource(this.url);

			this.eventSource.onopen = () => {
				this._isConnected = true;
				this.currentDelay = this.reconnectDelay;
				this.connectListeners.forEach((cb) => cb());
			};

			this.eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as StreamEvent;
					this.emit(data.type, data);
					this.emit('*', data);
				} catch {
					/* ignore parse errors */
				}
			};

			this.eventSource.onerror = () => {
				this._isConnected = false;
				this.disconnectListeners.forEach((cb) => cb());

				if (this._shouldReconnect) {
					this.scheduleReconnect();
				}
			};
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.errorListeners.forEach((cb) => cb(err));
		}
	}

	disconnect(): void {
		this._shouldReconnect = false;

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		this._isConnected = false;
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			return;
		}

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.currentDelay = Math.min(this.currentDelay * this.reconnectMultiplier, this.maxReconnectDelay);
			this.connect();
		}, this.currentDelay);
	}

	on(eventType: string, callback: EventCallback): () => void {
		let set = this.listeners.get(eventType);
		if (!set) {
			set = new Set();
			this.listeners.set(eventType, set);
		}
		set.add(callback);

		return () => {
			set?.delete(callback);
		};
	}

	onError(callback: ErrorCallback): () => void {
		this.errorListeners.add(callback);
		return () => {
			this.errorListeners.delete(callback);
		};
	}

	onConnect(callback: ConnectionCallback): () => void {
		this.connectListeners.add(callback);
		return () => {
			this.connectListeners.delete(callback);
		};
	}

	onDisconnect(callback: ConnectionCallback): () => void {
		this.disconnectListeners.add(callback);
		return () => {
			this.disconnectListeners.delete(callback);
		};
	}

	private emit(eventType: string, event: StreamEvent): void {
		const listeners = this.listeners.get(eventType);
		if (listeners) {
			listeners.forEach((cb) => cb(event));
		}
	}

	off(eventType: string, callback?: EventCallback): void {
		if (callback) {
			this.listeners.get(eventType)?.delete(callback);
		} else {
			this.listeners.delete(eventType);
		}
	}

	removeAllListeners(): void {
		this.listeners.clear();
		this.errorListeners.clear();
		this.connectListeners.clear();
		this.disconnectListeners.clear();
	}
}

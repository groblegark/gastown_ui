/**
 * Core stores module
 *
 * Low-level, foundational stores that other modules depend on.
 * These are infrastructure stores that domain stores can depend upon.
 */

// Network partition detection store (advanced implementation)
export {
	networkStore,
	createNetworkStore,
	NetworkError,
	NetworkErrorCode,
	type NetworkErrorCodeType,
	type NetworkState,
	type NetworkStoreInstance,
	type NetworkStoreDeps,
	type QueuedRequest,
	type QueueRequestConfig,
	type HttpMethod,
	type StatusChangeCallback,
	type QueueProcessor
} from './network.svelte';

// Visibility store for background mode optimization
export {
	visibilityStore,
	createVisibilityStore,
	NORMAL_POLLING_INTERVAL,
	BACKGROUND_POLLING_INTERVAL,
	type VisibilityStoreDeps,
	type VisibilityStoreInstance,
	type VisibilityChangeCallback
} from './visibility.svelte';

// Legacy network state (simple implementation)
export { networkState, type QueuedAction } from '../network.svelte';

// Multi-tier polling system
export {
	pollingManager,
	usePolling,
	getPolling,
	removePolling,
	createMultiTierPolling,
	POLLING_TIERS,
	POLLING_JITTER,
	addJitter,
	type ResourceState,
	type PollingConfig
} from '../polling.svelte';

// Toast notifications
export { toastStore, type Toast, type ToastType, type ToastOptions } from '../toast.svelte';

// Operations tracking
export {
	operationsStore,
	trackOperation,
	trackBatchOperation,
	type Operation,
	type OperationStatus,
	type OperationPriority,
	type OperationType,
	type OperationGroup,
	type CreateOperationConfig,
	type UpdateOperationOptions
} from '../operations.svelte';

// SWR Cache
export {
	swrCache,
	createSWRCache,
	CACHE_KEYS,
	CACHE_TTLS,
	type CacheEntry,
	type CacheConfig,
	type SWROptions
} from '../swr';

// Theme
export { themeStore, type Theme } from '../theme.svelte';

// Data synchronization
export {
	syncStore,
	createSyncStore,
	useSyncStatus,
	type SyncStatus,
	type VersionedData,
	type SyncOperation,
	type PendingSyncItem,
	type SyncEvent,
	type ConflictStrategy
} from '../sync.svelte';

// WebSocket client
export {
	wsClient,
	createWebSocketClient,
	type ConnectionState,
	type MessageType,
	type WSMessage,
	type AgentStatusPayload,
	type LogEntryPayload,
	type QueueUpdatePayload,
	type WorkflowUpdatePayload
} from '../websocket.svelte';

// Server-Sent Events
export {
	sseStore,
	useSSE,
	type SSEConnectionState,
	type SSEEvent,
	type SSEEventType
} from '../sse.svelte';

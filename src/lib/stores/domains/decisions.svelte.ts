/**
 * Decisions Store - Reactive store for decision requests
 *
 * Uses Svelte 5 runes with SWR caching for instant perceived performance.
 * Decisions are requests from agents for human input on choices.
 */

import { swrCache, CACHE_KEYS, CACHE_TTLS } from '../swr';
import { apiClient } from '$lib/api/client';
import { usePolling, POLLING_TIERS, POLLING_JITTER, type PollingConfig } from '../polling.svelte';
import type { ApiResponse } from '$lib/api/types';

const browser = typeof window !== 'undefined';

/** Decision urgency level */
export type DecisionUrgency = 'high' | 'medium' | 'low';

/** Decision status */
export type DecisionStatus = 'pending' | 'resolved';

/** A single option for a decision */
export interface DecisionOption {
	id: string;
	label: string;
	description?: string;
	recommended?: boolean;
}

/** A decision request from an agent */
export interface Decision {
	id: string;
	prompt: string;
	context?: string;
	options: DecisionOption[];
	urgency: DecisionUrgency;
	status: DecisionStatus;
	requestedBy: string;
	requestedAt: string;
	parentBeadId?: string;
	parentBeadTitle?: string;
	selectedOption?: string;
	resolvedBy?: string;
	resolvedAt?: string;
	responseText?: string;
}

/** Filter options for decisions */
export interface DecisionFilter {
	status?: DecisionStatus | DecisionStatus[];
	urgency?: DecisionUrgency | DecisionUrgency[];
	requestedBy?: string;
	search?: string;
}

/** Counts by urgency level */
export interface DecisionCounts {
	high: number;
	medium: number;
	low: number;
	total: number;
}

/** API response format for decisions endpoint */
interface DecisionsApiResponse {
	decisions: Decision[];
	counts: DecisionCounts;
}

interface DecisionStoreState {
	items: Decision[];
	isLoading: boolean;
	isValidating: boolean;
	error: Error | null;
	lastFetchedAt: number | null;
	filter: DecisionFilter;
	counts: DecisionCounts;
}

class DecisionStore {
	#state = $state<DecisionStoreState>({
		items: [],
		isLoading: false,
		isValidating: false,
		error: null,
		lastFetchedAt: null,
		filter: {},
		counts: { high: 0, medium: 0, low: 0, total: 0 }
	});

	#unsubscribers: (() => void)[] = [];
	#initialized = false;
	#pollingInstance: ReturnType<typeof usePolling<DecisionsApiResponse>> | null = null;

	constructor() {
		if (browser) {
			this.#init();
		}
	}

	#init() {
		if (this.#initialized) return;
		this.#initialized = true;

		// Subscribe to cache updates
		this.#unsubscribers.push(
			swrCache.subscribe<Decision[]>(CACHE_KEYS.DECISIONS, (entry) => {
				if (entry) {
					this.#state.items = entry.data;
					this.#state.isValidating = entry.isRevalidating;
					this.#state.error = entry.error;
					this.#state.lastFetchedAt = entry.timestamp;
					this.#state.isLoading = false;
				}
			})
		);
	}

	// =========================================================================
	// Getters
	// =========================================================================

	get items(): Decision[] {
		return this.#state.items;
	}

	get isLoading(): boolean {
		return this.#state.isLoading;
	}

	get isValidating(): boolean {
		return this.#state.isValidating;
	}

	get error(): Error | null {
		return this.#state.error;
	}

	get lastFetchedAt(): number | null {
		return this.#state.lastFetchedAt;
	}

	get filter(): DecisionFilter {
		return this.#state.filter;
	}

	get counts(): DecisionCounts {
		return this.#state.counts;
	}

	get filteredItems(): Decision[] {
		return this.#applyFilter(this.#state.items, this.#state.filter);
	}

	get pendingItems(): Decision[] {
		return this.#state.items.filter((item) => item.status === 'pending');
	}

	get resolvedItems(): Decision[] {
		return this.#state.items.filter((item) => item.status === 'resolved');
	}

	get highUrgencyItems(): Decision[] {
		return this.#state.items.filter((item) => item.urgency === 'high');
	}

	get hasPending(): boolean {
		return this.pendingItems.length > 0;
	}

	get hasHighUrgency(): boolean {
		return this.highUrgencyItems.filter((d) => d.status === 'pending').length > 0;
	}

	// =========================================================================
	// Fetch Actions
	// =========================================================================

	async fetch(status: DecisionStatus | 'all' = 'pending'): Promise<Decision[]> {
		if (!this.#state.lastFetchedAt) {
			this.#state.isLoading = true;
		}

		try {
			const items = await swrCache.swr<Decision[]>({
				key: CACHE_KEYS.DECISIONS,
				fetcher: async () => {
					const params = new URLSearchParams();
					if (status !== 'all') {
						params.set('status', status);
					} else {
						params.set('status', 'all');
					}

					const response: ApiResponse<DecisionsApiResponse> = await apiClient.get(
						`/api/gastown/decisions?${params.toString()}`
					);

					// Update counts from response
					if (response.data?.counts) {
						this.#state.counts = response.data.counts;
					}

					return response.data?.decisions ?? [];
				},
				...CACHE_TTLS.FAST
			});

			return items;
		} catch (err) {
			this.#state.error = err instanceof Error ? err : new Error(String(err));
			throw err;
		} finally {
			this.#state.isLoading = false;
		}
	}

	async fetchItem(id: string): Promise<Decision | null> {
		const cacheKey = CACHE_KEYS.DECISION(id);

		try {
			const item = await swrCache.swr<Decision>({
				key: cacheKey,
				fetcher: async () => {
					const response: ApiResponse<{ decision: Decision }> = await apiClient.get(
						`/api/gastown/decisions/${id}`
					);
					return response.data?.decision;
				},
				...CACHE_TTLS.FAST
			});

			return item;
		} catch {
			return null;
		}
	}

	getItem(id: string): Decision | undefined {
		return this.#state.items.find((item) => item.id === id);
	}

	// =========================================================================
	// Mutation Actions
	// =========================================================================

	/**
	 * Resolve a decision by selecting an option
	 */
	async resolve(
		id: string,
		optionId: string,
		rationale?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			const response: ApiResponse<{ success: boolean; message?: string }> = await apiClient.post(
				`/api/gastown/decisions/${id}/resolve`,
				{
					optionId,
					rationale
				}
			);

			if (response.data?.success) {
				// Optimistic update
				this.optimisticUpdate(id, {
					status: 'resolved',
					selectedOption: optionId,
					resolvedAt: new Date().toISOString(),
					responseText: rationale
				});

				// Invalidate cache to refetch
				this.invalidate();

				return { success: true };
			}

			return { success: false, error: 'Failed to resolve decision' };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Request additional guidance/context for a decision
	 */
	async guidance(id: string, text: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response: ApiResponse<{ success: boolean }> = await apiClient.post(
				`/api/gastown/decisions/${id}/guidance`,
				{ text }
			);

			if (response.data?.success) {
				return { success: true };
			}

			return { success: false, error: 'Failed to request guidance' };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Cancel a pending decision
	 */
	async cancel(id: string, reason?: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response: ApiResponse<{ success: boolean }> = await apiClient.post(
				`/api/gastown/decisions/${id}/cancel`,
				{ reason }
			);

			if (response.data?.success) {
				// Optimistic remove
				this.optimisticRemove(id);
				this.invalidate();
				return { success: true };
			}

			return { success: false, error: 'Failed to cancel decision' };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// =========================================================================
	// Filter Methods
	// =========================================================================

	setFilter(filter: DecisionFilter): void {
		this.#state.filter = filter;
	}

	clearFilter(): void {
		this.#state.filter = {};
	}

	#applyFilter(items: Decision[], filter: DecisionFilter): Decision[] {
		let result = items;

		if (filter.status) {
			const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
			result = result.filter((item) => statuses.includes(item.status));
		}

		if (filter.urgency) {
			const urgencies = Array.isArray(filter.urgency) ? filter.urgency : [filter.urgency];
			result = result.filter((item) => urgencies.includes(item.urgency));
		}

		if (filter.requestedBy) {
			result = result.filter((item) => item.requestedBy === filter.requestedBy);
		}

		if (filter.search) {
			const search = filter.search.toLowerCase();
			result = result.filter(
				(item) =>
					item.prompt.toLowerCase().includes(search) ||
					item.id.toLowerCase().includes(search) ||
					item.context?.toLowerCase().includes(search)
			);
		}

		return result;
	}

	// =========================================================================
	// Polling
	// =========================================================================

	/**
	 * Start polling for decisions updates
	 */
	startPolling(interval: number = POLLING_TIERS.FAST): void {
		if (this.#pollingInstance) return;

		const config: PollingConfig<DecisionsApiResponse> = {
			key: CACHE_KEYS.DECISIONS,
			endpoint: '/api/gastown/decisions',
			interval,
			jitter: POLLING_JITTER.FAST,
			enabled: true,
			pauseWhenHidden: true,
			pauseWhenOffline: true,
			transform: (data) => data as DecisionsApiResponse,
			onSuccess: (data) => {
				this.#state.items = data.decisions;
				this.#state.counts = data.counts;
				this.#state.lastFetchedAt = Date.now();
				this.#state.error = null;
				// Also update cache
				swrCache.set(CACHE_KEYS.DECISIONS, data.decisions, CACHE_TTLS.FAST);
			},
			onError: (error) => {
				this.#state.error = error;
			}
		};

		this.#pollingInstance = usePolling(config);
	}

	/**
	 * Stop polling for decisions updates
	 */
	stopPolling(): void {
		if (this.#pollingInstance) {
			this.#pollingInstance.stop();
			this.#pollingInstance = null;
		}
	}

	/**
	 * Pause polling (e.g., when tab hidden)
	 */
	pausePolling(): void {
		this.#pollingInstance?.pause();
	}

	/**
	 * Resume polling
	 */
	resumePolling(): void {
		this.#pollingInstance?.resume();
	}

	// =========================================================================
	// Cache Management
	// =========================================================================

	invalidate(): void {
		swrCache.invalidate(CACHE_KEYS.DECISIONS);
	}

	invalidateItem(id: string): void {
		swrCache.invalidate(CACHE_KEYS.DECISION(id));
	}

	optimisticUpdate(id: string, updates: Partial<Decision>): void {
		const idx = this.#state.items.findIndex((item) => item.id === id);
		if (idx === -1) return;

		const updated = { ...this.#state.items[idx], ...updates };
		this.#state.items = [
			...this.#state.items.slice(0, idx),
			updated,
			...this.#state.items.slice(idx + 1)
		];

		// Update counts if status changed
		if (updates.status) {
			this.#updateCounts();
		}

		swrCache.set(CACHE_KEYS.DECISIONS, this.#state.items, CACHE_TTLS.FAST);
	}

	optimisticAdd(item: Decision): void {
		this.#state.items = [item, ...this.#state.items];
		this.#updateCounts();
		swrCache.set(CACHE_KEYS.DECISIONS, this.#state.items, CACHE_TTLS.FAST);
	}

	optimisticRemove(id: string): void {
		this.#state.items = this.#state.items.filter((item) => item.id !== id);
		this.#updateCounts();
		swrCache.set(CACHE_KEYS.DECISIONS, this.#state.items, CACHE_TTLS.FAST);
	}

	#updateCounts(): void {
		const pending = this.#state.items.filter((d) => d.status === 'pending');
		this.#state.counts = {
			high: pending.filter((d) => d.urgency === 'high').length,
			medium: pending.filter((d) => d.urgency === 'medium').length,
			low: pending.filter((d) => d.urgency === 'low').length,
			total: pending.length
		};
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	destroy(): void {
		this.stopPolling();
		for (const unsubscribe of this.#unsubscribers) {
			unsubscribe();
		}
		this.#unsubscribers = [];
		this.#initialized = false;
	}
}

// Singleton instance
export const decisionsStore = new DecisionStore();

/**
 * Hook for using decisions store in components
 */
export function useDecisions() {
	return {
		get items() {
			return decisionsStore.items;
		},
		get filteredItems() {
			return decisionsStore.filteredItems;
		},
		get pendingItems() {
			return decisionsStore.pendingItems;
		},
		get isLoading() {
			return decisionsStore.isLoading;
		},
		get isValidating() {
			return decisionsStore.isValidating;
		},
		get error() {
			return decisionsStore.error;
		},
		get counts() {
			return decisionsStore.counts;
		},
		get hasPending() {
			return decisionsStore.hasPending;
		},
		get hasHighUrgency() {
			return decisionsStore.hasHighUrgency;
		},
		fetch: (status?: DecisionStatus | 'all') => decisionsStore.fetch(status),
		getItem: (id: string) => decisionsStore.getItem(id),
		resolve: (id: string, optionId: string, rationale?: string) =>
			decisionsStore.resolve(id, optionId, rationale),
		guidance: (id: string, text: string) => decisionsStore.guidance(id, text),
		cancel: (id: string, reason?: string) => decisionsStore.cancel(id, reason),
		setFilter: (filter: DecisionFilter) => decisionsStore.setFilter(filter),
		clearFilter: () => decisionsStore.clearFilter(),
		invalidate: () => decisionsStore.invalidate(),
		startPolling: (interval?: number) => decisionsStore.startPolling(interval),
		stopPolling: () => decisionsStore.stopPolling()
	};
}

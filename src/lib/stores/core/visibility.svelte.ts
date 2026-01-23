/**
 * Visibility Store - Page Visibility API Integration
 *
 * Provides:
 * - Track document.hidden state
 * - Visibility change callbacks
 * - Polling interval adjustment for background mode
 *
 * @module stores/core/visibility
 */

// Browser detection
const browser = typeof window !== 'undefined';

/**
 * Polling interval constants
 */
export const NORMAL_POLLING_INTERVAL = 5000;
export const BACKGROUND_POLLING_INTERVAL = 60000;

/**
 * Visibility change callback type
 */
export type VisibilityChangeCallback = (isVisible: boolean) => void;

/**
 * Dependencies for testable visibility store factory
 */
export interface VisibilityStoreDeps {
	getHiddenStatus: () => boolean;
	addEventListener: (event: string, handler: () => void) => void;
	removeEventListener: (event: string, handler: () => void) => void;
}

/**
 * Visibility store instance type
 */
export interface VisibilityStoreInstance {
	readonly isVisible: boolean;
	onVisibilityChange(callback: VisibilityChangeCallback): () => void;
	getPollingInterval(): number;
	destroy(): void;
}

/**
 * Default browser dependencies
 */
const defaultDeps: VisibilityStoreDeps = {
	getHiddenStatus: () => (browser ? document.hidden : false),
	addEventListener: (event, handler) => browser && document.addEventListener(event, handler),
	removeEventListener: (event, handler) => browser && document.removeEventListener(event, handler)
};

/**
 * Create a visibility store instance
 */
export function createVisibilityStore(
	deps: VisibilityStoreDeps = defaultDeps
): VisibilityStoreInstance {
	let isVisible = !deps.getHiddenStatus();
	let callbacks: VisibilityChangeCallback[] = [];
	let destroyed = false;

	const handleVisibilityChange = (): void => {
		if (destroyed) return;

		const wasVisible = isVisible;
		isVisible = !deps.getHiddenStatus();

		if (wasVisible !== isVisible) {
			for (const callback of [...callbacks]) {
				try {
					callback(isVisible);
				} catch {
					// Ignore callback errors
				}
			}
		}
	};

	deps.addEventListener('visibilitychange', handleVisibilityChange);

	return {
		get isVisible(): boolean {
			return isVisible;
		},

		onVisibilityChange(callback: VisibilityChangeCallback): () => void {
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
			};
		},

		getPollingInterval(): number {
			return isVisible ? NORMAL_POLLING_INTERVAL : BACKGROUND_POLLING_INTERVAL;
		},

		destroy(): void {
			destroyed = true;
			callbacks = [];
			deps.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	};
}

/**
 * Singleton instance for application-wide use
 */
export const visibilityStore = createVisibilityStore();

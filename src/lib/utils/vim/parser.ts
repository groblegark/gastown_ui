/**
 * Key Sequence Parser
 *
 * Handles parsing and tracking of vim-style key sequences (e.g., 'g' then 'd').
 */

/** How long to wait for the second key in a sequence (ms) */
export const SEQUENCE_TIMEOUT = 500;

/**
 * Tracks pending key sequences for vim-style shortcuts
 */
export class SequenceTracker {
	private pendingPrefix: string | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private clearCallback: (() => void) | null = null;

	/**
	 * Start tracking a key sequence
	 */
	start(prefix: string): void {
		this.clear();
		this.pendingPrefix = prefix;

		// Set timeout to auto-clear
		this.timer = setTimeout(() => {
			this.clear();
		}, SEQUENCE_TIMEOUT);
	}

	/**
	 * Check if a sequence is pending
	 */
	isPending(): boolean {
		return this.pendingPrefix !== null;
	}

	/**
	 * Get the pending prefix key
	 */
	getPrefix(): string | null {
		return this.pendingPrefix;
	}

	/**
	 * Clear the pending sequence
	 */
	clear(): void {
		const wasPending = this.pendingPrefix !== null;

		this.pendingPrefix = null;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		if (wasPending && this.clearCallback) {
			this.clearCallback();
		}
	}

	/**
	 * Register a callback for when sequence is cleared
	 */
	onClear(callback: () => void): void {
		this.clearCallback = callback;
	}

	/**
	 * Destroy the tracker and clean up
	 */
	destroy(): void {
		this.clear();
		this.clearCallback = null;
	}
}

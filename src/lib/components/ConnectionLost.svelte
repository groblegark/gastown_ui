<script lang="ts">
	import { cn } from '$lib/utils';
	import { networkState } from '$lib/stores';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		/** Initial countdown seconds before auto-retry */
		retryInterval?: number;
		/** Maximum retry attempts before showing manual retry only */
		maxRetries?: number;
		/** Callback when retry is triggered */
		onRetry?: () => void | Promise<void>;
		/** Additional classes */
		class?: string;
	}

	let {
		retryInterval = 30,
		maxRetries = 5,
		onRetry,
		class: className = ''
	}: Props = $props();

	// Track component mount state (SSR safety)
	let mounted = $state(false);

	// Countdown state
	let countdown = $state(30);
	let retryCount = $state(0);
	let isRetrying = $state(false);

	// Initialize countdown from prop (runs once on mount)
	$effect(() => {
		countdown = retryInterval;
	});

	// Timer reference
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	// Derived states
	const isOffline = $derived(networkState.isOffline);
	const showOverlay = $derived(mounted && isOffline);
	const hasExceededRetries = $derived(retryCount >= maxRetries);
	const formattedCountdown = $derived(String(countdown).padStart(2, '0'));

	// Handle retry action
	async function handleRetry() {
		if (isRetrying) return;

		isRetrying = true;
		retryCount++;

		try {
			// Call custom retry handler if provided
			if (onRetry) {
				await onRetry();
			}

			// Check if we're back online after a brief delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (networkState.isOnline) {
				// Successfully reconnected
				resetState();
			} else {
				// Still offline, reset countdown
				resetCountdown();
			}
		} catch {
			// Retry failed, reset countdown
			resetCountdown();
		} finally {
			isRetrying = false;
		}
	}

	function resetCountdown() {
		countdown = retryInterval;
	}

	function resetState() {
		countdown = retryInterval;
		retryCount = 0;
		isRetrying = false;
	}

	function startCountdown() {
		stopCountdown();
		countdownTimer = setInterval(() => {
			if (countdown > 0) {
				countdown--;
			} else if (!hasExceededRetries) {
				// Auto-retry when countdown reaches 0
				handleRetry();
			}
		}, 1000);
	}

	function stopCountdown() {
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
	}

	onMount(() => {
		mounted = true;

		// Subscribe to network status changes
		const unsubscribe = networkState.onStatusChange((isOnline) => {
			if (isOnline) {
				// Back online - reset everything
				resetState();
				stopCountdown();
			} else {
				// Gone offline - start countdown
				startCountdown();
			}
		});

		// Start countdown if already offline
		if (networkState.isOffline) {
			startCountdown();
		}

		return () => {
			unsubscribe();
			stopCountdown();
		};
	});

	onDestroy(() => {
		stopCountdown();
	});
</script>

<!--
	Connection Lost Component

	Fullscreen overlay that appears when network connection is lost.
	Features:
	- Animated warning icon
	- "Connection Lost" heading
	- Auto-reconnecting countdown timer
	- Manual "Retry Now" button
	- Offline mode indicator
	- Accessible (role="alertdialog", aria attributes)
	- Respects reduced motion preferences
-->

{#if showOverlay}
	<div
		class={cn(
			'fixed inset-0 z-50',
			'flex flex-col items-center justify-center',
			'bg-background/95 backdrop-blur-md',
			'p-6',
			'animate-fade-in',
			className
		)}
		role="alertdialog"
		aria-modal="true"
		aria-labelledby="connection-lost-title"
		aria-describedby="connection-lost-desc"
	>
		<!-- Content container -->
		<div class="flex flex-col items-center text-center max-w-sm animate-blur-fade-up">
			<!-- Animated warning icon -->
			<div
				class={cn(
					'relative w-20 h-20 mb-6',
					'flex items-center justify-center',
					'rounded-full',
					'bg-destructive/10',
					'animate-pulse-status'
				)}
			>
				<!-- Outer ring animation -->
				<div
					class={cn(
						'absolute inset-0',
						'rounded-full',
						'border-2 border-destructive/30',
						'animate-[ping_2s_ease-in-out_infinite]'
					)}
					aria-hidden="true"
				></div>

				<!-- Warning icon (wifi-off) -->
				<svg
					class="w-10 h-10 text-destructive animate-bounce"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<!-- Wifi with slash icon -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
					/>
					<!-- Diagonal slash -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 3l18 18"
						class="text-destructive"
					/>
				</svg>
			</div>

			<!-- Heading -->
			<h2
				id="connection-lost-title"
				class="text-2xl font-bold text-foreground mb-2"
			>
				Connection Lost
			</h2>

			<!-- Description -->
			<p
				id="connection-lost-desc"
				class="text-muted-foreground mb-6"
			>
				Unable to connect to the server. Please check your internet connection.
			</p>

			<!-- Reconnecting status -->
			{#if !hasExceededRetries}
				<div class="flex items-center gap-2 mb-6">
					{#if isRetrying}
						<!-- Reconnecting spinner -->
						<svg
							class="w-5 h-5 text-primary animate-spin"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<span class="text-sm text-muted-foreground">Reconnecting...</span>
					{:else}
						<!-- Countdown display -->
						<span class="text-sm text-muted-foreground">
							Retrying in <span class="font-mono font-bold text-foreground">{formattedCountdown}</span> seconds
						</span>
					{/if}
				</div>
			{:else}
				<!-- Max retries exceeded message -->
				<div class="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
					<svg
						class="w-4 h-4 text-warning"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span>Auto-retry paused after {maxRetries} attempts</span>
				</div>
			{/if}

			<!-- Retry button -->
			<button
				type="button"
				onclick={handleRetry}
				disabled={isRetrying}
				class={cn(
					'touch-target-interactive',
					'px-6 py-3',
					'rounded-full',
					'font-semibold text-base',
					'bg-primary text-primary-foreground',
					'hover:bg-primary/90',
					'focus-ring',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'transition-colors duration-150',
					'shadow-md hover:shadow-lg'
				)}
			>
				{#if isRetrying}
					<span class="flex items-center gap-2">
						<svg
							class="w-4 h-4 animate-spin"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Retrying...
					</span>
				{:else}
					Retry Now
				{/if}
			</button>

			<!-- Offline mode indicator badge -->
			<div
				class={cn(
					'mt-8 px-3 py-1.5',
					'rounded-full',
					'bg-destructive/10 text-destructive',
					'text-xs font-medium',
					'flex items-center gap-1.5'
				)}
			>
				<span
					class="w-2 h-2 rounded-full bg-destructive animate-pulse-status"
					aria-hidden="true"
				></span>
				Offline Mode
			</div>

			<!-- Retry count indicator (if retries have occurred) -->
			{#if retryCount > 0}
				<p class="mt-4 text-xs text-muted-foreground">
					Retry attempts: {retryCount}/{maxRetries}
				</p>
			{/if}
		</div>
	</div>
{/if}

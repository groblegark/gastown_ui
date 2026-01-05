<script lang="ts">
	import { cn } from '$lib/utils';
	import { tv } from 'tailwind-variants';
	import { RefreshCw } from 'lucide-svelte';

	interface Props {
		/** Whether the update prompt is visible */
		show?: boolean;
		/** Message to display */
		message?: string;
		/** Label for the update button */
		updateLabel?: string;
		/** Label for the dismiss button */
		dismissLabel?: string;
		/** Callback when update is requested */
		onupdate?: () => void;
		/** Callback when prompt is dismissed */
		ondismiss?: () => void;
		/** Auto-dismiss after this many milliseconds (0 to disable) */
		autoDismiss?: number;
		/** Position of the prompt */
		position?: 'top' | 'bottom';
		/** Additional classes */
		class?: string;
	}

	let {
		show = false,
		message = 'A new version is available',
		updateLabel = 'Update now',
		dismissLabel = 'Later',
		onupdate,
		ondismiss,
		autoDismiss = 0,
		position = 'bottom',
		class: className = ''
	}: Props = $props();

	// Internal visible state for animation
	let visible = $state(false);
	let mounted = $state(false);

	// Track dismissed state to prevent re-showing
	let dismissed = $state(false);

	// Variants for the prompt container
	const promptVariants = tv({
		base: [
			'fixed left-4 right-4 z-50',
			'panel-glass shadow-lg',
			'p-4 flex items-center justify-between gap-4',
			'transform transition-all duration-300 ease-out'
		],
		variants: {
			position: {
				top: 'top-4 mt-safe',
				bottom: 'bottom-4 mb-safe'
			},
			visible: {
				true: 'translate-y-0 opacity-100',
				false: ''
			}
		},
		compoundVariants: [
			{
				position: 'top',
				visible: false,
				class: '-translate-y-full opacity-0'
			},
			{
				position: 'bottom',
				visible: false,
				class: 'translate-y-full opacity-0'
			}
		],
		defaultVariants: {
			position: 'bottom',
			visible: false
		}
	});

	// Button variants
	const buttonVariants = tv({
		base: [
			'touch-target-interactive rounded-md px-4 py-2',
			'font-medium text-sm',
			'transition-colors duration-150',
			'focus-ring'
		],
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
				ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted'
			}
		},
		defaultVariants: {
			variant: 'primary'
		}
	});

	// Handle visibility changes with animation
	$effect(() => {
		if (show && !dismissed) {
			// Small delay to trigger animation
			mounted = true;
			requestAnimationFrame(() => {
				visible = true;
			});
		} else {
			visible = false;
			// Delay unmount for exit animation
			const timeout = setTimeout(() => {
				if (!show || dismissed) {
					mounted = false;
				}
			}, 300);
			return () => clearTimeout(timeout);
		}
	});

	// Auto-dismiss timer
	$effect(() => {
		if (show && autoDismiss > 0 && !dismissed) {
			const timeout = setTimeout(() => {
				handleDismiss();
			}, autoDismiss);
			return () => clearTimeout(timeout);
		}
	});

	function handleUpdate() {
		onupdate?.();
	}

	function handleDismiss() {
		dismissed = true;
		ondismiss?.();
	}

	// Handle keyboard
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleDismiss();
		}
	}
</script>

<!--
	Service Worker Update Prompt Component.
	Shows a non-intrusive notification when a new version is available.

	Example usage:
	```svelte
	<script>
	  import { UpdatePrompt } from '$lib/components';
	  import { createServiceWorkerStore } from '$lib/serviceWorker';

	  const sw = createServiceWorkerStore();
	</script>

	<UpdatePrompt
	  show={$sw.state === 'update-available'}
	  onupdate={() => sw.reload()}
	  ondismiss={() => {}}
	/>
	```
-->

{#if mounted}
	<div
		class={cn(promptVariants({ position, visible }), className)}
		role="alertdialog"
		aria-labelledby="update-prompt-title"
		aria-describedby="update-prompt-message"
		aria-live="polite"
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<div class="flex items-center gap-3 min-w-0">
			<!-- Update icon -->
			<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
				<RefreshCw class="w-4 h-4 text-primary" aria-hidden="true" />
			</div>

			<!-- Message -->
			<p
				id="update-prompt-message"
				class="text-sm text-foreground truncate"
			>
				<span id="update-prompt-title" class="sr-only">Update available</span>
				{message}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2 flex-shrink-0">
			<button
				type="button"
				class={buttonVariants({ variant: 'ghost' })}
				onclick={handleDismiss}
			>
				{dismissLabel}
			</button>
			<button
				type="button"
				class={buttonVariants({ variant: 'primary' })}
				onclick={handleUpdate}
			>
				{updateLabel}
			</button>
		</div>
	</div>
{/if}

<script lang="ts">
	import { navigating } from '$app/stores';
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Show loader after a short delay to avoid flicker on fast navigations
	let showLoader = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($navigating) {
			// Start showing loader after 150ms delay
			timeoutId = setTimeout(() => {
				showLoader = true;
			}, 150);
		} else {
			// Clear timeout and hide loader
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			showLoader = false;
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

{#if showLoader}
	<!-- Progress bar at top of viewport -->
	<div
		class={cn(
			'fixed top-0 left-0 right-0 z-[100] h-1 bg-muted overflow-hidden',
			className
		)}
		role="progressbar"
		aria-label="Loading page"
		aria-busy="true"
	>
		<div
			class="h-full bg-accent animate-progress-indeterminate"
			style="width: 30%"
		></div>
	</div>

	<!-- Overlay with spinner for longer loads -->
	<div
		class="fixed inset-0 z-[99] bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 animate-fade-in"
		style="animation-delay: 500ms; animation-fill-mode: forwards"
	>
		<div class="flex flex-col items-center gap-3">
			<div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
			<span class="text-sm text-muted-foreground">Loading...</span>
		</div>
	</div>
{/if}

<style>
	@keyframes progress-indeterminate {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(300%);
		}
	}

	.animate-progress-indeterminate {
		animation: progress-indeterminate 1.5s ease-in-out infinite;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>

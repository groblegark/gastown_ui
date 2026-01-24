<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Live region politeness: assertive interrupts, polite waits */
		politeness?: 'assertive' | 'polite' | 'off';
		/** Atomic: announce entire region or just changes */
		atomic?: boolean;
		/** Relevant: what changes to announce */
		relevant?: 'additions' | 'removals' | 'text' | 'all';
		/** Role override: status, alert, log, timer */
		role?: 'status' | 'alert' | 'log' | 'timer' | 'region';
		/** Visually hidden: hide content from sighted users */
		hidden?: boolean;
		/** Additional classes */
		class?: string;
		/** Content to announce */
		children?: Snippet;
	}

	let {
		politeness = 'polite',
		atomic = true,
		relevant = 'additions',
		role = 'status',
		hidden = false,
		class: className = '',
		children
	}: Props = $props();

	// Derive aria-live value
	const ariaLive = $derived(politeness);
</script>

<div
	class={cn(hidden ? 'sr-only' : '', className)}
	aria-live={ariaLive}
	aria-atomic={atomic}
	aria-relevant={relevant}
	{role}
>
	{@render children?.()}
</div>

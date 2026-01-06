<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	/**
	 * SkeletonGroup - Container for staggered skeleton loading
	 *
	 * Automatically applies 50ms staggered animation delays to children.
	 * Use this to wrap multiple Skeleton components for a polished loading effect.
	 *
	 * @example
	 * <SkeletonGroup>
	 *   <Skeleton type="title" />
	 *   <Skeleton type="text" />
	 *   <Skeleton type="text" width="3/4" />
	 * </SkeletonGroup>
	 */

	interface Props {
		class?: string;
		/** Custom stagger delay in ms (default: 50) */
		delay?: number;
		children: Snippet;
	}

	let { class: className = '', delay = 50, children }: Props = $props();
</script>

<div
	class={cn('skeleton-group', className)}
	style="--stagger-delay: {delay}ms"
	role="status"
	aria-busy="true"
>
	{@render children()}
</div>

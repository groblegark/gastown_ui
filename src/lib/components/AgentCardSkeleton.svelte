<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		compact?: boolean;
		/** Show progress bar skeleton */
		showProgress?: boolean;
	}

	let { class: className = '', compact = false, showProgress = false }: Props = $props();
</script>

<!--
	Agent Card Skeleton: matches the enhanced AgentCard component layout
	- Hero: 14x14 icon with rounded-2xl (matches icon-hero type)
	- Badge: pill with dot indicator
	- Progress: optional percentage display
	- Staggered: 50ms delay between children
-->
<div
	class={cn(
		'panel-glass overflow-hidden',
		className
	)}
	role="status"
	aria-label="Loading agent card"
	aria-busy="true"
>
	<!-- Hero Section with Icon (matches AgentCard hero: p-6, w-14 h-14 rounded-2xl) -->
	{#if !compact}
		<div class="flex items-center justify-center p-6 bg-gradient-to-br from-muted/20 to-muted/5">
			<Skeleton type="icon-hero" width="auto" stagger={0} />
		</div>
	{/if}

	<div class={cn('p-4 space-y-3 skeleton-group', compact && 'p-3')}>
		<!-- Header: Status + Name + Badge with dot -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2 min-w-0 flex-1">
				<!-- Status indicator dot -->
				<Skeleton type="avatar-xs" width="auto" class="w-2.5 h-2.5 flex-shrink-0" />
				<!-- Name -->
				<Skeleton type="title" width="2/3" />
			</div>
			<!-- Badge pill with dot -->
			<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 flex-shrink-0">
				<Skeleton type="badge-dot" width="auto" />
				<Skeleton type="text-sm" width="auto" class="w-12" />
			</div>
		</div>

		<!-- Body: Task description -->
		<div class="space-y-2">
			<Skeleton type="text" width="full" />
			<Skeleton type="text" width="3/4" />
		</div>

		<!-- Metadata: icons + text -->
		<div class="flex flex-wrap gap-x-4 gap-y-1">
			<div class="flex items-center gap-1">
				<Skeleton type="icon-sm" width="auto" />
				<Skeleton type="text-sm" width="auto" class="w-16" />
			</div>
			<div class="flex items-center gap-1">
				<Skeleton type="icon-sm" width="auto" />
				<Skeleton type="text-sm" width="auto" class="w-12" />
			</div>
		</div>

		<!-- Progress bar with percentage (optional) -->
		{#if showProgress}
			<div class="flex items-center gap-3 pt-1">
				<div class="flex-1">
					<Skeleton type="progress" width="full" />
				</div>
				<Skeleton type="text-sm" width="auto" class="w-8 tabular-nums" />
			</div>
		{/if}
	</div>
</div>

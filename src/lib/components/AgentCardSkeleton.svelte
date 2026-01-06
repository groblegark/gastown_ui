<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		compact?: boolean;
	}

	let { class: className = '', compact = false }: Props = $props();
</script>

<!-- Agent Card Skeleton: matches the AgentCard component layout -->
<div
	class={cn(
		'bg-card/80 backdrop-blur-xl border border-border rounded-lg shadow-sm overflow-hidden',
		className
	)}
	role="status"
	aria-label="Loading agent card"
	aria-busy="true"
>
	<!-- Hero Section with Icon (matches AgentCard hero) -->
	{#if !compact}
		<div class="flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/10">
			<Skeleton type="avatar" width="auto" class="w-12 h-12 rounded-xl" />
		</div>
	{/if}

	<div class={cn('p-4 space-y-3', compact && 'p-3')}>
		<!-- Header: Status + Name + Badge -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2 min-w-0 flex-1">
				<Skeleton type="avatar" width="auto" class="w-3 h-3 rounded-full flex-shrink-0" />
				<Skeleton type="title" width="2/3" />
			</div>
			<Skeleton type="text" width="auto" class="w-16 h-5 rounded-full flex-shrink-0" />
		</div>

		<!-- Body: Task + Metadata -->
		<div class="space-y-2">
			<Skeleton type="text" width="full" />
			<div class="flex gap-4">
				<Skeleton type="text" width="1/4" />
				<Skeleton type="text" width="1/4" />
			</div>
		</div>
	</div>
</div>

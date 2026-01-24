<script lang="ts">
	import Skeleton from '../../core/Skeleton.svelte';
	import { cn } from '$lib/utils';

	let { class: className = '' }: { class?: string } = $props();
</script>

<!--
	Log Entry Skeleton: matches the LogEntry component layout
	- Timestamp: mono font, fixed width
	- Level badge: pill style
	- Message: multi-line with staggered animation
-->
<div
	class={cn('flex items-start gap-3 py-2 px-3 border-b border-border skeleton-group', className)}
	role="status"
	aria-label="Loading log entry"
	aria-busy="true"
>
	<!-- Timestamp (mono, tabular-nums) -->
	<Skeleton type="text-sm" width="auto" class="w-20 flex-shrink-0 font-mono" />

	<!-- Level badge -->
	<Skeleton type="badge-sm" width="auto" class="flex-shrink-0" />

	<!-- Message content with staggered lines -->
	<div class="flex-1 space-y-1.5">
		<Skeleton type="text" width="full" />
		<Skeleton type="text" width="2/3" />
	</div>
</div>

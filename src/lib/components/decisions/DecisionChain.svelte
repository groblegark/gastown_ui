<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * DecisionChain - Displays iteration chain for a decision
	 * Shows numbered iterations with resolved/pending styling,
	 * collapsible behavior, and clickable navigation to prior iterations.
	 */
	export const decisionChainVariants = tv({
		slots: {
			wrapper: 'space-y-2',
			item: [
				'p-3 rounded-lg border cursor-pointer',
				'transition-colors hover:bg-muted/30'
			].join(' '),
			itemCurrent: [
				'p-3 rounded-lg border',
				'border-primary bg-primary/5'
			].join(' '),
			circle: [
				'w-6 h-6 rounded-full flex items-center justify-center',
				'text-xs font-medium flex-shrink-0'
			].join(' '),
			toggleBtn: [
				'flex items-center gap-1.5 text-xs text-muted-foreground',
				'hover:text-foreground transition-colors cursor-pointer',
				'py-1 px-2 rounded-md hover:bg-muted/50'
			].join(' ')
		}
	});

	export interface ChainItem {
		id: string;
		prompt: string;
		createdAt: string;
		response?: {
			selectedOption: string;
			text?: string;
			resolvedBy?: string;
			resolvedAt?: string;
		};
	}

	export type DecisionChainProps = VariantProps<typeof decisionChainVariants> & {
		chain: ChainItem[];
		currentId: string;
		onSelectItem?: (id: string) => void;
		class?: string;
	};
</script>

<script lang="ts">
	import { cn, formatRelativeTime } from '$lib/utils';
	import { CheckCircle2, ChevronRight, ChevronDown, ChevronUp } from 'lucide-svelte';

	let {
		chain,
		currentId,
		onSelectItem,
		class: className = ''
	}: DecisionChainProps = $props();

	const COLLAPSE_THRESHOLD = 3;

	let expanded = $state(false);

	const shouldCollapse = $derived(chain.length > COLLAPSE_THRESHOLD);
	const visibleItems = $derived(
		shouldCollapse && !expanded ? chain.slice(0, COLLAPSE_THRESHOLD) : chain
	);
	const hiddenCount = $derived(chain.length - COLLAPSE_THRESHOLD);

	const styles = decisionChainVariants();

	function handleItemClick(id: string) {
		if (id !== currentId && onSelectItem) {
			onSelectItem(id);
		}
	}

	function handleItemKeyDown(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleItemClick(id);
		}
	}

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

{#if chain.length > 1}
	<div class={cn(styles.wrapper(), className)}>
		{#each visibleItems as item, index (item.id)}
			{@const isCurrent = item.id === currentId}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class={isCurrent ? styles.itemCurrent() : cn(styles.item(), 'border-border')}
				onclick={() => handleItemClick(item.id)}
				onkeydown={(e) => handleItemKeyDown(e, item.id)}
				role={isCurrent ? 'presentation' : 'button'}
				tabindex={isCurrent ? -1 : 0}
				aria-label={isCurrent ? undefined : `View iteration ${index + 1}: ${item.prompt}`}
			>
				<div class="flex items-start gap-2">
					<div
						class={cn(
							styles.circle(),
							item.response ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
						)}
					>
						{index + 1}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm text-foreground line-clamp-2">{item.prompt}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{formatRelativeTime(item.createdAt)}
						</p>
						{#if item.response}
							<div class="mt-2 flex items-center gap-1 text-xs text-success">
								<CheckCircle2 class="w-3 h-3" />
								<span>Resolved: {item.response.selectedOption}</span>
							</div>
						{/if}
					</div>
					{#if isCurrent}
						<ChevronRight class="w-4 h-4 text-primary flex-shrink-0" />
					{/if}
				</div>
			</div>
		{/each}

		{#if shouldCollapse}
			<button type="button" class={styles.toggleBtn()} onclick={toggleExpanded}>
				{#if expanded}
					<ChevronUp class="w-3.5 h-3.5" />
					<span>Show less</span>
				{:else}
					<ChevronDown class="w-3.5 h-3.5" />
					<span>Show {hiddenCount} more</span>
				{/if}
			</button>
		{/if}
	</div>
{/if}

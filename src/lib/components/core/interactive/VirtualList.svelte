<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const virtualListVariants = tv({
		slots: {
			container: 'overflow-auto relative',
			content: 'relative',
			item: 'absolute w-full',
			spacer: 'pointer-events-none',
			empty: 'flex items-center justify-center text-muted-foreground py-8',
			srOnly: 'sr-only'
		}
	});

	export type VirtualListVariants = VariantProps<typeof virtualListVariants>;

	export interface VirtualListProps<T> {
		items: T[];
		itemHeight: number;
		containerHeight?: number;
		buffer?: number;
		ariaLabel?: string;
		emptyMessage?: string;
		class?: string;
	}
</script>

<script lang="ts" generics="T extends { id: string; label: string }">
	import { cn } from '$lib/utils';

	let {
		items,
		itemHeight,
		containerHeight = 400,
		buffer = 3,
		ariaLabel,
		emptyMessage = 'No items',
		class: className
	}: VirtualListProps<T> = $props();

	const styles = virtualListVariants();

	let scrollTop = $state(0);
	let scrollContainer: HTMLDivElement | undefined = $state();

	const totalHeight = $derived(items.length * itemHeight);
	const visibleCount = $derived(Math.ceil(containerHeight / itemHeight));
	const startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - buffer));
	const endIndex = $derived(Math.min(items.length, startIndex + visibleCount + buffer * 2));
	const visibleItems = $derived(items.slice(startIndex, endIndex));
	const topSpacerHeight = $derived(startIndex * itemHeight);
	const bottomSpacerHeight = $derived(Math.max(0, (items.length - endIndex) * itemHeight));

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}
</script>

{#if items.length === 0}
	<div
		role="list"
		aria-label={ariaLabel}
		class={cn(styles.container(), className)}
		style="height: {containerHeight}px;"
	>
		<div class={styles.empty()}>{emptyMessage}</div>
	</div>
{:else}
	<div
		bind:this={scrollContainer}
		role="list"
		aria-label={ariaLabel}
		class={cn(styles.container(), className)}
		style="height: {containerHeight}px;"
		onscroll={handleScroll}
		data-virtual-scroll
	>
		<span class={styles.srOnly()}>{items.length} items</span>

		<div 
			class={styles.content()}
			style="height: {totalHeight}px;"
			data-virtual-content
		>
			<!-- Top spacer -->
			<div
				aria-hidden="true"
				class={styles.spacer()}
				style="height: {topSpacerHeight}px;"
			></div>

			<!-- Visible items -->
			{#each visibleItems as item, index (item.id)}
				<div
					role="listitem"
					class={styles.item()}
					style="height: {itemHeight}px; top: {(startIndex + index) * itemHeight}px;"
					aria-posinset={startIndex + index + 1}
					aria-setsize={items.length}
				>
					{item.label}
				</div>
			{/each}

			<!-- Bottom spacer -->
			<div
				aria-hidden="true"
				class={styles.spacer()}
				style="height: {bottomSpacerHeight}px;"
			></div>
		</div>
	</div>
{/if}

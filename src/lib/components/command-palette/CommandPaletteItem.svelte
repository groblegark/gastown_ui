<script lang="ts">
	/**
	 * CommandPaletteItem - Individual result item in the command palette
	 *
	 * Renders a single result with icon, label, and optional sublabel.
	 * Handles click to execute action and mouseenter to update selection.
	 */
	import { cn } from '$lib/utils';
	import { CornerDownLeft } from 'lucide-svelte';
	import type { PaletteResult } from './types';

	interface Props {
		result: PaletteResult;
		isSelected: boolean;
		index: number;
		onSelect?: (index: number) => void;
	}

	let { result, isSelected, index, onSelect }: Props = $props();

	function handleClick() {
		result.action();
	}

	function handleMouseEnter() {
		onSelect?.(index);
	}

	const isRecent = $derived(result.type === 'recent');
</script>

<button
	type="button"
	id="cmd-result-{index}"
	role="option"
	aria-selected={isSelected}
	class={cn(
		'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
		'transition-all duration-200 ease-out',
		isSelected
			? 'bg-accent text-accent-foreground shadow-sm'
			: 'hover:bg-muted/50',
		isRecent && !isSelected && 'opacity-60'
	)}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
>
	<span
		class={cn(
			'w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg',
			isSelected
				? 'bg-accent-foreground/10 text-accent-foreground'
				: 'bg-muted/50 text-muted-foreground'
		)}
	>
		{#if result.icon}
			<result.icon size={18} strokeWidth={2} />
		{/if}
	</span>
	<div class="flex-1 min-w-0">
		<div class="font-medium truncate">{result.label}</div>
		{#if result.sublabel}
			<div class="text-body-sm text-muted-foreground truncate">{result.sublabel}</div>
		{/if}
	</div>
	{#if isSelected}
		<div class="flex items-center gap-1 text-muted-foreground opacity-60">
			<CornerDownLeft class="w-4 h-4" />
		</div>
	{/if}
</button>

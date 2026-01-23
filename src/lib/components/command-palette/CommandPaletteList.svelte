<script lang="ts">
	/**
	 * CommandPaletteList - Grouped list of command palette results
	 *
	 * Renders results grouped by type/category with group headers.
	 * Handles empty states and search suggestions.
	 */
	import { Search, Sparkles, Clock, Terminal } from 'lucide-svelte';
	import type { PaletteResult, PaletteMode } from './types';
	import { groupLabels, searchSuggestions } from './data';
	import CommandPaletteItem from './CommandPaletteItem.svelte';

	interface Props {
		results: PaletteResult[];
		selectedIndex: number;
		searchQuery?: string;
		activeMode?: PaletteMode;
		onSuggestionClick?: (query: string) => void;
		onSelect?: (index: number) => void;
	}

	let {
		results,
		selectedIndex,
		searchQuery = '',
		activeMode = 'search',
		onSuggestionClick,
		onSelect
	}: Props = $props();

	// Group results by type/category for display
	const groupedResults = $derived.by(() => {
		const groups: Record<string, PaletteResult[]> = {};

		for (const result of results) {
			const groupKey = result.category || result.type;
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(result);
		}

		return groups;
	});

	// Calculate flat index for a grouped item
	function getFlatIndex(groupKey: string, itemIndex: number): number {
		let flatIndex = 0;
		for (const [key, items] of Object.entries(groupedResults)) {
			if (key === groupKey) {
				return flatIndex + itemIndex;
			}
			flatIndex += items.length;
		}
		return 0;
	}

	function handleItemSelect(index: number) {
		onSelect?.(index);
	}
</script>

<div
	id="command-results-listbox"
	role="listbox"
	aria-label="Command palette results"
	class="max-h-[60vh] overflow-y-auto overscroll-contain"
>
	{#if results.length === 0}
		<div class="px-4 py-8 text-center">
			{#if searchQuery}
				<div class="text-muted-foreground">
					<Search class="w-10 h-10 mx-auto mb-3 opacity-40" />
					<p class="font-medium">No results for "{searchQuery}"</p>
					<p class="text-body-sm mt-1">
						{#if activeMode === 'search'}
							Try <kbd class="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">&gt;</kbd> for commands
							or <kbd class="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">:</kbd> for formulas
						{:else}
							Try a different search term
						{/if}
					</p>
				</div>
			{:else}
				<!-- Empty state with suggestions -->
				<div class="space-y-4">
					<div class="text-muted-foreground">
						<Sparkles class="w-10 h-10 mx-auto mb-3 opacity-40" />
						<p class="font-medium">Try searching for:</p>
					</div>
					<div class="flex flex-wrap justify-center gap-2">
						{#each searchSuggestions as suggestion}
							<button
								type="button"
								class="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-touch text-body-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors duration-fast"
								onclick={() => onSuggestionClick?.(suggestion.query)}
							>
								<Search class="w-3 h-3" />
								{suggestion.query}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="py-2">
			{#each Object.entries(groupedResults) as [groupKey, items]}
				<div class="px-2">
					<!-- Group header -->
					<div
						class="flex items-center gap-2 px-2 py-1.5 text-label-sm text-muted-foreground/60 uppercase tracking-[0.1em]"
					>
						{#if groupKey === 'recent'}
							<Clock class="w-3.5 h-3.5" />
						{:else if groupKey === 'beads' || groupKey === 'gasstown' || groupKey === 'git'}
							<Terminal class="w-3.5 h-3.5" />
						{/if}
						{groupLabels[groupKey] || groupKey}
					</div>
					{#each items as item, itemIndex}
						{@const flatIndex = getFlatIndex(groupKey, itemIndex)}
						<CommandPaletteItem
							result={item}
							isSelected={flatIndex === selectedIndex}
							index={flatIndex}
							onSelect={handleItemSelect}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

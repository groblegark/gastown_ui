<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * AdviceList - List component for displaying advice items
	 *
	 * Features:
	 * - Virtual scrolling for large lists
	 * - Filter bar (scope, status, search)
	 * - Sort controls
	 * - Quick actions
	 * - Batch selection
	 * - Skeleton loading state
	 */

	export const adviceListVariants = tv({
		slots: {
			container: 'panel-glass mx-auto max-w-2xl',
			header: 'flex items-center justify-between p-4 border-b border-border',
			title: 'text-lg font-semibold text-foreground flex items-center gap-2',
			count: 'text-sm text-muted-foreground font-normal',
			filterBar: 'p-4 space-y-3 border-b border-border bg-muted/30',
			filterRow: 'flex flex-wrap items-center gap-2',
			filterLabel: 'text-xs font-medium text-muted-foreground uppercase tracking-wide',
			chipGroup: 'flex flex-wrap gap-2',
			chip: [
				'px-3 py-1.5 text-xs font-medium rounded-full',
				'transition-colors touch-target cursor-pointer',
				'border border-transparent'
			].join(' '),
			chipActive: 'bg-primary text-primary-foreground',
			chipInactive: 'bg-muted text-muted-foreground hover:bg-muted/80',
			searchContainer: 'relative flex-1 min-w-[200px]',
			searchInput: [
				'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
				'bg-background border border-border',
				'placeholder:text-muted-foreground text-foreground',
				'focus:outline-none focus:ring-2 focus:ring-ring'
			].join(' '),
			searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
			sortContainer: 'flex items-center gap-2',
			sortLabel: 'text-xs font-medium text-muted-foreground',
			sortSelect: [
				'px-2 py-1.5 text-xs bg-background text-foreground rounded border border-border',
				'appearance-none pr-6 cursor-pointer',
				'focus:outline-none focus:ring-2 focus:ring-ring'
			].join(' '),
			sortButton: [
				'flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground',
				'hover:text-foreground rounded hover:bg-muted/50 transition-colors touch-target'
			].join(' '),
			batchBar: [
				'flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20'
			].join(' '),
			batchInfo: 'text-sm font-medium text-primary',
			batchActions: 'flex items-center gap-2',
			batchButton: [
				'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors touch-target'
			].join(' '),
			listContainer: 'overflow-auto',
			list: 'divide-y divide-border',
			item: [
				'flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer'
			].join(' '),
			itemSelected: 'bg-primary/5',
			checkbox: [
				'w-5 h-5 rounded border-2 border-muted-foreground/50 flex-shrink-0 mt-0.5',
				'flex items-center justify-center transition-colors cursor-pointer'
			].join(' '),
			checkboxChecked: 'bg-primary border-primary',
			itemContent: 'flex-1 min-w-0',
			itemHeader: 'flex items-center gap-2 mb-1',
			itemTitle: 'font-medium text-foreground truncate',
			itemMeta: 'flex items-center gap-2 text-xs text-muted-foreground',
			itemDescription: 'text-sm text-muted-foreground line-clamp-2',
			itemActions: 'flex items-center gap-1 flex-shrink-0',
			actionButton: [
				'p-1.5 rounded-lg text-muted-foreground hover:text-foreground',
				'hover:bg-muted/50 transition-colors touch-target'
			].join(' '),
			emptyState: 'flex flex-col items-center justify-center py-12 px-4 text-center',
			emptyIcon: 'w-12 h-12 text-muted-foreground mb-4',
			emptyTitle: 'text-lg font-medium text-foreground mb-2',
			emptyDescription: 'text-sm text-muted-foreground max-w-sm',
			skeleton: 'animate-pulse',
			skeletonItem: 'flex items-start gap-3 p-4',
			skeletonCheckbox: 'w-5 h-5 rounded bg-muted/50 flex-shrink-0',
			skeletonContent: 'flex-1 space-y-2',
			skeletonTitle: 'h-4 w-48 rounded bg-muted/50',
			skeletonMeta: 'h-3 w-32 rounded bg-muted/50',
			skeletonDesc: 'h-3 w-full rounded bg-muted/50'
		}
	});

	export type AdviceListVariants = VariantProps<typeof adviceListVariants>;

	/** Advice scope - where this advice applies */
	export type AdviceScope = 'global' | 'rig' | 'agent' | 'task';

	/** Advice status */
	export type AdviceStatus = 'active' | 'acknowledged' | 'dismissed' | 'expired';

	/** Sort options */
	export type AdviceSortBy = 'date' | 'priority' | 'scope' | 'status';
	export type AdviceSortOrder = 'asc' | 'desc';

	/** A single advice item */
	export interface Advice {
		id: string;
		title: string;
		description?: string;
		scope: AdviceScope;
		status: AdviceStatus;
		priority: number;
		createdAt: string;
		updatedAt?: string;
		source?: string;
		targetId?: string;
		targetName?: string;
		tags?: string[];
	}

	/** Filter state for advice list */
	export interface AdviceFilters {
		scope?: AdviceScope | 'all';
		status?: AdviceStatus | 'all';
		search?: string;
	}

	export interface AdviceListProps {
		advice: Advice[];
		filters?: AdviceFilters;
		loading?: boolean;
		sortBy?: AdviceSortBy;
		sortOrder?: AdviceSortOrder;
		selectedIds?: Set<string>;
		showBatchActions?: boolean;
		containerHeight?: number;
		itemHeight?: number;
		class?: string;
		onselect?: (id: string) => void;
		onbatchselect?: (ids: string[]) => void;
		onfilterchange?: (filters: AdviceFilters) => void;
		onsortchange?: (sortBy: AdviceSortBy) => void;
		onsortorderchange?: () => void;
		onaction?: (action: string, id: string) => void;
		onbatchaction?: (action: string, ids: string[]) => void;
	}
</script>

<script lang="ts">
	import { cn, formatRelativeTime } from '$lib/utils';
	import {
		Search,
		Lightbulb,
		ChevronUp,
		ChevronDown,
		Check,
		MoreHorizontal,
		Eye,
		Trash2,
		CheckCircle2,
		X,
		Globe,
		Server,
		Bot,
		ClipboardList
	} from 'lucide-svelte';

	let {
		advice,
		filters = { scope: 'all', status: 'all', search: '' },
		loading = false,
		sortBy = 'date',
		sortOrder = 'desc',
		selectedIds = new Set<string>(),
		showBatchActions = true,
		containerHeight = 500,
		itemHeight = 80,
		class: className = '',
		onselect,
		onbatchselect,
		onfilterchange,
		onsortchange,
		onsortorderchange,
		onaction,
		onbatchaction
	}: AdviceListProps = $props();

	const styles = adviceListVariants();

	// Local state for search input - use derived to sync with filters prop
	let searchValue = $state('');

	// Sync search value when filters change externally
	$effect(() => {
		searchValue = filters.search || '';
	});

	// Virtual scrolling state
	let scrollTop = $state(0);
	let scrollContainer: HTMLDivElement | undefined = $state();

	// Scope filter chips
	const scopeChips: Array<{ label: string; value: AdviceScope | 'all' }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Global', value: 'global' },
		{ label: 'Rig', value: 'rig' },
		{ label: 'Agent', value: 'agent' },
		{ label: 'Task', value: 'task' }
	];

	// Status filter chips
	const statusChips: Array<{ label: string; value: AdviceStatus | 'all' }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Active', value: 'active' },
		{ label: 'Acknowledged', value: 'acknowledged' },
		{ label: 'Dismissed', value: 'dismissed' }
	];

	// Derived: filtered and sorted advice
	const filteredAdvice = $derived.by(() => {
		let result = [...advice];

		// Apply scope filter
		if (filters.scope && filters.scope !== 'all') {
			result = result.filter((a) => a.scope === filters.scope);
		}

		// Apply status filter
		if (filters.status && filters.status !== 'all') {
			result = result.filter((a) => a.status === filters.status);
		}

		// Apply search filter
		if (filters.search) {
			const search = filters.search.toLowerCase();
			result = result.filter(
				(a) =>
					a.title.toLowerCase().includes(search) ||
					a.description?.toLowerCase().includes(search) ||
					a.source?.toLowerCase().includes(search) ||
					a.tags?.some((t) => t.toLowerCase().includes(search))
			);
		}

		// Apply sorting
		result.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'date':
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case 'priority':
					comparison = a.priority - b.priority;
					break;
				case 'scope':
					comparison = a.scope.localeCompare(b.scope);
					break;
				case 'status':
					comparison = a.status.localeCompare(b.status);
					break;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return result;
	});

	// Virtual scrolling calculations
	const totalHeight = $derived(filteredAdvice.length * itemHeight);
	const visibleCount = $derived(Math.ceil(containerHeight / itemHeight));
	const buffer = 3;
	const startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - buffer));
	const endIndex = $derived(Math.min(filteredAdvice.length, startIndex + visibleCount + buffer * 2));
	const visibleItems = $derived(filteredAdvice.slice(startIndex, endIndex));
	const topSpacerHeight = $derived(startIndex * itemHeight);

	// Batch selection state
	const selectedCount = $derived(selectedIds.size);
	const allSelected = $derived(
		filteredAdvice.length > 0 && filteredAdvice.every((a) => selectedIds.has(a.id))
	);

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	function handleScopeFilter(value: AdviceScope | 'all') {
		onfilterchange?.({ ...filters, scope: value });
	}

	function handleStatusFilter(value: AdviceStatus | 'all') {
		onfilterchange?.({ ...filters, status: value });
	}

	function handleSearchChange() {
		onfilterchange?.({ ...filters, search: searchValue });
	}

	function handleSortChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as AdviceSortBy;
		onsortchange?.(value);
	}

	function handleItemClick(id: string) {
		onselect?.(id);
	}

	function handleCheckboxClick(e: Event, id: string) {
		e.stopPropagation();
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		onbatchselect?.([...newSelected]);
	}

	function handleSelectAll() {
		if (allSelected) {
			onbatchselect?.([]);
		} else {
			onbatchselect?.(filteredAdvice.map((a) => a.id));
		}
	}

	function handleBatchAction(action: string) {
		onbatchaction?.(action, [...selectedIds]);
	}

	function handleItemAction(e: Event, action: string, id: string) {
		e.stopPropagation();
		onaction?.(action, id);
	}

	function getScopeIcon(scope: AdviceScope) {
		switch (scope) {
			case 'global':
				return Globe;
			case 'rig':
				return Server;
			case 'agent':
				return Bot;
			case 'task':
				return ClipboardList;
		}
	}

	function getStatusColor(status: AdviceStatus) {
		switch (status) {
			case 'active':
				return 'text-status-online';
			case 'acknowledged':
				return 'text-status-pending';
			case 'dismissed':
				return 'text-muted-foreground';
			case 'expired':
				return 'text-status-offline';
		}
	}
</script>

<section class={cn(styles.container(), className)}>
	<!-- Header -->
	<header class={styles.header()}>
		<h2 class={styles.title()}>
			<Lightbulb class="w-5 h-5 text-foreground" strokeWidth={2} />
			Advice
			<span class={styles.count()}>({filteredAdvice.length})</span>
		</h2>
	</header>

	<!-- Filter Bar -->
	<div class={styles.filterBar()}>
		<!-- Scope Filters -->
		<div class={styles.filterRow()}>
			<span class={styles.filterLabel()}>Scope</span>
			<div class={styles.chipGroup()}>
				{#each scopeChips as chip}
					<button
						type="button"
						class={cn(
							styles.chip(),
							filters.scope === chip.value || (chip.value === 'all' && !filters.scope)
								? styles.chipActive()
								: styles.chipInactive()
						)}
						onclick={() => handleScopeFilter(chip.value)}
						aria-pressed={filters.scope === chip.value}
					>
						{chip.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Status Filters -->
		<div class={styles.filterRow()}>
			<span class={styles.filterLabel()}>Status</span>
			<div class={styles.chipGroup()}>
				{#each statusChips as chip}
					<button
						type="button"
						class={cn(
							styles.chip(),
							filters.status === chip.value || (chip.value === 'all' && !filters.status)
								? styles.chipActive()
								: styles.chipInactive()
						)}
						onclick={() => handleStatusFilter(chip.value)}
						aria-pressed={filters.status === chip.value}
					>
						{chip.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Search and Sort Row -->
		<div class={cn(styles.filterRow(), 'justify-between')}>
			<!-- Search -->
			<div class={styles.searchContainer()}>
				<Search class={styles.searchIcon()} />
				<input
					type="text"
					placeholder="Search advice..."
					class={styles.searchInput()}
					bind:value={searchValue}
					onkeyup={(e) => e.key === 'Enter' && handleSearchChange()}
					onblur={handleSearchChange}
				/>
			</div>

			<!-- Sort Controls -->
			<div class={styles.sortContainer()}>
				<span class={styles.sortLabel()}>Sort:</span>
				<select value={sortBy} onchange={handleSortChange} class={styles.sortSelect()}>
					<option value="date">Date</option>
					<option value="priority">Priority</option>
					<option value="scope">Scope</option>
					<option value="status">Status</option>
				</select>
				<button
					type="button"
					onclick={onsortorderchange}
					class={styles.sortButton()}
					aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
				>
					{#if sortOrder === 'asc'}
						<ChevronUp class="w-4 h-4" />
					{:else}
						<ChevronDown class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Batch Selection Bar -->
	{#if showBatchActions && selectedCount > 0}
		<div class={styles.batchBar()}>
			<div class={styles.batchInfo()}>
				<button
					type="button"
					class={cn(styles.checkbox(), allSelected && styles.checkboxChecked())}
					onclick={handleSelectAll}
				>
					{#if allSelected}
						<Check class="w-3 h-3 text-primary-foreground" />
					{/if}
				</button>
				<span class="ml-2">{selectedCount} selected</span>
			</div>
			<div class={styles.batchActions()}>
				<button
					type="button"
					class={cn(styles.batchButton(), 'bg-primary text-primary-foreground hover:bg-primary/90')}
					onclick={() => handleBatchAction('acknowledge')}
				>
					<CheckCircle2 class="w-4 h-4 inline mr-1" />
					Acknowledge
				</button>
				<button
					type="button"
					class={cn(
						styles.batchButton(),
						'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
					)}
					onclick={() => handleBatchAction('dismiss')}
				>
					<X class="w-4 h-4 inline mr-1" />
					Dismiss
				</button>
			</div>
		</div>
	{/if}

	<!-- List Content -->
	{#if loading}
		<!-- Skeleton Loading State -->
		<div class={styles.skeleton()}>
			{#each Array(5) as _, i}
				<div class={styles.skeletonItem()} style="animation-delay: {i * 50}ms">
					<div class={styles.skeletonCheckbox()}></div>
					<div class={styles.skeletonContent()}>
						<div class={styles.skeletonTitle()}></div>
						<div class={styles.skeletonMeta()}></div>
						<div class={styles.skeletonDesc()} style="width: {70 + Math.random() * 30}%"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredAdvice.length === 0}
		<!-- Empty State -->
		<div class={styles.emptyState()}>
			<Lightbulb class={styles.emptyIcon()} />
			<h3 class={styles.emptyTitle()}>No advice found</h3>
			<p class={styles.emptyDescription()}>
				{#if filters.search || filters.scope !== 'all' || filters.status !== 'all'}
					Try adjusting your filters or search terms.
				{:else}
					No advice items are currently available.
				{/if}
			</p>
		</div>
	{:else}
		<!-- Virtual Scrolling List -->
		<div
			bind:this={scrollContainer}
			class={styles.listContainer()}
			style="height: {containerHeight}px;"
			onscroll={handleScroll}
			role="listbox"
			aria-label="Advice list"
			aria-multiselectable={showBatchActions}
		>
			<div style="height: {totalHeight}px; position: relative;">
				<!-- Top spacer -->
				<div style="height: {topSpacerHeight}px;" aria-hidden="true"></div>

				<!-- Visible items -->
				{#each visibleItems as item, index (item.id)}
					{@const ScopeIcon = getScopeIcon(item.scope)}
					<div
						role="option"
						aria-selected={selectedIds.has(item.id)}
						class={cn(styles.item(), selectedIds.has(item.id) && styles.itemSelected())}
						style="height: {itemHeight}px;"
						onclick={() => handleItemClick(item.id)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleItemClick(item.id)}
						tabindex="0"
						aria-label={`${item.title} - ${item.status}`}
					>
						<!-- Checkbox -->
						{#if showBatchActions}
							<button
								type="button"
								class={cn(styles.checkbox(), selectedIds.has(item.id) && styles.checkboxChecked())}
								onclick={(e) => handleCheckboxClick(e, item.id)}
								aria-label={selectedIds.has(item.id) ? 'Deselect' : 'Select'}
							>
								{#if selectedIds.has(item.id)}
									<Check class="w-3 h-3 text-primary-foreground" />
								{/if}
							</button>
						{/if}

						<!-- Content -->
						<div class={styles.itemContent()}>
							<div class={styles.itemHeader()}>
								<ScopeIcon class="w-4 h-4 text-muted-foreground flex-shrink-0" />
								<span class={styles.itemTitle()}>{item.title}</span>
								<span class={cn('text-xs font-medium', getStatusColor(item.status))}>
									{item.status}
								</span>
							</div>
							<div class={styles.itemMeta()}>
								<span>P{item.priority}</span>
								{#if item.source}
									<span>from {item.source}</span>
								{/if}
								<span>{formatRelativeTime(item.createdAt)}</span>
							</div>
							{#if item.description}
								<p class={styles.itemDescription()}>{item.description}</p>
							{/if}
						</div>

						<!-- Quick Actions -->
						<div class={styles.itemActions()}>
							<button
								type="button"
								class={styles.actionButton()}
								onclick={(e) => handleItemAction(e, 'view', item.id)}
								aria-label="View details"
							>
								<Eye class="w-4 h-4" />
							</button>
							<button
								type="button"
								class={styles.actionButton()}
								onclick={(e) => handleItemAction(e, 'acknowledge', item.id)}
								aria-label="Acknowledge"
							>
								<CheckCircle2 class="w-4 h-4" />
							</button>
							<button
								type="button"
								class={styles.actionButton()}
								onclick={(e) => handleItemAction(e, 'dismiss', item.id)}
								aria-label="Dismiss"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

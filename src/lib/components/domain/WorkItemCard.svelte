<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * WorkItemCard variant definitions using tailwind-variants
	 * Mobile-first card for displaying work items (beads) with expand/collapse
	 */
	export const workItemCardVariants = tv({
		slots: {
			card: [
				'panel-glass overflow-hidden border-l-4',
				'transition-all duration-normal ease-out-expo',
				'hover:shadow-elevation-2 hover:-translate-y-0.5',
				'touch-ripple active:scale-[0.98]',
				'cursor-pointer'
			].join(' '),
			header: 'flex items-start justify-between gap-3 p-4',
			idBadge: [
				'font-mono text-sm font-medium',
				'px-2 py-0.5 rounded',
				'bg-primary/10 text-primary'
			].join(' '),
			title: 'text-sm font-medium text-foreground line-clamp-2 flex-1',
			meta: 'flex flex-wrap items-center gap-2 px-4 pb-3',
			badge: [
				'inline-flex items-center gap-1',
				'px-2 py-0.5 rounded-full',
				'text-xs font-medium'
			].join(' '),
			priorityBadge: 'text-xs font-mono px-1.5 py-0.5 rounded',
			details: 'overflow-hidden transition-all duration-slow ease-spring',
			detailsContent: 'p-4 pt-0 border-t border-border/50 mt-3 space-y-3',
			chevron: 'w-4 h-4 text-muted-foreground transition-transform duration-normal ease-spring flex-shrink-0'
		},
		variants: {
			type: {
				task: { card: 'border-l-info' },
				bug: { card: 'border-l-destructive' },
				feature: { card: 'border-l-success' },
				epic: { card: 'border-l-[#8B5CF6]' }
			},
			status: {
				open: { badge: 'bg-muted text-muted-foreground' },
				in_progress: { badge: 'bg-status-idle/15 text-status-idle' },
				done: { badge: 'bg-status-online/15 text-status-online' },
				blocked: { badge: 'bg-status-offline/15 text-status-offline' }
			},
			priority: {
				0: { priorityBadge: 'bg-destructive/20 text-destructive font-semibold' },
				1: { priorityBadge: 'bg-warning/20 text-warning' },
				2: { priorityBadge: 'bg-info/20 text-info' },
				3: { priorityBadge: 'bg-muted text-muted-foreground' },
				4: { priorityBadge: 'bg-muted/50 text-muted-foreground/70' }
			},
			expanded: {
				true: { details: 'max-h-96 opacity-100', chevron: 'rotate-180' },
				false: { details: 'max-h-0 opacity-0' }
			},
			selected: {
				true: { card: 'ring-2 ring-primary' },
				false: {}
			}
		},
		defaultVariants: {
			type: 'task',
			status: 'open',
			priority: 2,
			expanded: false,
			selected: false
		}
	});

	export interface WorkItem {
		id: string;
		title: string;
		type: 'task' | 'bug' | 'feature' | 'epic';
		status: 'open' | 'in_progress' | 'done' | 'blocked';
		priority: 0 | 1 | 2 | 3 | 4;
		assignee?: string;
		description?: string;
		created?: string;
		updated?: string;
	}

	export type WorkItemCardProps = VariantProps<typeof workItemCardVariants> & {
		item: WorkItem;
		expanded?: boolean;
		selected?: boolean;
		selectable?: boolean;
		class?: string;
		onexpand?: (id: string) => void;
		onselect?: (id: string) => void;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { hapticLight } from '$lib/utils/haptics';
	import {
		ChevronDown,
		CheckSquare,
		Bug,
		Lightbulb,
		BookOpen,
		User,
		Calendar,
		Clock
	} from 'lucide-svelte';

	let {
		item,
		expanded = false,
		selected = false,
		selectable = false,
		class: className = '',
		onexpand,
		onselect
	}: WorkItemCardProps = $props();

	const styles = $derived(workItemCardVariants({
		type: item.type,
		status: item.status,
		priority: item.priority as 0 | 1 | 2 | 3 | 4,
		expanded,
		selected
	}));

	const typeIcons = {
		task: CheckSquare,
		bug: Bug,
		feature: Lightbulb,
		epic: BookOpen
	};

	const typeLabels = {
		task: 'Task',
		bug: 'Bug',
		feature: 'Feature',
		epic: 'Epic'
	};

	const statusLabels = {
		open: 'Open',
		in_progress: 'In Progress',
		done: 'Done',
		blocked: 'Blocked'
	};

	const priorityLabels = {
		0: 'P0',
		1: 'P1',
		2: 'P2',
		3: 'P3',
		4: 'P4'
	};

	const TypeIcon = $derived(typeIcons[item.type]);

	function handleClick(e: MouseEvent) {
		if (selectable && (e.target as HTMLElement).closest('[data-checkbox]')) {
			e.stopPropagation();
			hapticLight();
			onselect?.(item.id);
			return;
		}
		hapticLight();
		onexpand?.(item.id);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			hapticLight();
			onexpand?.(item.id);
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article
	class={cn(styles.card(), className)}
	role="button"
	tabindex={0}
	aria-expanded={expanded}
	onclick={handleClick}
	onkeydown={handleKeyDown}
>
	<div class={styles.header()}>
		{#if selectable}
			<div data-checkbox class="flex items-center pr-2">
				<input
					type="checkbox"
					checked={selected}
					class="w-4 h-4 rounded border-border text-primary focus:ring-ring"
					aria-label="Select {item.id}"
				/>
			</div>
		{/if}

		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class={styles.idBadge()}>{item.id}</span>
				<span class={styles.priorityBadge()}>{priorityLabels[item.priority]}</span>
			</div>
			<h3 class={styles.title()}>{item.title}</h3>
		</div>

		<ChevronDown class={styles.chevron()} aria-hidden="true" />
	</div>

	<div class={styles.meta()}>
		<span class={styles.badge()}>
			<TypeIcon class="w-3 h-3" strokeWidth={2} />
			{typeLabels[item.type]}
		</span>
		<span class={styles.badge()}>
			{statusLabels[item.status]}
		</span>
		{#if item.assignee}
			<span class="text-xs text-muted-foreground flex items-center gap-1">
				<User class="w-3 h-3" />
				{item.assignee}
			</span>
		{/if}
	</div>

	<div class={styles.details()}>
		{#if expanded}
			<div class={styles.detailsContent()}>
				{#if item.description}
					<p class="text-sm text-foreground/80">{item.description}</p>
				{/if}

				<div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
					{#if item.created}
						<span class="flex items-center gap-1">
							<Calendar class="w-3 h-3" />
							Created: {item.created}
						</span>
					{/if}
					{#if item.updated}
						<span class="flex items-center gap-1">
							<Clock class="w-3 h-3" />
							Updated: {item.updated}
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</article>

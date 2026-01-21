<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * WorkItemDetail slide-out panel for viewing full work item details
	 * Mobile-first with swipe-to-close support
	 */
	export const workItemDetailVariants = tv({
		slots: {
			overlay: [
				'fixed inset-0 bg-background/80 backdrop-blur-sm z-40',
				'transition-opacity duration-normal'
			].join(' '),
			panel: [
				'fixed inset-y-0 right-0 z-50',
				'w-full max-w-md',
				'bg-background border-l border-border',
				'shadow-elevation-4',
				'transition-transform duration-normal ease-out-expo',
				'flex flex-col'
			].join(' '),
			header: [
				'flex items-center justify-between gap-3',
				'p-4 border-b border-border',
				'sticky top-0 bg-background z-10'
			].join(' '),
			closeBtn: [
				'p-2 rounded-lg',
				'text-muted-foreground hover:text-foreground',
				'hover:bg-muted/50',
				'transition-colors touch-target'
			].join(' '),
			content: 'flex-1 overflow-y-auto p-4 space-y-6',
			section: 'space-y-2',
			sectionTitle: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
			badge: [
				'inline-flex items-center gap-1.5',
				'px-2.5 py-1 rounded-full',
				'text-xs font-medium'
			].join(' '),
			actions: [
				'flex gap-2 p-4 border-t border-border',
				'sticky bottom-0 bg-background'
			].join(' '),
			actionBtn: [
				'flex-1 flex items-center justify-center gap-2',
				'px-4 py-3 rounded-lg',
				'font-medium text-sm',
				'transition-colors touch-target'
			].join(' ')
		},
		variants: {
			open: {
				true: {
					overlay: 'opacity-100 pointer-events-auto',
					panel: 'translate-x-0'
				},
				false: {
					overlay: 'opacity-0 pointer-events-none',
					panel: 'translate-x-full'
				}
			},
			type: {
				task: {},
				bug: {},
				feature: {},
				epic: {}
			},
			priority: {
				0: { badge: 'bg-destructive/20 text-destructive' },
				1: { badge: 'bg-warning/20 text-warning' },
				2: { badge: 'bg-info/20 text-info' },
				3: { badge: 'bg-muted text-muted-foreground' },
				4: { badge: 'bg-muted/50 text-muted-foreground/70' }
			}
		},
		defaultVariants: {
			open: false,
			type: 'task',
			priority: 2
		}
	});

	export type WorkItemDetailProps = VariantProps<typeof workItemDetailVariants> & {
		item: import('./WorkItemCard.svelte').WorkItem | null;
		open?: boolean;
		class?: string;
		onclose?: () => void;
		onedit?: (id: string) => void;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { hapticLight, hapticMedium } from '$lib/utils/haptics';
	import { onMount } from 'svelte';
	import {
		X,
		CheckSquare,
		Bug,
		Lightbulb,
		BookOpen,
		User,
		Calendar,
		Clock,
		Edit,
		ExternalLink,
		Copy
	} from 'lucide-svelte';

	let {
		item,
		open = false,
		class: className = '',
		onclose,
		onedit
	}: WorkItemDetailProps = $props();

	const styles = $derived(workItemDetailVariants({
		open,
		type: item?.type || 'task',
		priority: (item?.priority ?? 2) as 0 | 1 | 2 | 3 | 4
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
		0: 'P0 - Critical',
		1: 'P1 - High',
		2: 'P2 - Medium',
		3: 'P3 - Low',
		4: 'P4 - Backlog'
	};

	const TypeIcon = $derived(item ? typeIcons[item.type] : CheckSquare);

	function handleClose() {
		hapticLight();
		onclose?.();
	}

	function handleEdit() {
		if (item) {
			hapticMedium();
			onedit?.(item.id);
		}
	}

	function handleCopyId() {
		if (item) {
			navigator.clipboard.writeText(item.id);
			hapticLight();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if open || item}
	<!-- Backdrop -->
	<div
		class={styles.overlay()}
		onclick={handleClose}
		role="presentation"
		aria-hidden="true"
	></div>

	<!-- Panel -->
	<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
	<aside
		class={cn(styles.panel(), className)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="work-item-title"
	>
		{#if item}
			<!-- Header -->
			<header class={styles.header()}>
				<div class="flex items-center gap-3 min-w-0">
					<div class="p-2 rounded-lg bg-primary/10 text-primary">
						<TypeIcon class="w-5 h-5" strokeWidth={2} />
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium text-primary">{item.id}</span>
							<button
								type="button"
								class="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
								onclick={handleCopyId}
								aria-label="Copy ID"
							>
								<Copy class="w-3 h-3" />
							</button>
						</div>
						<span class="text-xs text-muted-foreground">{typeLabels[item.type]}</span>
					</div>
				</div>
				<button
					type="button"
					class={styles.closeBtn()}
					onclick={handleClose}
					aria-label="Close panel"
				>
					<X class="w-5 h-5" />
				</button>
			</header>

			<!-- Content -->
			<div class={styles.content()}>
				<!-- Title -->
				<div class={styles.section()}>
					<h2 id="work-item-title" class="text-lg font-semibold text-foreground">
						{item.title}
					</h2>
				</div>

				<!-- Status & Priority -->
				<div class={styles.section()}>
					<h3 class={styles.sectionTitle()}>Status</h3>
					<div class="flex flex-wrap gap-2">
						<span class={cn(styles.badge(), 'bg-muted')}>
							{statusLabels[item.status]}
						</span>
						<span class={styles.badge()}>
							{priorityLabels[item.priority]}
						</span>
					</div>
				</div>

				<!-- Assignee -->
				{#if item.assignee}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Assignee</h3>
						<div class="flex items-center gap-2 text-sm text-foreground">
							<User class="w-4 h-4 text-muted-foreground" />
							{item.assignee}
						</div>
					</div>
				{/if}

				<!-- Description -->
				{#if item.description}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Description</h3>
						<p class="text-sm text-foreground/80 whitespace-pre-wrap">
							{item.description}
						</p>
					</div>
				{:else}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Description</h3>
						<p class="text-sm text-muted-foreground italic">
							No description provided
						</p>
					</div>
				{/if}

				<!-- Timestamps -->
				<div class={styles.section()}>
					<h3 class={styles.sectionTitle()}>Timeline</h3>
					<div class="space-y-2 text-sm">
						{#if item.created}
							<div class="flex items-center gap-2 text-muted-foreground">
								<Calendar class="w-4 h-4" />
								<span>Created: {item.created}</span>
							</div>
						{/if}
						{#if item.updated}
							<div class="flex items-center gap-2 text-muted-foreground">
								<Clock class="w-4 h-4" />
								<span>Updated: {item.updated}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class={styles.actions()}>
				<button
					type="button"
					class={cn(styles.actionBtn(), 'bg-secondary hover:bg-secondary/80 text-secondary-foreground')}
					onclick={handleEdit}
				>
					<Edit class="w-4 h-4" />
					Edit
				</button>
				<a
					href="/work/{item.id}"
					class={cn(styles.actionBtn(), 'bg-primary hover:bg-primary/90 text-primary-foreground no-underline')}
				>
					<ExternalLink class="w-4 h-4" />
					Open Full View
				</a>
			</div>
		{/if}
	</aside>
{/if}

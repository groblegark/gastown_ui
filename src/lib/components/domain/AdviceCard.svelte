<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * AdviceCard variant definitions using tailwind-variants
	 * Mobile-first card for displaying advice beads with expand/collapse
	 */
	export const adviceCardVariants = tv({
		slots: {
			card: [
				'panel-glass overflow-hidden border-l-4',
				'transition-all duration-normal ease-out-expo',
				'hover:shadow-elevation-2 hover:-translate-y-0.5',
				'touch-ripple active:scale-[0.98]',
				'cursor-pointer'
			].join(' '),
			header: 'flex items-start justify-between gap-3 p-4',
			scopeBadge: [
				'inline-flex items-center gap-1.5',
				'px-2 py-0.5 rounded-full',
				'text-xs font-medium'
			].join(' '),
			title: 'text-sm font-medium text-foreground line-clamp-2 flex-1',
			meta: 'flex flex-wrap items-center gap-2 px-4 pb-3',
			badge: [
				'inline-flex items-center gap-1',
				'px-2 py-0.5 rounded-full',
				'text-xs font-medium'
			].join(' '),
			priorityBadge: 'text-xs font-mono px-1.5 py-0.5 rounded',
			hookIndicator: 'flex items-center gap-1 text-xs',
			details: 'overflow-hidden transition-all duration-slow ease-spring',
			detailsContent: 'p-4 pt-0 border-t border-border/50 mt-3 space-y-3',
			actions: 'flex gap-2 pt-3',
			actionBtn: [
				'flex items-center justify-center gap-1.5',
				'px-3 py-2 rounded-lg',
				'text-sm font-medium',
				'transition-all duration-fast ease-out-expo',
				'active:scale-[0.98]'
			].join(' '),
			chevron: 'w-4 h-4 text-muted-foreground transition-transform duration-normal ease-spring flex-shrink-0'
		},
		variants: {
			scope: {
				global: {
					card: 'border-l-[#8B5CF6]',
					scopeBadge: 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
				},
				role: {
					card: 'border-l-info',
					scopeBadge: 'bg-info/15 text-info'
				},
				rig: {
					card: 'border-l-success',
					scopeBadge: 'bg-success/15 text-success'
				},
				agent: {
					card: 'border-l-warning',
					scopeBadge: 'bg-warning/15 text-warning'
				}
			},
			priority: {
				0: { priorityBadge: 'bg-destructive/20 text-destructive font-semibold' },
				1: { priorityBadge: 'bg-warning/20 text-warning' },
				2: { priorityBadge: 'bg-info/20 text-info' },
				3: { priorityBadge: 'bg-muted text-muted-foreground' },
				4: { priorityBadge: 'bg-muted/50 text-muted-foreground/70' }
			},
			hooked: {
				true: { hookIndicator: 'text-primary' },
				false: { hookIndicator: 'text-muted-foreground' }
			},
			expanded: {
				true: { details: 'max-h-96 opacity-100', chevron: 'rotate-180' },
				false: { details: 'max-h-0 opacity-0' }
			}
		},
		defaultVariants: {
			scope: 'global',
			priority: 2,
			hooked: false,
			expanded: false
		}
	});

	/**
	 * Advice scope type - determines the reach of the advice
	 */
	export type AdviceScope = 'global' | 'role' | 'rig' | 'agent';

	/**
	 * Advice data structure
	 */
	export interface Advice {
		id: string;
		title: string;
		description?: string;
		scope: AdviceScope;
		priority: 0 | 1 | 2 | 3 | 4;
		hooked?: boolean;
		created?: string;
		updated?: string;
		target?: string; // role name, rig name, or agent name depending on scope
	}

	export type AdviceCardProps = VariantProps<typeof adviceCardVariants> & {
		advice: Advice;
		expanded?: boolean;
		class?: string;
		onexpand?: (id: string) => void;
		onEdit?: (id: string) => void;
		onClose?: (id: string) => void;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { hapticLight } from '$lib/utils/haptics';
	import {
		ChevronDown,
		Globe,
		Users,
		Box,
		User,
		Anchor,
		Pencil,
		X,
		Calendar,
		Clock
	} from 'lucide-svelte';

	let {
		advice,
		expanded = false,
		class: className = '',
		onexpand,
		onEdit,
		onClose
	}: AdviceCardProps = $props();

	const styles = $derived(adviceCardVariants({
		scope: advice.scope,
		priority: advice.priority as 0 | 1 | 2 | 3 | 4,
		hooked: advice.hooked ?? false,
		expanded
	}));

	const scopeIcons = {
		global: Globe,
		role: Users,
		rig: Box,
		agent: User
	};

	const scopeLabels = {
		global: 'Global',
		role: 'Role',
		rig: 'Rig',
		agent: 'Agent'
	};

	const priorityLabels = {
		0: 'P0',
		1: 'P1',
		2: 'P2',
		3: 'P3',
		4: 'P4'
	};

	const ScopeIcon = $derived(scopeIcons[advice.scope]);

	function handleClick() {
		hapticLight();
		onexpand?.(advice.id);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			hapticLight();
			onexpand?.(advice.id);
		}
	}

	function handleEdit(e: MouseEvent) {
		e.stopPropagation();
		hapticLight();
		onEdit?.(advice.id);
	}

	function handleClose(e: MouseEvent) {
		e.stopPropagation();
		hapticLight();
		onClose?.(advice.id);
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
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class={styles.scopeBadge()}>
					<ScopeIcon class="w-3 h-3" strokeWidth={2} />
					{scopeLabels[advice.scope]}
				</span>
				<span class={styles.priorityBadge()}>{priorityLabels[advice.priority]}</span>
				{#if advice.hooked}
					<span class={styles.hookIndicator()}>
						<Anchor class="w-3 h-3" strokeWidth={2} />
						Hooked
					</span>
				{/if}
			</div>
			<h3 class={styles.title()}>{advice.title}</h3>
		</div>

		<ChevronDown class={styles.chevron()} aria-hidden="true" />
	</div>

	<div class={styles.meta()}>
		{#if advice.target}
			<span class="text-xs text-muted-foreground">
				Target: {advice.target}
			</span>
		{/if}
	</div>

	<div class={styles.details()}>
		{#if expanded}
			<div class={styles.detailsContent()}>
				{#if advice.description}
					<p class="text-sm text-foreground/80 whitespace-pre-wrap">{advice.description}</p>
				{/if}

				<div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
					{#if advice.created}
						<span class="flex items-center gap-1">
							<Calendar class="w-3 h-3" />
							Created: {advice.created}
						</span>
					{/if}
					{#if advice.updated}
						<span class="flex items-center gap-1">
							<Clock class="w-3 h-3" />
							Updated: {advice.updated}
						</span>
					{/if}
				</div>

				{#if onEdit || onClose}
					<div class={styles.actions()}>
						{#if onEdit}
							<button
								type="button"
								class={cn(styles.actionBtn(), 'bg-secondary hover:bg-secondary/80 text-secondary-foreground')}
								onclick={handleEdit}
							>
								<Pencil class="w-4 h-4" />
								Edit
							</button>
						{/if}
						{#if onClose}
							<button
								type="button"
								class={cn(styles.actionBtn(), 'bg-destructive/10 hover:bg-destructive/20 text-destructive')}
								onclick={handleClose}
							>
								<X class="w-4 h-4" />
								Close
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</article>

<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * DecisionDetailModal - Modal for viewing and resolving decisions
	 * Shows full prompt, context, options, iteration chain, parent bead link,
	 * and rationale input field for resolving.
	 */
	export const decisionDetailVariants = tv({
		slots: {
			overlay: [
				'fixed inset-0 bg-background/80 backdrop-blur-sm z-40',
				'transition-opacity duration-normal'
			].join(' '),
			panel: [
				'fixed inset-y-0 right-0 z-50',
				'w-full max-w-lg',
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
				'transition-colors touch-target',
				'disabled:opacity-50 disabled:cursor-not-allowed'
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
			urgency: {
				high: { badge: 'bg-warning/20 text-warning' },
				medium: { badge: 'bg-status-pending/20 text-status-pending' },
				low: { badge: 'bg-muted text-muted-foreground' }
			}
		},
		defaultVariants: {
			open: false,
			urgency: 'medium'
		}
	});

	export type DecisionDetailModalProps = VariantProps<typeof decisionDetailVariants> & {
		decisionId: string | null;
		open?: boolean;
		class?: string;
		onclose?: () => void;
		onresolved?: (id: string) => void;
	};
</script>

<script lang="ts">
	import { cn, formatRelativeTime, getDecisionUrgencyConfig } from '$lib/utils';
	import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '$lib/utils/haptics';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/client';
	import type { ApiResponse } from '$lib/api/types';
	import {
		X,
		AlertCircle,
		CheckCircle2,
		Clock,
		User,
		Link2,
		MessageSquare,
		Loader2,
		ExternalLink
	} from 'lucide-svelte';
	import DecisionChain from './DecisionChain.svelte';

	interface DecisionOption {
		id: string;
		label: string;
		description?: string;
		recommended?: boolean;
	}

	interface DecisionResponse {
		selectedOption: string;
		text?: string;
		resolvedBy?: string;
		resolvedAt?: string;
	}

	interface ParentBead {
		id: string;
		title: string;
		status: string;
		priority: number;
		description?: string;
	}

	interface ChainItem {
		id: string;
		prompt: string;
		createdAt: string;
		response?: DecisionResponse;
	}

	interface DecisionDetail {
		id: string;
		prompt: string;
		options: DecisionOption[];
		urgency: 'high' | 'medium' | 'low';
		status: 'pending' | 'resolved';
		requestedBy: string;
		requestedAt: string;
		predecessorId?: string;
		response?: DecisionResponse;
		parentBead?: ParentBead;
	}

	interface DecisionDetailApiResponse {
		decision: DecisionDetail;
		chain: ChainItem[];
		fetchedAt: string;
	}

	let {
		decisionId,
		open = false,
		class: className = '',
		onclose,
		onresolved
	}: DecisionDetailModalProps = $props();

	let decision = $state<DecisionDetail | null>(null);
	let chain = $state<ChainItem[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let selectedOptionId = $state<string | null>(null);
	let rationale = $state('');
	let isSubmitting = $state(false);

	const styles = $derived(
		decisionDetailVariants({
			open,
			urgency: decision?.urgency || 'medium'
		})
	);

	const urgencyConfig = $derived(getDecisionUrgencyConfig(decision?.urgency || 'medium'));
	const isPending = $derived(decision?.status === 'pending');
	const canSubmit = $derived(isPending && selectedOptionId !== null && !isSubmitting);

	async function fetchDecision() {
		if (!decisionId) return;

		isLoading = true;
		error = null;

		try {
			const response: ApiResponse<DecisionDetailApiResponse> = await apiClient.get(
				`/api/gastown/decisions/${decisionId}`
			);

			if (response.data) {
				decision = response.data.decision;
				chain = response.data.chain || [];

				// Pre-select if already resolved
				if (decision.response?.selectedOption) {
					selectedOptionId = decision.response.selectedOption;
					rationale = decision.response.text || '';
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load decision';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit() {
		if (!decision || !selectedOptionId || isSubmitting) return;

		isSubmitting = true;
		hapticMedium();

		try {
			const response: ApiResponse<{ success: boolean; message?: string }> = await apiClient.post(
				`/api/gastown/decisions/${decision.id}/resolve`,
				{
					optionId: selectedOptionId,
					rationale: rationale.trim() || undefined
				}
			);

			if (response.data?.success) {
				hapticSuccess();
				decision = { ...decision, status: 'resolved' };
				onresolved?.(decision.id);
				onclose?.();
			} else {
				hapticError();
				error = 'Failed to resolve decision';
			}
		} catch (err) {
			hapticError();
			error = err instanceof Error ? err.message : 'Failed to resolve decision';
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		hapticLight();
		onclose?.();
	}

	function handleOptionSelect(optionId: string) {
		if (!isPending) return;
		hapticLight();
		selectedOptionId = optionId;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	// Fetch decision when ID changes
	$effect(() => {
		if (decisionId && open) {
			fetchDecision();
		}
	});

	// Reset state when closed
	$effect(() => {
		if (!open) {
			selectedOptionId = null;
			rationale = '';
			error = null;
		}
	});

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div class={styles.overlay()} onclick={handleClose} role="presentation" aria-hidden="true"></div>

	<!-- Panel -->
	<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
	<aside
		class={cn(styles.panel(), className)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="decision-title"
	>
		{#if isLoading}
			<div class="flex-1 flex items-center justify-center">
				<Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
			</div>
		{:else if error && !decision}
			<div class="flex-1 flex flex-col items-center justify-center gap-4 p-4">
				<AlertCircle class="w-12 h-12 text-destructive" />
				<p class="text-sm text-destructive text-center">{error}</p>
				<button
					type="button"
					class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
					onclick={fetchDecision}
				>
					Retry
				</button>
			</div>
		{:else if decision}
			<!-- Header -->
			<header class={styles.header()}>
				<div class="flex items-center gap-3 min-w-0">
					<div class={cn('p-2 rounded-lg', urgencyConfig.bg)}>
						{#if isPending}
							<AlertCircle class={cn('w-5 h-5', urgencyConfig.text)} strokeWidth={2} />
						{:else}
							<CheckCircle2 class="w-5 h-5 text-success" strokeWidth={2} />
						{/if}
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-medium text-primary">{decision.id}</span>
							<span class={cn(styles.badge(), urgencyConfig.badge)}>
								{urgencyConfig.label}
							</span>
						</div>
						<span class="text-xs text-muted-foreground">
							{isPending ? 'Pending' : 'Resolved'}
						</span>
					</div>
				</div>
				<button type="button" class={styles.closeBtn()} onclick={handleClose} aria-label="Close">
					<X class="w-5 h-5" />
				</button>
			</header>

			<!-- Content -->
			<div class={styles.content()}>
				<!-- Prompt -->
				<div class={styles.section()}>
					<h3 class={styles.sectionTitle()}>Decision Request</h3>
					<p id="decision-title" class="text-base font-medium text-foreground">
						{decision.prompt}
					</p>
				</div>

				<!-- Parent Bead Link -->
				{#if decision.parentBead}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Parent Issue</h3>
						<a
							href="/work/{decision.parentBead.id}"
							class="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
						>
							<Link2 class="w-4 h-4 text-muted-foreground" />
							<div class="flex-1 min-w-0">
								<span class="font-mono text-xs text-primary">{decision.parentBead.id}</span>
								<p class="text-sm text-foreground truncate">{decision.parentBead.title}</p>
							</div>
							<ExternalLink
								class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
							/>
						</a>
					</div>
				{/if}

				<!-- Metadata -->
				<div class={styles.section()}>
					<h3 class={styles.sectionTitle()}>Details</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2 text-muted-foreground">
							<User class="w-4 h-4" />
							<span>Requested by: {decision.requestedBy}</span>
						</div>
						<div class="flex items-center gap-2 text-muted-foreground">
							<Clock class="w-4 h-4" />
							<span>{formatRelativeTime(decision.requestedAt)}</span>
						</div>
					</div>
				</div>

				<!-- Options -->
				<div class={styles.section()}>
					<h3 class={styles.sectionTitle()}>Options</h3>
					<div class="space-y-2">
						{#each decision.options as option (option.id)}
							<button
								type="button"
								class={cn(
									'w-full text-left p-3 rounded-lg border transition-colors',
									selectedOptionId === option.id
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-muted-foreground/50',
									!isPending && 'cursor-default'
								)}
								onclick={() => handleOptionSelect(option.id)}
								disabled={!isPending}
							>
								<div class="flex items-start gap-3">
									<div
										class={cn(
											'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
											selectedOptionId === option.id
												? 'border-primary bg-primary'
												: 'border-muted-foreground/50'
										)}
									>
										{#if selectedOptionId === option.id}
											<div class="w-2 h-2 rounded-full bg-primary-foreground"></div>
										{/if}
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<span class="font-medium text-foreground">{option.label}</span>
											{#if option.recommended}
												<span
													class="px-1.5 py-0.5 text-xs rounded bg-success/20 text-success font-medium"
												>
													Recommended
												</span>
											{/if}
										</div>
										{#if option.description}
											<p class="text-sm text-muted-foreground mt-1">{option.description}</p>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Rationale Input (for pending decisions) -->
				{#if isPending}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Rationale (Optional)</h3>
						<div class="relative">
							<MessageSquare
								class="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none"
							/>
							<textarea
								bind:value={rationale}
								placeholder="Explain your decision..."
								class={cn(
									'w-full pl-10 pr-3 py-3 rounded-lg border border-border',
									'bg-background text-foreground placeholder:text-muted-foreground',
									'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
									'resize-none min-h-[100px]'
								)}
								rows="3"
							></textarea>
						</div>
					</div>
				{:else if decision.response?.text}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Response Rationale</h3>
						<p class="text-sm text-foreground/80 whitespace-pre-wrap p-3 rounded-lg bg-muted/50">
							{decision.response.text}
						</p>
						{#if decision.response.resolvedBy}
							<p class="text-xs text-muted-foreground mt-2">
								Resolved by {decision.response.resolvedBy}
								{#if decision.response.resolvedAt}
									- {formatRelativeTime(decision.response.resolvedAt)}
								{/if}
							</p>
						{/if}
					</div>
				{/if}

				<!-- Iteration Chain -->
				{#if chain.length > 1}
					<div class={styles.section()}>
						<h3 class={styles.sectionTitle()}>Decision History</h3>
						<DecisionChain
							{chain}
							currentId={decision.id}
							onSelectItem={(id) => {
								decisionId = id;
								fetchDecision();
							}}
						/>
					</div>
				{/if}

				<!-- Error display -->
				{#if error}
					<div class="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
						<p class="text-sm text-destructive">{error}</p>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			{#if isPending}
				<div class={styles.actions()}>
					<button
						type="button"
						class={cn(
							styles.actionBtn(),
							'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
						)}
						onclick={handleClose}
					>
						Cancel
					</button>
					<button
						type="button"
						class={cn(styles.actionBtn(), 'bg-primary hover:bg-primary/90 text-primary-foreground')}
						onclick={handleSubmit}
						disabled={!canSubmit}
					>
						{#if isSubmitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Submitting...
						{:else}
							<CheckCircle2 class="w-4 h-4" />
							Submit Decision
						{/if}
					</button>
				</div>
			{:else}
				<div class={styles.actions()}>
					<button
						type="button"
						class={cn(
							styles.actionBtn(),
							'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
						)}
						onclick={handleClose}
					>
						Close
					</button>
				</div>
			{/if}
		{/if}
	</aside>
{/if}

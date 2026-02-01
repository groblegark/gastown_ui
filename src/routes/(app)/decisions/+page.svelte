<script lang="ts">
	import {
		cn,
		formatRelativeTime,
		decisionUrgencyConfig,
		type DecisionUrgency
	} from '$lib/utils';
	import { GridPattern } from '$lib/components';
	import { toastStore } from '$lib/stores';
	import { Scale, Check, Loader2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Track which decisions are being resolved
	let resolvingIds = $state<Set<string>>(new Set());
	// Track selected options for each decision
	let selectedOptions = $state<Map<string, string>>(new Map());
	// Track rationale text for each decision
	let rationaleInputs = $state<Map<string, string>>(new Map());

	function getBeadUrl(id: string): string {
		return `bd://show/${id}`;
	}

	function selectOption(decisionId: string, optionId: string) {
		selectedOptions.set(decisionId, optionId);
		selectedOptions = new Map(selectedOptions); // trigger reactivity
	}

	function updateRationale(decisionId: string, value: string) {
		rationaleInputs.set(decisionId, value);
		rationaleInputs = new Map(rationaleInputs); // trigger reactivity
	}

	async function resolveDecision(decisionId: string) {
		const optionId = selectedOptions.get(decisionId);
		if (!optionId) return;

		const rationale = rationaleInputs.get(decisionId)?.trim() || undefined;

		resolvingIds.add(decisionId);
		resolvingIds = new Set(resolvingIds); // trigger reactivity

		try {
			const response = await fetch(`/api/gastown/decisions/${decisionId}/resolve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ optionId, rationale })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to resolve decision');
			}

			toastStore.success(`Decision ${decisionId} resolved successfully`);
			// Reload the page to refresh the list
			window.location.reload();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to resolve decision';
			toastStore.error(message);
			resolvingIds.delete(decisionId);
			resolvingIds = new Set(resolvingIds);
		}
	}

	function formatAgent(agent: string): string {
		const parts = agent.split('/');
		return parts[parts.length - 1];
	}
</script>

<div class="relative min-h-screen bg-background">
	<GridPattern variant="dots" opacity={0.03} />

	<div class="relative z-10 flex flex-col min-h-screen">
		<!-- Header -->
		<header class="sticky top-0 z-50 panel-glass px-4 h-[72px] relative">
			<div class="container h-full flex items-center justify-between lg:pr-44">
				<div class="flex items-center gap-3">
					<div class="w-1.5 h-8 bg-primary rounded-sm shadow-glow shrink-0" aria-hidden="true"></div>
					<div>
						<h1 class="text-2xl font-display font-semibold text-foreground">Decisions</h1>
						<p class="text-sm text-muted-foreground">
							{data.counts.total} pending {data.counts.total === 1 ? 'decision' : 'decisions'}
						</p>
					</div>
				</div>

				<!-- Urgency counts -->
				<div class="flex items-center gap-2">
					{#if data.counts.high > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning"
						>
							{data.counts.high} HIGH
						</span>
					{/if}
					{#if data.counts.medium > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-pending/20 text-status-pending"
						>
							{data.counts.medium} MED
						</span>
					{/if}
					{#if data.counts.low > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted/30 text-muted-foreground"
						>
							{data.counts.low} LOW
						</span>
					{/if}
				</div>
			</div>
			<div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true"></div>
		</header>

		<!-- Main content -->
		<main class="flex-1 container py-6">
			{#if data.error}
				<div class="panel-glass p-8 text-center">
					<p class="font-medium text-destructive">Error loading decisions</p>
					<p class="text-sm text-muted-foreground mt-2">{data.error}</p>
				</div>
			{:else if data.decisions.length === 0}
				<div class="panel-glass p-12 text-center">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
						<Scale class="w-8 h-8 text-success" />
					</div>
					<p class="font-medium text-foreground">No decisions pending</p>
					<p class="text-sm text-muted-foreground mt-2">
						All clear! Decisions will appear here when agents need your input.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.decisions as decision, i}
						{@const config = decisionUrgencyConfig[decision.urgency as DecisionUrgency]}
						{@const isResolving = resolvingIds.has(decision.id)}
						{@const selectedOption = selectedOptions.get(decision.id)}
						<article
							class={cn(
								'panel-glass overflow-hidden animate-blur-fade-up',
								config.border,
								'border-l-4'
							)}
							style="animation-delay: {i * 50}ms"
						>
							<div class="p-4">
								<!-- Header row -->
								<div class="flex items-start justify-between gap-4 mb-3">
									<div class="flex items-center gap-3">
										<!-- Urgency badge -->
										<span
											class={cn(
												'inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-sm',
												config.badge
											)}
										>
											{config.icon}
										</span>

										<div>
											<h2 class="font-medium text-foreground">{decision.prompt}</h2>
											<div class="flex items-center gap-2 mt-0.5">
												<span
													class={cn(
														'text-xs font-medium px-1.5 py-0.5 rounded',
														config.bg,
														config.text
													)}
												>
													{config.label}
												</span>
												<span class="text-xs text-muted-foreground">
													from {formatAgent(decision.requestedBy)}
												</span>
											</div>
										</div>
									</div>

									<!-- Timestamp and ID -->
									<div class="text-right text-sm">
										<p class="text-muted-foreground">{formatRelativeTime(decision.requestedAt)}</p>
										<a
											href={getBeadUrl(decision.id)}
											class="text-xs font-mono text-primary hover:underline"
										>
											{decision.id}
										</a>
									</div>
								</div>

								<!-- Options section -->
								{#if decision.options && decision.options.length > 0}
									<div class={cn('mt-4 p-4 rounded-lg', config.bg)}>
										<p class="text-sm font-medium text-muted-foreground mb-3">
											Select an option:
										</p>

										<div class="space-y-2">
											{#each decision.options as option, optIdx}
												{@const isSelected = selectedOption === option.id}
												<button
													type="button"
													onclick={() => selectOption(decision.id, option.id)}
													disabled={isResolving}
													class={cn(
														'w-full text-left px-4 py-3 rounded-lg border transition-colors',
														'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
														isSelected
															? 'border-primary bg-primary/10'
															: 'bg-background/80 border-border hover:border-primary hover:bg-primary/5',
														isResolving && 'opacity-50 cursor-not-allowed'
													)}
												>
													<div class="flex items-center justify-between">
														<div>
															<span class="text-sm font-medium text-foreground">
																{optIdx + 1}. {option.label}
																{#if option.recommended}
																	<span class="ml-2 text-xs text-primary">(Recommended)</span>
																{/if}
															</span>
															{#if option.description}
																<p class="text-xs text-muted-foreground mt-1">{option.description}</p>
															{/if}
														</div>
														{#if isSelected}
															<Check class="w-5 h-5 text-primary shrink-0" />
														{/if}
													</div>
												</button>
											{/each}
										</div>

										<!-- Rationale textarea - appears when option selected -->
										{#if selectedOption}
											<div class="mt-4">
												<label
													for="rationale-{decision.id}"
													class="block text-sm font-medium text-muted-foreground mb-2"
												>
													Rationale (optional)
												</label>
												<textarea
													id="rationale-{decision.id}"
													rows="3"
													placeholder="Explain your decision..."
													disabled={isResolving}
													value={rationaleInputs.get(decision.id) ?? ''}
													oninput={(e) => updateRationale(decision.id, e.currentTarget.value)}
													class={cn(
														'w-full px-3 py-2 rounded-lg border bg-background/80 text-foreground',
														'placeholder:text-muted-foreground/50',
														'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
														'resize-none transition-colors',
														isResolving && 'opacity-50 cursor-not-allowed'
													)}
												></textarea>
											</div>
										{/if}
									</div>
								{/if}

								<!-- Footer -->
								<div class="flex items-center justify-between mt-4 pt-3 border-t border-border">
									<span class="text-xs text-muted-foreground">
										Requested by {decision.requestedBy}
									</span>

									<div class="flex items-center gap-2">
										<a
											href={getBeadUrl(decision.id)}
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-muted/50 text-muted-foreground hover:bg-muted"
										>
											View Details
										</a>
										<button
											type="button"
											onclick={() => resolveDecision(decision.id)}
											disabled={!selectedOption || isResolving}
											class={cn(
												'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
												selectedOption && !isResolving
													? 'bg-primary text-primary-foreground hover:bg-primary/90'
													: 'bg-muted/30 text-muted-foreground cursor-not-allowed'
											)}
										>
											{#if isResolving}
												<Loader2 class="w-4 h-4 animate-spin" />
												<span>Resolving...</span>
											{:else}
												<Check class="w-4 h-4" />
												<span>Resolve</span>
											{/if}
										</button>
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>

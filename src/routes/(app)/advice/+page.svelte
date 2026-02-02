<script lang="ts">
	import { cn, formatRelativeTime, getPriorityConfig } from '$lib/utils';
	import { GridPattern } from '$lib/components';
	import { Lightbulb, Zap, Search, X } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { getScopeBadgeColor, type Advice } from './+page.server';

	let { data }: { data: PageData } = $props();

	// Filter state
	type ScopeFilter = 'all' | 'Global' | 'Role' | 'Rig' | 'Agent' | 'Custom';
	type StatusFilter = 'all' | 'open' | 'closed';

	let scopeFilter = $state<ScopeFilter>('all');
	let statusFilter = $state<StatusFilter>('open');
	let searchQuery = $state('');

	// Filtered advice
	let filteredAdvice = $derived(
		data.advice.filter((advice: Advice) => {
			// Scope filter
			if (scopeFilter !== 'all' && advice.scope !== scopeFilter) return false;

			// Status filter
			if (statusFilter !== 'all' && advice.status !== statusFilter) return false;

			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesTitle = advice.title.toLowerCase().includes(query);
				const matchesDescription = advice.description.toLowerCase().includes(query);
				const matchesLabels = advice.labels.some((l: string) => l.toLowerCase().includes(query));
				if (!matchesTitle && !matchesDescription && !matchesLabels) return false;
			}

			return true;
		})
	);

	function getBeadUrl(id: string): string {
		return `bd://show/${id}`;
	}

	function clearFilters() {
		scopeFilter = 'all';
		statusFilter = 'open';
		searchQuery = '';
	}

	const scopeOptions: { value: ScopeFilter; label: string }[] = [
		{ value: 'all', label: 'All Scopes' },
		{ value: 'Global', label: 'Global' },
		{ value: 'Role', label: 'Role' },
		{ value: 'Rig', label: 'Rig' },
		{ value: 'Agent', label: 'Agent' },
		{ value: 'Custom', label: 'Custom' }
	];

	const statusOptions: { value: StatusFilter; label: string }[] = [
		{ value: 'open', label: 'Active' },
		{ value: 'closed', label: 'Closed' },
		{ value: 'all', label: 'All' }
	];
</script>

<div class="relative min-h-screen bg-background">
	<GridPattern variant="dots" opacity={0.03} />

	<div class="relative z-10 flex flex-col min-h-screen">
		<!-- Header -->
		<header class="sticky top-0 z-50 panel-glass px-4 h-[72px] relative">
			<div class="container h-full flex items-center justify-between lg:pr-44">
				<div class="flex items-center gap-3">
					<div
						class="w-1.5 h-8 bg-primary rounded-sm shadow-glow shrink-0"
						aria-hidden="true"
					></div>
					<div>
						<h1 class="text-2xl font-display font-semibold text-foreground">Advice</h1>
						<p class="text-sm text-muted-foreground">
							{data.counts.total} active {data.counts.total === 1 ? 'advice' : 'advice items'}
						</p>
					</div>
				</div>

				<!-- Scope counts -->
				<div class="flex items-center gap-2">
					{#if data.counts.global > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400"
						>
							{data.counts.global} Global
						</span>
					{/if}
					{#if data.counts.role > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400"
						>
							{data.counts.role} Role
						</span>
					{/if}
					{#if data.counts.rig > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400"
						>
							{data.counts.rig} Rig
						</span>
					{/if}
					{#if data.counts.agent > 0}
						<span
							class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400"
						>
							{data.counts.agent} Agent
						</span>
					{/if}
				</div>
			</div>
			<div
				class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
				aria-hidden="true"
			></div>
		</header>

		<!-- Main content -->
		<main class="flex-1 container py-6">
			{#if data.error}
				<div class="panel-glass p-8 text-center">
					<p class="font-medium text-destructive">Error loading advice</p>
					<p class="text-sm text-muted-foreground mt-2">{data.error}</p>
				</div>
			{:else}
				<!-- Filter bar -->
				<div class="panel-glass p-4 mb-6">
					<div class="flex flex-wrap items-center gap-4">
						<!-- Search -->
						<div class="relative flex-1 min-w-[200px]">
							<Search
								class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
							/>
							<input
								type="text"
								placeholder="Search advice..."
								bind:value={searchQuery}
								class="w-full pl-9 pr-4 py-2 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>

						<!-- Scope filter -->
						<select
							bind:value={scopeFilter}
							class="px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{#each scopeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>

						<!-- Status filter -->
						<select
							bind:value={statusFilter}
							class="px-3 py-2 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{#each statusOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>

						<!-- Clear filters -->
						{#if scopeFilter !== 'all' || statusFilter !== 'open' || searchQuery}
							<button
								type="button"
								onclick={clearFilters}
								class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
							>
								<X class="w-4 h-4" />
								Clear
							</button>
						{/if}
					</div>
				</div>

				<!-- Results count -->
				{#if filteredAdvice.length !== data.advice.length}
					<p class="text-sm text-muted-foreground mb-4">
						Showing {filteredAdvice.length} of {data.advice.length} advice items
					</p>
				{/if}

				<!-- Advice list -->
				{#if filteredAdvice.length === 0}
					<div class="panel-glass p-12 text-center">
						<div
							class="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center"
						>
							<Lightbulb class="w-8 h-8 text-success" />
						</div>
						{#if data.advice.length === 0}
							<p class="font-medium text-foreground">No advice exists</p>
							<p class="text-sm text-muted-foreground mt-2">
								Advice beads provide dynamic guidance to agents. Create advice using the bd CLI.
							</p>
						{:else}
							<p class="font-medium text-foreground">No matching advice</p>
							<p class="text-sm text-muted-foreground mt-2">
								Try adjusting your filters to see more results.
							</p>
							<button
								type="button"
								onclick={clearFilters}
								class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
							>
								Clear filters
							</button>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredAdvice as advice, i}
							{@const scopeColors = getScopeBadgeColor(advice.scope)}
							{@const priorityConfig = getPriorityConfig(advice.priority)}
							<article
								class={cn(
									'panel-glass overflow-hidden animate-blur-fade-up',
									'border-l-4',
									advice.status === 'closed' ? 'border-l-muted opacity-60' : 'border-l-primary'
								)}
								style="animation-delay: {i * 50}ms"
							>
								<div class="p-4">
									<!-- Header row -->
									<div class="flex items-start justify-between gap-4 mb-3">
										<div class="flex items-center gap-3">
											<!-- Icon -->
											<span
												class={cn(
													'inline-flex items-center justify-center w-8 h-8 rounded-lg',
													advice.hasHook ? 'bg-warning/10' : 'bg-primary/10'
												)}
											>
												{#if advice.hasHook}
													<Zap class="w-4 h-4 text-warning" />
												{:else}
													<Lightbulb class="w-4 h-4 text-primary" />
												{/if}
											</span>

											<div>
												<h2 class="font-medium text-foreground">{advice.title}</h2>
												<div class="flex items-center gap-2 mt-0.5 flex-wrap">
													<!-- Scope badge -->
													<span
														class={cn(
															'text-xs font-medium px-1.5 py-0.5 rounded',
															scopeColors.bg,
															scopeColors.text
														)}
													>
														{advice.scope}
													</span>
													<!-- Priority badge -->
													<span
														class={cn(
															'text-xs font-medium px-1.5 py-0.5 rounded',
															priorityConfig.bg,
															priorityConfig.text
														)}
													>
														P{advice.priority}
													</span>
													<!-- Hook indicator -->
													{#if advice.hasHook}
														<span
															class="text-xs font-medium px-1.5 py-0.5 rounded bg-warning/10 text-warning"
														>
															{advice.hookTrigger || 'hook'}
														</span>
													{/if}
													<!-- Status if closed -->
													{#if advice.status === 'closed'}
														<span
															class="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
														>
															closed
														</span>
													{/if}
												</div>
											</div>
										</div>

										<!-- Timestamp and ID -->
										<div class="text-right text-sm shrink-0">
											<p class="text-muted-foreground">{formatRelativeTime(advice.createdAt)}</p>
											<a
												href={getBeadUrl(advice.id)}
												class="text-xs font-mono text-primary hover:underline"
											>
												{advice.id}
											</a>
										</div>
									</div>

									<!-- Description -->
									{#if advice.description}
										<p class="text-sm text-muted-foreground mb-3 line-clamp-2">
											{advice.description}
										</p>
									{/if}

									<!-- Labels -->
									{#if advice.labels.length > 0}
										<div class="flex flex-wrap gap-1.5 mb-3">
											{#each advice.labels as label}
												<span
													class="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
												>
													{label}
												</span>
											{/each}
										</div>
									{/if}

									<!-- Footer -->
									<div class="flex items-center justify-between pt-3 border-t border-border">
										<span class="text-xs text-muted-foreground">
											Created by {advice.createdBy}
										</span>

										<a
											href={getBeadUrl(advice.id)}
											class={cn(
												'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
												'bg-primary/10 text-primary hover:bg-primary/20'
											)}
										>
											<span>View Details</span>
											<span aria-hidden="true">&rarr;</span>
										</a>
									</div>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			{/if}
		</main>
	</div>
</div>

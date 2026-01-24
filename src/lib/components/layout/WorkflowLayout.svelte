<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn } from '$lib/utils';
	import StatusIndicator from '../core/StatusIndicator.svelte';
	import GridPattern from '../core/GridPattern.svelte';
	import type { Snippet } from 'svelte';

	/**
	 * WorkflowStep variant definitions
	 */
	const stepVariants = tv({
		base: 'flex-shrink-0 w-48 bg-card text-card-foreground border border-border p-4 rounded-lg shadow-sm transition-all duration-200',
		variants: {
			status: {
				pending: 'opacity-50',
				running: 'border-status-online/50 shadow-glow',
				complete: 'border-status-online/30',
				error: 'border-status-offline/50'
			},
			expanded: {
				true: 'w-64',
				false: ''
			}
		},
		defaultVariants: {
			status: 'pending',
			expanded: false
		}
	});

	interface Step {
		id: string;
		name: string;
		status: 'pending' | 'running' | 'complete' | 'error';
		description?: string;
	}

	interface Props {
		title?: string;
		steps?: Step[];
		currentStep?: number;
		class?: string;
		actions?: Snippet;
		details?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		title = 'Workflow',
		steps = [],
		currentStep = 0,
		class: className = '',
		actions,
		details,
		children,
		footer
	}: Props = $props();

	// Map step status to StatusIndicator status
	const statusMap = {
		pending: 'idle',
		running: 'running',
		complete: 'complete',
		error: 'error'
	} as const;

	// Calculate progress percentage
	const progress = $derived(
		steps.length > 0
			? Math.round(
					(steps.filter((s) => s.status === 'complete').length / steps.length) * 100
				)
			: 0
	);
</script>

<div class={cn('relative min-h-screen bg-background', className)}>
	<!-- Grid pattern background -->
	<GridPattern variant="dots" opacity={0.1} />

	<!-- Main content wrapper -->
	<div class="relative z-10 flex flex-col min-h-screen">
		<!-- Header -->
		<header class="sticky top-0 z-50 panel-glass border-b border-border px-4 py-4">
			<div class="container flex items-center justify-between">
				<div>
					<h1 class="text-xl font-semibold text-foreground">{title}</h1>
					<p class="text-sm text-muted-foreground">
						{progress}% complete
						({steps.filter((s) => s.status === 'complete').length}/{steps.length} steps)
					</p>
				</div>
				{#if actions}
					<div class="flex items-center gap-2">
						{@render actions()}
					</div>
				{/if}
			</div>
		</header>

		<!-- Pipeline visualization -->
		<section class="container py-6">
			<div class="overflow-x-auto pb-4">
				<div class="flex items-center gap-2 min-w-max">
					{#each steps as step, index}
						<!-- Step node -->
						<div class={stepVariants({ status: step.status })}>
							<div class="flex items-center gap-2 mb-2">
								<StatusIndicator status={statusMap[step.status]} size="md" />
								<span class="text-xs text-muted-foreground">Step {index + 1}</span>
							</div>
							<h3 class="font-medium text-foreground text-sm">{step.name}</h3>
							{#if step.description}
								<p class="text-xs text-muted-foreground mt-1 line-clamp-2">
									{step.description}
								</p>
							{/if}
						</div>

						<!-- Connector line (except after last step) -->
						{#if index < steps.length - 1}
							<div
								class="flex-shrink-0 w-8 h-0.5 bg-border"
								class:bg-status-online={step.status === 'complete'}
							></div>
						{/if}
					{/each}
				</div>
			</div>
		</section>

		<!-- Step details section -->
		{#if details}
			<section class="container pb-6">
				<div class="panel-glass p-4">
					{@render details()}
				</div>
			</section>
		{/if}

		<!-- Main content slot -->
		{#if children}
			<main class="flex-1 container pb-6">
				{@render children()}
			</main>
		{/if}

		<!-- Footer slot -->
		{#if footer}
			<footer class="mt-auto border-t border-border px-4 py-3">
				<div class="container">
					{@render footer()}
				</div>
			</footer>
		{/if}
	</div>
</div>

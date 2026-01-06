<script lang="ts">
	import { cn } from '$lib/utils';
	import GridPattern from './GridPattern.svelte';
	import StatusIndicator from './StatusIndicator.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		systemStatus?: 'running' | 'idle' | 'error' | 'warning';
		class?: string;
		stats?: Snippet;
		agents?: Snippet;
		activity?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		title = 'Gas Town',
		systemStatus = 'running',
		class: className = '',
		stats,
		agents,
		activity,
		children,
		footer
	}: Props = $props();
</script>

<div class={cn('relative min-h-screen bg-background', className)}>
	<!-- Grid pattern background -->
	<GridPattern variant="dots" opacity={0.15} />

	<!-- Main content wrapper -->
	<div class="relative z-10 flex flex-col min-h-screen">
		<!-- Header -->
		<header class="sticky top-0 z-50 panel-glass border-b border-border px-4 py-3">
			<div class="container flex items-center justify-between gap-4">
				<!-- Branding with accent bar -->
				<div class="flex items-center gap-3">
					<!-- Logo accent bar with glow -->
					<div class="w-2 h-8 bg-primary rounded-sm shadow-glow" aria-hidden="true"></div>
					<h1 class="text-xl font-bold uppercase tracking-wider text-foreground">{title}</h1>
				</div>

				<!-- Connection status pill -->
				<div class="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border">
					<!-- Animated pulse dot -->
					<span
						class="w-2 h-2 rounded-full bg-primary animate-pulse"
						aria-hidden="true"
					></span>
					<span class="text-[10px] font-bold text-primary uppercase tracking-wider">
						{systemStatus === 'running' ? 'Connected' : systemStatus === 'error' ? 'Disconnected' : systemStatus}
					</span>
				</div>
			</div>
		</header>

		<!-- Main content area -->
		<main class="flex-1 container py-6 space-y-6">
			<!-- Stats section -->
			{#if stats}
				<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{@render stats()}
				</section>
			{/if}

			<!-- Agent grid -->
			{#if agents}
				<section class="space-y-4">
					<h2 class="text-lg font-medium text-foreground">Agents</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{@render agents()}
					</div>
				</section>
			{/if}

			<!-- Activity feed -->
			{#if activity}
				<section class="space-y-4">
					<h2 class="text-lg font-medium text-foreground">Recent Activity</h2>
					<div class="panel-glass divide-y divide-border overflow-hidden">
						{@render activity()}
					</div>
				</section>
			{/if}

			<!-- Default slot for custom content -->
			{#if children}
				{@render children()}
			{/if}
		</main>

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

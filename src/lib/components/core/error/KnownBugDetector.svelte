<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { AlertTriangle, Info, X, ExternalLink } from 'lucide-svelte';

	interface KnownBug {
		id: string;
		pattern: RegExp | string;
		title: string;
		description: string;
		workaround?: string;
		solution?: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		tracking?: string; // Issue tracker URL
		affectedVersions?: string[];
	}

	interface DetectedBug extends KnownBug {
		detectedAt: Date;
		errorMessage: string;
	}

	interface Props {
		/** Additional classes */
		class?: string;
		/** Auto-dismiss after N milliseconds (0 = no auto-dismiss) */
		autoDismiss?: number;
		/** Show close button */
		closeable?: boolean;
	}

	let {
		class: className = '',
		autoDismiss = 0,
		closeable = true
	}: Props = $props();

	// Known bugs database
	const knownBugs: KnownBug[] = [
		{
			id: 'witness-restart-loop',
			pattern: /witness.*restart.*loop|witness.*crash/i,
			title: 'Witness Restart Loop',
			description: 'Witness agent is stuck in a restart loop, causing degraded mode.',
			workaround: 'Manually stop and restart the witness agent from the Agents page.',
			solution: 'Fixed in next release. Upgrade when available.',
			severity: 'high',
			tracking: 'https://github.com/gastown/issues/1234',
			affectedVersions: ['0.1.0', '0.1.1']
		},
		{
			id: 'convoy-stall',
			pattern: /convoy.*stall|convoy.*blocked/i,
			title: 'Convoy Processing Stall',
			description: 'Convoy operations may stall if dependencies are circular.',
			workaround: 'Check convoy dependencies with "bd show <convoy-id>" and break circular dependencies.',
			severity: 'medium'
		},
		{
			id: 'refinery-merge-conflict',
			pattern: /refinery.*merge.*conflict|merge.*queue.*stuck/i,
			title: 'Refinery Merge Queue Stuck',
			description: 'Merge queue may get stuck on conflicting branches.',
			workaround: 'Manually rebase the stuck branch or use "gt done --force" to skip the queue.',
			solution: 'Automatic conflict detection coming soon.',
			severity: 'high'
		},
		{
			id: 'api-timeout',
			pattern: /timeout|ECONNABORTED|network.*error/i,
			title: 'API Request Timeout',
			description: 'API requests timing out due to backend load.',
			workaround: 'Refresh the page or wait a few seconds before retrying.',
			severity: 'low'
		},
		{
			id: 'beads-sync-fail',
			pattern: /beads.*sync.*fail|bd sync.*error/i,
			title: 'Beads Sync Failure',
			description: 'Beads synchronization failing between local and remote.',
			workaround: 'Run "bd sync --force" to force synchronization, or check network connectivity.',
			severity: 'medium',
			tracking: 'https://github.com/gastown/issues/5678'
		}
	];

	// State
	let detectedBugs = $state<DetectedBug[]>([]);
	let dismissedBugs = $state<Set<string>>(new Set());
	let mounted = $state(false);

	// Active bugs (not dismissed)
	const activeBugs = $derived(
		detectedBugs.filter((bug) => !dismissedBugs.has(bug.id))
	);

	/**
	 * Check if an error message matches any known bug pattern
	 */
	function detectKnownBug(errorMessage: string): KnownBug | null {
		for (const bug of knownBugs) {
			const pattern = typeof bug.pattern === 'string'
				? new RegExp(bug.pattern, 'i')
				: bug.pattern;

			if (pattern.test(errorMessage)) {
				return bug;
			}
		}
		return null;
	}

	/**
	 * Add a detected bug to the list
	 */
	function addDetectedBug(bug: KnownBug, errorMessage: string) {
		// Check if already detected
		const existing = detectedBugs.find((b) => b.id === bug.id);
		if (existing) {
			return; // Already detected
		}

		const detected: DetectedBug = {
			...bug,
			detectedAt: new Date(),
			errorMessage
		};

		detectedBugs = [...detectedBugs, detected];

		// Auto-dismiss if configured
		if (autoDismiss > 0) {
			setTimeout(() => {
				dismissBug(bug.id);
			}, autoDismiss);
		}
	}

	/**
	 * Dismiss a bug notification
	 */
	function dismissBug(bugId: string) {
		dismissedBugs = new Set([...dismissedBugs, bugId]);
	}

	/**
	 * Global error handler to detect known bugs
	 */
	function handleGlobalError(event: ErrorEvent) {
		const errorMessage = event.message || event.error?.message || '';
		const knownBug = detectKnownBug(errorMessage);

		if (knownBug) {
			addDetectedBug(knownBug, errorMessage);
		}
	}

	/**
	 * Handle unhandled promise rejections
	 */
	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		const errorMessage = event.reason?.message || String(event.reason) || '';
		const knownBug = detectKnownBug(errorMessage);

		if (knownBug) {
			addDetectedBug(knownBug, errorMessage);
		}
	}

	/**
	 * Expose API for programmatic detection
	 */
	export function checkError(errorMessage: string): boolean {
		const knownBug = detectKnownBug(errorMessage);
		if (knownBug) {
			addDetectedBug(knownBug, errorMessage);
			return true;
		}
		return false;
	}

	/**
	 * Get severity color
	 */
	function getSeverityColor(severity: KnownBug['severity']): string {
		switch (severity) {
			case 'critical':
				return 'border-destructive/50 bg-destructive/5';
			case 'high':
				return 'border-warning/50 bg-warning/5';
			case 'medium':
				return 'border-info/50 bg-info/5';
			case 'low':
				return 'border-muted-foreground/30 bg-muted/20';
			default:
				return 'border-border bg-background';
		}
	}

	/**
	 * Get severity text color
	 */
	function getSeverityTextColor(severity: KnownBug['severity']): string {
		switch (severity) {
			case 'critical':
				return 'text-destructive';
			case 'high':
				return 'text-warning';
			case 'medium':
				return 'text-info';
			case 'low':
				return 'text-muted-foreground';
			default:
				return 'text-foreground';
		}
	}

	onMount(() => {
		mounted = true;

		// Register global error handlers
		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});
</script>

<!--
	Known Bug Detector Component

	Automatically detects known bugs by monitoring errors and displays
	helpful information about workarounds and solutions.

	Features:
	- Pattern matching for known error messages
	- Severity levels (low/medium/high/critical)
	- Workarounds and solutions
	- Issue tracker links
	- Dismissible notifications
	- Auto-dismiss support
-->

{#if mounted && activeBugs.length > 0}
	<div class={cn('fixed bottom-4 right-4 z-50 space-y-3 max-w-md', className)}>
		{#each activeBugs as bug}
			<div
				class={cn(
					'panel-glass rounded-lg p-4 border-2 animate-blur-fade-up shadow-lg',
					getSeverityColor(bug.severity)
				)}
				role="alert"
				aria-live="polite"
			>
				<!-- Header -->
				<div class="flex items-start justify-between mb-2">
					<div class="flex items-center gap-2">
						<AlertTriangle
							class={cn('w-5 h-5 shrink-0', getSeverityTextColor(bug.severity))}
							aria-hidden="true"
						/>
						<div>
							<h3 class={cn('text-sm font-semibold', getSeverityTextColor(bug.severity))}>
								Known Issue
							</h3>
							<p class="text-xs text-muted-foreground uppercase tracking-wide">
								{bug.severity} severity
							</p>
						</div>
					</div>

					{#if closeable}
						<button
							type="button"
							onclick={() => dismissBug(bug.id)}
							class={cn(
								'p-1 -m-1 text-muted-foreground hover:text-foreground',
								'transition-colors rounded focus-ring'
							)}
							aria-label="Dismiss notification"
						>
							<X class="w-4 h-4" aria-hidden="true" />
						</button>
					{/if}
				</div>

				<!-- Bug Title -->
				<h4 class="text-sm font-medium text-foreground mb-1">{bug.title}</h4>

				<!-- Description -->
				<p class="text-sm text-muted-foreground mb-3">{bug.description}</p>

				<!-- Workaround -->
				{#if bug.workaround}
					<div class="mb-3 p-2 rounded bg-muted/30 border border-border/50">
						<div class="flex items-start gap-2">
							<Info class="w-4 h-4 text-info shrink-0 mt-0.5" aria-hidden="true" />
							<div>
								<p class="text-xs font-medium text-foreground mb-1">Workaround</p>
								<p class="text-xs text-muted-foreground">{bug.workaround}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Solution -->
				{#if bug.solution}
					<p class="text-xs text-success mb-2">
						<span class="font-medium">Solution:</span>
						{bug.solution}
					</p>
				{/if}

				<!-- Tracking Link -->
				{#if bug.tracking}
					<a
						href={bug.tracking}
						target="_blank"
						rel="noopener noreferrer"
						class={cn(
							'inline-flex items-center gap-1 text-xs text-primary hover:underline',
							'focus-ring rounded'
						)}
					>
						View issue tracker
						<ExternalLink class="w-3 h-3" aria-hidden="true" />
					</a>
				{/if}
			</div>
		{/each}
	</div>
{/if}

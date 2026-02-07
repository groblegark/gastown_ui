<script module lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * GuidanceModal - Modal for providing iteration guidance on a pending decision
	 * Centered modal with textarea for feedback that gets sent to the agent.
	 */
	export const guidanceModalVariants = tv({
		slots: {
			overlay: [
				'fixed inset-0 bg-background/80 backdrop-blur-sm z-40',
				'transition-opacity duration-normal'
			].join(' '),
			panel: [
				'fixed inset-0 z-50',
				'flex items-center justify-center',
				'p-4'
			].join(' '),
			card: [
				'w-full max-w-md',
				'bg-background border border-border rounded-xl',
				'shadow-elevation-4',
				'flex flex-col',
				'max-h-[85vh]'
			].join(' '),
			header: [
				'flex items-center justify-between gap-3',
				'p-4 border-b border-border'
			].join(' '),
			closeBtn: [
				'p-2 rounded-lg',
				'text-muted-foreground hover:text-foreground',
				'hover:bg-muted/50',
				'transition-colors touch-target'
			].join(' '),
			content: 'flex-1 overflow-y-auto p-4 space-y-4',
			actions: [
				'flex gap-2 p-4 border-t border-border'
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
					panel: 'pointer-events-auto'
				},
				false: {
					overlay: 'opacity-0 pointer-events-none',
					panel: 'pointer-events-none'
				}
			}
		},
		defaultVariants: {
			open: false
		}
	});

	export interface GuidanceModalProps {
		decision: {
			id: string;
			prompt: string;
		};
		/** Current iteration number in the decision chain */
		iterationCount?: number;
		open?: boolean;
		onclose?: () => void;
		onsubmit?: (text: string) => Promise<void>;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '$lib/utils/haptics';
	import { onMount } from 'svelte';
	import { X, MessageSquare, Loader2, Send } from 'lucide-svelte';

	const MIN_CHARS = 10;
	const MAX_CHARS = 2000;

	let {
		decision,
		iterationCount = 1,
		open = false,
		onclose,
		onsubmit
	}: GuidanceModalProps = $props();

	let guidanceText = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	const styles = $derived(guidanceModalVariants({ open }));
	const charCount = $derived(guidanceText.length);
	const canSubmit = $derived(charCount >= MIN_CHARS && charCount <= MAX_CHARS && !isSubmitting);

	async function handleSubmit() {
		if (!canSubmit || !onsubmit) return;

		isSubmitting = true;
		error = null;
		hapticMedium();

		try {
			await onsubmit(guidanceText.trim());
			hapticSuccess();
			guidanceText = '';
		} catch (err) {
			hapticError();
			error = err instanceof Error ? err.message : 'Failed to submit guidance';
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (isSubmitting) return;
		hapticLight();
		onclose?.();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	// Auto-focus textarea when opened
	$effect(() => {
		if (open && textareaRef) {
			// Delay to ensure DOM is ready
			setTimeout(() => textareaRef?.focus(), 50);
		}
	});

	// Reset state when closed
	$effect(() => {
		if (!open) {
			guidanceText = '';
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

	<!-- Centering container -->
	<div class={styles.panel()} role="presentation">
		<!-- Modal card -->
		<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
		<div
			class={styles.card()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="guidance-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => { if (e.key === 'Escape') handleClose(); }}
		>
			<!-- Header -->
			<header class={styles.header()}>
				<div class="flex items-center gap-2 min-w-0">
					<MessageSquare class="w-5 h-5 text-primary flex-shrink-0" />
					<h2 id="guidance-title" class="text-sm font-semibold text-foreground truncate">
						Provide Guidance
					</h2>
				</div>
				<button type="button" class={styles.closeBtn()} onclick={handleClose} aria-label="Close">
					<X class="w-5 h-5" />
				</button>
			</header>

			<!-- Content -->
			<div class={styles.content()}>
				<!-- Decision context -->
				<div class="space-y-1">
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Decision Request
					</p>
					<p class="text-sm text-foreground/80 line-clamp-3">{decision.prompt}</p>
				</div>

				<!-- Iteration indicator -->
				{#if iterationCount > 1}
					<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
						<span class="text-xs text-muted-foreground">
							Iteration {iterationCount} of this decision
						</span>
					</div>
				{/if}

				<!-- Guidance textarea -->
				<div class="space-y-1.5">
					<label for="guidance-input" class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Your Guidance
					</label>
					<textarea
						id="guidance-input"
						bind:this={textareaRef}
						bind:value={guidanceText}
						placeholder="Tell the agent how to refine this decision..."
						maxlength={MAX_CHARS}
						class={cn(
							'w-full px-3 py-3 rounded-lg border border-border',
							'bg-background text-foreground placeholder:text-muted-foreground',
							'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
							'resize-none min-h-[120px]'
						)}
						rows="4"
						disabled={isSubmitting}
					></textarea>
					<div class="flex justify-between items-center">
						<span class={cn(
							'text-xs',
							charCount < MIN_CHARS ? 'text-muted-foreground' : charCount > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'
						)}>
							{#if charCount < MIN_CHARS}
								{MIN_CHARS - charCount} more characters needed
							{:else}
								{charCount}/{MAX_CHARS}
							{/if}
						</span>
					</div>
				</div>

				<!-- Error display -->
				{#if error}
					<div class="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
						<p class="text-sm text-destructive">{error}</p>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class={styles.actions()}>
				<button
					type="button"
					class={cn(
						styles.actionBtn(),
						'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
					)}
					onclick={handleClose}
					disabled={isSubmitting}
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
						Sending...
					{:else}
						<Send class="w-4 h-4" />
						Send Guidance
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

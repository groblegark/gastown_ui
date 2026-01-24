<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * CopyCliButton variant definitions using tailwind-variants
	 *
	 * Variants:
	 * - icon: Compact icon-only button
	 * - full: Full width button with command preview
	 * - inline: Inline button that fits within text flow
	 */
	export const copyCliButtonVariants = tv({
		base: [
			'inline-flex items-center gap-2',
			'font-mono text-sm',
			'rounded-md',
			'transition-all duration-200 ease-out',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			'disabled:pointer-events-none disabled:opacity-50'
		],
		variants: {
			variant: {
				icon: [
					'justify-center',
					'h-8 w-8 p-0',
					'bg-muted/50 text-muted-foreground',
					'hover:bg-muted hover:text-foreground',
					'active:bg-muted/80'
				],
				full: [
					'justify-between',
					'w-full px-3 py-2',
					'border border-input bg-background',
					'hover:bg-accent hover:border-accent-foreground/20',
					'active:bg-accent/80'
				],
				inline: [
					'justify-center',
					'h-6 px-1.5',
					'text-xs',
					'bg-transparent text-muted-foreground',
					'hover:text-foreground hover:bg-muted/50',
					'active:bg-muted/30'
				]
			}
		},
		defaultVariants: {
			variant: 'icon'
		}
	});

	export type CopyCliButtonVariants = VariantProps<typeof copyCliButtonVariants>;

	export interface CopyCliButtonProps {
		/** The CLI command to copy */
		command: string;
		/** Button variant */
		variant?: CopyCliButtonVariants['variant'];
		/** Additional CSS classes */
		class?: string;
		/** Accessible label override */
		'aria-label'?: string;
		/** Whether to show the copied state feedback */
		showFeedback?: boolean;
		/** Callback when copy succeeds */
		onCopy?: () => void;
		/** Callback when copy fails */
		onError?: (error: Error) => void;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { copy } from '$lib/utils/clipboard';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { hapticSuccess } from '$lib/utils/haptics';
	import { Check, Copy, ClipboardCopy } from 'lucide-svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, keyof CopyCliButtonProps>, CopyCliButtonProps {}

	let {
		command,
		variant = 'icon',
		class: className = '',
		'aria-label': ariaLabelProp,
		showFeedback = true,
		onCopy,
		onError,
		disabled = false,
		...restProps
	}: Props = $props();

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	const ariaLabel = $derived(ariaLabelProp ?? `Copy command: ${command}`);
	const buttonLabel = $derived(copied ? 'Copied!' : 'Copy');

	async function handleCopy() {
		if (disabled || copied) return;

		try {
			const success = await copy(command);

			if (success) {
				copied = true;
				hapticSuccess();

				if (showFeedback) {
					toastStore.success('Copied to clipboard');
				}

				onCopy?.();

				// Clear previous timeout if exists
				if (copyTimeout) {
					clearTimeout(copyTimeout);
				}

				// Reset copied state after 2 seconds
				copyTimeout = setTimeout(() => {
					copied = false;
					copyTimeout = null;
				}, 2000);
			} else {
				throw new Error('Copy failed');
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to copy');

			if (showFeedback) {
				toastStore.error('Failed to copy to clipboard');
			}

			onError?.(error);
		}
	}
</script>

<button
	type="button"
	class={cn(copyCliButtonVariants({ variant }), className)}
	onclick={handleCopy}
	{disabled}
	aria-label={ariaLabel}
	title={variant === 'icon' ? command : undefined}
	{...restProps}
>
	{#if variant === 'icon'}
		{#if copied}
			<Check class="h-4 w-4 text-green-500" aria-hidden="true" />
		{:else}
			<Copy class="h-4 w-4" aria-hidden="true" />
		{/if}
	{:else if variant === 'full'}
		<code class="flex-1 truncate text-left text-muted-foreground">
			{command}
		</code>
		<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
			{#if copied}
				<Check class="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
				<span class="text-green-500">Copied!</span>
			{:else}
				<ClipboardCopy class="h-3.5 w-3.5" aria-hidden="true" />
				<span>Copy</span>
			{/if}
		</span>
	{:else}
		<!-- inline variant -->
		{#if copied}
			<Check class="h-3 w-3 text-green-500" aria-hidden="true" />
		{:else}
			<Copy class="h-3 w-3" aria-hidden="true" />
		{/if}
	{/if}
</button>

<script lang="ts">
	/**
	 * TouchTarget Component
	 *
	 * Ensures minimum 44x44px touch target size per WCAG 2.5.5 (AAA: 48px).
	 * Wraps interactive elements to guarantee accessibility on mobile.
	 *
	 * Usage:
	 * ```svelte
	 * <TouchTarget onclick={handleClick}>
	 *   <Icon />
	 * </TouchTarget>
	 *
	 * <TouchTarget as="a" href="/page">
	 *   Link Text
	 * </TouchTarget>
	 * ```
	 */
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type ElementType = 'button' | 'a' | 'div';

	interface Props {
		as?: ElementType;
		children: Snippet;
		onclick?: (event: MouseEvent) => void;
		href?: string;
		disabled?: boolean;
		class?: string;
		'aria-label'?: string;
	}

	let {
		as = 'button',
		children,
		onclick,
		href,
		disabled = false,
		class: className = '',
		'aria-label': ariaLabel
	}: Props = $props();

	const baseClasses = [
		'min-w-[44px] min-h-[44px]',
		'inline-flex items-center justify-center',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		'active:scale-95 transition-transform duration-75',
		'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100'
	].join(' ');
</script>

{#if as === 'a'}
	<a
		{href}
		class={cn(baseClasses, className)}
		aria-label={ariaLabel}
		onclick={onclick}
	>
		{@render children()}
	</a>
{:else if as === 'div'}
	<div
		role="button"
		tabindex={disabled ? -1 : 0}
		class={cn(baseClasses, disabled && 'opacity-50 cursor-not-allowed', className)}
		aria-label={ariaLabel}
		aria-disabled={disabled}
		onclick={disabled ? undefined : onclick}
		onkeydown={(e) => {
			if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onclick?.(e as unknown as MouseEvent);
			}
		}}
	>
		{@render children()}
	</div>
{:else}
	<button
		type="button"
		{disabled}
		class={cn(baseClasses, className)}
		aria-label={ariaLabel}
		{onclick}
	>
		{@render children()}
	</button>
{/if}

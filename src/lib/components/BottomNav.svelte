<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { cn } from '$lib/utils';
	import { X, MoreHorizontal } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	/**
	 * Navigation item variant definitions
	 * Dark industrial aesthetic with glow effects
	 */
	const navItemVariants = tv({
		base: [
			'flex flex-col items-center justify-center gap-1',
			'min-w-[64px] min-h-[44px] py-2 px-3',
			'transition-all duration-200'
		],
		variants: {
			active: {
				true: 'text-gas-primary shadow-[0_0_10px_#00dba8]',
				false: 'text-muted-foreground hover:text-foreground'
			}
		},
		defaultVariants: {
			active: false
		}
	});

	/**
	 * Active indicator with glow effect
	 */
	const activeIndicatorClass = [
		'absolute bottom-0 left-1/2 -translate-x-1/2',
		'w-10 h-1 rounded-full',
		'bg-gas-primary',
		'shadow-[0_0_10px_hsl(var(--gas-primary))]'
	].join(' ');

	interface NavItem {
		id: string;
		label: string;
		href?: string;
		icon?: ComponentType;
		badge?: number | string;
	}

	interface Props {
		items?: NavItem[];
		activeId?: string;
		maxVisible?: number;
		class?: string;
	}

	let {
		items = [],
		activeId = '',
		maxVisible = 5,
		class: className = ''
	}: Props = $props();

	// State for overflow menu
	let showOverflow = $state(false);

	// Split items into visible and overflow
	const visibleItems = $derived(items.slice(0, maxVisible - 1));
	const overflowItems = $derived(items.slice(maxVisible - 1));
	const hasOverflow = $derived(items.length > maxVisible);

	// Check if active item is in overflow
	const activeInOverflow = $derived(overflowItems.some(item => item.id === activeId));

	// Trigger haptic feedback where supported
	function triggerHaptic() {
		if ('vibrate' in navigator) {
			navigator.vibrate(10);
		}
	}

	function toggleOverflow() {
		triggerHaptic();
		showOverflow = !showOverflow;
	}

	function closeOverflow() {
		showOverflow = false;
	}
</script>

<!-- Overflow backdrop -->
{#if showOverflow}
	<button
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
		onclick={closeOverflow}
		aria-label="Close navigation menu"
	></button>
{/if}

<!-- Overflow panel -->
{#if showOverflow}
	<div
		class="fixed bottom-16 left-0 right-0 z-50 pb-safe px-safe animate-in slide-in-from-bottom duration-200"
		role="menu"
		aria-label="Additional navigation options"
	>
		<div class="bg-gas-surface/95 backdrop-blur-md border border-gas-border rounded-t-xl mx-2 mb-2 p-2 max-h-[60vh] overflow-y-auto">
			<div class="grid grid-cols-4 gap-1" role="none">
				{#each overflowItems as item}
					{@const isActive = item.id === activeId}
					<a
						href={item.href ?? '#'}
						class={cn(navItemVariants({ active: isActive }), 'relative rounded-lg')}
						role="menuitem"
						aria-current={isActive ? 'page' : undefined}
						onclick={() => { triggerHaptic(); closeOverflow(); }}
					>
						<span class="relative">
							{#if item.icon}
								<span class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
									<item.icon size={20} strokeWidth={2} />
								</span>
							{:else}
								<span class="w-6 h-6 rounded-full bg-current opacity-20" aria-hidden="true"></span>
							{/if}
							{#if item.badge}
								<span
									class="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-destructive rounded-full flex items-center justify-center"
									aria-label="{item.badge} notifications"
								>
									{typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
								</span>
							{/if}
						</span>
						<span class="text-2xs font-medium uppercase tracking-wider">{item.label}</span>
						{#if isActive}
							<span class={activeIndicatorClass} aria-hidden="true"></span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

<nav
	class={cn(
		'fixed bottom-0 left-0 right-0 z-50',
		'bg-gas-surface/90 backdrop-blur-md',
		'border-t border-gas-border',
		'pb-safe px-safe',
		className
	)}
	aria-label="Bottom navigation"
>
	<div class="flex items-center justify-around max-w-lg mx-auto">
		{#if hasOverflow}
			<!-- Show visible items + More button -->
			{#each visibleItems as item}
				{@const isActive = item.id === activeId}
				<a
					href={item.href ?? '#'}
					class={cn(navItemVariants({ active: isActive }), 'relative')}
					aria-current={isActive ? 'page' : undefined}
					onclick={triggerHaptic}
				>
					<span class="relative">
						{#if item.icon}
							<span class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
								<item.icon size={20} strokeWidth={2} />
							</span>
						{:else}
							<span class="w-6 h-6 rounded-full bg-current opacity-20" aria-hidden="true"></span>
						{/if}
						{#if item.badge}
							<span
								class="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-destructive rounded-full flex items-center justify-center"
								aria-label="{item.badge} notifications"
							>
								{typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
							</span>
						{/if}
					</span>
					<span class="text-2xs font-medium uppercase tracking-wider">{item.label}</span>
					{#if isActive}
						<span class={activeIndicatorClass} aria-hidden="true"></span>
					{/if}
				</a>
			{/each}
			<!-- More button -->
			<button
				class={cn(navItemVariants({ active: activeInOverflow || showOverflow }), 'relative')}
				onclick={toggleOverflow}
				aria-expanded={showOverflow}
				aria-haspopup="true"
				aria-label="More navigation options"
			>
				<span class="relative">
					<span class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
						{#if showOverflow}
							<X size={20} strokeWidth={2} />
						{:else}
							<MoreHorizontal size={20} strokeWidth={2} />
						{/if}
					</span>
					{#if activeInOverflow && !showOverflow}
						<span
							class="absolute -top-1 -right-2 w-2 h-2 bg-gas-primary rounded-full"
							aria-hidden="true"
						></span>
					{/if}
				</span>
				<span class="text-2xs font-medium uppercase tracking-wider">More</span>
				{#if showOverflow}
					<span class={activeIndicatorClass} aria-hidden="true"></span>
				{/if}
			</button>
		{:else}
			<!-- Show all items when no overflow needed -->
			{#each items as item}
				{@const isActive = item.id === activeId}
				<a
					href={item.href ?? '#'}
					class={cn(navItemVariants({ active: isActive }), 'relative')}
					aria-current={isActive ? 'page' : undefined}
					onclick={triggerHaptic}
				>
					<span class="relative">
						{#if item.icon}
							<span class="w-6 h-6 flex items-center justify-center" aria-hidden="true">
								<item.icon size={20} strokeWidth={2} />
							</span>
						{:else}
							<span class="w-6 h-6 rounded-full bg-current opacity-20" aria-hidden="true"></span>
						{/if}
						{#if item.badge}
							<span
								class="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-destructive rounded-full flex items-center justify-center"
								aria-label="{item.badge} notifications"
							>
								{typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
							</span>
						{/if}
					</span>
					<span class="text-2xs font-medium uppercase tracking-wider">{item.label}</span>
					{#if isActive}
						<span class={activeIndicatorClass} aria-hidden="true"></span>
					{/if}
				</a>
			{/each}
		{/if}
	</div>
</nav>

<!-- Spacer to prevent content overlap -->
<div class="h-16 pb-safe" aria-hidden="true"></div>

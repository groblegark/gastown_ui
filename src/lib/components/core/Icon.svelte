<script lang="ts">
	/**
	 * Icon Wrapper Component
	 *
	 * Provides consistent sizing and styling for Lucide icons.
	 * Standard sizes: sm=16, md=20, lg=24
	 *
	 * @example
	 * <Icon icon={Home} size="md" />
	 * <Icon icon={Search} size="sm" class="text-muted-foreground" />
	 */
	import { cn } from '$lib/utils';
	import type { ComponentType } from 'svelte';

	type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		/** Lucide icon component */
		icon: ComponentType;
		/** Size variant */
		size?: IconSize;
		/** Additional CSS classes */
		class?: string;
		/** Stroke width (default: 2) */
		strokeWidth?: number;
		/** Accessible label */
		'aria-label'?: string;
	}

	let {
		icon: IconComponent,
		size = 'md',
		class: className = '',
		strokeWidth = 2,
		'aria-label': ariaLabel
	}: Props = $props();

	const sizeMap: Record<IconSize, number> = {
		xs: 12,
		sm: 16,
		md: 20,
		lg: 24,
		xl: 32
	};

	const sizeClasses: Record<IconSize, string> = {
		xs: 'w-3 h-3',
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6',
		xl: 'w-8 h-8'
	};
</script>

<IconComponent
	size={sizeMap[size]}
	{strokeWidth}
	class={cn(sizeClasses[size], 'flex-shrink-0', className)}
	aria-hidden={!ariaLabel}
	aria-label={ariaLabel}
/>

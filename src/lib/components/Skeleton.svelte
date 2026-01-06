<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn } from '$lib/utils';

	/**
	 * Skeleton loading variant definitions using tailwind-variants
	 *
	 * Design tokens used:
	 * - Animation: 1.5s shimmer, 50ms stagger delay
	 * - Shapes: match actual content layout exactly
	 *
	 * Uses shimmer-effect class for GPU-accelerated animation (transform instead of backgroundPosition)
	 */
	const skeletonVariants = tv({
		base: 'shimmer-effect motion-reduce:bg-muted/80 motion-reduce:[&::after]:hidden',
		variants: {
			type: {
				// Text variants
				text: 'h-4 rounded',
				'text-sm': 'h-3 rounded',
				'text-lg': 'h-5 rounded',
				title: 'h-6 rounded',
				'title-lg': 'h-8 rounded',
				subtitle: 'h-5 rounded',
				paragraph: 'h-4 rounded',

				// Avatar variants (match StatusIndicator sizes)
				avatar: 'h-10 w-10 rounded-full',
				'avatar-xs': 'h-6 w-6 rounded-full',
				'avatar-sm': 'h-8 w-8 rounded-full',
				'avatar-lg': 'h-12 w-12 rounded-full',
				'avatar-xl': 'h-14 w-14 rounded-full',

				// Icon variants (match Lucide icon containers)
				icon: 'h-5 w-5 rounded',
				'icon-sm': 'h-4 w-4 rounded',
				'icon-lg': 'h-6 w-6 rounded',
				'icon-hero': 'h-14 w-14 rounded-2xl',

				// UI element variants
				card: 'h-32 rounded-lg',
				button: 'h-10 rounded-md min-h-touch',
				'button-sm': 'h-8 rounded-md',
				badge: 'h-6 w-16 rounded-full',
				'badge-sm': 'h-5 w-12 rounded-full',
				'badge-dot': 'h-1.5 w-1.5 rounded-full',

				// Progress bar
				progress: 'h-1 rounded-full',
				'progress-md': 'h-2 rounded-full',

				// Image placeholders
				thumbnail: 'aspect-square rounded-lg',
				banner: 'aspect-video rounded-lg'
			},
			width: {
				full: 'w-full',
				'3/4': 'w-3/4',
				'2/3': 'w-2/3',
				'1/2': 'w-1/2',
				'1/3': 'w-1/3',
				'1/4': 'w-1/4',
				'1/5': 'w-1/5',
				auto: 'w-auto'
			}
		},
		defaultVariants: {
			type: 'text',
			width: 'full'
		}
	});

	/**
	 * Props type derived from variant definitions
	 */
	type SkeletonProps = VariantProps<typeof skeletonVariants> & {
		class?: string;
		label?: string;
		/** Stagger index for delayed appearance (use with skeleton-group parent) */
		stagger?: number;
	};

	// Component props
	let {
		type = 'text',
		width = 'full',
		class: className = '',
		label = 'Loading...',
		stagger
	}: SkeletonProps = $props();

	// Stagger style for custom delays beyond what skeleton-group provides
	const staggerStyle = $derived(
		stagger !== undefined ? `animation-delay: ${stagger * 50}ms` : undefined
	);
</script>

<div
	class={cn(skeletonVariants({ type, width }), className)}
	role="status"
	aria-label={label}
	aria-busy="true"
	style={staggerStyle}
></div>

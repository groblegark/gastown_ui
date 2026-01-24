/**
 * Core Components Module
 *
 * Primitive UI building blocks used across the application.
 * These are foundational components that other components build upon.
 */

// Button
export {
	default as Button,
	buttonVariants,
	type ButtonProps,
	type ButtonVariants
} from '../Button.svelte';

// Badge
export {
	default as Badge,
	badgeVariants,
	type BadgeVariant,
	type BadgeSize,
	type BadgeProps
} from '../Badge.svelte';

// Input
export { default as Input } from '../Input.svelte';

// Icon
export { default as Icon } from '../Icon.svelte';

// Switch
export { default as Switch, switchVariants, type SwitchProps, type SwitchVariants } from '../Switch.svelte';

// Progress components
export {
	default as CircularProgress,
	circularProgressVariants,
	type CircularProgressProps
} from '../CircularProgress.svelte';
export { default as ProgressBar } from '../ProgressBar.svelte';

// Status components
export {
	default as StatusIndicator,
	statusIndicatorVariants,
	type StatusIndicatorStatus,
	type StatusIndicatorSize,
	type StatusIndicatorProps
} from '../StatusIndicator.svelte';
export {
	default as StatusBadge,
	statusBadgeVariants,
	type StatusBadgeProps,
	type StatusBadgeVariants
} from '../StatusBadge.svelte';

// State components
export {
	default as EmptyState,
	emptyStateVariants,
	emptyStatePresets,
	type EmptyStatePreset,
	type EmptyStateProps,
	type EmptyStateVariants
} from '../EmptyState.svelte';
export { default as ErrorState } from '../ErrorState.svelte';

// Notification components
export { default as Toast } from '../Toast.svelte';
export { default as ToastContainer } from '../ToastContainer.svelte';

// Skeleton components
export { default as Skeleton } from '../Skeleton.svelte';
export { default as SkeletonCard } from '../SkeletonCard.svelte';
export { default as SkeletonGroup } from '../SkeletonGroup.svelte';
export { default as SkeletonLoader } from '../SkeletonLoader.svelte';

// Utility components
export { default as UnreadDot } from '../UnreadDot.svelte';
export { default as ShimmerText } from '../ShimmerText.svelte';
export { default as GridPattern } from '../GridPattern.svelte';
export { default as NumberCounter } from '../NumberCounter.svelte';

// Data display components
export {
	default as DataTable,
	dataTableVariants,
	type Column,
	type DataTableProps,
	type DataTableVariants
} from '../DataTable.svelte';
export {
	default as StatsCard,
	statsCardVariants,
	type TrendDirection,
	type SparklinePoint,
	type StatusBreakdown,
	type StatsCardProps,
	type StatsCardVariants
} from '../StatsCard.svelte';

// Form components
export {
	default as IssueTypeSelector,
	issueTypeSelectorVariants,
	type IssueTypeOption
} from '../IssueTypeSelector.svelte';
export {
	default as CopyCliButton,
	copyCliButtonVariants,
	type CopyCliButtonProps,
	type CopyCliButtonVariants
} from '../CopyCliButton.svelte';
export { default as ThemeToggle } from '../ThemeToggle.svelte';

// Interactive components
export { default as SwipeableItem } from '../SwipeableItem.svelte';
export { default as SwipeableTabs } from '../SwipeableTabs.svelte';
export { default as PullToRefresh } from '../PullToRefresh.svelte';
export { default as FloatingActionButton } from '../FloatingActionButton.svelte';
export { default as TouchTarget } from '../TouchTarget.svelte';
export { default as VirtualList } from '../VirtualList.svelte';

// Error handling components
export { default as ErrorBoundary } from '../ErrorBoundary.svelte';
export { default as ApiError } from '../ApiError.svelte';
export { default as KnownBugDetector } from '../KnownBugDetector.svelte';

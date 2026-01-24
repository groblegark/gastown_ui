/**
 * Domain Components Module
 *
 * Business domain-specific components organized by area.
 * Re-exports from subdirectories for convenience.
 */

// Work domain components
export {
	WorkFilters,
	WorkList,
	WorkCreateForm,
	WorkSlingForm,
	workFiltersVariants,
	workListVariants,
	workCreateFormVariants,
	workSlingFormVariants,
	issueSchema,
	convoySchema,
	slingSchema
} from '../work';
export type {
	FilterType,
	FilterPriority,
	FilterStatus,
	SortBy,
	SortOrder,
	WorkFiltersState,
	LocalIssue,
	Rig,
	IssueTypeOption,
	IssueFormData,
	ConvoyFormData,
	SlingFormData
} from '../work';

// Work item display components
export {
	default as WorkItemCard,
	workItemCardVariants,
	type WorkItem,
	type WorkItemCardProps
} from '../WorkItemCard.svelte';
export {
	default as WorkItemDetail,
	workItemDetailVariants,
	type WorkItemDetailProps
} from '../WorkItemDetail.svelte';

// Agents domain components
export { default as AgentCard } from '../AgentCard.svelte';
export { default as AgentCardSkeleton } from '../AgentCardSkeleton.svelte';

// Seance domain components
export { SeanceControls, SeanceOutput, SeanceHistory } from '../seance';
export type * from '../seance/types';

// Workflows domain components
export { WorkflowFilters, WorkflowList, WorkflowDetail } from '../workflows';
export type * from '../workflows/types';

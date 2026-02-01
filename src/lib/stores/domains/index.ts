/**
 * Domain stores module
 *
 * Business entity stores for the application.
 * These depend on core infrastructure stores.
 */

// Work (beads/issues)
export {
	workStore,
	useWork,
	type WorkItem,
	type WorkFilter
} from '../work.svelte';

// Convoys
export {
	convoysStore,
	useConvoys,
	type Convoy,
	type ConvoyStatus,
	type ConvoyFilter
} from '../convoys.svelte';

// Agents (polecats)
export {
	agentsStore,
	useAgents,
	type Agent,
	type AgentStatus,
	type AgentFilter
} from '../agents.svelte';

// Mail
export {
	mailStore,
	useMail,
	type MailItem,
	type MailPriority,
	type MailStatus,
	type MailType,
	type MailFilter
} from '../mail.svelte';

// Rigs
export {
	rigsStore,
	useRigs,
	type Rig,
	type RigAgent,
	type RigConfig,
	type RigStatus,
	type RigFilter
} from '../rigs.svelte';

// Merge Queue
export {
	queueStore,
	useQueue,
	type MergeQueueItem,
	type MergeQueueStatus,
	type MergeQueueCloseReason,
	type MergeQueueFailureType,
	type CIStatus,
	type MergeableStatus,
	type QueueFilter
} from '../queue.svelte';

// Search Index
export {
	searchIndex,
	useSearchIndex,
	type SearchableItem,
	type SearchableType
} from '../search-index.svelte';

// Decisions
export {
	decisionsStore,
	useDecisions,
	type Decision,
	type DecisionOption,
	type DecisionUrgency,
	type DecisionStatus,
	type DecisionFilter,
	type DecisionCounts
} from './decisions.svelte';

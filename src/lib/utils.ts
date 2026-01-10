import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx and tailwind-merge.
 * This utility handles conditional classes and properly merges
 * conflicting Tailwind CSS classes.
 *
 * @example
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 * cn('bg-red-500', condition && 'bg-blue-500') // => 'bg-blue-500' if condition is true
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

// Re-export date utilities for convenient access
export {
	formatRelativeTime,
	formatTimestamp,
	formatDate,
	formatTime,
	formatFriendlyDate,
	formatDuration,
	isToday,
	isPast
} from './utils/date';

// Re-export status utilities for convenient access
export {
	// Convoy status
	type ConvoyStatus,
	type ConvoyStatusConfig,
	convoyStatusConfig,
	getConvoyStatusConfig,
	// Issue status
	type IssueStatus,
	type IssueStatusConfig,
	issueStatusConfig,
	getIssueStatusConfig,
	getIssueStatusBg,
	getIssueStatusColor,
	getIssueStatusBgSimple,
	// Escalation severity
	type EscalationSeverity,
	type EscalationSeverityConfig,
	escalationSeverityConfig,
	getEscalationSeverityConfig,
	// Priority
	type PriorityConfig,
	priorityLabels,
	getPriorityConfig,
	// Worker/Agent formatting
	formatWorkerName,
	formatAgent
} from './utils/status';

// Re-export logger utilities for convenient access
export {
	createLogger,
	configureLogger,
	enableNamespaces,
	disableNamespaces,
	enableAllLogs,
	disableAllLogs,
	getEnabledNamespaces,
	log,
	type LogLevel
} from './utils/logger';

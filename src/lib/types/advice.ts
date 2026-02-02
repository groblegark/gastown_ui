/**
 * Advice TypeScript Helper Types and Functions
 *
 * Helper types and utility functions for the advice system UI.
 *
 * @module advice-types
 */

import type { AdviceHookTriggerInferred } from './schemas/advice.schema';

// =============================================================================
// Scope Types
// =============================================================================

/**
 * Advice scope - derived from label patterns
 *
 * - Global: Has 'global' label
 * - Role: Has 'role:X' label
 * - Rig: Has 'rig:X' label
 * - Agent: Has 'agent:X' label
 * - Custom: Has other labels or combinations
 */
export type AdviceScope = 'Global' | 'Role' | 'Rig' | 'Agent' | 'Custom';

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Advice list filter options
 */
export interface AdviceFilters {
	scope?: AdviceScope;
	status?: 'open' | 'closed' | 'all';
	search?: string;
	hasHook?: boolean;
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input type for creating new advice
 */
export interface AdviceCreateInput {
	title: string;
	description?: string;
	labels: string[];
	priority?: number;
	hook?: {
		command: string;
		trigger: AdviceHookTriggerInferred;
		timeout?: number;
		onFailure?: 'block' | 'warn' | 'ignore';
	};
}

/**
 * Input type for updating advice
 */
export interface AdviceUpdateInput {
	title?: string;
	description?: string;
	labels?: string[];
	priority?: number;
	hook?: {
		command: string;
		trigger: AdviceHookTriggerInferred;
		timeout?: number;
		onFailure?: 'block' | 'warn' | 'ignore';
	} | null;
}

// =============================================================================
// Agent Matching Types
// =============================================================================

/**
 * Represents an agent that matches advice targeting labels
 */
export interface AgentMatch {
	agentId: string;
	rig: string;
	role: string;
	matchedLabels: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determine the scope of an advice bead based on its labels.
 *
 * Scope priority (first match wins):
 * 1. Agent-specific (agent:X)
 * 2. Role-specific (role:X)
 * 3. Rig-specific (rig:X)
 * 4. Global (global)
 * 5. Custom (other labels)
 *
 * @param labels - Array of targeting labels
 * @returns The derived scope
 */
export function getAdviceScope(labels: string[]): AdviceScope {
	for (const label of labels) {
		if (label.startsWith('agent:')) return 'Agent';
		if (label.startsWith('role:')) return 'Role';
		if (label.startsWith('rig:')) return 'Rig';
		if (label === 'global') return 'Global';
	}
	return 'Custom';
}

/**
 * Get Tailwind CSS classes for scope badge coloring.
 *
 * @param scope - The advice scope
 * @returns Tailwind CSS classes for background and text color
 */
export function getScopeBadgeColor(scope: AdviceScope): string {
	switch (scope) {
		case 'Global':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		case 'Role':
			return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
		case 'Rig':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		case 'Agent':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
		case 'Custom':
			return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
	}
}

/**
 * Extract the target value from a label.
 *
 * @example
 * extractLabelValue('role:polecat') // 'polecat'
 * extractLabelValue('global') // 'global'
 * extractLabelValue('agent:furiosa') // 'furiosa'
 *
 * @param label - The label string
 * @returns The value portion after the colon, or the full label if no colon
 */
export function extractLabelValue(label: string): string {
	const colonIndex = label.indexOf(':');
	return colonIndex !== -1 ? label.slice(colonIndex + 1) : label;
}

/**
 * Check if an advice bead has hook configuration.
 *
 * @param advice - Object with optional hook command
 * @returns True if the advice has a hook command configured
 */
export function hasHookConfig(advice: { advice_hook_command?: string }): boolean {
	return !!advice.advice_hook_command;
}

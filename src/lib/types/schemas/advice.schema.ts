/**
 * Advice Zod Validation Schemas
 *
 * Runtime validation schemas for advice-related types. These schemas
 * use passthrough() for forward compatibility with evolving CLI output.
 *
 * @module advice-schemas
 */

import { z } from 'zod';

// =============================================================================
// Advice Hook Schemas
// =============================================================================

/**
 * Advice hook trigger - when the hook command runs
 */
export const AdviceHookTriggerSchema = z.enum([
	'session-end',
	'before-commit',
	'before-push',
	'before-handoff'
]);

/**
 * Advice hook failure mode - how to handle hook failures
 */
export const AdviceHookFailureModeSchema = z.enum(['block', 'warn', 'ignore']);

/**
 * Advice hook configuration schema
 */
export const AdviceHookConfigSchema = z.object({
	command: z.string().max(1000),
	trigger: AdviceHookTriggerSchema,
	timeout: z.number().min(1).max(300).default(30),
	onFailure: AdviceHookFailureModeSchema.default('warn')
});

// =============================================================================
// Advice Bead Schema
// =============================================================================

/**
 * Advice bead schema - validates advice beads from CLI output
 *
 * Uses snake_case field names to match CLI JSON output
 */
export const AdviceBeadSchema = z
	.object({
		id: z.string(),
		title: z.string(),
		description: z.string().optional(),
		status: z.enum(['open', 'closed']),
		priority: z.number().min(0).max(4),
		labels: z.array(z.string()),
		created_at: z.string(),
		updated_at: z.string(),
		created_by: z.string().optional(),
		// Hook fields (snake_case to match CLI output)
		advice_hook_command: z.string().optional(),
		advice_hook_trigger: AdviceHookTriggerSchema.optional(),
		advice_hook_timeout: z.number().optional(),
		advice_hook_on_failure: AdviceHookFailureModeSchema.optional()
	})
	.passthrough();

// =============================================================================
// Type Inference Helpers
// =============================================================================

/** Infer TypeScript types from Zod schemas */
export type AdviceBeadInferred = z.infer<typeof AdviceBeadSchema>;
export type AdviceHookConfigInferred = z.infer<typeof AdviceHookConfigSchema>;
export type AdviceHookTriggerInferred = z.infer<typeof AdviceHookTriggerSchema>;
export type AdviceHookFailureModeInferred = z.infer<typeof AdviceHookFailureModeSchema>;

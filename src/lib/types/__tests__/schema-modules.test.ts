/**
 * Schema Module Split Tests
 *
 * Tests that verify the schema module split is complete and all schemas
 * are properly exported from both new locations and backwards-compatible
 * re-exports from the original location.
 *
 * @module schema-modules-test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// =============================================================================
// Helper for validating Zod schemas
// =============================================================================

/**
 * Verifies that a value is a valid Zod schema by checking for safeParse method
 * and the _def property that all Zod schemas have
 */
function expectZodSchema(value: unknown): void {
	expect(typeof (value as z.ZodTypeAny).safeParse).toBe('function');
	expect(typeof (value as z.ZodTypeAny)._def).toBe('object');
}

// =============================================================================
// New Schema Module Imports (Testing New Locations)
// =============================================================================

describe('Schema Module Split - New Locations', () => {
	describe('bead.schema.ts exports', () => {
		it('exports all bead-related schemas as valid Zod schemas', async () => {
			const beadSchemas = await import('../schemas/bead.schema');

			expectZodSchema(beadSchemas.BdBeadStorageStatusSchema);
			expectZodSchema(beadSchemas.BdBeadDisplayStatusSchema);
			expectZodSchema(beadSchemas.BdBeadStatusSchema);
			expectZodSchema(beadSchemas.BdBeadSchema);
		});

		it('validates bead data correctly', async () => {
			const { BdBeadSchema } = await import('../schemas/bead.schema');

			const validBead = {
				id: 'bd-123',
				title: 'Test Bead',
				description: 'A test bead',
				status: 'open',
				priority: 1,
				issue_type: 'task',
				created_at: '2026-01-01T00:00:00Z',
				created_by: 'test',
				updated_at: '2026-01-01T00:00:00Z'
			};

			const result = BdBeadSchema.safeParse(validBead);
			expect(result.success).toBe(true);
		});
	});

	describe('mail.schema.ts exports', () => {
		it('exports all mail-related schemas as valid Zod schemas', async () => {
			const mailSchemas = await import('../schemas/mail.schema');

			expectZodSchema(mailSchemas.GtMailPrioritySchema);
			expectZodSchema(mailSchemas.GtMailTypeSchema);
			expectZodSchema(mailSchemas.GtMailDeliverySchema);
			expectZodSchema(mailSchemas.GtMailMessageSchema);
		});

		it('validates mail message correctly', async () => {
			const { GtMailMessageSchema } = await import('../schemas/mail.schema');

			const validMail = {
				id: 'mail-123',
				from: 'mayor/',
				to: 'gastown_ui/polecats/amp',
				subject: 'Test',
				body: 'Test body',
				timestamp: '2026-01-01T00:00:00Z',
				read: false,
				priority: 'normal',
				type: 'task',
				delivery: 'queue',
				pinned: false,
				wisp: false
			};

			const result = GtMailMessageSchema.safeParse(validMail);
			expect(result.success).toBe(true);
		});
	});

	describe('agent.schema.ts exports', () => {
		it('exports all agent-related schemas as valid Zod schemas', async () => {
			const agentSchemas = await import('../schemas/agent.schema');

			expectZodSchema(agentSchemas.PolecatStateSchema);
			expectZodSchema(agentSchemas.AgentDisplayStatusSchema);
			expectZodSchema(agentSchemas.CleanupStatusSchema);
			expectZodSchema(agentSchemas.GtAgentStatusSchema);
			expectZodSchema(agentSchemas.GtAgentHealthSchema);
			expectZodSchema(agentSchemas.GtAgentSummarySchema);
			expectZodSchema(agentSchemas.GtAgentSchema);
			expectZodSchema(agentSchemas.GtHookInfoSchema);
		});

		it('validates agent data correctly', async () => {
			const { GtAgentSchema } = await import('../schemas/agent.schema');

			const validAgent = {
				name: 'amp',
				id: 'gastown_ui-amp-12345',
				status: 'active',
				session_id: 'gt-gastown_ui-amp',
				rig: 'gastown_ui',
				worktree: '/path/to/worktree',
				last_activity: '2026-01-01T00:00:00Z',
				last_activity_ago: '5m ago',
				health: 'healthy'
			};

			const result = GtAgentSchema.safeParse(validAgent);
			expect(result.success).toBe(true);
		});
	});

	describe('convoy.schema.ts exports', () => {
		it('exports all convoy-related schemas as valid Zod schemas', async () => {
			const convoySchemas = await import('../schemas/convoy.schema');

			expectZodSchema(convoySchemas.GtConvoyWorkStatusSchema);
			expectZodSchema(convoySchemas.GtConvoyStatusSchema);
			expectZodSchema(convoySchemas.GtTrackedIssueSchema);
			expectZodSchema(convoySchemas.GtConvoyListItemSchema);
			expectZodSchema(convoySchemas.GtConvoySchema);
		});

		it('validates convoy data correctly', async () => {
			const { GtConvoySchema } = await import('../schemas/convoy.schema');

			const validConvoy = {
				id: 'convoy-123',
				title: 'Test Convoy',
				status: 'open',
				work_status: 'active',
				progress: '3/10',
				completed: 3,
				total: 10,
				created_at: '2026-01-01T00:00:00Z',
				updated_at: '2026-01-01T00:00:00Z',
				tracked_issues: []
			};

			const result = GtConvoySchema.safeParse(validConvoy);
			expect(result.success).toBe(true);
		});
	});

	describe('refinery.schema.ts exports', () => {
		it('exports all refinery/MR-related schemas as valid Zod schemas', async () => {
			const refinerySchemas = await import('../schemas/refinery.schema');

			expectZodSchema(refinerySchemas.GtMergeQueueStatusSchema);
			expectZodSchema(refinerySchemas.GtMergeQueueCloseReasonSchema);
			expectZodSchema(refinerySchemas.GtMergeQueueFailureTypeSchema);
			expectZodSchema(refinerySchemas.GtCIStatusSchema);
			expectZodSchema(refinerySchemas.GtMergeableStatusSchema);
			expectZodSchema(refinerySchemas.GtMergeQueueItemSchema);
		});

		it('validates merge queue item correctly', async () => {
			const { GtMergeQueueItemSchema } = await import('../schemas/refinery.schema');

			const validMQItem = {
				id: 'mq-123',
				branch: 'polecat/amp/bd-123',
				repo: 'gastown_ui',
				polecat: 'amp',
				rig: 'gastown_ui',
				status: 'open',
				priority: 1,
				submitted_at: '2026-01-01T00:00:00Z'
			};

			const result = GtMergeQueueItemSchema.safeParse(validMQItem);
			expect(result.success).toBe(true);
		});
	});

	describe('schemas/index.ts re-exports', () => {
		it('re-exports all schemas from index as valid Zod schemas', async () => {
			const allSchemas = await import('../schemas');

			// Bead schemas
			expectZodSchema(allSchemas.BdBeadStorageStatusSchema);
			expectZodSchema(allSchemas.BdBeadDisplayStatusSchema);
			expectZodSchema(allSchemas.BdBeadStatusSchema);
			expectZodSchema(allSchemas.BdBeadSchema);

			// Mail schemas
			expectZodSchema(allSchemas.GtMailPrioritySchema);
			expectZodSchema(allSchemas.GtMailTypeSchema);
			expectZodSchema(allSchemas.GtMailDeliverySchema);
			expectZodSchema(allSchemas.GtMailMessageSchema);

			// Agent schemas
			expectZodSchema(allSchemas.PolecatStateSchema);
			expectZodSchema(allSchemas.AgentDisplayStatusSchema);
			expectZodSchema(allSchemas.CleanupStatusSchema);
			expectZodSchema(allSchemas.GtAgentStatusSchema);
			expectZodSchema(allSchemas.GtAgentHealthSchema);
			expectZodSchema(allSchemas.GtAgentSummarySchema);
			expectZodSchema(allSchemas.GtAgentSchema);
			expectZodSchema(allSchemas.GtHookInfoSchema);

			// Convoy schemas
			expectZodSchema(allSchemas.GtConvoyWorkStatusSchema);
			expectZodSchema(allSchemas.GtConvoyStatusSchema);
			expectZodSchema(allSchemas.GtTrackedIssueSchema);
			expectZodSchema(allSchemas.GtConvoyListItemSchema);
			expectZodSchema(allSchemas.GtConvoySchema);

			// Refinery schemas
			expectZodSchema(allSchemas.GtMergeQueueStatusSchema);
			expectZodSchema(allSchemas.GtMergeQueueCloseReasonSchema);
			expectZodSchema(allSchemas.GtMergeQueueFailureTypeSchema);
			expectZodSchema(allSchemas.GtCIStatusSchema);
			expectZodSchema(allSchemas.GtMergeableStatusSchema);
			expectZodSchema(allSchemas.GtMergeQueueItemSchema);
		});
	});
});

// =============================================================================
// Backwards Compatibility Tests
// =============================================================================

describe('Schema Module Split - Backwards Compatibility', () => {
	it('gastown.schema.ts still exports all bead schemas as valid Zod schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expectZodSchema(legacySchemas.BdBeadStorageStatusSchema);
		expectZodSchema(legacySchemas.BdBeadDisplayStatusSchema);
		expectZodSchema(legacySchemas.BdBeadStatusSchema);
		expectZodSchema(legacySchemas.BdBeadSchema);
	});

	it('gastown.schema.ts still exports all mail schemas as valid Zod schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expectZodSchema(legacySchemas.GtMailPrioritySchema);
		expectZodSchema(legacySchemas.GtMailTypeSchema);
		expectZodSchema(legacySchemas.GtMailDeliverySchema);
		expectZodSchema(legacySchemas.GtMailMessageSchema);
	});

	it('gastown.schema.ts still exports all agent schemas as valid Zod schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expectZodSchema(legacySchemas.PolecatStateSchema);
		expectZodSchema(legacySchemas.AgentDisplayStatusSchema);
		expectZodSchema(legacySchemas.CleanupStatusSchema);
		expectZodSchema(legacySchemas.GtAgentStatusSchema);
		expectZodSchema(legacySchemas.GtAgentHealthSchema);
		expectZodSchema(legacySchemas.GtAgentSummarySchema);
		expectZodSchema(legacySchemas.GtAgentSchema);
		expectZodSchema(legacySchemas.GtHookInfoSchema);
	});

	it('gastown.schema.ts still exports all convoy schemas as valid Zod schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expectZodSchema(legacySchemas.GtConvoyWorkStatusSchema);
		expectZodSchema(legacySchemas.GtConvoyStatusSchema);
		expectZodSchema(legacySchemas.GtTrackedIssueSchema);
		expectZodSchema(legacySchemas.GtConvoyListItemSchema);
		expectZodSchema(legacySchemas.GtConvoySchema);
	});

	it('gastown.schema.ts still exports all refinery schemas as valid Zod schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expectZodSchema(legacySchemas.GtMergeQueueStatusSchema);
		expectZodSchema(legacySchemas.GtMergeQueueCloseReasonSchema);
		expectZodSchema(legacySchemas.GtMergeQueueFailureTypeSchema);
		expectZodSchema(legacySchemas.GtCIStatusSchema);
		expectZodSchema(legacySchemas.GtMergeableStatusSchema);
		expectZodSchema(legacySchemas.GtMergeQueueItemSchema);
	});

	it('existing imports from gastown.schema.ts continue to work', async () => {
		// This is what parse.ts does - import directly from gastown.schema
		const { GtMergeQueueItemSchema } = await import('../gastown.schema');

		const validMQItem = {
			id: 'mq-123',
			branch: 'polecat/amp/bd-123',
			repo: 'gastown_ui',
			polecat: 'amp',
			rig: 'gastown_ui',
			status: 'open',
			priority: 1,
			submitted_at: '2026-01-01T00:00:00Z'
		};

		const result = GtMergeQueueItemSchema.safeParse(validMQItem);
		expect(result.success).toBe(true);
	});

	it('types/index.ts re-exports still work as valid Zod schemas', async () => {
		const indexExports = await import('../index');

		// Verify key schemas are still accessible via index
		expectZodSchema(indexExports.BdBeadSchema);
		expectZodSchema(indexExports.GtMailMessageSchema);
		expectZodSchema(indexExports.GtAgentSchema);
		expectZodSchema(indexExports.GtConvoySchema);
		expectZodSchema(indexExports.GtMergeQueueItemSchema);
	});
});

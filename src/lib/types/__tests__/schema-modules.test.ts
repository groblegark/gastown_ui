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

// =============================================================================
// New Schema Module Imports (Testing New Locations)
// =============================================================================

describe('Schema Module Split - New Locations', () => {
	describe('bead.schema.ts exports', () => {
		it('exports all bead-related schemas', async () => {
			const beadSchemas = await import('../schemas/bead.schema');

			expect(beadSchemas.BdBeadStorageStatusSchema).toBeDefined();
			expect(beadSchemas.BdBeadDisplayStatusSchema).toBeDefined();
			expect(beadSchemas.BdBeadStatusSchema).toBeDefined();
			expect(beadSchemas.BdBeadSchema).toBeDefined();
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
		it('exports all mail-related schemas', async () => {
			const mailSchemas = await import('../schemas/mail.schema');

			expect(mailSchemas.GtMailPrioritySchema).toBeDefined();
			expect(mailSchemas.GtMailTypeSchema).toBeDefined();
			expect(mailSchemas.GtMailDeliverySchema).toBeDefined();
			expect(mailSchemas.GtMailMessageSchema).toBeDefined();
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
		it('exports all agent-related schemas', async () => {
			const agentSchemas = await import('../schemas/agent.schema');

			expect(agentSchemas.PolecatStateSchema).toBeDefined();
			expect(agentSchemas.AgentDisplayStatusSchema).toBeDefined();
			expect(agentSchemas.CleanupStatusSchema).toBeDefined();
			expect(agentSchemas.GtAgentStatusSchema).toBeDefined();
			expect(agentSchemas.GtAgentHealthSchema).toBeDefined();
			expect(agentSchemas.GtAgentSummarySchema).toBeDefined();
			expect(agentSchemas.GtAgentSchema).toBeDefined();
			expect(agentSchemas.GtHookInfoSchema).toBeDefined();
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
		it('exports all convoy-related schemas', async () => {
			const convoySchemas = await import('../schemas/convoy.schema');

			expect(convoySchemas.GtConvoyWorkStatusSchema).toBeDefined();
			expect(convoySchemas.GtConvoyStatusSchema).toBeDefined();
			expect(convoySchemas.GtTrackedIssueSchema).toBeDefined();
			expect(convoySchemas.GtConvoyListItemSchema).toBeDefined();
			expect(convoySchemas.GtConvoySchema).toBeDefined();
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
		it('exports all refinery/MR-related schemas', async () => {
			const refinerySchemas = await import('../schemas/refinery.schema');

			expect(refinerySchemas.GtMergeQueueStatusSchema).toBeDefined();
			expect(refinerySchemas.GtMergeQueueCloseReasonSchema).toBeDefined();
			expect(refinerySchemas.GtMergeQueueFailureTypeSchema).toBeDefined();
			expect(refinerySchemas.GtCIStatusSchema).toBeDefined();
			expect(refinerySchemas.GtMergeableStatusSchema).toBeDefined();
			expect(refinerySchemas.GtMergeQueueItemSchema).toBeDefined();
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
		it('re-exports all schemas from index', async () => {
			const allSchemas = await import('../schemas');

			// Bead schemas
			expect(allSchemas.BdBeadStorageStatusSchema).toBeDefined();
			expect(allSchemas.BdBeadDisplayStatusSchema).toBeDefined();
			expect(allSchemas.BdBeadStatusSchema).toBeDefined();
			expect(allSchemas.BdBeadSchema).toBeDefined();

			// Mail schemas
			expect(allSchemas.GtMailPrioritySchema).toBeDefined();
			expect(allSchemas.GtMailTypeSchema).toBeDefined();
			expect(allSchemas.GtMailDeliverySchema).toBeDefined();
			expect(allSchemas.GtMailMessageSchema).toBeDefined();

			// Agent schemas
			expect(allSchemas.PolecatStateSchema).toBeDefined();
			expect(allSchemas.AgentDisplayStatusSchema).toBeDefined();
			expect(allSchemas.CleanupStatusSchema).toBeDefined();
			expect(allSchemas.GtAgentStatusSchema).toBeDefined();
			expect(allSchemas.GtAgentHealthSchema).toBeDefined();
			expect(allSchemas.GtAgentSummarySchema).toBeDefined();
			expect(allSchemas.GtAgentSchema).toBeDefined();
			expect(allSchemas.GtHookInfoSchema).toBeDefined();

			// Convoy schemas
			expect(allSchemas.GtConvoyWorkStatusSchema).toBeDefined();
			expect(allSchemas.GtConvoyStatusSchema).toBeDefined();
			expect(allSchemas.GtTrackedIssueSchema).toBeDefined();
			expect(allSchemas.GtConvoyListItemSchema).toBeDefined();
			expect(allSchemas.GtConvoySchema).toBeDefined();

			// Refinery schemas
			expect(allSchemas.GtMergeQueueStatusSchema).toBeDefined();
			expect(allSchemas.GtMergeQueueCloseReasonSchema).toBeDefined();
			expect(allSchemas.GtMergeQueueFailureTypeSchema).toBeDefined();
			expect(allSchemas.GtCIStatusSchema).toBeDefined();
			expect(allSchemas.GtMergeableStatusSchema).toBeDefined();
			expect(allSchemas.GtMergeQueueItemSchema).toBeDefined();
		});
	});
});

// =============================================================================
// Backwards Compatibility Tests
// =============================================================================

describe('Schema Module Split - Backwards Compatibility', () => {
	it('gastown.schema.ts still exports all bead schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expect(legacySchemas.BdBeadStorageStatusSchema).toBeDefined();
		expect(legacySchemas.BdBeadDisplayStatusSchema).toBeDefined();
		expect(legacySchemas.BdBeadStatusSchema).toBeDefined();
		expect(legacySchemas.BdBeadSchema).toBeDefined();
	});

	it('gastown.schema.ts still exports all mail schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expect(legacySchemas.GtMailPrioritySchema).toBeDefined();
		expect(legacySchemas.GtMailTypeSchema).toBeDefined();
		expect(legacySchemas.GtMailDeliverySchema).toBeDefined();
		expect(legacySchemas.GtMailMessageSchema).toBeDefined();
	});

	it('gastown.schema.ts still exports all agent schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expect(legacySchemas.PolecatStateSchema).toBeDefined();
		expect(legacySchemas.AgentDisplayStatusSchema).toBeDefined();
		expect(legacySchemas.CleanupStatusSchema).toBeDefined();
		expect(legacySchemas.GtAgentStatusSchema).toBeDefined();
		expect(legacySchemas.GtAgentHealthSchema).toBeDefined();
		expect(legacySchemas.GtAgentSummarySchema).toBeDefined();
		expect(legacySchemas.GtAgentSchema).toBeDefined();
		expect(legacySchemas.GtHookInfoSchema).toBeDefined();
	});

	it('gastown.schema.ts still exports all convoy schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expect(legacySchemas.GtConvoyWorkStatusSchema).toBeDefined();
		expect(legacySchemas.GtConvoyStatusSchema).toBeDefined();
		expect(legacySchemas.GtTrackedIssueSchema).toBeDefined();
		expect(legacySchemas.GtConvoyListItemSchema).toBeDefined();
		expect(legacySchemas.GtConvoySchema).toBeDefined();
	});

	it('gastown.schema.ts still exports all refinery schemas', async () => {
		const legacySchemas = await import('../gastown.schema');

		expect(legacySchemas.GtMergeQueueStatusSchema).toBeDefined();
		expect(legacySchemas.GtMergeQueueCloseReasonSchema).toBeDefined();
		expect(legacySchemas.GtMergeQueueFailureTypeSchema).toBeDefined();
		expect(legacySchemas.GtCIStatusSchema).toBeDefined();
		expect(legacySchemas.GtMergeableStatusSchema).toBeDefined();
		expect(legacySchemas.GtMergeQueueItemSchema).toBeDefined();
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

	it('types/index.ts re-exports still work', async () => {
		const indexExports = await import('../index');

		// Verify key schemas are still accessible via index
		expect(indexExports.BdBeadSchema).toBeDefined();
		expect(indexExports.GtMailMessageSchema).toBeDefined();
		expect(indexExports.GtAgentSchema).toBeDefined();
		expect(indexExports.GtConvoySchema).toBeDefined();
		expect(indexExports.GtMergeQueueItemSchema).toBeDefined();
	});
});

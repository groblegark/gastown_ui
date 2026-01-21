/**
 * Work API Endpoint
 *
 * Returns all work items from the beads database with filtering support.
 * NOTE: Bead storage status is 'open'|'closed'. Display status is DERIVED.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { randomUUID } from 'node:crypto';
import { deriveDisplayStatus, type MRStatus } from '$lib/utils/status';
import type { BdBeadDisplayStatus } from '$lib/types/gastown';

/** WorkItem display status - derived from storage status + context */
type WorkItemStatus = 'open' | 'in_progress' | 'done' | 'blocked';

interface WorkItem {
	id: string;
	title: string;
	description?: string;
	status: WorkItemStatus;
	priority: number;
	type: 'task' | 'bug' | 'feature' | 'epic';
	assignee: string | null;
	labels: string[];
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}

/**
 * Raw bead from CLI - status is storage status ('open'|'closed')
 * Display status derived from: status + hook_bead + blocked_by_count + assignee
 */
interface BdBead {
	id: string;
	title: string;
	description?: string;
	status: 'open' | 'closed'; // Storage status only
	priority: number;
	issue_type: string;
	assignee?: string;
	labels?: string[];
	created_at: string;
	updated_at: string;
	created_by: string;
	// Fields for deriving display status
	hook_bead?: boolean;
	blocked_by_count?: number;
}

/**
 * Transform raw bead to WorkItem with derived display status
 * Uses deriveDisplayStatus() to compute UI-friendly status from storage status + context
 */
function transformBead(bead: BdBead): WorkItem {
	const allowedTypes = new Set(['task', 'bug', 'feature', 'epic']);
	const type = allowedTypes.has(bead.issue_type) ? bead.issue_type : 'task';

	// Derive display status from storage status + context fields
	const displayStatus = deriveDisplayStatus({
		status: bead.status,
		hook_bead: bead.hook_bead,
		blocked_by_count: bead.blocked_by_count,
		assignee: bead.assignee
	});

	// Map BdBeadDisplayStatus to WorkItemStatus
	const statusMap: Record<BdBeadDisplayStatus, WorkItemStatus> = {
		open: 'open',
		in_progress: 'in_progress',
		blocked: 'blocked',
		closed: 'done',
		hooked: 'in_progress' // Hooked beads show as in_progress
	};

	return {
		id: bead.id,
		title: bead.title,
		description: bead.description,
		status: statusMap[displayStatus],
		priority: Math.min(4, Math.max(0, bead.priority)),
		type: type as WorkItem['type'],
		assignee: bead.assignee ?? null,
		labels: bead.labels || [],
		createdAt: bead.created_at,
		updatedAt: bead.updated_at,
		createdBy: bead.created_by
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const requestId = randomUUID();
	const supervisor = getProcessSupervisor();

	const type = url.searchParams.get('type');
	const status = url.searchParams.get('status');
	const priority = url.searchParams.get('priority');
	const assignee = url.searchParams.get('assignee');
	const labels = url.searchParams.get('labels');

	const args = ['list', '--json'];

	if (type && /^[a-zA-Z_]+$/.test(type)) {
		args.push(`--type=${type}`);
	}
	if (status && /^[a-zA-Z_]+$/.test(status)) {
		args.push(`--status=${status}`);
	}
	if (priority && /^[0-4]$/.test(priority)) {
		args.push(`--priority=${priority}`);
	}
	if (assignee && /^[a-zA-Z0-9/_-]+$/.test(assignee)) {
		args.push(`--assignee=${assignee}`);
	}
	if (labels && /^[a-zA-Z0-9:,_-]+$/.test(labels)) {
		for (const label of labels.split(',')) {
			args.push(`--label=${label.trim()}`);
		}
	}

	try {
		const result = await supervisor.bd<BdBead[]>(args, { timeout: 15_000 });

		if (!result.success) {
			const errorMessage = result.error || 'Unknown error';

			if (errorMessage.includes('no issues') || errorMessage.includes('no beads')) {
				return json({
					items: [],
					total: 0,
					timestamp: new Date().toISOString(),
					requestId
				});
			}

			console.error('Failed to fetch work items:', result.error);
			return json(
				{
					items: [],
					total: 0,
					error: errorMessage,
					timestamp: new Date().toISOString(),
					requestId
				},
				{ status: 500 }
			);
		}

		const beads: BdBead[] = result.data || [];
		const items = beads.map(transformBead);

		return json({
			items,
			total: items.length,
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		console.error('Failed to fetch work items:', error);
		return json(
			{
				items: [],
				total: 0,
				error: errorMessage,
				timestamp: new Date().toISOString(),
				requestId
			},
			{ status: 500 }
		);
	}
};

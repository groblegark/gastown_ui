/**
 * Decision Detail API Endpoint
 *
 * Fetches a single decision with its full chain history.
 */

import { json } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';
import type { RequestHandler } from './$types';

/** Get the beads working directory */
function getBdCwd(): string | undefined {
	return process.env.GASTOWN_BD_CWD || process.env.GASTOWN_TOWN_ROOT;
}

interface DecisionOption {
	id: string;
	label: string;
	description?: string;
	recommended?: boolean;
}

interface BdDecisionShow {
	issue_id: string;
	prompt: string;
	options: string;
	options_parsed?: DecisionOption[];
	created_at: string;
	requested_by?: string;
	urgency?: string;
	response?: {
		selected_option: string;
		text?: string;
		resolved_by?: string;
		resolved_at?: string;
	};
	predecessor_id?: string;
	issue?: {
		id: string;
		title: string;
		status: string;
		priority: number;
		description?: string;
	};
}

interface BdChainItem {
	issue_id: string;
	prompt: string;
	options?: string;
	created_at: string;
	response?: {
		selected_option: string;
		text?: string;
		resolved_by?: string;
		resolved_at?: string;
	};
}

type Urgency = 'high' | 'medium' | 'low';

/**
 * Parse urgency from string, defaulting to medium
 */
function parseUrgency(urgency?: string): Urgency {
	if (urgency === 'high' || urgency === 'medium' || urgency === 'low') {
		return urgency;
	}
	return 'medium';
}

/**
 * Parse options from JSON string
 */
function parseOptions(optionsStr?: string): DecisionOption[] {
	if (!optionsStr) return [];
	try {
		const parsed = JSON.parse(optionsStr);
		if (Array.isArray(parsed)) {
			return parsed.map((opt, idx) => ({
				id: opt.id || String(idx + 1),
				label: opt.label || opt.short || `Option ${idx + 1}`,
				description: opt.description,
				recommended: opt.recommended
			}));
		}
	} catch {
		// Ignore parse errors
	}
	return [];
}

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id) {
		return json({ error: 'Decision ID is required' }, { status: 400 });
	}

	// Validate ID format (alphanumeric with dots, hyphens, underscores)
	if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
		return json({ error: 'Invalid decision ID format' }, { status: 400 });
	}

	try {
		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();

		// Fetch decision details and chain in parallel
		const [showResult, chainResult] = await Promise.all([
			supervisor.bd<BdDecisionShow>(['decision', 'show', id, '--json', '--no-daemon'], {
				timeout: 10000,
				cwd: bdCwd
			}),
			supervisor.bd<BdChainItem[]>(['decision', 'chain', id, '--json', '--no-daemon'], {
				timeout: 10000,
				cwd: bdCwd
			})
		]);

		if (!showResult.success || !showResult.data) {
			// Check if it's a not found error
			const errorLower = (showResult.error || '').toLowerCase();
			if (errorLower.includes('not found') || errorLower.includes('no decision')) {
				return json({ error: 'Decision not found' }, { status: 404 });
			}
			return json(
				{ error: showResult.error || 'Failed to fetch decision' },
				{ status: 500 }
			);
		}

		const decision = showResult.data;
		const options = decision.options_parsed?.length
			? decision.options_parsed
			: parseOptions(decision.options);

		// Build response
		const response = {
			decision: {
				id: decision.issue_id,
				prompt: decision.prompt,
				options,
				urgency: parseUrgency(decision.urgency),
				status: decision.issue?.status === 'closed' ? 'resolved' : 'pending',
				requestedBy: decision.requested_by || 'unknown',
				requestedAt: decision.created_at,
				predecessorId: decision.predecessor_id,
				response: decision.response
					? {
							selectedOption: decision.response.selected_option,
							text: decision.response.text,
							resolvedBy: decision.response.resolved_by,
							resolvedAt: decision.response.resolved_at
						}
					: undefined,
				parentBead: decision.issue
					? {
							id: decision.issue.id,
							title: decision.issue.title,
							status: decision.issue.status,
							priority: decision.issue.priority,
							description: decision.issue.description
						}
					: undefined
			},
			chain: chainResult.success && chainResult.data
				? chainResult.data.map((item) => ({
						id: item.issue_id,
						prompt: item.prompt,
						createdAt: item.created_at,
						response: item.response
							? {
									selectedOption: item.response.selected_option,
									text: item.response.text,
									resolvedBy: item.response.resolved_by,
									resolvedAt: item.response.resolved_at
								}
							: undefined
					}))
				: [],
			fetchedAt: new Date().toISOString()
		};

		return json(response);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error fetching decision:', errorMessage);
		return json({ error: errorMessage }, { status: 500 });
	}
};

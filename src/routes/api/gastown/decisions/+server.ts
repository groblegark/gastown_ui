import { json } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';
import type { RequestHandler } from './$types';

type Urgency = 'high' | 'medium' | 'low';

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

interface BdDecisionListItem {
	issue_id: string;
	prompt: string;
	options: string;
	options_parsed?: DecisionOption[];
	created_at: string;
	requested_by?: string;
	urgency?: string;
	issue?: {
		id: string;
		title: string;
		status: string;
		priority: number;
	};
}

interface Decision {
	id: string;
	prompt: string;
	context?: string;
	options: DecisionOption[];
	urgency: Urgency;
	status: 'pending' | 'resolved';
	requestedBy: string;
	requestedAt: string;
	parentBeadId?: string;
	parentBeadTitle?: string;
}

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
function parseOptions(optionsStr: string): DecisionOption[] {
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

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') || 'pending';
	const urgency = url.searchParams.get('urgency');

	try {
		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();

		// Build command arguments
		const args = ['decision', 'list', '--json', '--no-daemon'];

		// Note: bd decision list shows pending by default
		// Add status filter if needed (e.g., --all for resolved)
		if (status === 'all') {
			args.push('--all');
		}

		const result = await supervisor.bd<BdDecisionListItem[]>(args, {
			timeout: 10000,
			cwd: bdCwd
		});

		if (!result.success || !result.data) {
			return json(
				{ error: result.error || 'Failed to fetch decisions', decisions: [] },
				{ status: 500 }
			);
		}

		const items: BdDecisionListItem[] = result.data;

		// Transform to decision format
		let decisions: Decision[] = items
			.filter((item) => status === 'all' || item.issue?.status !== 'closed')
			.map((item) => {
				const options = item.options_parsed?.length
					? item.options_parsed
					: parseOptions(item.options);

				return {
					id: item.issue_id,
					prompt: item.prompt,
					options,
					urgency: parseUrgency(item.urgency),
					status: (item.issue?.status === 'closed' ? 'resolved' : 'pending') as 'pending' | 'resolved',
					requestedBy: item.requested_by || 'unknown',
					requestedAt: item.created_at
				};
			});

		// Filter by urgency if specified
		if (urgency && (urgency === 'high' || urgency === 'medium' || urgency === 'low')) {
			decisions = decisions.filter((d) => d.urgency === urgency);
		}

		// Sort by urgency (high first)
		const urgencyOrder: Record<Urgency, number> = {
			high: 0,
			medium: 1,
			low: 2
		};

		decisions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

		return json({
			decisions,
			counts: {
				high: decisions.filter((d) => d.urgency === 'high').length,
				medium: decisions.filter((d) => d.urgency === 'medium').length,
				low: decisions.filter((d) => d.urgency === 'low').length,
				total: decisions.length
			}
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error fetching decisions:', errorMessage);
		return json({ error: errorMessage, decisions: [] }, { status: 500 });
	}
};

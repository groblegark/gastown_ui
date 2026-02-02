import { json } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';
import type { RequestHandler } from './$types';

/** Get the beads working directory */
function getBdCwd(): string | undefined {
	return process.env.GASTOWN_BD_CWD || process.env.GASTOWN_TOWN_ROOT;
}

interface BdAdviceItem {
	id: string;
	title: string;
	description: string;
	status: string;
	priority: number;
	issue_type: string;
	created_at: string;
	updated_at: string;
	labels?: string[];
}

interface Advice {
	id: string;
	title: string;
	description: string;
	status: 'open' | 'closed';
	priority: number;
	createdAt: string;
	updatedAt: string;
	labels: string[];
}

/**
 * GET /api/gastown/advice
 *
 * Returns advice beads. Supports optional `for` query param to filter by agent.
 *
 * Query params:
 * - for: Agent path to filter advice for (e.g., "beads/polecats/quartz")
 * - all: Include closed advice if "true"
 */
export const GET: RequestHandler = async ({ url }) => {
	const forAgent = url.searchParams.get('for');
	const includeAll = url.searchParams.get('all') === 'true';

	try {
		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();

		// Build command arguments
		const args = ['advice', 'list', '--json'];

		// Add --for filter if specified
		if (forAgent) {
			args.push(`--for=${forAgent}`);
		}

		// Include closed advice if requested
		if (includeAll) {
			args.push('--all');
		}

		const result = await supervisor.bd<BdAdviceItem[]>(args, {
			timeout: 10000,
			cwd: bdCwd
		});

		if (!result.success || !result.data) {
			return json(
				{ error: result.error || 'Failed to fetch advice', advice: [] },
				{ status: 500 }
			);
		}

		const items: BdAdviceItem[] = result.data;

		// Transform to advice format
		const advice: Advice[] = items.map((item) => ({
			id: item.id,
			title: item.title,
			description: item.description,
			status: item.status === 'closed' ? 'closed' : 'open',
			priority: item.priority,
			createdAt: item.created_at,
			updatedAt: item.updated_at,
			labels: item.labels || []
		}));

		return json({
			advice,
			counts: {
				open: advice.filter((a) => a.status === 'open').length,
				closed: advice.filter((a) => a.status === 'closed').length,
				total: advice.length
			},
			filter: forAgent ? { for: forAgent } : undefined
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error fetching advice:', errorMessage);
		return json({ error: errorMessage, advice: [] }, { status: 500 });
	}
};

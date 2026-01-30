import { getProcessSupervisor } from '$lib/server/cli';
import type { PageServerLoad } from './$types';

type Urgency = 'high' | 'medium' | 'low';

/** Check if demo mode is enabled */
function isDemoMode(): boolean {
	const demoMode = process.env.GASTOWN_DEMO_MODE;
	return demoMode !== 'false';
}

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
	options: string; // JSON string of options
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

export interface Decision {
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

/**
 * Generate demo decisions for demo mode
 */
function getDemoDecisions(): Decision[] {
	return [
		{
			id: 'dec-demo-1',
			prompt: 'How should we handle API versioning?',
			options: [
				{ id: '1', label: 'URL path versioning', description: '/api/v1/users', recommended: true },
				{ id: '2', label: 'Header versioning', description: 'Accept-Version: v1' },
				{ id: '3', label: 'Query param versioning', description: '/api/users?version=1' }
			],
			urgency: 'high',
			status: 'pending',
			requestedBy: 'gastown/polecats/rictus',
			requestedAt: new Date(Date.now() - 3600000).toISOString()
		},
		{
			id: 'dec-demo-2',
			prompt: 'Which authentication method should we use for the new API?',
			options: [
				{ id: '1', label: 'JWT tokens', description: 'Stateless, scalable' },
				{ id: '2', label: 'Session cookies', description: 'Traditional, simpler', recommended: true },
				{ id: '3', label: 'API keys', description: 'For machine-to-machine' }
			],
			urgency: 'medium',
			status: 'pending',
			requestedBy: 'gastown/crew/architect',
			requestedAt: new Date(Date.now() - 7200000).toISOString()
		},
		{
			id: 'dec-demo-3',
			prompt: 'Should we migrate to the new database schema now or wait for the next sprint?',
			options: [
				{ id: '1', label: 'Migrate now', description: 'Get it done, accept some risk' },
				{ id: '2', label: 'Wait for next sprint', description: 'More time for testing', recommended: true }
			],
			urgency: 'low',
			status: 'pending',
			requestedBy: 'gastown/polecats/furiosa',
			requestedAt: new Date(Date.now() - 14400000).toISOString()
		}
	];
}

export const load: PageServerLoad = async () => {
	// In demo mode, return demo decisions directly
	if (isDemoMode()) {
		const decisions = getDemoDecisions();
		return {
			decisions,
			error: null,
			counts: {
				high: decisions.filter((d) => d.urgency === 'high').length,
				medium: decisions.filter((d) => d.urgency === 'medium').length,
				low: decisions.filter((d) => d.urgency === 'low').length,
				total: decisions.length
			},
			dataSource: 'demo' as const
		};
	}

	try {
		// Run bd decision list to get pending decisions
		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();
		const result = await supervisor.bd<BdDecisionListItem[]>(
			['decision', 'list', '--json', '--no-daemon'],
			{
				timeout: 10000,
				cwd: bdCwd
			}
		);

		if (!result.success || !result.data) {
			throw new Error(result.error || 'Failed to fetch decisions');
		}

		const items: BdDecisionListItem[] = result.data;

		// Transform to decision format
		const decisions: Decision[] = items
			.filter((item) => item.issue?.status !== 'closed')
			.map((item) => {
				// Use pre-parsed options if available, otherwise parse from JSON string
				const options = item.options_parsed?.length
					? item.options_parsed
					: parseOptions(item.options);

				return {
					id: item.issue_id,
					prompt: item.prompt,
					options,
					urgency: parseUrgency(item.urgency),
					status: 'pending' as const,
					requestedBy: item.requested_by || 'unknown',
					requestedAt: item.created_at
				};
			});

		// Sort by urgency (high first, then medium, low)
		const urgencyOrder: Record<Urgency, number> = {
			high: 0,
			medium: 1,
			low: 2
		};

		decisions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

		return {
			decisions,
			error: null,
			counts: {
				high: decisions.filter((d) => d.urgency === 'high').length,
				medium: decisions.filter((d) => d.urgency === 'medium').length,
				low: decisions.filter((d) => d.urgency === 'low').length,
				total: decisions.length
			},
			dataSource: 'live' as const
		};
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : 'Unknown error fetching decisions';

		return {
			decisions: [],
			error: errorMessage,
			counts: {
				high: 0,
				medium: 0,
				low: 0,
				total: 0
			},
			dataSource: 'live' as const
		};
	}
};

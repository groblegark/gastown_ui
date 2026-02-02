import { getProcessSupervisor } from '$lib/server/cli';
import type { PageServerLoad } from './$types';
import type { AdviceScope } from '$lib/domain/advice';

/** Check if demo mode is enabled */
function isDemoMode(): boolean {
	const demoMode = process.env.GASTOWN_DEMO_MODE;
	return demoMode !== 'false';
}

/** Get the beads working directory */
function getBdCwd(): string | undefined {
	return process.env.GASTOWN_BD_CWD || process.env.GASTOWN_TOWN_ROOT;
}

interface BeadsAdvice {
	id: string;
	title: string;
	description?: string;
	status: string;
	priority: number;
	issue_type: string;
	created_at: string;
	created_by?: string;
	updated_at: string;
	labels?: string[];
	// Advice-specific hook fields
	advice_hook_command?: string;
	advice_hook_trigger?: string;
	advice_hook_timeout?: number;
	advice_hook_on_failure?: string;
}

export interface Advice {
	id: string;
	title: string;
	description: string;
	scope: AdviceScope;
	labels: string[];
	priority: number;
	status: 'open' | 'closed';
	createdAt: string;
	createdBy: string;
	hasHook: boolean;
	hookTrigger?: string;
}

/**
 * Determine advice scope from labels
 */
function getAdviceScope(labels: string[]): AdviceScope {
	for (const label of labels) {
		if (label.startsWith('agent:')) return 'Agent';
		if (label.startsWith('role:')) return 'Role';
		if (label.startsWith('rig:')) return 'Rig';
		if (label === 'global') return 'Global';
	}
	return 'Custom';
}


/**
 * Generate demo advice for demo mode
 */
function getDemoAdvice(): Advice[] {
	return [
		{
			id: 'adv-demo-1',
			title: 'Always run tests before committing',
			description:
				'Run the full test suite before creating commits to catch regressions early. Use `npm test` or the appropriate test command for the project.',
			scope: 'Global',
			labels: ['global'],
			priority: 1,
			status: 'open',
			createdAt: new Date(Date.now() - 86400000).toISOString(),
			createdBy: 'mayor/',
			hasHook: true,
			hookTrigger: 'before-commit'
		},
		{
			id: 'adv-demo-2',
			title: 'Use conventional commit messages',
			description:
				'Follow the conventional commits specification: feat:, fix:, docs:, refactor:, test:, chore:. This helps with changelog generation and semantic versioning.',
			scope: 'Role',
			labels: ['role:polecat'],
			priority: 2,
			status: 'open',
			createdAt: new Date(Date.now() - 172800000).toISOString(),
			createdBy: 'gastown_ui/witness',
			hasHook: false
		},
		{
			id: 'adv-demo-3',
			title: 'Check circuit breaker before API calls',
			description:
				'The process supervisor has a circuit breaker. If seeing repeated failures, check circuit breaker status before making more API calls.',
			scope: 'Rig',
			labels: ['rig:gastown_ui'],
			priority: 2,
			status: 'open',
			createdAt: new Date(Date.now() - 259200000).toISOString(),
			createdBy: 'gastown_ui/witness',
			hasHook: false
		},
		{
			id: 'adv-demo-4',
			title: 'Run gt done when work is complete',
			description:
				'After completing your assigned task, always run `gt done` to submit work to the merge queue. Never wait idle at the prompt.',
			scope: 'Agent',
			labels: ['agent:gastown_ui/polecats/furiosa'],
			priority: 0,
			status: 'open',
			createdAt: new Date(Date.now() - 3600000).toISOString(),
			createdBy: 'gastown_ui/witness',
			hasHook: false
		}
	];
}

export const load: PageServerLoad = async () => {
	// In demo mode, return demo advice directly
	if (isDemoMode()) {
		const advice = getDemoAdvice();
		return {
			advice,
			error: null,
			counts: {
				global: advice.filter((a) => a.scope === 'Global').length,
				role: advice.filter((a) => a.scope === 'Role').length,
				rig: advice.filter((a) => a.scope === 'Rig').length,
				agent: advice.filter((a) => a.scope === 'Agent').length,
				total: advice.length
			},
			dataSource: 'demo' as const
		};
	}

	try {
		// Run bd list to get advice using async ProcessSupervisor
		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();
		const result = await supervisor.bd<BeadsAdvice[]>(
			['list', '-t', 'advice', '--json', '--limit', '500'],
			{
				timeout: 10000,
				cwd: bdCwd
			}
		);

		if (!result.success || !result.data) {
			throw new Error(result.error || 'Failed to fetch advice');
		}

		const items: BeadsAdvice[] = result.data;

		// Transform to advice format
		const advice: Advice[] = items.map((item) => {
			const labels = item.labels || [];
			return {
				id: item.id,
				title: item.title,
				description: item.description || '',
				scope: getAdviceScope(labels),
				labels,
				priority: item.priority,
				status: item.status === 'closed' ? 'closed' : 'open',
				createdAt: item.created_at,
				createdBy: item.created_by || 'unknown',
				hasHook: !!item.advice_hook_command,
				hookTrigger: item.advice_hook_trigger
			};
		});

		// Sort by priority (P0 first)
		advice.sort((a, b) => a.priority - b.priority);

		return {
			advice,
			error: null,
			counts: {
				global: advice.filter((a) => a.scope === 'Global').length,
				role: advice.filter((a) => a.scope === 'Role').length,
				rig: advice.filter((a) => a.scope === 'Rig').length,
				agent: advice.filter((a) => a.scope === 'Agent').length,
				total: advice.length
			},
			dataSource: 'live' as const
		};
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching advice';

		return {
			advice: [],
			error: errorMessage,
			counts: {
				global: 0,
				role: 0,
				rig: 0,
				agent: 0,
				total: 0
			},
			dataSource: 'live' as const
		};
	}
};

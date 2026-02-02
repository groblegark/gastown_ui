import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { randomUUID } from 'node:crypto';

interface GtStatus {
	name: string;
	agents?: unknown[];
	rigs?: unknown[];
}

interface BeadsIssue {
	id: string;
	status: string;
	labels?: string[];
}

/** Check if demo mode is enabled */
function isDemoMode(): boolean {
	const demoMode = process.env.GASTOWN_DEMO_MODE;
	return demoMode !== 'false';
}

export const GET: RequestHandler = async () => {
	const requestId = randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		// Fetch gt status
		const result = await supervisor.gt<GtStatus>(['status', '--json']);

		if (!result.success) {
			console.error('Failed to fetch gt status:', result.error);
			return json(
				{
					error: result.error || 'Failed to fetch status',
					requestId
				},
				{ status: 500 }
			);
		}

		// Fetch escalation count from beads
		let escalationCount = 0;
		// Fetch advice count from beads
		let adviceCount = 0;

		if (isDemoMode()) {
			// Demo mode: return consistent placeholder counts
			escalationCount = 2;
			adviceCount = 3;
		} else {
			// Production: fetch from beads CLI
			const [escalationResult, adviceResult] = await Promise.all([
				supervisor.bd<BeadsIssue[]>(
					['list', '--status=open', '--label', 'escalation', '--json'],
					{ timeout: 5000 }
				),
				supervisor.bd<BeadsIssue[]>(
					['list', '--status=open', '--label', 'advice', '--json'],
					{ timeout: 5000 }
				)
			]);

			if (escalationResult.success && escalationResult.data) {
				escalationCount = escalationResult.data.length;
			}

			if (adviceResult.success && adviceResult.data) {
				adviceCount = adviceResult.data.length;
			}
		}

		return json({
			...result.data,
			escalation_count: escalationCount,
			advice_count: adviceCount,
			requestId
		});
	} catch (error) {
		console.error('Failed to fetch gt status:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch status',
				requestId
			},
			{ status: 500 }
		);
	}
};

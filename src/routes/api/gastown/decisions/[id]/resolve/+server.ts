import { json } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';
import type { RequestHandler } from './$types';

/** Get the beads working directory */
function getBdCwd(): string | undefined {
	return process.env.GASTOWN_BD_CWD || process.env.GASTOWN_TOWN_ROOT;
}

export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	if (!id) {
		return json({ error: 'Decision ID is required' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { optionId, rationale } = body as { optionId: string; rationale?: string };

		if (!optionId) {
			return json({ error: 'Option ID is required' }, { status: 400 });
		}

		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();

		// Build the respond command arguments
		const args = ['decision', 'respond', id, `--select=${optionId}`, '--no-daemon'];

		if (rationale) {
			args.push(`--text=${rationale}`);
		}

		// Add resolved-by from UI
		args.push('--by=gastown_ui');

		const result = await supervisor.bd(args, {
			timeout: 15000,
			cwd: bdCwd
		});

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to resolve decision' },
				{ status: 500 }
			);
		}

		return json({ success: true, message: 'Decision resolved successfully' });
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error resolving decision:', errorMessage);
		return json({ error: errorMessage }, { status: 500 });
	}
};

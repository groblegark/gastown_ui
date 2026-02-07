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

	// Validate ID format (alphanumeric with dots, hyphens, underscores)
	if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
		return json({ error: 'Invalid decision ID format' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { text } = body as { text: string };

		if (!text || typeof text !== 'string' || text.trim().length === 0) {
			return json({ error: 'Guidance text is required' }, { status: 400 });
		}

		const supervisor = getProcessSupervisor();
		const bdCwd = getBdCwd();

		const args = ['decision', 'respond', id, `--guidance=${text.trim()}`, '--by=gastown_ui', '--no-daemon'];

		const result = await supervisor.bd(args, {
			timeout: 15000,
			cwd: bdCwd
		});

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to submit guidance' },
				{ status: 500 }
			);
		}

		return json({ success: true, message: 'Guidance submitted successfully' });
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		console.error('Error submitting guidance:', errorMessage);
		return json({ error: errorMessage }, { status: 500 });
	}
};

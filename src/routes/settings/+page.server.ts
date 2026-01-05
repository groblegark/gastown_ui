import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

const execAsync = promisify(exec);

interface AgentConfig {
	name: string;
	command: string;
	args: string;
	type: string;
	is_custom: boolean;
}

interface SettingsData {
	agents: AgentConfig[];
	defaultAgent: string;
	error: string | null;
}

async function getAgentList(): Promise<AgentConfig[]> {
	try {
		const { stdout } = await execAsync('gt config agent list --json');
		return JSON.parse(stdout);
	} catch {
		return [];
	}
}

async function getDefaultAgent(): Promise<string> {
	try {
		const { stdout } = await execAsync('gt config default-agent');
		// Output is "Default agent: claude"
		const match = stdout.match(/Default agent:\s*(\S+)/);
		return match?.[1] ?? 'claude';
	} catch {
		return 'claude';
	}
}

export const load: PageServerLoad = async (): Promise<SettingsData> => {
	try {
		const [agents, defaultAgent] = await Promise.all([
			getAgentList(),
			getDefaultAgent()
		]);

		return {
			agents,
			defaultAgent,
			error: null
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to load settings';
		return {
			agents: [],
			defaultAgent: 'claude',
			error: message
		};
	}
};

export const actions: Actions = {
	setDefaultAgent: async ({ request }) => {
		const data = await request.formData();
		const agent = data.get('agent');

		if (!agent || typeof agent !== 'string') {
			return fail(400, { error: 'Agent name is required' });
		}

		try {
			await execAsync(`gt config default-agent ${agent}`);
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to set default agent';
			return fail(500, { error: message });
		}
	},

	addAgent: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const command = data.get('command');

		if (!name || typeof name !== 'string' || !command || typeof command !== 'string') {
			return fail(400, { error: 'Agent name and command are required' });
		}

		try {
			await execAsync(`gt config agent set "${name}" "${command}"`);
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to add agent';
			return fail(500, { error: message });
		}
	},

	removeAgent: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string') {
			return fail(400, { error: 'Agent name is required' });
		}

		try {
			await execAsync(`gt config agent remove "${name}"`);
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to remove agent';
			return fail(500, { error: message });
		}
	}
};

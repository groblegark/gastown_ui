/**
 * Address normalization utilities
 *
 * Implements Postel's Law: "Be liberal in what you accept, conservative in what you send"
 * Normalizes mail addresses for consistent routing and display.
 */

const TOWN_LEVEL_AGENTS = new Set(['mayor', 'deacon', 'witness']);

export function normalizeAddress(addr: string): string {
	const trimmed = addr.trim();
	if (!trimmed) return '';

	if (trimmed === 'overseer' || trimmed === 'overseer/') {
		return 'overseer';
	}

	const baseAgent = trimmed.replace(/\/$/, '');
	if (TOWN_LEVEL_AGENTS.has(baseAgent)) {
		return baseAgent + '/';
	}

	const polecatMatch = trimmed.match(/^([^/]+)\/polecats\/(.+)$/);
	if (polecatMatch) {
		return `${polecatMatch[1]}/${polecatMatch[2]}`;
	}

	const crewMatch = trimmed.match(/^([^/]+)\/crew\/(.+)$/);
	if (crewMatch) {
		return `${crewMatch[1]}/${crewMatch[2]}`;
	}

	if (trimmed.endsWith('/') && !TOWN_LEVEL_AGENTS.has(baseAgent)) {
		return baseAgent;
	}

	return trimmed;
}

export function formatDisplayAddress(addr: string): string {
	const trimmed = addr.trim();
	if (!trimmed) return '';

	const withoutTrailingSlash = trimmed.replace(/\/$/, '');
	const parts = withoutTrailingSlash.split('/');
	return parts[parts.length - 1] || withoutTrailingSlash;
}

export function isValidAddress(addr: string): boolean {
	const trimmed = addr.trim();
	return trimmed.length > 0;
}

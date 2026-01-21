/**
 * ID Extraction Helpers
 *
 * Utilities for extracting bead IDs, rig names, and agent names from messages.
 */

const BEAD_ID_PATTERN = /\b(gu-[a-z0-9]+|hq-[a-z0-9]+)\b/i;
const RIG_NAME_PATTERN = /(?:rig|repository|repo):\s*["']?([a-zA-Z0-9_-]+)["']?/i;
const AGENT_NAME_PATTERN =
	/(?:agent|polecat|worker):\s*["']?([a-zA-Z0-9_-]+)["']?|polecats\/([a-zA-Z0-9_-]+)/i;

/**
 * Extract a bead ID (gu-xxx or hq-xxx format) from a message
 * @returns The first matched bead ID or null if none found
 */
export function extractBeadId(message: string): string | null {
	const match = message.match(BEAD_ID_PATTERN);
	return match ? match[1].toLowerCase() : null;
}

/**
 * Extract all bead IDs from a message
 * @returns Array of matched bead IDs
 */
export function extractAllBeadIds(message: string): string[] {
	const globalPattern = new RegExp(BEAD_ID_PATTERN.source, 'gi');
	const matches = message.match(globalPattern);
	return matches ? matches.map((id) => id.toLowerCase()) : [];
}

/**
 * Extract a rig name from a message
 * @returns The matched rig name or null if none found
 */
export function extractRigName(message: string): string | null {
	const match = message.match(RIG_NAME_PATTERN);
	return match ? match[1] : null;
}

/**
 * Extract an agent name from a message
 * @returns The matched agent name or null if none found
 */
export function extractAgentName(message: string): string | null {
	const match = message.match(AGENT_NAME_PATTERN);
	if (!match) return null;
	return match[1] || match[2];
}

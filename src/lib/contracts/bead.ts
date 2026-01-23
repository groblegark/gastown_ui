/**
 * Bead Contract - Storage vs Display Status
 *
 * IMPORTANT: Gastown only stores 'open' or 'closed' in beads.db.
 * Display statuses like 'in_progress', 'blocked', 'hooked' are DERIVED.
 *
 * Derivation rules (in precedence order):
 * 1. status === 'closed' -> 'closed'
 * 2. hook_bead === true -> 'hooked'
 * 3. blocked_by_count > 0 -> 'blocked'
 * 4. has assignee OR mrStatus === 'in_progress' -> 'in_progress'
 * 5. default -> 'open'
 *
 * Source of truth: internal/beads/beads.go
 * @see CONTRACTS.md for full documentation
 * @module contracts/bead
 */

// =============================================================================
// Storage Status (what gastown stores)
// =============================================================================

export type BeadStorageStatus = 'open' | 'closed';

export const BEAD_STORAGE_STATUSES: readonly BeadStorageStatus[] = ['open', 'closed'] as const;

const VALID_STORAGE = new Set<string>(BEAD_STORAGE_STATUSES);

export function isValidBeadStorageStatus(value: string): value is BeadStorageStatus {
	return VALID_STORAGE.has(value);
}

// =============================================================================
// Display Status (derived for UI presentation)
// =============================================================================

export type BeadDisplayStatus = 'open' | 'in_progress' | 'blocked' | 'hooked' | 'closed';

export const BEAD_DISPLAY_STATUSES: readonly BeadDisplayStatus[] = [
	'open',
	'in_progress',
	'blocked',
	'hooked',
	'closed'
] as const;

const VALID_DISPLAY = new Set<string>(BEAD_DISPLAY_STATUSES);

export function isValidBeadDisplayStatus(value: string): value is BeadDisplayStatus {
	return VALID_DISPLAY.has(value);
}

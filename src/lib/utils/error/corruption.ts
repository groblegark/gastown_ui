/**
 * Types of database corruption that can be detected.
 */
export type CorruptionType = 'INVALID_JSON' | 'MISSING_FILE' | 'SCHEMA_MISMATCH';

/**
 * A recovery action that can be taken to resolve corruption.
 */
export interface RecoveryAction {
	/** Short identifier for the action (e.g., 'backup', 'delete', 'migrate') */
	action: string;
	/** Human-readable description of what the action does */
	description: string;
}

/**
 * Information about detected database corruption.
 * All corruption types are non-retryable and require manual intervention.
 */
export interface CorruptionInfo {
	/** The type of corruption detected */
	type: CorruptionType;
	/** Human-readable message describing the corruption */
	message: string;
	/** Always false - corruption errors are not automatically recoverable */
	recoverable: false;
	/** Ordered list of recovery actions the user should take */
	recoveryActions: RecoveryAction[];
}

/** Pattern for detecting JSON parse errors */
const INVALID_JSON_PATTERN = /unexpected token|unexpected end of json|json\.parse.*unexpected/i;

/** Pattern for detecting missing file errors */
const MISSING_FILE_PATTERN = /enoent|file not found/i;

/** Pattern for detecting schema mismatch errors */
const SCHEMA_MISMATCH_PATTERN = /cannot read propert|undefined is not an object|expected.*but got/i;

/**
 * Detects database corruption from an error and returns recovery instructions.
 *
 * Corruption scenarios detected:
 * - INVALID_JSON: Database file contains malformed JSON (SyntaxError, parse failures)
 * - MISSING_FILE: Database file does not exist (ENOENT, file not found)
 * - SCHEMA_MISMATCH: Data structure doesn't match expected schema (property access on undefined)
 *
 * @param error - The error to analyze (Error object or error message string)
 * @returns CorruptionInfo with recovery actions if corruption detected, null otherwise
 *
 * @example
 * ```ts
 * const result = detectCorruption(new SyntaxError('Unexpected token'));
 * if (result) {
 *   console.log(result.type); // 'INVALID_JSON'
 *   console.log(result.recoveryActions); // Steps to recover
 * }
 * ```
 */
export function detectCorruption(error: Error | string): CorruptionInfo | null {
	const message = typeof error === 'string' ? error : error.message;

	if (message === '') {
		return null;
	}

	if (INVALID_JSON_PATTERN.test(message)) {
		return {
			type: 'INVALID_JSON',
			message: 'Database file contains invalid JSON',
			recoverable: false,
			recoveryActions: [
				{ action: 'backup', description: 'Back up the corrupted file' },
				{ action: 'delete', description: 'Delete the corrupted database file' },
				{ action: 'restart', description: 'Restart the application to recreate the database' }
			]
		};
	}

	if (MISSING_FILE_PATTERN.test(message)) {
		return {
			type: 'MISSING_FILE',
			message: 'Database file is missing',
			recoverable: false,
			recoveryActions: [
				{ action: 'create', description: 'Create a new database file' },
				{ action: 'restore', description: 'Restore from backup if available' }
			]
		};
	}

	if (SCHEMA_MISMATCH_PATTERN.test(message)) {
		return {
			type: 'SCHEMA_MISMATCH',
			message: 'Database schema does not match expected format',
			recoverable: false,
			recoveryActions: [
				{ action: 'migrate', description: 'Run database migration to update schema' },
				{ action: 'backup', description: 'Back up current data before migration' },
				{ action: 'reset', description: 'Reset database to default state if migration fails' }
			]
		};
	}

	return null;
}

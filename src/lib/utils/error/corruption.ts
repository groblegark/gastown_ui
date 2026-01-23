export type CorruptionType = 'INVALID_JSON' | 'MISSING_FILE' | 'SCHEMA_MISMATCH';

export interface RecoveryAction {
	action: string;
	description: string;
}

export interface CorruptionInfo {
	type: CorruptionType;
	message: string;
	recoverable: boolean;
	recoveryActions: RecoveryAction[];
}

export function detectCorruption(error: Error | string): CorruptionInfo | null {
	const message = typeof error === 'string' ? error : error.message;

	if (message === '') {
		return null;
	}

	// INVALID_JSON detection
	if (/unexpected token|unexpected end of json|json\.parse.*unexpected/i.test(message)) {
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

	// MISSING_FILE detection
	if (/enoent|file not found/i.test(message)) {
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

	// SCHEMA_MISMATCH detection
	if (
		/cannot read propert|undefined is not an object|expected.*but got/i.test(message)
	) {
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

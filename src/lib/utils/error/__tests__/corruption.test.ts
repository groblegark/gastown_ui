import { describe, it, expect } from 'vitest';
import {
	detectCorruption,
	type CorruptionInfo,
	type CorruptionType,
	type RecoveryAction
} from '../corruption';

describe('detectCorruption', () => {
	describe('parse error detection', () => {
		it('detects JSON parse error from SyntaxError', () => {
			const error = new SyntaxError('Unexpected token < in JSON at position 0');
			const result = detectCorruption(error);

			expect(result).not.toBeNull();
			expect(result?.type).toBe('INVALID_JSON');
			expect(result?.message).toBe('Database file contains invalid JSON');
			expect(result?.recoverable).toBe(false);
			expect(result?.recoveryActions).toEqual([
				{ action: 'backup', description: 'Back up the corrupted file' },
				{ action: 'delete', description: 'Delete the corrupted database file' },
				{ action: 'restart', description: 'Restart the application to recreate the database' }
			]);
		});

		it('detects JSON parse error from string message', () => {
			const result = detectCorruption('Unexpected end of JSON input');

			expect(result).not.toBeNull();
			expect(result?.type).toBe('INVALID_JSON');
		});

		it('detects invalid JSON structure error', () => {
			const result = detectCorruption('JSON.parse: unexpected character at line 1 column 1');

			expect(result).not.toBeNull();
			expect(result?.type).toBe('INVALID_JSON');
		});
	});

	describe('missing file detection', () => {
		it('detects ENOENT error', () => {
			const error = new Error("ENOENT: no such file or directory, open '/path/to/file'");
			const result = detectCorruption(error);

			expect(result).not.toBeNull();
			expect(result?.type).toBe('MISSING_FILE');
			expect(result?.message).toBe('Database file is missing');
			expect(result?.recoverable).toBe(false);
			expect(result?.recoveryActions).toEqual([
				{ action: 'create', description: 'Create a new database file' },
				{ action: 'restore', description: 'Restore from backup if available' }
			]);
		});

		it('detects file not found error', () => {
			const result = detectCorruption('File not found: beads.json');

			expect(result).not.toBeNull();
			expect(result?.type).toBe('MISSING_FILE');
		});
	});

	describe('schema mismatch detection', () => {
		it('detects missing required field error', () => {
			const error = new Error("Cannot read properties of undefined (reading 'id')");
			const result = detectCorruption(error);

			expect(result).not.toBeNull();
			expect(result?.type).toBe('SCHEMA_MISMATCH');
			expect(result?.message).toBe('Database schema does not match expected format');
			expect(result?.recoverable).toBe(false);
			expect(result?.recoveryActions).toEqual([
				{ action: 'migrate', description: 'Run database migration to update schema' },
				{ action: 'backup', description: 'Back up current data before migration' },
				{ action: 'reset', description: 'Reset database to default state if migration fails' }
			]);
		});

		it('detects property access on null error', () => {
			const result = detectCorruption("Cannot read property 'type' of null");

			expect(result).not.toBeNull();
			expect(result?.type).toBe('SCHEMA_MISMATCH');
		});

		it('detects undefined is not an object error', () => {
			const result = detectCorruption("undefined is not an object (evaluating 'data.items')");

			expect(result).not.toBeNull();
			expect(result?.type).toBe('SCHEMA_MISMATCH');
		});

		it('detects type error with expected type', () => {
			const result = detectCorruption('Expected array but got object');

			expect(result).not.toBeNull();
			expect(result?.type).toBe('SCHEMA_MISMATCH');
		});
	});

	describe('non-corruption errors', () => {
		it('returns null for network errors', () => {
			const result = detectCorruption('ECONNREFUSED: Connection refused');

			expect(result).toBeNull();
		});

		it('returns null for timeout errors', () => {
			const result = detectCorruption('Request timed out after 30000ms');

			expect(result).toBeNull();
		});

		it('returns null for generic errors', () => {
			const result = detectCorruption('Something went wrong');

			expect(result).toBeNull();
		});

		it('returns null for authentication errors', () => {
			const result = detectCorruption('401 Unauthorized');

			expect(result).toBeNull();
		});

		it('returns null for empty string', () => {
			const result = detectCorruption('');

			expect(result).toBeNull();
		});
	});

	describe('CorruptionInfo fields', () => {
		it('includes all required fields for INVALID_JSON', () => {
			const result = detectCorruption('Unexpected token');

			expect(result).toHaveProperty('type');
			expect(result).toHaveProperty('message');
			expect(result).toHaveProperty('recoverable');
			expect(result).toHaveProperty('recoveryActions');

			expect(typeof result?.type).toBe('string');
			expect(typeof result?.message).toBe('string');
			expect(typeof result?.recoverable).toBe('boolean');
			expect(Array.isArray(result?.recoveryActions)).toBe(true);
		});

		it('recoveryActions have action and description', () => {
			const result = detectCorruption('ENOENT: no such file');

			expect(result?.recoveryActions.length).toBeGreaterThan(0);
			for (const action of result?.recoveryActions ?? []) {
				expect(action).toHaveProperty('action');
				expect(action).toHaveProperty('description');
				expect(typeof action.action).toBe('string');
				expect(typeof action.description).toBe('string');
			}
		});

		it('all corruption types are non-retryable', () => {
			const jsonResult = detectCorruption('Unexpected token');
			const fileResult = detectCorruption('ENOENT: no such file');
			const schemaResult = detectCorruption("Cannot read properties of undefined");

			expect(jsonResult?.recoverable).toBe(false);
			expect(fileResult?.recoverable).toBe(false);
			expect(schemaResult?.recoverable).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('handles Error objects with stack traces', () => {
			const error = new SyntaxError('Unexpected token');
			error.stack = 'SyntaxError: Unexpected token\n    at JSON.parse (<anonymous>)';
			const result = detectCorruption(error);

			expect(result).not.toBeNull();
			expect(result?.type).toBe('INVALID_JSON');
		});

		it('handles nested error messages', () => {
			const result = detectCorruption('Error: ENOENT: no such file or directory');

			expect(result).not.toBeNull();
			expect(result?.type).toBe('MISSING_FILE');
		});

		it('is case insensitive for pattern matching', () => {
			const result1 = detectCorruption('UNEXPECTED TOKEN');
			const result2 = detectCorruption('unexpected token');

			expect(result1?.type).toBe('INVALID_JSON');
			expect(result2?.type).toBe('INVALID_JSON');
		});
	});
});

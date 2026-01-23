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

			expect(result).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});

		it('detects JSON parse error from string message', () => {
			const result = detectCorruption('Unexpected end of JSON input');

			expect(result).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});

		it('detects invalid JSON structure error', () => {
			const result = detectCorruption('JSON.parse: unexpected character at line 1 column 1');

			expect(result).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});
	});

	describe('missing file detection', () => {
		it('detects ENOENT error', () => {
			const error = new Error("ENOENT: no such file or directory, open '/path/to/file'");
			const result = detectCorruption(error);

			expect(result).toEqual({
				type: 'MISSING_FILE',
				message: 'Database file is missing',
				recoverable: false,
				recoveryActions: [
					{ action: 'create', description: 'Create a new database file' },
					{ action: 'restore', description: 'Restore from backup if available' }
				]
			});
		});

		it('detects file not found error', () => {
			const result = detectCorruption('File not found: beads.json');

			expect(result).toEqual({
				type: 'MISSING_FILE',
				message: 'Database file is missing',
				recoverable: false,
				recoveryActions: [
					{ action: 'create', description: 'Create a new database file' },
					{ action: 'restore', description: 'Restore from backup if available' }
				]
			});
		});
	});

	describe('schema mismatch detection', () => {
		it('detects missing required field error', () => {
			const error = new Error("Cannot read properties of undefined (reading 'id')");
			const result = detectCorruption(error);

			expect(result).toEqual({
				type: 'SCHEMA_MISMATCH',
				message: 'Database schema does not match expected format',
				recoverable: false,
				recoveryActions: [
					{ action: 'migrate', description: 'Run database migration to update schema' },
					{ action: 'backup', description: 'Back up current data before migration' },
					{ action: 'reset', description: 'Reset database to default state if migration fails' }
				]
			});
		});

		it('detects property access on null error', () => {
			const result = detectCorruption("Cannot read property 'type' of null");

			expect(result).toEqual({
				type: 'SCHEMA_MISMATCH',
				message: 'Database schema does not match expected format',
				recoverable: false,
				recoveryActions: [
					{ action: 'migrate', description: 'Run database migration to update schema' },
					{ action: 'backup', description: 'Back up current data before migration' },
					{ action: 'reset', description: 'Reset database to default state if migration fails' }
				]
			});
		});

		it('detects undefined is not an object error', () => {
			const result = detectCorruption("undefined is not an object (evaluating 'data.items')");

			expect(result).toEqual({
				type: 'SCHEMA_MISMATCH',
				message: 'Database schema does not match expected format',
				recoverable: false,
				recoveryActions: [
					{ action: 'migrate', description: 'Run database migration to update schema' },
					{ action: 'backup', description: 'Back up current data before migration' },
					{ action: 'reset', description: 'Reset database to default state if migration fails' }
				]
			});
		});

		it('detects type error with expected type', () => {
			const result = detectCorruption('Expected array but got object');

			expect(result).toEqual({
				type: 'SCHEMA_MISMATCH',
				message: 'Database schema does not match expected format',
				recoverable: false,
				recoveryActions: [
					{ action: 'migrate', description: 'Run database migration to update schema' },
					{ action: 'backup', description: 'Back up current data before migration' },
					{ action: 'reset', description: 'Reset database to default state if migration fails' }
				]
			});
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
		it('INVALID_JSON has correct structure', () => {
			const result = detectCorruption('Unexpected token');

			expect(result).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});

		it('MISSING_FILE has correct recovery actions structure', () => {
			const result = detectCorruption('ENOENT: no such file');

			expect(result).toEqual({
				type: 'MISSING_FILE',
				message: 'Database file is missing',
				recoverable: false,
				recoveryActions: [
					{ action: 'create', description: 'Create a new database file' },
					{ action: 'restore', description: 'Restore from backup if available' }
				]
			});
		});

		it('all corruption types have recoverable set to false', () => {
			const jsonResult = detectCorruption('Unexpected token');
			const fileResult = detectCorruption('ENOENT: no such file');
			const schemaResult = detectCorruption("Cannot read properties of undefined");

			expect(jsonResult).toMatchObject({ recoverable: false });
			expect(fileResult).toMatchObject({ recoverable: false });
			expect(schemaResult).toMatchObject({ recoverable: false });
		});
	});

	describe('edge cases', () => {
		it('handles Error objects with stack traces', () => {
			const error = new SyntaxError('Unexpected token');
			error.stack = 'SyntaxError: Unexpected token\n    at JSON.parse (<anonymous>)';
			const result = detectCorruption(error);

			expect(result).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});

		it('handles nested error messages', () => {
			const result = detectCorruption('Error: ENOENT: no such file or directory');

			expect(result).toEqual({
				type: 'MISSING_FILE',
				message: 'Database file is missing',
				recoverable: false,
				recoveryActions: [
					{ action: 'create', description: 'Create a new database file' },
					{ action: 'restore', description: 'Restore from backup if available' }
				]
			});
		});

		it('is case insensitive for pattern matching', () => {
			const result1 = detectCorruption('UNEXPECTED TOKEN');
			const result2 = detectCorruption('unexpected token');

			expect(result1).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
			expect(result2).toEqual({
				type: 'INVALID_JSON',
				message: 'Database file contains invalid JSON',
				recoverable: false,
				recoveryActions: [
					{ action: 'backup', description: 'Back up the corrupted file' },
					{ action: 'delete', description: 'Delete the corrupted database file' },
					{ action: 'restart', description: 'Restart the application to recreate the database' }
				]
			});
		});
	});
});

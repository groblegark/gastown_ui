import { describe, it, expect } from 'vitest';
import {
	detectConflict,
	createOptimisticUpdate,
	resolveConflict,
	ConflictError,
	type OptimisticUpdate,
	type ConflictResult,
	type ConflictResolutionStrategy
} from '../index';

describe('OptimisticUpdate interface', () => {
	it('has correct structure with all required fields', () => {
		const update: OptimisticUpdate<{ name: string }> = {
			id: 'update-1',
			localVersion: 1,
			serverVersion: 1,
			localData: { name: 'Alice' },
			serverData: { name: 'Alice' },
			status: 'pending',
			timestamp: 1234567890
		};

		expect(update).toEqual({
			id: 'update-1',
			localVersion: 1,
			serverVersion: 1,
			localData: { name: 'Alice' },
			serverData: { name: 'Alice' },
			status: 'pending',
			timestamp: 1234567890
		});
	});

	it('supports all status types', () => {
		const pending: OptimisticUpdate<string> = {
			id: '1',
			localVersion: 1,
			serverVersion: 1,
			localData: 'test',
			serverData: 'test',
			status: 'pending',
			timestamp: 0
		};

		const synced: OptimisticUpdate<string> = {
			id: '2',
			localVersion: 2,
			serverVersion: 2,
			localData: 'test',
			serverData: 'test',
			status: 'synced',
			timestamp: 0
		};

		const conflicted: OptimisticUpdate<string> = {
			id: '3',
			localVersion: 2,
			serverVersion: 3,
			localData: 'local',
			serverData: 'server',
			status: 'conflicted',
			timestamp: 0
		};

		expect(pending.status).toBe('pending');
		expect(synced.status).toBe('synced');
		expect(conflicted.status).toBe('conflicted');
	});
});

describe('ConflictResult interface', () => {
	it('has correct structure for conflict detected', () => {
		const result: ConflictResult = {
			hasConflict: true,
			localVersion: 2,
			serverVersion: 3,
			message: 'Version mismatch detected'
		};

		expect(result).toEqual({
			hasConflict: true,
			localVersion: 2,
			serverVersion: 3,
			message: 'Version mismatch detected'
		});
	});

	it('has correct structure for no conflict', () => {
		const result: ConflictResult = {
			hasConflict: false,
			localVersion: 5,
			serverVersion: 5,
			message: 'Versions match'
		};

		expect(result).toEqual({
			hasConflict: false,
			localVersion: 5,
			serverVersion: 5,
			message: 'Versions match'
		});
	});
});

describe('detectConflict', () => {
	describe('conflict detection', () => {
		it('detects conflict when server version is higher', () => {
			const result = detectConflict(2, 5);

			expect(result).toEqual({
				hasConflict: true,
				localVersion: 2,
				serverVersion: 5,
				message: 'Server version (5) is ahead of local version (2)'
			});
		});

		it('detects conflict when local version is higher (stale server)', () => {
			const result = detectConflict(5, 2);

			expect(result).toEqual({
				hasConflict: true,
				localVersion: 5,
				serverVersion: 2,
				message: 'Local version (5) is ahead of server version (2)'
			});
		});

		it('reports no conflict when versions match', () => {
			const result = detectConflict(3, 3);

			expect(result).toEqual({
				hasConflict: false,
				localVersion: 3,
				serverVersion: 3,
				message: 'Versions match'
			});
		});

		it('reports no conflict for version zero matching', () => {
			const result = detectConflict(0, 0);

			expect(result).toEqual({
				hasConflict: false,
				localVersion: 0,
				serverVersion: 0,
				message: 'Versions match'
			});
		});
	});

	describe('error cases', () => {
		it('throws ConflictError for negative local version', () => {
			expect(() => detectConflict(-1, 5)).toThrow(ConflictError);
			expect(() => detectConflict(-1, 5)).toThrow('Version numbers cannot be negative');
		});

		it('throws ConflictError for negative server version', () => {
			expect(() => detectConflict(5, -1)).toThrow(ConflictError);
			expect(() => detectConflict(5, -1)).toThrow('Version numbers cannot be negative');
		});

		it('throws ConflictError for both negative versions', () => {
			expect(() => detectConflict(-1, -2)).toThrow(ConflictError);
			expect(() => detectConflict(-1, -2)).toThrow('Version numbers cannot be negative');
		});
	});

	describe('edge cases', () => {
		it('handles large version numbers', () => {
			const result = detectConflict(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

			expect(result).toEqual({
				hasConflict: false,
				localVersion: Number.MAX_SAFE_INTEGER,
				serverVersion: Number.MAX_SAFE_INTEGER,
				message: 'Versions match'
			});
		});

		it('handles version difference of 1', () => {
			const result = detectConflict(5, 6);

			expect(result).toEqual({
				hasConflict: true,
				localVersion: 5,
				serverVersion: 6,
				message: 'Server version (6) is ahead of local version (5)'
			});
		});
	});
});

describe('createOptimisticUpdate', () => {
	it('creates update with correct initial state', () => {
		const data = { name: 'Alice', age: 30 };
		const result = createOptimisticUpdate('user-1', data, 1);

		expect(result).toMatchObject({
			id: 'user-1',
			localVersion: 1,
			serverVersion: 1,
			localData: { name: 'Alice', age: 30 },
			serverData: { name: 'Alice', age: 30 },
			status: 'pending'
		});
		expect(typeof result.timestamp).toBe('number');
		expect(result.timestamp).toBeGreaterThan(0);
	});

	it('creates update with version zero', () => {
		const result = createOptimisticUpdate('item-0', 'test', 0);

		expect(result).toMatchObject({
			id: 'item-0',
			localVersion: 0,
			serverVersion: 0,
			localData: 'test',
			serverData: 'test',
			status: 'pending'
		});
	});

	it('handles complex nested data', () => {
		const data = {
			user: { name: 'Bob', roles: ['admin', 'user'] },
			settings: { theme: 'dark' }
		};
		const result = createOptimisticUpdate('config-1', data, 5);

		expect(result.localData).toEqual(data);
		expect(result.serverData).toEqual(data);
	});

	it('handles array data', () => {
		const data = [1, 2, 3, 4, 5];
		const result = createOptimisticUpdate('list-1', data, 1);

		expect(result.localData).toEqual([1, 2, 3, 4, 5]);
		expect(result.serverData).toEqual([1, 2, 3, 4, 5]);
	});

	it('handles null data', () => {
		const result = createOptimisticUpdate('empty-1', null, 0);

		expect(result.localData).toBeNull();
		expect(result.serverData).toBeNull();
	});

	describe('error cases', () => {
		it('throws ConflictError for empty id', () => {
			expect(() => createOptimisticUpdate('', 'data', 1)).toThrow(ConflictError);
			expect(() => createOptimisticUpdate('', 'data', 1)).toThrow('Update ID cannot be empty');
		});

		it('throws ConflictError for negative version', () => {
			expect(() => createOptimisticUpdate('id-1', 'data', -1)).toThrow(ConflictError);
			expect(() => createOptimisticUpdate('id-1', 'data', -1)).toThrow(
				'Version number cannot be negative'
			);
		});
	});
});

describe('resolveConflict', () => {
	type TestData = { name: string; value: number };

	const createTestUpdate = (
		localData: TestData,
		serverData: TestData,
		localVersion: number,
		serverVersion: number
	): OptimisticUpdate<TestData> => ({
		id: 'test-1',
		localVersion,
		serverVersion,
		localData,
		serverData,
		status: 'conflicted',
		timestamp: Date.now()
	});

	describe('local-wins strategy', () => {
		it('resolves conflict by keeping local data', () => {
			const update = createTestUpdate(
				{ name: 'Local', value: 100 },
				{ name: 'Server', value: 200 },
				2,
				3
			);

			const result = resolveConflict(update, 'local-wins');

			expect(result).toMatchObject({
				id: 'test-1',
				localData: { name: 'Local', value: 100 },
				serverData: { name: 'Local', value: 100 },
				localVersion: 4,
				serverVersion: 4,
				status: 'synced'
			});
		});

		it('updates version to be max + 1', () => {
			const update = createTestUpdate({ name: 'L', value: 1 }, { name: 'S', value: 2 }, 5, 10);

			const result = resolveConflict(update, 'local-wins');

			expect(result.localVersion).toBe(11);
			expect(result.serverVersion).toBe(11);
		});
	});

	describe('server-wins strategy', () => {
		it('resolves conflict by keeping server data', () => {
			const update = createTestUpdate(
				{ name: 'Local', value: 100 },
				{ name: 'Server', value: 200 },
				2,
				3
			);

			const result = resolveConflict(update, 'server-wins');

			expect(result).toMatchObject({
				id: 'test-1',
				localData: { name: 'Server', value: 200 },
				serverData: { name: 'Server', value: 200 },
				localVersion: 4,
				serverVersion: 4,
				status: 'synced'
			});
		});
	});

	describe('merge strategy', () => {
		it('resolves conflict by merging data (server takes precedence for conflicts)', () => {
			const update = createTestUpdate(
				{ name: 'Local', value: 100 },
				{ name: 'Server', value: 200 },
				2,
				3
			);

			const result = resolveConflict(update, 'merge');

			// Merge behavior: spread local over server (server base, local overlays)
			// Actually for merge, server wins for conflicts but local non-conflicting fields preserved
			// In this case both have same fields, so server wins
			expect(result).toMatchObject({
				id: 'test-1',
				localData: { name: 'Server', value: 200 },
				serverData: { name: 'Server', value: 200 },
				status: 'synced'
			});
		});

		it('merges by combining server base with local overlay', () => {
			type ExtendedData = { name: string; value: number; extra?: string };
			const localData: ExtendedData = { name: 'Local', value: 100, extra: 'local-only' };
			const serverData: ExtendedData = { name: 'Server', value: 200 };

			const update: OptimisticUpdate<ExtendedData> = {
				id: 'test-2',
				localVersion: 2,
				serverVersion: 3,
				localData,
				serverData,
				status: 'conflicted',
				timestamp: Date.now()
			};

			const result = resolveConflict(update, 'merge');

			// Merge should keep local's extra field while taking server's conflicting values
			expect(result.localData).toEqual({
				name: 'Server',
				value: 200,
				extra: 'local-only'
			});
		});
	});

	describe('custom merge function', () => {
		it('uses custom merge function when provided', () => {
			const update = createTestUpdate(
				{ name: 'Local', value: 100 },
				{ name: 'Server', value: 200 },
				2,
				3
			);

			const customMerge = (local: TestData, server: TestData): TestData => ({
				name: `${local.name}-${server.name}`,
				value: local.value + server.value
			});

			const result = resolveConflict(update, 'merge', customMerge);

			expect(result.localData).toEqual({
				name: 'Local-Server',
				value: 300
			});
		});
	});

	describe('error cases', () => {
		it('throws ConflictError for invalid strategy', () => {
			const update = createTestUpdate({ name: 'L', value: 1 }, { name: 'S', value: 2 }, 1, 2);

			expect(() => resolveConflict(update, 'invalid' as ConflictResolutionStrategy)).toThrow(
				ConflictError
			);
			expect(() => resolveConflict(update, 'invalid' as ConflictResolutionStrategy)).toThrow(
				'Invalid resolution strategy: invalid'
			);
		});
	});
});

describe('ConflictError', () => {
	it('has correct name', () => {
		const err = new ConflictError('test error');
		expect(err.name).toBe('ConflictError');
	});

	it('has correct message', () => {
		const err = new ConflictError('Version mismatch detected');
		expect(err.message).toBe('Version mismatch detected');
	});

	it('inherits from Error properly', () => {
		const err = new ConflictError('test message');
		expect(err).toBeInstanceOf(ConflictError);
		expect(err.stack).toMatch(/ConflictError: test message/);
		expect(Object.getPrototypeOf(Object.getPrototypeOf(err))).toBe(Error.prototype);
	});
});

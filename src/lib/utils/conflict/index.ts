/**
 * Conflict detection utilities for handling concurrent modifications
 * with optimistic updates and version tracking.
 *
 * @module conflict
 */

/**
 * Status of an optimistic update.
 * - `pending`: Update has been applied locally but not yet confirmed by server
 * - `synced`: Update has been confirmed and versions match
 * - `conflicted`: Local and server versions have diverged
 */
export type OptimisticUpdateStatus = 'pending' | 'synced' | 'conflicted';

/**
 * Represents an optimistic update with version tracking for conflict detection.
 *
 * @template T - The type of data being tracked
 */
export interface OptimisticUpdate<T> {
	/** Unique identifier for this update */
	id: string;
	/** Current local version number */
	localVersion: number;
	/** Last known server version number */
	serverVersion: number;
	/** Local copy of the data (may include pending changes) */
	localData: T;
	/** Server copy of the data (last known state) */
	serverData: T;
	/** Current status of the update */
	status: OptimisticUpdateStatus;
	/** Timestamp of when this update was created/modified */
	timestamp: number;
}

/**
 * Result of a conflict detection check.
 */
export interface ConflictResult {
	/** Whether a conflict was detected */
	hasConflict: boolean;
	/** The local version that was checked */
	localVersion: number;
	/** The server version that was checked */
	serverVersion: number;
	/** Human-readable description of the result */
	message: string;
}

/**
 * Strategy for resolving conflicts between local and server data.
 * - `local-wins`: Keep local changes, discard server changes
 * - `server-wins`: Accept server changes, discard local changes
 * - `merge`: Attempt to merge both (uses custom merge function if provided)
 */
export type ConflictResolutionStrategy = 'local-wins' | 'server-wins' | 'merge';

/**
 * Error thrown when conflict-related operations fail.
 */
export class ConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConflictError';
	}
}

/**
 * Detects whether there is a version conflict between local and server versions.
 *
 * @param localVersion - The local version number
 * @param serverVersion - The server version number
 * @returns A ConflictResult indicating whether there is a conflict
 * @throws {ConflictError} If either version number is negative
 *
 * @example
 * const result = detectConflict(2, 3);
 * // result.hasConflict === true
 * // result.message === "Server version (3) is ahead of local version (2)"
 */
export function detectConflict(localVersion: number, serverVersion: number): ConflictResult {
	if (localVersion < 0 || serverVersion < 0) {
		throw new ConflictError('Version numbers cannot be negative');
	}

	if (localVersion === serverVersion) {
		return {
			hasConflict: false,
			localVersion,
			serverVersion,
			message: 'Versions match'
		};
	}

	if (serverVersion > localVersion) {
		return {
			hasConflict: true,
			localVersion,
			serverVersion,
			message: `Server version (${serverVersion}) is ahead of local version (${localVersion})`
		};
	}

	return {
		hasConflict: true,
		localVersion,
		serverVersion,
		message: `Local version (${localVersion}) is ahead of server version (${serverVersion})`
	};
}

/**
 * Creates a new optimistic update with the given data and version.
 * The update starts in 'pending' status with matching local and server data.
 *
 * @template T - The type of data being tracked
 * @param id - Unique identifier for this update
 * @param data - The initial data
 * @param version - The initial version number
 * @returns A new OptimisticUpdate in pending status
 * @throws {ConflictError} If id is empty or version is negative
 *
 * @example
 * const update = createOptimisticUpdate('user-1', { name: 'Alice' }, 1);
 * // update.status === 'pending'
 * // update.localVersion === 1
 */
export function createOptimisticUpdate<T>(id: string, data: T, version: number): OptimisticUpdate<T> {
	if (id === '') {
		throw new ConflictError('Update ID cannot be empty');
	}

	if (version < 0) {
		throw new ConflictError('Version number cannot be negative');
	}

	return {
		id,
		localVersion: version,
		serverVersion: version,
		localData: data,
		serverData: data,
		status: 'pending',
		timestamp: Date.now()
	};
}

/**
 * Resolves a conflict using the specified strategy.
 *
 * @template T - The type of data being tracked
 * @param update - The optimistic update with conflicting versions
 * @param strategy - The resolution strategy to use
 * @param customMerge - Optional custom merge function for 'merge' strategy
 * @returns A new OptimisticUpdate with the conflict resolved and status set to 'synced'
 * @throws {ConflictError} If an invalid strategy is provided
 *
 * @example
 * const resolved = resolveConflict(conflictedUpdate, 'local-wins');
 * // resolved.status === 'synced'
 * // resolved.localData === resolved.serverData
 *
 * @example
 * // With custom merge function
 * const resolved = resolveConflict(update, 'merge', (local, server) => ({
 *   ...server,
 *   ...local,
 *   merged: true
 * }));
 */
export function resolveConflict<T>(
	update: OptimisticUpdate<T>,
	strategy: ConflictResolutionStrategy,
	customMerge?: (local: T, server: T) => T
): OptimisticUpdate<T> {
	const newVersion = Math.max(update.localVersion, update.serverVersion) + 1;
	let resolvedData: T;

	switch (strategy) {
		case 'local-wins':
			resolvedData = update.localData;
			break;
		case 'server-wins':
			resolvedData = update.serverData;
			break;
		case 'merge':
			if (customMerge) {
				resolvedData = customMerge(update.localData, update.serverData);
			} else {
				// Default merge: server base with local overlay (for object types)
				if (
					typeof update.localData === 'object' &&
					update.localData !== null &&
					typeof update.serverData === 'object' &&
					update.serverData !== null
				) {
					resolvedData = { ...update.localData, ...update.serverData } as T;
				} else {
					resolvedData = update.serverData;
				}
			}
			break;
		default:
			throw new ConflictError(`Invalid resolution strategy: ${strategy}`);
	}

	return {
		...update,
		localData: resolvedData,
		serverData: resolvedData,
		localVersion: newVersion,
		serverVersion: newVersion,
		status: 'synced',
		timestamp: Date.now()
	};
}

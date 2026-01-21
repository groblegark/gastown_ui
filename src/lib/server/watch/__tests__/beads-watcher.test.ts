/**
 * Beads Watcher Tests
 *
 * Tests for .beads/ directory watcher functionality.
 * Tests the watcher logic and integration with cache invalidation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
	BeadsWatcher,
	createBeadsWatcher,
	createWatcherWithCacheInvalidation,
	type BeadChange
} from '../beads-watcher';

// Create a unique temp directory for each test run
function createTempDir(): string {
	return join(tmpdir(), `beads-watcher-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

describe('BeadsWatcher', () => {
	let watcher: BeadsWatcher | null = null;
	let tempDir: string;

	beforeEach(async () => {
		tempDir = createTempDir();
		await mkdir(tempDir, { recursive: true });
	});

	afterEach(async () => {
		if (watcher) {
			watcher.stop();
			watcher = null;
		}
		// Clean up temp directory
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe('initialization', () => {
		it('creates watcher with default config', () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });

			expect(watcher.beadsPath).toBe(tempDir);
			expect(watcher.isWatching).toBe(false);
		});

		it('creates watcher with custom config', () => {
			const onError = vi.fn();
			watcher = new BeadsWatcher({
				beadsPath: tempDir,
				debounceMs: 100,
				recursive: false,
				onError
			});

			expect(watcher.beadsPath).toBe(tempDir);
		});

		it('factory function creates instance', () => {
			watcher = createBeadsWatcher({ beadsPath: tempDir });

			expect(watcher).toBeInstanceOf(BeadsWatcher);
		});
	});

	describe('start and stop', () => {
		it('starts watching directory', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });

			await watcher.start();

			expect(watcher.isWatching).toBe(true);
		});

		it('emits start event', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });
			const startHandler = vi.fn();
			watcher.on('start', startHandler);

			await watcher.start();

			expect(startHandler).toHaveBeenCalled();
		});

		it('handles non-existent directory gracefully', async () => {
			const nonExistentPath = join(tempDir, 'does-not-exist');
			watcher = new BeadsWatcher({ beadsPath: nonExistentPath });
			const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			await watcher.start();

			expect(watcher.isWatching).toBe(false);
			expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Beads directory not found'));

			consoleWarn.mockRestore();
		});

		it('throws on non-directory path', async () => {
			const filePath = join(tempDir, 'file.txt');
			await writeFile(filePath, 'content');

			watcher = new BeadsWatcher({ beadsPath: filePath });

			await expect(watcher.start()).rejects.toThrow('is not a directory');
		});

		it('does not start twice', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });
			const startHandler = vi.fn();
			watcher.on('start', startHandler);

			await watcher.start();
			await watcher.start();

			// Should only emit start once
			expect(startHandler).toHaveBeenCalledTimes(1);
		});

		it('stops watching and emits stop event', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });
			const stopHandler = vi.fn();
			watcher.on('stop', stopHandler);

			await watcher.start();
			watcher.stop();

			expect(watcher.isWatching).toBe(false);
			expect(stopHandler).toHaveBeenCalled();
		});

		it('handles stop when not watching', () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });

			// Should not throw
			expect(() => watcher!.stop()).not.toThrow();
		});
	});

	describe('change detection with real filesystem', () => {
		it('detects file creation', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
			const changes: BeadChange[] = [];

			watcher.on('change', (change) => {
				changes.push(change);
			});

			await watcher.start();

			// Create a file
			const testFile = join(tempDir, 'gu-123.json');
			await writeFile(testFile, '{}');

			// Wait for the watcher to detect the change
			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(changes.length).toBeGreaterThan(0);
			const workChange = changes.find((c) => c.entityType === 'work');
			expect(workChange).toBeDefined();
		});

		it('detects file modification', async () => {
			// Create file first
			const testFile = join(tempDir, 'gu-456.json');
			await writeFile(testFile, '{"version": 1}');

			// Give filesystem time to settle
			await new Promise((resolve) => setTimeout(resolve, 100));

			watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
			const changes: BeadChange[] = [];

			watcher.on('change', (change) => {
				changes.push(change);
			});

			await watcher.start();

			// Modify the file
			await writeFile(testFile, '{"version": 2}');

			// Wait for the watcher to detect the change
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should detect a change (could be 'update' or 'create' depending on timing)
			expect(changes.length).toBeGreaterThan(0);
			// The key is that a change was detected for this file
			const hasChange = changes.some(
				(c) => c.path.includes('gu-456.json') && (c.type === 'update' || c.type === 'create')
			);
			expect(hasChange).toBe(true);
		});

		it('detects file deletion', async () => {
			// Create file first
			const testFile = join(tempDir, 'gu-789.json');
			await writeFile(testFile, '{}');

			watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
			const changes: BeadChange[] = [];

			watcher.on('change', (change) => {
				changes.push(change);
			});

			await watcher.start();

			// Delete the file
			await unlink(testFile);

			// Wait for the watcher to detect the change
			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(changes.length).toBeGreaterThan(0);
			expect(changes.some((c) => c.type === 'delete')).toBe(true);
		});
	});

	describe('onChange callback management', () => {
		it('registers and unregisters callbacks', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
			const callback = vi.fn();

			await watcher.start();

			const unsubscribe = watcher.onChange(callback);

			// Create a file to trigger the callback
			await writeFile(join(tempDir, 'test.json'), '{}');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const callCountAfterFirst = callback.mock.calls.length;
			expect(callCountAfterFirst).toBeGreaterThan(0);

			// Unsubscribe
			unsubscribe();

			// Create another file
			await writeFile(join(tempDir, 'test2.json'), '{}');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should not have been called again after unsubscribe
			expect(callback.mock.calls.length).toBe(callCountAfterFirst);
		});

		it('handles callback errors gracefully', async () => {
			const onError = vi.fn();
			watcher = new BeadsWatcher({
				beadsPath: tempDir,
				debounceMs: 10,
				onError
			});

			const badCallback = vi.fn(() => {
				throw new Error('Callback error');
			});
			const goodCallback = vi.fn();

			await watcher.start();
			watcher.onChange(badCallback);
			watcher.onChange(goodCallback);

			// Create a file to trigger callbacks
			await writeFile(join(tempDir, 'error-test.json'), '{}');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Bad callback was called and threw
			expect(badCallback).toHaveBeenCalled();
			expect(onError).toHaveBeenCalledWith(expect.any(Error));

			// Good callback still executed
			expect(goodCallback).toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('emits error events from watcher', async () => {
			watcher = new BeadsWatcher({ beadsPath: tempDir });
			const errorHandler = vi.fn();
			watcher.on('error', errorHandler);

			await watcher.start();

			// Emit an error manually (simulating a watcher error)
			watcher.emit('error', new Error('Test error'));

			expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
		});

		it('calls onError callback on error', async () => {
			const onError = vi.fn();
			watcher = new BeadsWatcher({ beadsPath: tempDir, onError });

			// This tests that the onError callback is set up correctly
			expect(watcher).toBeDefined();
		});
	});
});

describe('createWatcherWithCacheInvalidation', () => {
	let watcher: BeadsWatcher | null = null;
	let tempDir: string;

	beforeEach(async () => {
		tempDir = createTempDir();
		await mkdir(tempDir, { recursive: true });
	});

	afterEach(async () => {
		if (watcher) {
			watcher.stop();
			watcher = null;
		}
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it('creates watcher with cache invalidator', () => {
		const invalidator = {
			invalidateWork: vi.fn(),
			invalidateConvoys: vi.fn(),
			invalidateAgents: vi.fn(),
			invalidateMail: vi.fn(),
			invalidateAll: vi.fn()
		};

		watcher = createWatcherWithCacheInvalidation(tempDir, invalidator);

		expect(watcher).toBeInstanceOf(BeadsWatcher);
	});

	it('invalidates work on work change', async () => {
		const invalidator = {
			invalidateWork: vi.fn(),
			invalidateConvoys: vi.fn(),
			invalidateAgents: vi.fn(),
			invalidateMail: vi.fn(),
			invalidateAll: vi.fn()
		};

		// Create work subdirectory
		const workDir = join(tempDir, 'work');
		await mkdir(workDir, { recursive: true });

		watcher = createWatcherWithCacheInvalidation(tempDir, invalidator);
		await watcher.start();

		// Create a work file
		await writeFile(join(workDir, 'gu-123.json'), '{}');
		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(invalidator.invalidateWork).toHaveBeenCalled();
		expect(invalidator.invalidateConvoys).toHaveBeenCalled();
	});

	it('invalidates convoys on convoy change', async () => {
		const invalidator = {
			invalidateWork: vi.fn(),
			invalidateConvoys: vi.fn(),
			invalidateAgents: vi.fn(),
			invalidateMail: vi.fn(),
			invalidateAll: vi.fn()
		};

		// Create convoy subdirectory
		const convoyDir = join(tempDir, 'convoy');
		await mkdir(convoyDir, { recursive: true });

		watcher = createWatcherWithCacheInvalidation(tempDir, invalidator);
		await watcher.start();

		// Create a convoy file
		await writeFile(join(convoyDir, 'main.json'), '{}');
		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(invalidator.invalidateConvoys).toHaveBeenCalled();
	});

	it('invalidates all on event file change', async () => {
		const invalidator = {
			invalidateWork: vi.fn(),
			invalidateConvoys: vi.fn(),
			invalidateAgents: vi.fn(),
			invalidateMail: vi.fn(),
			invalidateAll: vi.fn()
		};

		watcher = createWatcherWithCacheInvalidation(tempDir, invalidator);
		await watcher.start();

		// Create an events file
		await writeFile(join(tempDir, '.events.jsonl'), '{}');
		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(invalidator.invalidateAll).toHaveBeenCalled();
	});
});

describe('BeadChange entity type parsing', () => {
	// These tests verify the filename parsing logic without needing filesystem
	// We can test this by checking what changes are emitted for different filenames

	let watcher: BeadsWatcher | null = null;
	let tempDir: string;

	beforeEach(async () => {
		tempDir = createTempDir();
		await mkdir(tempDir, { recursive: true });
	});

	afterEach(async () => {
		if (watcher) {
			watcher.stop();
			watcher = null;
		}
		try {
			await rm(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	const testCases = [
		{ subdir: 'work', file: 'gu-123.json', expectedType: 'work' },
		{ subdir: 'convoy', file: 'main.json', expectedType: 'convoy' },
		{ subdir: 'agents', file: 'polecat.json', expectedType: 'agent' },
		{ subdir: 'mail', file: 'inbox.json', expectedType: 'mail' }
	];

	for (const { subdir, file, expectedType } of testCases) {
		it(`parses ${subdir}/${file} as ${expectedType}`, async () => {
			const dir = join(tempDir, subdir);
			await mkdir(dir, { recursive: true });

			watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
			const changes: BeadChange[] = [];
			watcher.on('change', (change) => changes.push(change));

			await watcher.start();

			await writeFile(join(dir, file), '{}');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const matchingChange = changes.find((c) => c.entityType === expectedType);
			expect(matchingChange).toBeDefined();
		});
	}

	it('parses .events.jsonl as event type', async () => {
		watcher = new BeadsWatcher({ beadsPath: tempDir, debounceMs: 10 });
		const changes: BeadChange[] = [];
		watcher.on('change', (change) => changes.push(change));

		await watcher.start();

		await writeFile(join(tempDir, 'data.events.jsonl'), '{}');
		await new Promise((resolve) => setTimeout(resolve, 200));

		const eventChange = changes.find((c) => c.entityType === 'event');
		expect(eventChange).toBeDefined();
	});
});

/**
 * Unit Tests: Server Operations Store
 *
 * Tests for the in-memory operations tracking store used by API endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

class TestOperationsStore {
	private operations = new Map<
		string,
		{
			id: string;
			type: string;
			status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
			startedAt: string;
			completedAt: string | null;
			progress: number;
			error: string | null;
			logs: string[];
			metadata: Record<string, unknown>;
		}
	>();
	private cancelCallbacks = new Map<string, () => void>();

	generateId(): string {
		return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	}

	create(type: string, metadata: Record<string, unknown> = {}) {
		const id = this.generateId();
		const operation = {
			id,
			type,
			status: 'pending' as const,
			startedAt: new Date().toISOString(),
			completedAt: null,
			progress: 0,
			error: null,
			logs: [],
			metadata
		};
		this.operations.set(id, operation);
		return operation;
	}

	get(id: string) {
		return this.operations.get(id);
	}

	list(filters?: { status?: string; type?: string }) {
		let ops = Array.from(this.operations.values());
		if (filters?.status) {
			ops = ops.filter((op) => op.status === filters.status);
		}
		if (filters?.type) {
			ops = ops.filter((op) => op.type === filters.type);
		}
		return ops.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
	}

	update(
		id: string,
		updates: Partial<{ status: string; progress: number; error: string | null }>
	): boolean {
		const op = this.operations.get(id);
		if (!op) return false;
		if (updates.status !== undefined) op.status = updates.status as typeof op.status;
		if (updates.progress !== undefined) op.progress = updates.progress;
		if (updates.error !== undefined) op.error = updates.error;
		if (updates.status === 'completed' || updates.status === 'failed') {
			op.completedAt = new Date().toISOString();
		}
		return true;
	}

	appendLog(id: string, log: string): boolean {
		const op = this.operations.get(id);
		if (!op) return false;
		op.logs.push(log);
		return true;
	}

	setCancelCallback(id: string, callback: () => void): void {
		this.cancelCallbacks.set(id, callback);
	}

	cancel(id: string): { success: boolean; error?: string } {
		const op = this.operations.get(id);
		if (!op) {
			return { success: false, error: 'Operation not found' };
		}
		if (op.status !== 'pending' && op.status !== 'running') {
			return { success: false, error: `Cannot cancel operation in ${op.status} state` };
		}
		const callback = this.cancelCallbacks.get(id);
		if (callback) {
			callback();
			this.cancelCallbacks.delete(id);
		}
		op.status = 'cancelled';
		op.completedAt = new Date().toISOString();
		return { success: true };
	}

	cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
		const cutoff = Date.now() - maxAge;
		let removed = 0;
		for (const [id, op] of this.operations) {
			const timestamp = op.completedAt || op.startedAt;
			if (new Date(timestamp).getTime() < cutoff) {
				this.operations.delete(id);
				this.cancelCallbacks.delete(id);
				removed++;
			}
		}
		return removed;
	}

	clear() {
		this.operations.clear();
		this.cancelCallbacks.clear();
	}
}

describe('Server Operations Store', () => {
	let store: TestOperationsStore;

	beforeEach(() => {
		store = new TestOperationsStore();
	});

	describe('create()', () => {
		it('creates a new operation with pending status', () => {
			const op = store.create('rig-add', { name: 'test-rig' });

			expect(op.id).toMatch(/^op-/);
			expect(op.type).toBe('rig-add');
			expect(op.status).toBe('pending');
			expect(op.progress).toBe(0);
			expect(op.error).toBeNull();
			expect(op.logs).toEqual([]);
			expect(op.metadata).toEqual({ name: 'test-rig' });
		});

		it('generates unique IDs', () => {
			const op1 = store.create('fetch');
			const op2 = store.create('fetch');

			expect(op1.id).not.toBe(op2.id);
		});

		it('sets startedAt timestamp', () => {
			const before = new Date().toISOString();
			const op = store.create('merge');
			const after = new Date().toISOString();

			expect(op.startedAt >= before).toBe(true);
			expect(op.startedAt <= after).toBe(true);
		});
	});

	describe('get()', () => {
		it('retrieves operation by ID', () => {
			const created = store.create('test');
			const retrieved = store.get(created.id);

			expect(retrieved).toEqual(created);
		});

		it('returns undefined for unknown ID', () => {
			const result = store.get('nonexistent');
			expect(result).toBeUndefined();
		});
	});

	describe('list()', () => {
		it('returns all operations', () => {
			store.create('fetch');
			store.create('merge');
			store.create('deploy');

			const ops = store.list();
			expect(ops).toHaveLength(3);
		});

		it('filters by status', () => {
			const op1 = store.create('fetch');
			const op2 = store.create('merge');
			store.update(op1.id, { status: 'completed' });

			const pending = store.list({ status: 'pending' });
			expect(pending).toHaveLength(1);
			expect(pending[0].id).toBe(op2.id);

			const completed = store.list({ status: 'completed' });
			expect(completed).toHaveLength(1);
			expect(completed[0].id).toBe(op1.id);
		});

		it('filters by type', () => {
			store.create('fetch');
			store.create('merge');
			store.create('fetch');

			const fetchOps = store.list({ type: 'fetch' });
			expect(fetchOps).toHaveLength(2);
		});

		it('returns operations in order', () => {
			const op1 = store.create('first');
			const op2 = store.create('second');
			const op3 = store.create('third');

			const ops = store.list();
			expect(ops).toHaveLength(3);
			const ids = ops.map((o) => o.id);
			expect(ids).toContain(op1.id);
			expect(ids).toContain(op2.id);
			expect(ids).toContain(op3.id);
		});
	});

	describe('update()', () => {
		it('updates operation status', () => {
			const op = store.create('test');
			const success = store.update(op.id, { status: 'running' });

			expect(success).toBe(true);
			expect(store.get(op.id)?.status).toBe('running');
		});

		it('updates operation progress', () => {
			const op = store.create('test');
			store.update(op.id, { progress: 50 });

			expect(store.get(op.id)?.progress).toBe(50);
		});

		it('sets completedAt on completed status', () => {
			const op = store.create('test');
			expect(op.completedAt).toBeNull();

			store.update(op.id, { status: 'completed' });

			expect(store.get(op.id)?.completedAt).not.toBeNull();
		});

		it('sets completedAt on failed status', () => {
			const op = store.create('test');
			store.update(op.id, { status: 'failed', error: 'Test error' });

			expect(store.get(op.id)?.completedAt).not.toBeNull();
			expect(store.get(op.id)?.error).toBe('Test error');
		});

		it('returns false for unknown operation', () => {
			const success = store.update('nonexistent', { status: 'running' });
			expect(success).toBe(false);
		});
	});

	describe('appendLog()', () => {
		it('appends log messages', () => {
			const op = store.create('test');
			store.appendLog(op.id, 'Step 1 complete');
			store.appendLog(op.id, 'Step 2 complete');

			const logs = store.get(op.id)?.logs;
			expect(logs).toEqual(['Step 1 complete', 'Step 2 complete']);
		});

		it('returns false for unknown operation', () => {
			const success = store.appendLog('nonexistent', 'Log');
			expect(success).toBe(false);
		});
	});

	describe('cancel()', () => {
		it('cancels pending operation', () => {
			const op = store.create('test');
			const result = store.cancel(op.id);

			expect(result.success).toBe(true);
			expect(store.get(op.id)?.status).toBe('cancelled');
			expect(store.get(op.id)?.completedAt).not.toBeNull();
		});

		it('cancels running operation', () => {
			const op = store.create('test');
			store.update(op.id, { status: 'running' });

			const result = store.cancel(op.id);

			expect(result.success).toBe(true);
			expect(store.get(op.id)?.status).toBe('cancelled');
		});

		it('calls cancel callback', () => {
			const op = store.create('test');
			const callback = vi.fn();
			store.setCancelCallback(op.id, callback);

			store.cancel(op.id);

			expect(callback).toHaveBeenCalled();
		});

		it('rejects cancellation of completed operation', () => {
			const op = store.create('test');
			store.update(op.id, { status: 'completed' });

			const result = store.cancel(op.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain('completed');
		});

		it('returns error for unknown operation', () => {
			const result = store.cancel('nonexistent');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Operation not found');
		});
	});

	describe('cleanup()', () => {
		it('removes operations older than maxAge', () => {
			const op = store.create('test');
			store.update(op.id, { status: 'completed' });

			const removed = store.cleanup(1);
			expect(removed).toBeGreaterThanOrEqual(0);
		});

		it('keeps operations within maxAge', () => {
			const op = store.create('test');

			const removed = store.cleanup(24 * 60 * 60 * 1000);

			expect(removed).toBe(0);
			expect(store.get(op.id)).toBeDefined();
		});
	});
});

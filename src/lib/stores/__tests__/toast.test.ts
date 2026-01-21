/**
 * Toast Store Tests
 *
 * Tests for toast creation, queuing, auto-dismiss, and manual dismiss.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestLogger } from '../../../../scripts/smoke/lib/logger';

const logger = createTestLogger('Unit: Toast Store');

const createToastStore = () => {
	type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error';

	interface Toast {
		id: string;
		type: ToastType;
		message: string;
		duration: number;
		dismissible: boolean;
		timestamp: number;
		dismissing?: boolean;
	}

	interface ToastOptions {
		type?: ToastType;
		duration?: number;
		dismissible?: boolean;
	}

	const DEFAULT_DURATION = 4000;
	const MAX_TOASTS = 3;
	const EXIT_ANIMATION_DURATION = 200;

	let toasts: Toast[] = [];
	const timeouts = new Map<string, ReturnType<typeof setTimeout>>();
	let idCounter = 0;

	const generateId = () => `toast-${++idCounter}`;

	return {
		get toasts() {
			return toasts;
		},
		get count() {
			return toasts.length;
		},
		getVisible() {
			return toasts.filter((t) => !t.dismissing);
		},
		show(message: string, options: ToastOptions = {}) {
			const toast: Toast = {
				id: generateId(),
				message,
				type: options.type ?? 'default',
				duration: options.duration ?? DEFAULT_DURATION,
				dismissible: options.dismissible ?? true,
				timestamp: Date.now()
			};

			if (toasts.length >= MAX_TOASTS) {
				const oldest = toasts[0];
				this.dismiss(oldest.id);
			}

			toasts = [...toasts, toast];

			if (toast.duration > 0) {
				const timeout = setTimeout(() => {
					this.dismiss(toast.id);
				}, toast.duration);
				timeouts.set(toast.id, timeout);
			}

			return toast.id;
		},
		info(message: string, options: Omit<ToastOptions, 'type'> = {}) {
			return this.show(message, { ...options, type: 'info' });
		},
		success(message: string, options: Omit<ToastOptions, 'type'> = {}) {
			return this.show(message, { ...options, type: 'success' });
		},
		warning(message: string, options: Omit<ToastOptions, 'type'> = {}) {
			return this.show(message, { ...options, type: 'warning' });
		},
		error(message: string, options: Omit<ToastOptions, 'type'> = {}) {
			return this.show(message, { ...options, type: 'error' });
		},
		dismiss(id: string) {
			const timeout = timeouts.get(id);
			if (timeout) {
				clearTimeout(timeout);
				timeouts.delete(id);
			}

			toasts = toasts.map((t) => (t.id === id ? { ...t, dismissing: true } : t));

			setTimeout(() => {
				toasts = toasts.filter((t) => t.id !== id);
			}, EXIT_ANIMATION_DURATION);
		},
		dismissAll() {
			for (const timeout of timeouts.values()) {
				clearTimeout(timeout);
			}
			timeouts.clear();
			toasts = [];
		},
		clear() {
			this.dismissAll();
			idCounter = 0;
		}
	};
};

describe('Toast Store', () => {
	let toastStore: ReturnType<typeof createToastStore>;

	beforeEach(() => {
		logger.step('Setting up toast store test');
		vi.useFakeTimers();
		toastStore = createToastStore();
		toastStore.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Unique ID Generation', () => {
		it('creates toast with unique ID', () => {
			logger.info('Testing unique ID generation');
			const id1 = toastStore.info('First');
			const id2 = toastStore.info('Second');
			logger.info('Generated IDs', { id1, id2 });
			expect(id1).not.toBe(id2);
			logger.success('IDs are unique');
		});

		it('generates sequential IDs', () => {
			logger.info('Testing sequential ID generation');
			const id1 = toastStore.info('First');
			const id2 = toastStore.info('Second');
			const id3 = toastStore.info('Third');
			logger.info('Generated IDs', { id1, id2, id3 });
			expect(id1).toBe('toast-1');
			expect(id2).toBe('toast-2');
			expect(id3).toBe('toast-3');
			logger.success('Sequential IDs generated correctly');
		});
	});

	describe('Queue Management', () => {
		it('queues toasts (max 3 visible)', () => {
			logger.info('Testing toast queue limit');
			for (let i = 0; i < 5; i++) {
				toastStore.info(`Toast ${i}`);
				vi.advanceTimersByTime(250);
			}
			const visible = toastStore.getVisible();
			logger.info('Visible toasts', { count: visible.length });
			expect(visible.length).toBe(3);
			logger.success('Queue limit enforced');
		});

		it('removes oldest toast when at max', () => {
			logger.info('Testing FIFO queue behavior');
			toastStore.info('Toast 1');
			toastStore.info('Toast 2');
			toastStore.info('Toast 3');
			vi.advanceTimersByTime(250);

			const beforeAdd = toastStore.getVisible();
			logger.info('Before adding fourth', {
				messages: beforeAdd.map((t) => t.message)
			});

			toastStore.info('Toast 4');
			vi.advanceTimersByTime(250);

			const afterAdd = toastStore.getVisible();
			logger.info('After adding fourth', {
				messages: afterAdd.map((t) => t.message)
			});

			expect(afterAdd.map((t) => t.message)).toEqual(['Toast 2', 'Toast 3', 'Toast 4']);
			logger.success('FIFO queue behavior correct');
		});
	});

	describe('Auto-Dismiss', () => {
		it('auto-dismisses after duration', () => {
			logger.info('Testing auto-dismiss after duration');
			const id = toastStore.info('Auto dismiss', { duration: 4000 });
			logger.info('Created toast', { id });

			expect(toastStore.toasts.length).toBe(1);
			logger.info('Toast exists before timeout');

			vi.advanceTimersByTime(4000);
			logger.info('Advanced timer by 4000ms');

			vi.advanceTimersByTime(250);
			expect(toastStore.toasts.length).toBe(0);
			logger.success('Toast auto-dismissed');
		});

		it('does not auto-dismiss when duration is 0', () => {
			logger.info('Testing persistent toast (duration: 0)');
			const id = toastStore.info('Persistent', { duration: 0 });
			logger.info('Created persistent toast', { id });

			vi.advanceTimersByTime(10000);
			expect(toastStore.toasts.length).toBe(1);
			logger.success('Persistent toast remains');
		});
	});

	describe('Manual Dismiss', () => {
		it('manual dismiss works', () => {
			logger.info('Testing manual dismiss');
			const id = toastStore.info('Dismiss me', { duration: 0 });
			logger.info('Created toast', { id });

			expect(toastStore.toasts.length).toBe(1);

			toastStore.dismiss(id);
			logger.info('Called dismiss');

			vi.advanceTimersByTime(250);
			expect(toastStore.toasts.length).toBe(0);
			logger.success('Manual dismiss works');
		});

		it('dismissAll clears all toasts', () => {
			logger.info('Testing dismissAll');
			toastStore.info('Toast 1');
			toastStore.info('Toast 2');
			toastStore.info('Toast 3');
			logger.info('Created 3 toasts', { count: toastStore.count });

			toastStore.dismissAll();
			expect(toastStore.toasts.length).toBe(0);
			logger.success('All toasts dismissed');
		});
	});

	describe('Progress Toast', () => {
		it('progress toast persists until dismissed', () => {
			logger.info('Testing progress toast persistence');
			const id = toastStore.info('Loading...', { duration: 0, dismissible: false });
			logger.info('Created progress toast', { id });

			vi.advanceTimersByTime(10000);
			expect(toastStore.toasts.length).toBe(1);
			logger.info('Toast persists after 10 seconds');

			toastStore.dismiss(id);
			vi.advanceTimersByTime(250);
			expect(toastStore.toasts.length).toBe(0);
			logger.success('Progress toast persisted until manual dismiss');
		});
	});

	describe('Toast Types', () => {
		it('creates info toast', () => {
			logger.info('Testing info toast creation');
			const id = toastStore.info('Info message');
			const toast = toastStore.toasts.find((t) => t.id === id);
			expect(toast?.type).toBe('info');
			logger.success('Info toast created with correct type');
		});

		it('creates success toast', () => {
			logger.info('Testing success toast creation');
			const id = toastStore.success('Success message');
			const toast = toastStore.toasts.find((t) => t.id === id);
			expect(toast?.type).toBe('success');
			logger.success('Success toast created with correct type');
		});

		it('creates warning toast', () => {
			logger.info('Testing warning toast creation');
			const id = toastStore.warning('Warning message');
			const toast = toastStore.toasts.find((t) => t.id === id);
			expect(toast?.type).toBe('warning');
			logger.success('Warning toast created with correct type');
		});

		it('creates error toast', () => {
			logger.info('Testing error toast creation');
			const id = toastStore.error('Error message');
			const toast = toastStore.toasts.find((t) => t.id === id);
			expect(toast?.type).toBe('error');
			logger.success('Error toast created with correct type');
		});
	});

	describe('Two-Phase Pattern', () => {
		it('async shows progress then success', async () => {
			logger.info('Testing two-phase async toast');

			const progressId = toastStore.info('Processing...', { duration: 0 });
			logger.info('Progress toast shown', { progressId });
			expect(toastStore.toasts.length).toBe(1);

			await Promise.resolve();

			toastStore.dismiss(progressId);
			vi.advanceTimersByTime(250);
			logger.info('Progress toast dismissed');

			const successId = toastStore.success('Complete!');
			logger.info('Success toast shown', { successId });

			expect(toastStore.toasts.length).toBe(1);
			const toast = toastStore.toasts[0];
			expect(toast.type).toBe('success');
			expect(toast.message).toBe('Complete!');
			logger.success('Two-phase pattern works');
		});

		it('async shows progress then error on failure', async () => {
			logger.info('Testing two-phase async toast with error');

			const progressId = toastStore.info('Processing...', { duration: 0 });
			logger.info('Progress toast shown', { progressId });

			await Promise.resolve();

			toastStore.dismiss(progressId);
			vi.advanceTimersByTime(250);

			const errorId = toastStore.error('Operation failed');
			logger.info('Error toast shown', { errorId });

			const toast = toastStore.toasts[0];
			expect(toast.type).toBe('error');
			expect(toast.message).toBe('Operation failed');
			logger.success('Two-phase error pattern works');
		});

		it('progress toast dismissed before success', async () => {
			logger.info('Testing progress toast cleanup');

			const progressId = toastStore.info('Processing...', { duration: 0 });
			expect(toastStore.toasts.length).toBe(1);

			toastStore.dismiss(progressId);
			vi.advanceTimersByTime(250);
			expect(toastStore.toasts.length).toBe(0);
			logger.info('Progress toast fully removed');

			toastStore.success('Done!');
			expect(toastStore.toasts.length).toBe(1);
			logger.success('Progress toast dismissed before showing success');
		});
	});
});

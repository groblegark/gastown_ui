/**
 * Clipboard Utility Tests
 *
 * Tests for clipboard operations with mocked browser APIs.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original values
const originalClipboard = navigator.clipboard;
const originalExecCommand = document.execCommand;

describe('Clipboard Utility', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		// Restore original clipboard
		Object.defineProperty(navigator, 'clipboard', {
			value: originalClipboard,
			writable: true,
			configurable: true
		});
		document.execCommand = originalExecCommand;
	});

	describe('supportsClipboard', () => {
		it('returns true when clipboard API is available', async () => {
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: vi.fn().mockResolvedValue(undefined),
					readText: vi.fn().mockResolvedValue('')
				},
				writable: true,
				configurable: true
			});

			const { supportsClipboard } = await import('./clipboard');
			expect(supportsClipboard()).toBe(true);
		});

		it('returns false when writeText is not a function', async () => {
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: 'not a function'
				},
				writable: true,
				configurable: true
			});

			const { supportsClipboard } = await import('./clipboard');
			expect(supportsClipboard()).toBe(false);
		});
	});

	describe('copy', () => {
		it('uses modern Clipboard API when available', async () => {
			const writeTextMock = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: writeTextMock,
					readText: vi.fn().mockResolvedValue('')
				},
				writable: true,
				configurable: true
			});

			const { copy } = await import('./clipboard');
			const result = await copy('test text');

			expect(writeTextMock).toHaveBeenCalledWith('test text');
			expect(result).toBe(true);
		});

		it('falls back to execCommand when Clipboard API fails', async () => {
			const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: writeTextMock,
					readText: vi.fn().mockResolvedValue('')
				},
				writable: true,
				configurable: true
			});

			const execCommandMock = vi.fn().mockReturnValue(true);
			document.execCommand = execCommandMock;

			const { copy } = await import('./clipboard');
			const result = await copy('test text');

			expect(writeTextMock).toHaveBeenCalledWith('test text');
			expect(execCommandMock).toHaveBeenCalledWith('copy');
			expect(result).toBe(true);
		});

		it('returns false when both methods fail', async () => {
			const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: writeTextMock,
					readText: vi.fn().mockResolvedValue('')
				},
				writable: true,
				configurable: true
			});

			const execCommandMock = vi.fn().mockReturnValue(false);
			document.execCommand = execCommandMock;

			const { copy } = await import('./clipboard');
			const result = await copy('test text');

			expect(result).toBe(false);
		});

		it('uses fallback when Clipboard API is not available', async () => {
			// Remove clipboard API
			Object.defineProperty(navigator, 'clipboard', {
				value: undefined,
				writable: true,
				configurable: true
			});

			const execCommandMock = vi.fn().mockReturnValue(true);
			document.execCommand = execCommandMock;

			const { copy } = await import('./clipboard');
			const result = await copy('test text');

			expect(execCommandMock).toHaveBeenCalledWith('copy');
			expect(result).toBe(true);
		});
	});

	describe('paste', () => {
		it('reads text from clipboard when API is available', async () => {
			const readTextMock = vi.fn().mockResolvedValue('pasted text');
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: vi.fn().mockResolvedValue(undefined),
					readText: readTextMock
				},
				writable: true,
				configurable: true
			});

			const { paste } = await import('./clipboard');
			const result = await paste();

			expect(readTextMock).toHaveBeenCalled();
			expect(result).toBe('pasted text');
		});

		it('returns empty string when clipboard API is not available', async () => {
			Object.defineProperty(navigator, 'clipboard', {
				value: undefined,
				writable: true,
				configurable: true
			});

			const { paste } = await import('./clipboard');
			const result = await paste();

			expect(result).toBe('');
		});

		it('returns empty string when clipboard read fails', async () => {
			const readTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: vi.fn().mockResolvedValue(undefined),
					readText: readTextMock
				},
				writable: true,
				configurable: true
			});

			const { paste } = await import('./clipboard');
			const result = await paste();

			expect(result).toBe('');
		});
	});
});

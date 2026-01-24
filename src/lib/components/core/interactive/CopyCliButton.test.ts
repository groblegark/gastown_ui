/**
 * CopyCliButton Component Tests
 *
 * Tests for CopyCliButton variants, states, and clipboard functionality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import CopyCliButton from './CopyCliButton.svelte';

// Mock clipboard utility
vi.mock('$lib/utils/clipboard', () => ({
	copy: vi.fn()
}));

// Mock haptics utility
vi.mock('$lib/utils/haptics', () => ({
	hapticSuccess: vi.fn()
}));

// Mock toast store
vi.mock('$lib/stores/toast.svelte', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

describe('CopyCliButton', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Variants', () => {
		it('renders icon variant by default', () => {
			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('h-8');
			expect(button).toHaveClass('w-8');
		});

		it('renders full variant with command text', () => {
			render(CopyCliButton, { props: { command: 'gt mail inbox', variant: 'full' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('w-full');

			// Check command is displayed
			const code = button.querySelector('code');
			expect(code).toHaveTextContent('gt mail inbox');
		});

		it('renders inline variant with compact size', () => {
			render(CopyCliButton, { props: { command: 'gt status', variant: 'inline' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('h-6');
			expect(button).toHaveClass('text-xs');
		});
	});

	describe('States', () => {
		it('is not disabled by default', () => {
			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');
			expect(button).not.toBeDisabled();
		});

		it('can be disabled', () => {
			render(CopyCliButton, { props: { command: 'gt hook', disabled: true } });
			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
		});
	});

	describe('Copy Functionality', () => {
		it('calls copy with command when clicked', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			vi.mocked(copy).mockResolvedValue(true);

			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(copy).toHaveBeenCalledWith('gt hook');
		});

		it('triggers haptic feedback on successful copy', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			const { hapticSuccess } = await import('$lib/utils/haptics');
			vi.mocked(copy).mockResolvedValue(true);

			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(hapticSuccess).toHaveBeenCalled();
		});

		it('shows success toast on copy', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			const { toastStore } = await import('$lib/stores/toast.svelte');
			vi.mocked(copy).mockResolvedValue(true);

			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(toastStore.success).toHaveBeenCalledWith('Copied to clipboard');
		});

		it('shows error toast on copy failure', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			const { toastStore } = await import('$lib/stores/toast.svelte');
			vi.mocked(copy).mockResolvedValue(false);

			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(toastStore.error).toHaveBeenCalledWith('Failed to copy to clipboard');
		});

		it('does not show feedback when showFeedback is false', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			const { toastStore } = await import('$lib/stores/toast.svelte');
			vi.mocked(copy).mockResolvedValue(true);

			render(CopyCliButton, { props: { command: 'gt hook', showFeedback: false } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(toastStore.success).not.toHaveBeenCalled();
		});

		it('calls onCopy callback on successful copy', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			vi.mocked(copy).mockResolvedValue(true);

			const onCopy = vi.fn();
			render(CopyCliButton, { props: { command: 'gt hook', onCopy } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(onCopy).toHaveBeenCalled();
		});

		it('calls onError callback on copy failure', async () => {
			const { copy } = await import('$lib/utils/clipboard');
			vi.mocked(copy).mockResolvedValue(false);

			const onError = vi.fn();
			render(CopyCliButton, { props: { command: 'gt hook', onError } });
			const button = screen.getByRole('button');

			await fireEvent.click(button);

			expect(onError).toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		it('has correct default aria-label with command', () => {
			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-label', 'Copy command: gt hook');
		});

		it('accepts custom aria-label', () => {
			render(CopyCliButton, { props: { command: 'gt hook', 'aria-label': 'Copy hook command' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-label', 'Copy hook command');
		});

		it('icon variant has title with command', () => {
			render(CopyCliButton, { props: { command: 'gt mail inbox', variant: 'icon' } });
			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('title', 'gt mail inbox');
		});

		it('full variant does not have title', () => {
			render(CopyCliButton, { props: { command: 'gt mail inbox', variant: 'full' } });
			const button = screen.getByRole('button');
			expect(button).not.toHaveAttribute('title');
		});

		it('has focus visible styles', () => {
			render(CopyCliButton, { props: { command: 'gt hook' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('focus-visible:ring-2');
		});
	});

	describe('Custom Classes', () => {
		it('accepts custom class names', () => {
			render(CopyCliButton, { props: { command: 'gt hook', class: 'my-custom-class' } });
			const button = screen.getByRole('button');
			expect(button).toHaveClass('my-custom-class');
		});
	});
});

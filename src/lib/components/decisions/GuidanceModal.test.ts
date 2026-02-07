/**
 * GuidanceModal Component Tests
 *
 * Tests for rendering, validation, submission, and accessibility.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GuidanceModal from './GuidanceModal.svelte';

const mockDecision = {
	id: 'dec-123',
	prompt: 'Should we use Redis or Memcached for caching?'
};

describe('GuidanceModal', () => {
	describe('Rendering', () => {
		it('renders nothing when closed', () => {
			const { container } = render(GuidanceModal, {
				props: { decision: mockDecision, open: false }
			});
			expect(container.querySelector('[role="dialog"]')).toBeNull();
		});

		it('renders modal when open', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			expect(screen.getByRole('dialog')).toBeTruthy();
		});

		it('displays decision prompt for context', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			expect(screen.getByText(mockDecision.prompt)).toBeTruthy();
		});

		it('displays modal title', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			expect(screen.getByText('Provide Guidance')).toBeTruthy();
		});

		it('shows iteration count when greater than 1', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, iterationCount: 3 }
			});
			expect(screen.getByText('Iteration 3 of this decision')).toBeTruthy();
		});

		it('hides iteration count when 1 or not provided', () => {
			const { container } = render(GuidanceModal, {
				props: { decision: mockDecision, open: true, iterationCount: 1 }
			});
			expect(container.textContent).not.toContain('Iteration');
		});
	});

	describe('Validation', () => {
		it('disables submit button when text is too short', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			const submitBtn = screen.getByText('Send Guidance').closest('button');
			expect(submitBtn?.disabled).toBe(true);
		});

		it('shows characters needed message when below minimum', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			expect(screen.getByText('10 more characters needed')).toBeTruthy();
		});

		it('enables submit button when text meets minimum length', async () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			const textarea = screen.getByPlaceholderText('Tell the agent how to refine this decision...');
			await fireEvent.input(textarea, { target: { value: 'Use Redis instead because it supports more data structures' } });
			const submitBtn = screen.getByText('Send Guidance').closest('button');
			expect(submitBtn?.disabled).toBe(false);
		});
	});

	describe('Submission', () => {
		it('calls onsubmit with trimmed text', async () => {
			const onsubmit = vi.fn().mockResolvedValue(undefined);
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, onsubmit }
			});
			const textarea = screen.getByPlaceholderText('Tell the agent how to refine this decision...');
			await fireEvent.input(textarea, { target: { value: '  Use Redis for better data structure support  ' } });
			const submitBtn = screen.getByText('Send Guidance').closest('button');
			await fireEvent.click(submitBtn!);
			expect(onsubmit).toHaveBeenCalledWith('Use Redis for better data structure support');
		});

		it('displays error when submission fails', async () => {
			const onsubmit = vi.fn().mockRejectedValue(new Error('Network error'));
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, onsubmit }
			});
			const textarea = screen.getByPlaceholderText('Tell the agent how to refine this decision...');
			await fireEvent.input(textarea, { target: { value: 'Use Redis for better performance' } });
			const submitBtn = screen.getByText('Send Guidance').closest('button');
			await fireEvent.click(submitBtn!);
			// Wait for async error
			await vi.waitFor(() => {
				expect(screen.getByText('Network error')).toBeTruthy();
			});
		});
	});

	describe('Close behavior', () => {
		it('calls onclose when cancel is clicked', async () => {
			const onclose = vi.fn();
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, onclose }
			});
			await fireEvent.click(screen.getByText('Cancel'));
			expect(onclose).toHaveBeenCalled();
		});

		it('calls onclose when close button is clicked', async () => {
			const onclose = vi.fn();
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, onclose }
			});
			await fireEvent.click(screen.getByLabelText('Close'));
			expect(onclose).toHaveBeenCalled();
		});

		it('calls onclose on Escape key', async () => {
			const onclose = vi.fn();
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true, onclose }
			});
			await fireEvent.keyDown(window, { key: 'Escape' });
			expect(onclose).toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		it('has proper dialog role and aria attributes', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			const dialog = screen.getByRole('dialog');
			expect(dialog.getAttribute('aria-modal')).toBe('true');
			expect(dialog.getAttribute('aria-labelledby')).toBe('guidance-title');
		});

		it('has a labeled textarea', () => {
			render(GuidanceModal, {
				props: { decision: mockDecision, open: true }
			});
			const textarea = screen.getByLabelText('Your Guidance');
			expect(textarea).toBeTruthy();
		});
	});
});

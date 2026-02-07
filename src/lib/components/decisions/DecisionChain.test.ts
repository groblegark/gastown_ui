/**
 * DecisionChain Component Tests
 *
 * Tests for chain visualization, collapsible behavior, and item navigation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DecisionChain from './DecisionChain.svelte';
import type { ChainItem } from './DecisionChain.svelte';

function makeChainItem(id: string, resolved = false): ChainItem {
	return {
		id,
		prompt: `Decision prompt for ${id}`,
		createdAt: new Date().toISOString(),
		...(resolved
			? { response: { selectedOption: 'option-a', text: 'Rationale' } }
			: {})
	};
}

describe('DecisionChain', () => {
	describe('Rendering', () => {
		it('renders nothing when chain has 0 items', () => {
			const { container } = render(DecisionChain, {
				props: { chain: [], currentId: 'dec-1' }
			});
			expect(container.textContent?.trim()).toBe('');
		});

		it('renders nothing when chain has 1 item', () => {
			const { container } = render(DecisionChain, {
				props: { chain: [makeChainItem('dec-1')], currentId: 'dec-1' }
			});
			expect(container.textContent?.trim()).toBe('');
		});

		it('renders all items when chain has 2 items', () => {
			render(DecisionChain, {
				props: {
					chain: [makeChainItem('dec-1', true), makeChainItem('dec-2')],
					currentId: 'dec-2'
				}
			});
			expect(screen.getByText('Decision prompt for dec-1')).toBeTruthy();
			expect(screen.getByText('Decision prompt for dec-2')).toBeTruthy();
		});

		it('shows resolved status for resolved items', () => {
			render(DecisionChain, {
				props: {
					chain: [makeChainItem('dec-1', true), makeChainItem('dec-2')],
					currentId: 'dec-2'
				}
			});
			expect(screen.getByText('Resolved: option-a')).toBeTruthy();
		});
	});

	describe('Collapsible Behavior', () => {
		it('shows all items when chain has exactly 3 items', () => {
			const chain = [
				makeChainItem('dec-1', true),
				makeChainItem('dec-2', true),
				makeChainItem('dec-3')
			];
			render(DecisionChain, {
				props: { chain, currentId: 'dec-3' }
			});
			expect(screen.getByText('Decision prompt for dec-1')).toBeTruthy();
			expect(screen.getByText('Decision prompt for dec-2')).toBeTruthy();
			expect(screen.getByText('Decision prompt for dec-3')).toBeTruthy();
			// No toggle button needed
			expect(screen.queryByText(/Show \d+ more/)).toBeNull();
		});

		it('collapses by default when chain has more than 3 items', () => {
			const chain = [
				makeChainItem('dec-1', true),
				makeChainItem('dec-2', true),
				makeChainItem('dec-3', true),
				makeChainItem('dec-4'),
				makeChainItem('dec-5')
			];
			render(DecisionChain, {
				props: { chain, currentId: 'dec-5' }
			});
			// First 3 visible
			expect(screen.getByText('Decision prompt for dec-1')).toBeTruthy();
			expect(screen.getByText('Decision prompt for dec-2')).toBeTruthy();
			expect(screen.getByText('Decision prompt for dec-3')).toBeTruthy();
			// Last 2 hidden
			expect(screen.queryByText('Decision prompt for dec-4')).toBeNull();
			expect(screen.queryByText('Decision prompt for dec-5')).toBeNull();
			// Toggle button shows count
			expect(screen.getByText('Show 2 more')).toBeTruthy();
		});

		it('expands to show all items when toggle is clicked', async () => {
			const chain = [
				makeChainItem('dec-1', true),
				makeChainItem('dec-2', true),
				makeChainItem('dec-3', true),
				makeChainItem('dec-4')
			];
			render(DecisionChain, {
				props: { chain, currentId: 'dec-4' }
			});
			expect(screen.queryByText('Decision prompt for dec-4')).toBeNull();

			await fireEvent.click(screen.getByText('Show 1 more'));

			expect(screen.getByText('Decision prompt for dec-4')).toBeTruthy();
			expect(screen.getByText('Show less')).toBeTruthy();
		});

		it('collapses again when "Show less" is clicked', async () => {
			const chain = [
				makeChainItem('dec-1', true),
				makeChainItem('dec-2', true),
				makeChainItem('dec-3', true),
				makeChainItem('dec-4')
			];
			render(DecisionChain, {
				props: { chain, currentId: 'dec-4' }
			});

			// Expand
			await fireEvent.click(screen.getByText('Show 1 more'));
			expect(screen.getByText('Decision prompt for dec-4')).toBeTruthy();

			// Collapse
			await fireEvent.click(screen.getByText('Show less'));
			expect(screen.queryByText('Decision prompt for dec-4')).toBeNull();
		});
	});

	describe('Navigation', () => {
		it('calls onSelectItem when a non-current item is clicked', async () => {
			const onSelectItem = vi.fn();
			render(DecisionChain, {
				props: {
					chain: [makeChainItem('dec-1', true), makeChainItem('dec-2')],
					currentId: 'dec-2',
					onSelectItem
				}
			});

			const item = screen.getByRole('button', { name: /View iteration 1/ });
			await fireEvent.click(item);
			expect(onSelectItem).toHaveBeenCalledWith('dec-1');
		});

		it('does not call onSelectItem when current item is clicked', async () => {
			const onSelectItem = vi.fn();
			render(DecisionChain, {
				props: {
					chain: [makeChainItem('dec-1', true), makeChainItem('dec-2')],
					currentId: 'dec-2',
					onSelectItem
				}
			});

			// Current item should not have role="button"
			const items = screen.queryAllByRole('button');
			// Only the non-current item should be a button (plus any toggle)
			const chainButtons = items.filter(
				(el) => el.getAttribute('aria-label')?.includes('View iteration')
			);
			expect(chainButtons).toHaveLength(1);
			expect(onSelectItem).not.toHaveBeenCalled();
		});

		it('supports keyboard navigation (Enter key)', async () => {
			const onSelectItem = vi.fn();
			render(DecisionChain, {
				props: {
					chain: [makeChainItem('dec-1', true), makeChainItem('dec-2')],
					currentId: 'dec-2',
					onSelectItem
				}
			});

			const item = screen.getByRole('button', { name: /View iteration 1/ });
			await fireEvent.keyDown(item, { key: 'Enter' });
			expect(onSelectItem).toHaveBeenCalledWith('dec-1');
		});
	});

	describe('Variants', () => {
		it('exports decisionChainVariants', async () => {
			const mod = await import('./DecisionChain.svelte');
			expect(typeof mod.decisionChainVariants).toBe('function');
			const result = mod.decisionChainVariants();
			expect(result).toHaveProperty('wrapper');
			expect(result).toHaveProperty('item');
			expect(result).toHaveProperty('itemCurrent');
			expect(result).toHaveProperty('circle');
			expect(result).toHaveProperty('toggleBtn');
		});
	});
});

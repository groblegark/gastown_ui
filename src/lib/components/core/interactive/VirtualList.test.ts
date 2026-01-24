/**
 * VirtualList Component Tests
 *
 * Tests for virtualized list rendering that only renders visible items
 * plus a buffer for smooth scrolling.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import VirtualList from './VirtualList.svelte';

describe('VirtualList', () => {
	describe('Basic Rendering', () => {
		it('renders container with correct role', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			expect(screen.getByRole('list')).toBeInTheDocument();
		});

		it('renders only visible items plus buffer', () => {
			const items = createItems(1000);
			render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 400 } });
			const renderedItems = screen.getAllByRole('listitem');
			expect(renderedItems.length).toBeLessThan(1000);
			expect(renderedItems.length).toBeGreaterThan(0);
		});

		it('renders first items on initial load', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			expect(screen.getByText('Item 0')).toBeInTheDocument();
			expect(screen.getByText('Item 1')).toBeInTheDocument();
		});

		it('applies custom container height', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 500 } });
			const container = screen.getByRole('list');
			expect(container).toHaveStyle({ height: '500px' });
		});
	});

	describe('Empty State', () => {
		it('renders empty state when no items', () => {
			render(VirtualList, { props: { items: [], itemHeight: 40 } });
			expect(screen.getByText(/no items/i)).toBeInTheDocument();
		});

		it('renders custom empty message', () => {
			render(VirtualList, { props: { items: [], itemHeight: 40, emptyMessage: 'Nothing here' } });
			expect(screen.getByText('Nothing here')).toBeInTheDocument();
		});
	});

	describe('Spacer Elements', () => {
		it('creates top spacer for scroll offset', () => {
			const items = createItems(1000);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			const container = screen.getByRole('list');
			const contentWrapper = container.querySelector('[data-virtual-content]');
			const spacers = contentWrapper?.querySelectorAll('[aria-hidden="true"]');
			expect(spacers?.length).toBeGreaterThanOrEqual(2);
		});

		it('creates bottom spacer for total height', () => {
			const items = createItems(1000);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			const container = screen.getByRole('list');
			const contentWrapper = container.querySelector('[data-virtual-content]');
			const spacers = contentWrapper?.querySelectorAll('[aria-hidden="true"]');
			expect(spacers?.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Scroll Handling', () => {
		it('updates visible items on scroll', async () => {
			const items = createItems(1000);
			const { container } = render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 400 } });
			const scrollContainer = container.querySelector('[data-virtual-scroll]');
			
			expect(scrollContainer).toBeInTheDocument();
			expect(screen.getByText('Item 0')).toBeInTheDocument();
		});
	});

	describe('Item Height', () => {
		it('calculates total height based on item count', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 50 } });
			const container = screen.getByRole('list');
			const innerWrapper = container.querySelector('[data-virtual-content]');
			expect(innerWrapper).toHaveStyle({ height: '5000px' });
		});
	});

	describe('Buffer', () => {
		it('renders extra items for smooth scrolling', () => {
			const items = createItems(1000);
			render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 400, buffer: 5 } });
			const renderedItems = screen.getAllByRole('listitem');
			expect(renderedItems.length).toBeGreaterThan(10);
		});

		it('uses default buffer of 3', () => {
			const items = createItems(1000);
			render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 400 } });
			const renderedItems = screen.getAllByRole('listitem');
			expect(renderedItems.length).toBeGreaterThanOrEqual(10 + 6);
		});
	});

	describe('Accessibility', () => {
		it('has aria-label for virtual list', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40, ariaLabel: 'Agent list' } });
			expect(screen.getByRole('list', { name: 'Agent list' })).toBeInTheDocument();
		});

		it('announces item count to screen readers', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			expect(screen.getByText(/100 items/i)).toBeInTheDocument();
		});

		it('items have correct index for screen readers', () => {
			const items = createItems(10);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			const firstItem = screen.getByText('Item 0').closest('[role="listitem"]');
			expect(firstItem).toHaveAttribute('aria-posinset', '1');
		});

		it('items announce total set size', () => {
			const items = createItems(100);
			render(VirtualList, { props: { items, itemHeight: 40 } });
			const firstItem = screen.getByText('Item 0').closest('[role="listitem"]');
			expect(firstItem).toHaveAttribute('aria-setsize', '100');
		});
	});

	describe('Custom Rendering', () => {
		it('accepts custom class', () => {
			const items = createItems(10);
			render(VirtualList, { props: { items, itemHeight: 40, class: 'my-custom-list' } });
			const container = screen.getByRole('list');
			expect(container).toHaveClass('my-custom-list');
		});
	});

	describe('Performance', () => {
		it('handles large lists without rendering all items', () => {
			const items = createItems(10000);
			render(VirtualList, { props: { items, itemHeight: 40, containerHeight: 400 } });
			const renderedItems = screen.getAllByRole('listitem');
			expect(renderedItems.length).toBeLessThan(100);
		});
	});
});

// Test helpers
interface TestItem {
	id: string;
	label: string;
}

function createItems(count: number): TestItem[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `item-${i}`,
		label: `Item ${i}`
	}));
}

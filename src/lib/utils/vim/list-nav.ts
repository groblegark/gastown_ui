/**
 * List Navigation Utilities
 *
 * Handles the DOM manipulation and event dispatching for vim-style list navigation.
 */

import type { ListState } from './bindings';

/**
 * Clear visual selection from all items in a list
 */
export function clearSelection(list: ListState): void {
	for (const item of list.items) {
		item.setAttribute('data-vim-selected', 'false');
		item.classList.remove('vim-selected');
	}
}

/**
 * Highlight an item at the given index
 */
export function highlightItem(list: ListState): void {
	if (list.selectedIndex < 0) return;

	const item = list.items[list.selectedIndex];
	if (item) {
		item.setAttribute('data-vim-selected', 'true');
		item.classList.add('vim-selected');
		item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('vim-list-select', {
					detail: { item, index: list.selectedIndex }
				})
			);
		}
	}
}

/**
 * Navigate down in the list (j key behavior)
 */
export function moveDown(list: ListState): void {
	if (list.items.length === 0) return;

	clearSelection(list);
	list.selectedIndex =
		list.selectedIndex < 0 ? 0 : Math.min(list.selectedIndex + 1, list.items.length - 1);
	highlightItem(list);
}

/**
 * Navigate up in the list (k key behavior)
 */
export function moveUp(list: ListState): void {
	if (list.items.length === 0) return;

	clearSelection(list);
	list.selectedIndex =
		list.selectedIndex < 0 ? list.items.length - 1 : Math.max(list.selectedIndex - 1, 0);
	highlightItem(list);
}

/**
 * Open the selected item (Enter key behavior)
 */
export function openItem(list: ListState): void {
	if (list.selectedIndex < 0) return;

	const item = list.items[list.selectedIndex];
	if (!item) return;

	const link = item.querySelector('a') || item.closest('a');
	const button = item.querySelector('button') || item.closest('button');

	if (link) {
		link.click();
	} else if (button) {
		button.click();
	} else if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('vim-list-open', {
				detail: { item, index: list.selectedIndex }
			})
		);
	}
}

/**
 * Toggle selection on the current item (x key behavior)
 */
export function toggleItem(list: ListState): void {
	if (list.selectedIndex < 0) return;

	const item = list.items[list.selectedIndex];
	if (!item) return;

	const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
	if (checkbox) {
		checkbox.click();
	} else if (typeof window !== 'undefined') {
		const isSelected = item.getAttribute('data-vim-checked') === 'true';
		item.setAttribute('data-vim-checked', String(!isSelected));
		window.dispatchEvent(
			new CustomEvent('vim-list-toggle', {
				detail: { item, index: list.selectedIndex, selected: !isSelected }
			})
		);
	}
}

/**
 * Create a ListState from a container element
 */
export function createListState(container: HTMLElement, containerId: string): ListState {
	const items = Array.from(container.querySelectorAll('[data-list-item]')) as HTMLElement[];
	return {
		items,
		selectedIndex: -1,
		containerId
	};
}

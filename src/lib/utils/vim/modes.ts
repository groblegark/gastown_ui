/**
 * Vim Mode State Machine
 *
 * Manages the vim keyboard navigation state including:
 * - Shortcut registration and handling
 * - Key sequence tracking
 * - List navigation state
 * - Help dialog state
 */

import type { VimShortcut, ListState } from './bindings';
import { SequenceTracker } from './parser';

/**
 * Main vim keyboard manager class
 */
export class VimKeyboardManager {
	private shortcuts: Map<string, VimShortcut> = new Map();
	private sequenceShortcuts: Map<string, Map<string, VimShortcut>> = new Map();
	private isInputFocused = false;
	private helpOpen = false;

	// Sequence tracking
	private sequenceTracker: SequenceTracker;

	// List navigation state
	private activeList: ListState | null = null;
	private listContainers: Map<string, HTMLElement> = new Map();

	// Event handlers bound to this instance
	private boundHandleKeyDown: (e: KeyboardEvent) => void;
	private boundUpdateInputFocus: (e: FocusEvent) => void;

	constructor() {
		this.sequenceTracker = new SequenceTracker();

		// Set up sequence clear notification
		this.sequenceTracker.onClear(() => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('vim-sequence-end'));
			}
		});

		this.boundHandleKeyDown = this.handleKeyDown.bind(this);
		this.boundUpdateInputFocus = this.updateInputFocus.bind(this);

		if (typeof window !== 'undefined') {
			document.addEventListener('keydown', this.boundHandleKeyDown);
			document.addEventListener('focus', this.boundUpdateInputFocus, true);
			document.addEventListener('blur', this.boundUpdateInputFocus, true);
		}
	}

	/**
	 * Register a vim shortcut
	 */
	register(id: string, shortcut: VimShortcut): void {
		if (Array.isArray(shortcut.key)) {
			// Sequence shortcut (e.g., ['g', 'd'])
			const [prefix, suffix] = shortcut.key;
			if (!this.sequenceShortcuts.has(prefix)) {
				this.sequenceShortcuts.set(prefix, new Map());
			}
			this.sequenceShortcuts.get(prefix)!.set(suffix, shortcut);
		} else {
			// Single key shortcut
			this.shortcuts.set(shortcut.key, shortcut);
		}
	}

	/**
	 * Unregister a shortcut
	 */
	unregister(id: string): void {
		this.shortcuts.delete(id);
		// Also check sequence shortcuts
		for (const [, suffixMap] of this.sequenceShortcuts) {
			for (const [key] of suffixMap) {
				if (id === key) {
					suffixMap.delete(key);
				}
			}
		}
	}

	/**
	 * Get all registered shortcuts for display
	 */
	getShortcuts(): VimShortcut[] {
		const all: VimShortcut[] = [];

		// Single key shortcuts
		for (const shortcut of this.shortcuts.values()) {
			all.push(shortcut);
		}

		// Sequence shortcuts
		for (const [, suffixMap] of this.sequenceShortcuts) {
			for (const shortcut of suffixMap.values()) {
				all.push(shortcut);
			}
		}

		return all;
	}

	/**
	 * Get shortcuts by category
	 */
	getShortcutsByCategory(category: 'navigation' | 'list' | 'action' | 'system'): VimShortcut[] {
		return this.getShortcuts().filter((s) => s.category === category);
	}

	/**
	 * Format shortcut keys for display
	 */
	formatShortcut(key: string | string[]): string {
		if (Array.isArray(key)) {
			return key.join(' then ');
		}
		if (key === '/') return '/';
		if (key === '?') return '?';
		return key.toUpperCase();
	}

	/**
	 * Register a list container for j/k navigation
	 */
	registerList(containerId: string, element: HTMLElement): void {
		this.listContainers.set(containerId, element);
	}

	/**
	 * Unregister a list container
	 */
	unregisterList(containerId: string): void {
		this.listContainers.delete(containerId);
		if (this.activeList?.containerId === containerId) {
			this.activeList = null;
		}
	}

	/**
	 * Set the active list for keyboard navigation
	 */
	setActiveList(containerId: string): void {
		const container = this.listContainers.get(containerId);
		if (!container) return;

		const items = Array.from(container.querySelectorAll('[data-list-item]')) as HTMLElement[];

		this.activeList = {
			items,
			selectedIndex: -1,
			containerId
		};
	}

	/**
	 * Clear active list
	 */
	clearActiveList(): void {
		if (this.activeList) {
			this.clearListSelection();
		}
		this.activeList = null;
	}

	/**
	 * Get current selected item
	 */
	getSelectedItem(): HTMLElement | null {
		if (!this.activeList || this.activeList.selectedIndex < 0) {
			return null;
		}
		return this.activeList.items[this.activeList.selectedIndex] || null;
	}

	/**
	 * Navigate list down (j key)
	 */
	navigateDown(): void {
		if (!this.activeList) return;

		const { items, selectedIndex } = this.activeList;
		if (items.length === 0) return;

		// Clear previous selection
		this.clearListSelection();

		// Move to next item (or first if none selected)
		this.activeList.selectedIndex =
			selectedIndex < 0 ? 0 : Math.min(selectedIndex + 1, items.length - 1);

		this.highlightSelectedItem();
	}

	/**
	 * Navigate list up (k key)
	 */
	navigateUp(): void {
		if (!this.activeList) return;

		const { items, selectedIndex } = this.activeList;
		if (items.length === 0) return;

		// Clear previous selection
		this.clearListSelection();

		// Move to previous item (or last if none selected)
		this.activeList.selectedIndex =
			selectedIndex < 0 ? items.length - 1 : Math.max(selectedIndex - 1, 0);

		this.highlightSelectedItem();
	}

	/**
	 * Clear visual selection from list items
	 */
	private clearListSelection(): void {
		if (!this.activeList) return;

		for (const item of this.activeList.items) {
			item.setAttribute('data-vim-selected', 'false');
			item.classList.remove('vim-selected');
		}
	}

	/**
	 * Highlight the currently selected item
	 */
	private highlightSelectedItem(): void {
		if (!this.activeList || this.activeList.selectedIndex < 0) return;

		const item = this.activeList.items[this.activeList.selectedIndex];
		if (item) {
			item.setAttribute('data-vim-selected', 'true');
			item.classList.add('vim-selected');
			item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

			// Dispatch custom event for components to react
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('vim-list-select', {
						detail: { item, index: this.activeList.selectedIndex }
					})
				);
			}
		}
	}

	/**
	 * Open selected item (Enter key)
	 */
	openSelectedItem(): void {
		const item = this.getSelectedItem();
		if (!item) return;

		// Check for link or button
		const link = item.querySelector('a') || item.closest('a');
		const button = item.querySelector('button') || item.closest('button');

		if (link) {
			link.click();
		} else if (button) {
			button.click();
		} else if (typeof window !== 'undefined') {
			// Dispatch event for custom handling
			window.dispatchEvent(
				new CustomEvent('vim-list-open', {
					detail: { item, index: this.activeList?.selectedIndex }
				})
			);
		}
	}

	/**
	 * Toggle selection (x key)
	 */
	toggleSelection(): void {
		const item = this.getSelectedItem();
		if (!item) return;

		const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
		if (checkbox) {
			checkbox.click();
		} else if (typeof window !== 'undefined') {
			// Dispatch event for custom handling
			const isSelected = item.getAttribute('data-vim-checked') === 'true';
			item.setAttribute('data-vim-checked', String(!isSelected));
			window.dispatchEvent(
				new CustomEvent('vim-list-toggle', {
					detail: { item, index: this.activeList?.selectedIndex, selected: !isSelected }
				})
			);
		}
	}

	/**
	 * Handle keydown events
	 */
	private handleKeyDown(event: KeyboardEvent): void {
		// Skip if input is focused (except for Escape)
		if (this.isInputFocused) {
			if (event.key === 'Escape') {
				// Allow Escape to blur inputs
				(document.activeElement as HTMLElement)?.blur();
				event.preventDefault();
			}
			return;
		}

		// Skip if modifier keys are pressed (let existing shortcuts handle those)
		if (event.metaKey || event.ctrlKey || event.altKey) {
			// Exception: Cmd/Ctrl+K for command palette
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault();
				this.openCommandPalette();
				return;
			}
			return;
		}

		const key = event.key.toLowerCase();

		// Check for sequence continuation
		if (this.sequenceTracker.isPending()) {
			const prefix = this.sequenceTracker.getPrefix()!;
			const suffixMap = this.sequenceShortcuts.get(prefix);
			if (suffixMap?.has(key)) {
				event.preventDefault();
				this.sequenceTracker.clear();
				suffixMap.get(key)!.action();
				return;
			}
			// Invalid sequence - clear and continue
			this.sequenceTracker.clear();
		}

		// Check for sequence start
		if (this.sequenceShortcuts.has(key)) {
			event.preventDefault();
			this.startSequence(key);
			return;
		}

		// Check for single-key shortcuts
		const shortcut = this.shortcuts.get(key);
		if (shortcut) {
			// Skip list-context shortcuts if no list is active
			if (shortcut.requiresListContext && !this.activeList) {
				return;
			}
			event.preventDefault();
			shortcut.action();
		}
	}

	/**
	 * Start a key sequence
	 */
	private startSequence(prefix: string): void {
		this.sequenceTracker.start(prefix);

		// Show sequence indicator
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('vim-sequence-start', { detail: { prefix } }));
		}
	}

	/**
	 * Open command palette
	 */
	private openCommandPalette(): void {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('open-search'));
		}
	}

	/**
	 * Open help dialog
	 */
	openHelp(): void {
		this.helpOpen = true;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('keyboard-help-toggle', { detail: { open: true } }));
		}
	}

	/**
	 * Close help dialog
	 */
	closeHelp(): void {
		this.helpOpen = false;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('keyboard-help-toggle', { detail: { open: false } }));
		}
	}

	/**
	 * Toggle help dialog
	 */
	toggleHelp(): void {
		if (this.helpOpen) {
			this.closeHelp();
		} else {
			this.openHelp();
		}
	}

	/**
	 * Update input focus state
	 */
	private updateInputFocus(event: FocusEvent): void {
		const target = event.target as HTMLElement;
		this.isInputFocused =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			(target && target.contentEditable === 'true');
	}

	/**
	 * Destroy the manager and clean up
	 */
	destroy(): void {
		if (typeof window !== 'undefined') {
			document.removeEventListener('keydown', this.boundHandleKeyDown);
			document.removeEventListener('focus', this.boundUpdateInputFocus, true);
			document.removeEventListener('blur', this.boundUpdateInputFocus, true);
		}
		this.sequenceTracker.destroy();
		this.activeList = null;
		this.listContainers.clear();
	}
}

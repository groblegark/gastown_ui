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
import * as listNav from './list-nav';

/**
 * Main vim keyboard manager class
 */
export class VimKeyboardManager {
	private shortcuts: Map<string, VimShortcut> = new Map();
	private sequenceShortcuts: Map<string, Map<string, VimShortcut>> = new Map();
	private isInputFocused = false;
	private helpOpen = false;
	private sequenceTracker: SequenceTracker;
	private activeList: ListState | null = null;
	private listContainers: Map<string, HTMLElement> = new Map();
	private boundHandleKeyDown: (e: KeyboardEvent) => void;
	private boundUpdateInputFocus: (e: FocusEvent) => void;

	constructor() {
		this.sequenceTracker = new SequenceTracker();
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

	/** Register a vim shortcut */
	register(id: string, shortcut: VimShortcut): void {
		if (Array.isArray(shortcut.key)) {
			const [prefix, suffix] = shortcut.key;
			if (!this.sequenceShortcuts.has(prefix)) {
				this.sequenceShortcuts.set(prefix, new Map());
			}
			this.sequenceShortcuts.get(prefix)!.set(suffix, shortcut);
		} else {
			this.shortcuts.set(shortcut.key, shortcut);
		}
	}

	/** Unregister a shortcut */
	unregister(id: string): void {
		this.shortcuts.delete(id);
		for (const [, suffixMap] of this.sequenceShortcuts) {
			for (const [key] of suffixMap) {
				if (id === key) suffixMap.delete(key);
			}
		}
	}

	/** Get all registered shortcuts for display */
	getShortcuts(): VimShortcut[] {
		const all: VimShortcut[] = [];
		for (const shortcut of this.shortcuts.values()) all.push(shortcut);
		for (const [, suffixMap] of this.sequenceShortcuts) {
			for (const shortcut of suffixMap.values()) all.push(shortcut);
		}
		return all;
	}

	/** Get shortcuts by category */
	getShortcutsByCategory(category: 'navigation' | 'list' | 'action' | 'system'): VimShortcut[] {
		return this.getShortcuts().filter((s) => s.category === category);
	}

	/** Format shortcut keys for display */
	formatShortcut(key: string | string[]): string {
		if (Array.isArray(key)) return key.join(' then ');
		if (key === '/' || key === '?') return key;
		return key.toUpperCase();
	}

	/** Register a list container for j/k navigation */
	registerList(containerId: string, element: HTMLElement): void {
		this.listContainers.set(containerId, element);
	}

	/** Unregister a list container */
	unregisterList(containerId: string): void {
		this.listContainers.delete(containerId);
		if (this.activeList?.containerId === containerId) this.activeList = null;
	}

	/** Set the active list for keyboard navigation */
	setActiveList(containerId: string): void {
		const container = this.listContainers.get(containerId);
		if (!container) return;
		this.activeList = listNav.createListState(container, containerId);
	}

	/** Clear active list */
	clearActiveList(): void {
		if (this.activeList) listNav.clearSelection(this.activeList);
		this.activeList = null;
	}

	/** Get current selected item */
	getSelectedItem(): HTMLElement | null {
		if (!this.activeList || this.activeList.selectedIndex < 0) return null;
		return this.activeList.items[this.activeList.selectedIndex] || null;
	}

	/** Navigate list down (j key) */
	navigateDown(): void {
		if (this.activeList) listNav.moveDown(this.activeList);
	}

	/** Navigate list up (k key) */
	navigateUp(): void {
		if (this.activeList) listNav.moveUp(this.activeList);
	}

	/** Open selected item (Enter key) */
	openSelectedItem(): void {
		if (this.activeList) listNav.openItem(this.activeList);
	}

	/** Toggle selection (x key) */
	toggleSelection(): void {
		if (this.activeList) listNav.toggleItem(this.activeList);
	}

	/** Handle keydown events */
	private handleKeyDown(event: KeyboardEvent): void {
		if (this.isInputFocused) {
			if (event.key === 'Escape') {
				(document.activeElement as HTMLElement)?.blur();
				event.preventDefault();
			}
			return;
		}

		if (event.metaKey || event.ctrlKey || event.altKey) {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault();
				this.openCommandPalette();
			}
			return;
		}

		const key = event.key.toLowerCase();

		if (this.sequenceTracker.isPending()) {
			const prefix = this.sequenceTracker.getPrefix()!;
			const suffixMap = this.sequenceShortcuts.get(prefix);
			if (suffixMap?.has(key)) {
				event.preventDefault();
				this.sequenceTracker.clear();
				suffixMap.get(key)!.action();
				return;
			}
			this.sequenceTracker.clear();
		}

		if (this.sequenceShortcuts.has(key)) {
			event.preventDefault();
			this.startSequence(key);
			return;
		}

		const shortcut = this.shortcuts.get(key);
		if (shortcut) {
			if (shortcut.requiresListContext && !this.activeList) return;
			event.preventDefault();
			shortcut.action();
		}
	}

	private startSequence(prefix: string): void {
		this.sequenceTracker.start(prefix);
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('vim-sequence-start', { detail: { prefix } }));
		}
	}

	private openCommandPalette(): void {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('open-search'));
		}
	}

	openHelp(): void {
		this.helpOpen = true;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('keyboard-help-toggle', { detail: { open: true } }));
		}
	}

	closeHelp(): void {
		this.helpOpen = false;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('keyboard-help-toggle', { detail: { open: false } }));
		}
	}

	toggleHelp(): void {
		if (this.helpOpen) this.closeHelp();
		else this.openHelp();
	}

	private updateInputFocus(event: FocusEvent): void {
		const target = event.target as HTMLElement;
		this.isInputFocused =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			(target && target.contentEditable === 'true');
	}

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

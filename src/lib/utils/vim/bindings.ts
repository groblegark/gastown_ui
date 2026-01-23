/**
 * Vim Key Bindings Definitions
 *
 * Defines the shortcut types and default bindings for vim-style navigation.
 * This module is pure data - no side effects or DOM dependencies.
 */

/**
 * A vim-style keyboard shortcut definition
 */
export interface VimShortcut {
	/** Single key or sequence (e.g., ['g', 'd']) */
	key: string | string[];
	/** Human-readable description */
	description: string;
	/** Action to execute when triggered */
	action: () => void;
	/** Category for grouping in help display */
	category: 'navigation' | 'list' | 'action' | 'system';
	/** Only active when a list is focused */
	requiresListContext?: boolean;
}

/**
 * State for list navigation
 */
export interface ListState {
	items: HTMLElement[];
	selectedIndex: number;
	containerId: string;
}

/**
 * Binding definition for registration
 */
export interface BindingDefinition {
	id: string;
	shortcut: Omit<VimShortcut, 'action'>;
}

/**
 * Default navigation bindings (g + key sequences)
 */
export const DEFAULT_NAVIGATION_BINDINGS: BindingDefinition[] = [
	{
		id: 'nav-dashboard',
		shortcut: {
			key: ['g', 'd'],
			description: 'Go to Dashboard',
			category: 'navigation'
		}
	},
	{
		id: 'nav-agents',
		shortcut: {
			key: ['g', 'a'],
			description: 'Go to Agents',
			category: 'navigation'
		}
	},
	{
		id: 'nav-rigs',
		shortcut: {
			key: ['g', 'r'],
			description: 'Go to Rigs',
			category: 'navigation'
		}
	},
	{
		id: 'nav-work',
		shortcut: {
			key: ['g', 'w'],
			description: 'Go to Work',
			category: 'navigation'
		}
	},
	{
		id: 'nav-mail',
		shortcut: {
			key: ['g', 'm'],
			description: 'Go to Mail',
			category: 'navigation'
		}
	},
	{
		id: 'nav-queue',
		shortcut: {
			key: ['g', 'q'],
			description: 'Go to Queue',
			category: 'navigation'
		}
	},
	{
		id: 'nav-convoys',
		shortcut: {
			key: ['g', 'c'],
			description: 'Go to Convoys',
			category: 'navigation'
		}
	}
];

/**
 * Default list navigation bindings (j/k/Enter/Escape/x)
 */
export const DEFAULT_LIST_BINDINGS: BindingDefinition[] = [
	{
		id: 'list-down',
		shortcut: {
			key: 'j',
			description: 'Next item',
			category: 'list',
			requiresListContext: true
		}
	},
	{
		id: 'list-up',
		shortcut: {
			key: 'k',
			description: 'Previous item',
			category: 'list',
			requiresListContext: true
		}
	},
	{
		id: 'list-open',
		shortcut: {
			key: 'enter',
			description: 'Open selected',
			category: 'list',
			requiresListContext: true
		}
	},
	{
		id: 'list-deselect',
		shortcut: {
			key: 'escape',
			description: 'Deselect/close',
			category: 'list'
		}
	},
	{
		id: 'list-toggle',
		shortcut: {
			key: 'x',
			description: 'Toggle select',
			category: 'list',
			requiresListContext: true
		}
	}
];

/**
 * Default action bindings (single-key actions)
 */
export const DEFAULT_ACTION_BINDINGS: BindingDefinition[] = [
	{
		id: 'action-refresh',
		shortcut: {
			key: 'r',
			description: 'Refresh',
			category: 'action'
		}
	},
	{
		id: 'action-create',
		shortcut: {
			key: 'c',
			description: 'Create new',
			category: 'action'
		}
	},
	{
		id: 'action-sling',
		shortcut: {
			key: 's',
			description: 'Sling (assign work)',
			category: 'action'
		}
	},
	{
		id: 'action-search',
		shortcut: {
			key: '/',
			description: 'Focus search',
			category: 'action'
		}
	},
	{
		id: 'action-help',
		shortcut: {
			key: '?',
			description: 'Show help',
			category: 'system'
		}
	}
];

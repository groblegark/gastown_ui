/**
 * Vim-Style Keyboard Navigation
 *
 * Provides vim-style shortcuts for the application:
 * - Navigation sequences: g+d (dashboard), g+a (agents), etc.
 * - List navigation: j (down), k (up), Enter (open), Escape (deselect), x (toggle)
 * - Actions: r (refresh), c (create), s (sling), / (search), ? (help)
 * - Command palette: Cmd/Ctrl+K
 */

// Re-export types and constants from submodules
export { SEQUENCE_TIMEOUT, SequenceTracker } from './parser';
export type { VimShortcut, ListState, BindingDefinition } from './bindings';
export {
	DEFAULT_NAVIGATION_BINDINGS,
	DEFAULT_LIST_BINDINGS,
	DEFAULT_ACTION_BINDINGS
} from './bindings';
export { VimKeyboardManager } from './modes';

// Singleton instance
let vimManager: import('./modes').VimKeyboardManager | null = null;

/**
 * Initialize vim keyboard shortcuts
 */
export function initializeVimShortcuts(): import('./modes').VimKeyboardManager {
	// Dynamically import to avoid circular dependency and test environment issues
	const { VimKeyboardManager } = require('./modes');

	// Import goto dynamically to avoid issues in test environment
	let goto: (path: string) => void;
	try {
		goto = require('$app/navigation').goto;
	} catch {
		// In test environment, provide a no-op
		goto = () => {};
	}

	if (typeof window !== 'undefined' && !vimManager) {
		const manager = new VimKeyboardManager();

		// Register navigation shortcuts (g + key sequences)
		manager.register('nav-dashboard', {
			key: ['g', 'd'],
			description: 'Go to Dashboard',
			action: () => goto('/'),
			category: 'navigation'
		});

		manager.register('nav-agents', {
			key: ['g', 'a'],
			description: 'Go to Agents',
			action: () => goto('/agents'),
			category: 'navigation'
		});

		manager.register('nav-rigs', {
			key: ['g', 'r'],
			description: 'Go to Rigs',
			action: () => goto('/rigs'),
			category: 'navigation'
		});

		manager.register('nav-work', {
			key: ['g', 'w'],
			description: 'Go to Work',
			action: () => goto('/work'),
			category: 'navigation'
		});

		manager.register('nav-mail', {
			key: ['g', 'm'],
			description: 'Go to Mail',
			action: () => goto('/mail'),
			category: 'navigation'
		});

		manager.register('nav-queue', {
			key: ['g', 'q'],
			description: 'Go to Queue',
			action: () => goto('/queue'),
			category: 'navigation'
		});

		manager.register('nav-convoys', {
			key: ['g', 'c'],
			description: 'Go to Convoys',
			action: () => goto('/convoys'),
			category: 'navigation'
		});

		// List navigation shortcuts
		manager.register('list-down', {
			key: 'j',
			description: 'Next item',
			action: () => manager.navigateDown(),
			category: 'list',
			requiresListContext: true
		});

		manager.register('list-up', {
			key: 'k',
			description: 'Previous item',
			action: () => manager.navigateUp(),
			category: 'list',
			requiresListContext: true
		});

		manager.register('list-open', {
			key: 'enter',
			description: 'Open selected',
			action: () => manager.openSelectedItem(),
			category: 'list',
			requiresListContext: true
		});

		manager.register('list-deselect', {
			key: 'escape',
			description: 'Deselect/close',
			action: () => manager.clearActiveList(),
			category: 'list'
		});

		manager.register('list-toggle', {
			key: 'x',
			description: 'Toggle select',
			action: () => manager.toggleSelection(),
			category: 'list',
			requiresListContext: true
		});

		// Action shortcuts
		manager.register('action-refresh', {
			key: 'r',
			description: 'Refresh',
			action: () => window.dispatchEvent(new CustomEvent('vim-refresh')),
			category: 'action'
		});

		manager.register('action-create', {
			key: 'c',
			description: 'Create new',
			action: () => window.dispatchEvent(new CustomEvent('vim-create')),
			category: 'action'
		});

		manager.register('action-sling', {
			key: 's',
			description: 'Sling (assign work)',
			action: () => window.dispatchEvent(new CustomEvent('vim-sling')),
			category: 'action'
		});

		manager.register('action-search', {
			key: '/',
			description: 'Focus search',
			action: () => window.dispatchEvent(new CustomEvent('open-search')),
			category: 'action'
		});

		manager.register('action-help', {
			key: '?',
			description: 'Show help',
			action: () => manager.toggleHelp(),
			category: 'system'
		});

		// Assign to module-level singleton
		vimManager = manager;
	}

	return vimManager!;
}

/**
 * Get the vim keyboard manager instance
 */
export function getVimManager(): import('./modes').VimKeyboardManager | null {
	return vimManager;
}

/**
 * Svelte action for registering a list container
 */
export function vimList(node: HTMLElement, containerId: string) {
	const manager = getVimManager();
	if (manager) {
		manager.registerList(containerId, node);

		// Set as active when focused or clicked
		const handleFocus = () => manager.setActiveList(containerId);
		const handleClick = () => manager.setActiveList(containerId);

		node.addEventListener('focusin', handleFocus);
		node.addEventListener('click', handleClick);

		return {
			destroy() {
				manager.unregisterList(containerId);
				node.removeEventListener('focusin', handleFocus);
				node.removeEventListener('click', handleClick);
			}
		};
	}
}

/**
 * Vim-Style Keyboard Navigation
 *
 * BACKWARDS COMPATIBILITY SHIM
 *
 * This file re-exports from the new vim module structure.
 * New code should import directly from '$lib/utils/vim'.
 *
 * @deprecated Import from '$lib/utils/vim' instead
 */

// Re-export everything from the new module location
export {
	// Types
	type VimShortcut,
	type ListState,
	type BindingDefinition,
	// Classes
	VimKeyboardManager,
	SequenceTracker,
	// Constants
	SEQUENCE_TIMEOUT,
	// Binding arrays
	DEFAULT_NAVIGATION_BINDINGS,
	DEFAULT_LIST_BINDINGS,
	DEFAULT_ACTION_BINDINGS,
	// Functions
	initializeVimShortcuts,
	getVimManager,
	vimList
} from './vim';

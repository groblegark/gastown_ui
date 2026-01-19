/**
 * Clipboard Utility
 * Provides cross-browser clipboard operations with fallback for older browsers
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
 */

/**
 * Check if the Clipboard API is available
 */
export function supportsClipboard(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		'clipboard' in navigator &&
		navigator.clipboard != null &&
		typeof navigator.clipboard.writeText === 'function'
	);
}

/**
 * Copy text to clipboard using the Clipboard API with fallback
 * @param text - The text to copy
 * @returns Promise resolving to true on success, false on failure
 */
export async function copy(text: string): Promise<boolean> {
	// Try modern Clipboard API first
	if (supportsClipboard()) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to fallback
		}
	}

	// Fallback for older browsers or when Clipboard API fails
	return copyFallback(text);
}

/**
 * Fallback copy method using a temporary textarea
 * Used when Clipboard API is unavailable or fails
 */
function copyFallback(text: string): boolean {
	if (typeof document === 'undefined') return false;

	const textarea = document.createElement('textarea');
	textarea.value = text;

	// Prevent scrolling to bottom of page
	textarea.style.position = 'fixed';
	textarea.style.top = '0';
	textarea.style.left = '0';
	textarea.style.width = '2em';
	textarea.style.height = '2em';
	textarea.style.padding = '0';
	textarea.style.border = 'none';
	textarea.style.outline = 'none';
	textarea.style.boxShadow = 'none';
	textarea.style.background = 'transparent';
	textarea.style.opacity = '0';

	// Accessibility: hide from screen readers
	textarea.setAttribute('aria-hidden', 'true');
	textarea.setAttribute('tabindex', '-1');

	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();

	let success = false;
	try {
		success = document.execCommand('copy');
	} catch {
		success = false;
	}

	document.body.removeChild(textarea);
	return success;
}

/**
 * Read text from clipboard
 * @returns Promise resolving to clipboard text or empty string on failure
 */
export async function paste(): Promise<string> {
	if (!supportsClipboard()) {
		return '';
	}

	try {
		return await navigator.clipboard.readText();
	} catch {
		return '';
	}
}

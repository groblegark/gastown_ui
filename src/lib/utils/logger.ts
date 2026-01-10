/**
 * Debug Logger Utility
 *
 * Provides consistent, namespaced logging with environment-aware output control.
 *
 * Features:
 * - Namespaced loggers for different modules
 * - Log levels: debug, info, warn, error
 * - Environment-aware (enabled in dev, disabled in prod by default)
 * - Colored console output for better visibility
 * - Timestamp support
 *
 * Usage:
 * ```ts
 * import { createLogger } from '$lib/utils/logger';
 *
 * const log = createLogger('WebSocket');
 * log.debug('Connection opened');
 * log.info('Message received', { type: 'ping' });
 * log.warn('Reconnecting...', { attempt: 3 });
 * log.error('Connection failed', error);
 * ```
 */

import { browser } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
	/** Whether logging is enabled (defaults to dev mode) */
	enabled?: boolean;
	/** Minimum log level to output (defaults to 'debug' in dev, 'warn' in prod) */
	minLevel?: LogLevel;
	/** Whether to include timestamps (defaults to true) */
	timestamps?: boolean;
}

interface LoggerInstance {
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	/** Create a child logger with additional namespace */
	child: (childNamespace: string) => LoggerInstance;
}

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

// Console colors for different namespaces (cycles through)
const NAMESPACE_COLORS = [
	'#3b82f6', // blue
	'#10b981', // green
	'#f59e0b', // amber
	'#8b5cf6', // violet
	'#ef4444', // red
	'#ec4899', // pink
	'#06b6d4', // cyan
	'#84cc16' // lime
];

// Map of namespaces to their assigned colors
const namespaceColors = new Map<string, string>();
let colorIndex = 0;

function getNamespaceColor(namespace: string): string {
	if (!namespaceColors.has(namespace)) {
		namespaceColors.set(namespace, NAMESPACE_COLORS[colorIndex % NAMESPACE_COLORS.length]);
		colorIndex++;
	}
	return namespaceColors.get(namespace)!;
}

// Global logger configuration
let globalEnabled = import.meta.env.DEV;
let globalMinLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';
let globalTimestamps = true;

// Storage key for persisting enabled namespaces
const ENABLED_NAMESPACES_KEY = 'gastown-debug-namespaces';

// Set of enabled namespace patterns (supports wildcards like 'WebSocket:*')
let enabledNamespaces: Set<string> = new Set(['*']);

// Load enabled namespaces from localStorage on init (browser only)
function loadEnabledNamespaces(): void {
	if (!browser) return;
	try {
		const saved = localStorage.getItem(ENABLED_NAMESPACES_KEY);
		if (saved) {
			enabledNamespaces = new Set(JSON.parse(saved));
		}
	} catch {
		// Ignore parse errors, use defaults
	}
}

// Save enabled namespaces to localStorage
function saveEnabledNamespaces(): void {
	if (!browser) return;
	try {
		localStorage.setItem(ENABLED_NAMESPACES_KEY, JSON.stringify([...enabledNamespaces]));
	} catch {
		// Ignore storage errors
	}
}

// Check if a namespace is enabled
function isNamespaceEnabled(namespace: string): boolean {
	if (enabledNamespaces.has('*')) return true;
	if (enabledNamespaces.has(namespace)) return true;

	// Check for wildcard patterns
	for (const pattern of enabledNamespaces) {
		if (pattern.endsWith('*')) {
			const prefix = pattern.slice(0, -1);
			if (namespace.startsWith(prefix)) return true;
		}
	}

	return false;
}

/**
 * Configure the global logger settings
 */
export function configureLogger(options: {
	enabled?: boolean;
	minLevel?: LogLevel;
	timestamps?: boolean;
	enableNamespaces?: string[];
	disableNamespaces?: string[];
}): void {
	if (options.enabled !== undefined) globalEnabled = options.enabled;
	if (options.minLevel !== undefined) globalMinLevel = options.minLevel;
	if (options.timestamps !== undefined) globalTimestamps = options.timestamps;

	if (options.enableNamespaces) {
		options.enableNamespaces.forEach((ns) => enabledNamespaces.add(ns));
		saveEnabledNamespaces();
	}

	if (options.disableNamespaces) {
		options.disableNamespaces.forEach((ns) => enabledNamespaces.delete(ns));
		saveEnabledNamespaces();
	}
}

/**
 * Enable specific namespaces for logging (supports wildcards)
 * @example
 * enableNamespaces('WebSocket', 'Auth:*', 'API')
 */
export function enableNamespaces(...namespaces: string[]): void {
	namespaces.forEach((ns) => enabledNamespaces.add(ns));
	saveEnabledNamespaces();
}

/**
 * Disable specific namespaces
 */
export function disableNamespaces(...namespaces: string[]): void {
	namespaces.forEach((ns) => enabledNamespaces.delete(ns));
	saveEnabledNamespaces();
}

/**
 * Enable all logging (add '*' wildcard)
 */
export function enableAllLogs(): void {
	enabledNamespaces.add('*');
	saveEnabledNamespaces();
}

/**
 * Disable all logging (remove '*' wildcard)
 */
export function disableAllLogs(): void {
	enabledNamespaces.delete('*');
	saveEnabledNamespaces();
}

/**
 * Get list of currently enabled namespace patterns
 */
export function getEnabledNamespaces(): string[] {
	return [...enabledNamespaces];
}

/**
 * Create a namespaced logger instance
 *
 * @param namespace - The namespace/module name for this logger
 * @param options - Optional configuration overrides
 * @returns Logger instance with debug, info, warn, error methods
 */
export function createLogger(namespace: string, options: LoggerOptions = {}): LoggerInstance {
	const {
		enabled = globalEnabled,
		minLevel = globalMinLevel,
		timestamps = globalTimestamps
	} = options;

	const color = getNamespaceColor(namespace);

	function shouldLog(level: LogLevel): boolean {
		if (!enabled) return false;
		if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) return false;
		if (!isNamespaceEnabled(namespace)) return false;
		return true;
	}

	function formatPrefix(level: LogLevel): string[] {
		const parts: string[] = [];

		if (timestamps) {
			const now = new Date();
			const time = now.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				fractionalSecondDigits: 3
			});
			parts.push(`%c${time}`, 'color: #6b7280');
		}

		// Namespace with color
		parts.push(`%c[${namespace}]`, `color: ${color}; font-weight: bold`);

		// Level indicator
		const levelColors: Record<LogLevel, string> = {
			debug: '#9ca3af',
			info: '#3b82f6',
			warn: '#f59e0b',
			error: '#ef4444'
		};
		parts.push(`%c${level.toUpperCase()}`, `color: ${levelColors[level]}`);

		return parts;
	}

	function log(level: LogLevel, ...args: unknown[]): void {
		if (!shouldLog(level)) return;

		const prefix = formatPrefix(level);
		const consoleMethod = level === 'debug' ? 'log' : level;

		if (browser) {
			// Browser: use colored output
			const formatStr = prefix.filter((_, i) => i % 2 === 0).join(' ');
			const styles = prefix.filter((_, i) => i % 2 === 1);
			console[consoleMethod](formatStr, ...styles, ...args);
		} else {
			// Server: plain text
			const time = timestamps ? `${new Date().toISOString()} ` : '';
			console[consoleMethod](`${time}[${namespace}] ${level.toUpperCase()}:`, ...args);
		}
	}

	const logger: LoggerInstance = {
		debug: (...args: unknown[]) => log('debug', ...args),
		info: (...args: unknown[]) => log('info', ...args),
		warn: (...args: unknown[]) => log('warn', ...args),
		error: (...args: unknown[]) => log('error', ...args),
		child: (childNamespace: string) => createLogger(`${namespace}:${childNamespace}`, options)
	};

	return logger;
}

// Initialize on module load
loadEnabledNamespaces();

// Pre-built loggers for common modules
export const log = {
	/** General app logging */
	app: createLogger('App'),
	/** Authentication module */
	auth: createLogger('Auth'),
	/** WebSocket connections */
	ws: createLogger('WebSocket'),
	/** API requests */
	api: createLogger('API'),
	/** Service Worker */
	sw: createLogger('SW'),
	/** Sync operations */
	sync: createLogger('Sync'),
	/** Network status */
	network: createLogger('Network'),
	/** UI components */
	ui: createLogger('UI'),
	/** Error boundaries */
	error: createLogger('Error')
};

// Export window helper for debugging in browser console
if (browser) {
	// Expose debug controls to window for easy debugging
	(window as unknown as Record<string, unknown>).__gastwonLog = {
		enable: enableNamespaces,
		disable: disableNamespaces,
		enableAll: enableAllLogs,
		disableAll: disableAllLogs,
		list: getEnabledNamespaces,
		configure: configureLogger,
		create: createLogger
	};
}

/**
 * Tests for stores module structure and organization
 *
 * Verifies:
 * - Core stores index exports expected items
 * - Domain stores index exports expected items
 * - Main index re-exports all stores
 * - Backwards compatibility is maintained
 *
 * NOTE: These tests verify the module structure exists, not runtime behavior.
 * Svelte 5 runes and $app/environment require special test setup.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const STORES_DIR = join(process.cwd(), 'src/lib/stores');

/**
 * Helper to check if a file exports a symbol (via grep on source)
 */
function fileExports(filePath: string, exportName: string): boolean {
	const fullPath = join(STORES_DIR, filePath);
	if (!existsSync(fullPath)) return false;
	const content = readFileSync(fullPath, 'utf-8');
	// Match various export patterns
	const patterns = [
		new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`, 'm'),
		new RegExp(`export\\s+const\\s+${exportName}\\b`),
		new RegExp(`export\\s+function\\s+${exportName}\\b`),
		new RegExp(`export\\s+class\\s+${exportName}\\b`),
		new RegExp(`export\\s+type\\s+${exportName}\\b`),
		new RegExp(`export\\s+interface\\s+${exportName}\\b`)
	];
	return patterns.some((p) => p.test(content));
}

describe('stores/core module structure', () => {
	const coreIndexPath = 'core/index.ts';

	it('exports network store items', () => {
		expect(fileExports(coreIndexPath, 'networkStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'createNetworkStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'NetworkError')).toBe(true);
		expect(fileExports(coreIndexPath, 'NetworkErrorCode')).toBe(true);
	});

	it('exports visibility store items', () => {
		expect(fileExports(coreIndexPath, 'visibilityStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'createVisibilityStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'NORMAL_POLLING_INTERVAL')).toBe(true);
		expect(fileExports(coreIndexPath, 'BACKGROUND_POLLING_INTERVAL')).toBe(true);
	});

	it('exports polling store items', () => {
		expect(fileExports(coreIndexPath, 'pollingManager')).toBe(true);
		expect(fileExports(coreIndexPath, 'usePolling')).toBe(true);
		expect(fileExports(coreIndexPath, 'getPolling')).toBe(true);
		expect(fileExports(coreIndexPath, 'removePolling')).toBe(true);
		expect(fileExports(coreIndexPath, 'createMultiTierPolling')).toBe(true);
		expect(fileExports(coreIndexPath, 'POLLING_TIERS')).toBe(true);
	});

	it('exports toast store items', () => {
		expect(fileExports(coreIndexPath, 'toastStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'Toast')).toBe(true);
		expect(fileExports(coreIndexPath, 'ToastType')).toBe(true);
		expect(fileExports(coreIndexPath, 'ToastOptions')).toBe(true);
	});

	it('exports operations store items', () => {
		expect(fileExports(coreIndexPath, 'operationsStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'trackOperation')).toBe(true);
		expect(fileExports(coreIndexPath, 'trackBatchOperation')).toBe(true);
	});

	it('exports SWR cache items', () => {
		expect(fileExports(coreIndexPath, 'swrCache')).toBe(true);
		expect(fileExports(coreIndexPath, 'createSWRCache')).toBe(true);
		expect(fileExports(coreIndexPath, 'CACHE_KEYS')).toBe(true);
		expect(fileExports(coreIndexPath, 'CACHE_TTLS')).toBe(true);
	});

	it('exports theme store', () => {
		expect(fileExports(coreIndexPath, 'themeStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'Theme')).toBe(true);
	});

	it('exports sync store items', () => {
		expect(fileExports(coreIndexPath, 'syncStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'createSyncStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'useSyncStatus')).toBe(true);
	});

	it('exports websocket client items', () => {
		expect(fileExports(coreIndexPath, 'wsClient')).toBe(true);
		expect(fileExports(coreIndexPath, 'createWebSocketClient')).toBe(true);
	});

	it('exports SSE store items', () => {
		expect(fileExports(coreIndexPath, 'sseStore')).toBe(true);
		expect(fileExports(coreIndexPath, 'useSSE')).toBe(true);
	});
});

describe('stores/domains module structure', () => {
	const domainsIndexPath = 'domains/index.ts';

	it('exports work store items', () => {
		expect(fileExports(domainsIndexPath, 'workStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useWork')).toBe(true);
		expect(fileExports(domainsIndexPath, 'WorkItem')).toBe(true);
		expect(fileExports(domainsIndexPath, 'WorkFilter')).toBe(true);
	});

	it('exports convoys store items', () => {
		expect(fileExports(domainsIndexPath, 'convoysStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useConvoys')).toBe(true);
		expect(fileExports(domainsIndexPath, 'Convoy')).toBe(true);
		expect(fileExports(domainsIndexPath, 'ConvoyStatus')).toBe(true);
	});

	it('exports agents store items', () => {
		expect(fileExports(domainsIndexPath, 'agentsStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useAgents')).toBe(true);
		expect(fileExports(domainsIndexPath, 'Agent')).toBe(true);
		expect(fileExports(domainsIndexPath, 'AgentStatus')).toBe(true);
	});

	it('exports mail store items', () => {
		expect(fileExports(domainsIndexPath, 'mailStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useMail')).toBe(true);
		expect(fileExports(domainsIndexPath, 'MailItem')).toBe(true);
	});

	it('exports rigs store items', () => {
		expect(fileExports(domainsIndexPath, 'rigsStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useRigs')).toBe(true);
		expect(fileExports(domainsIndexPath, 'Rig')).toBe(true);
	});

	it('exports queue store items', () => {
		expect(fileExports(domainsIndexPath, 'queueStore')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useQueue')).toBe(true);
		expect(fileExports(domainsIndexPath, 'MergeQueueItem')).toBe(true);
	});

	it('exports search index items', () => {
		expect(fileExports(domainsIndexPath, 'searchIndex')).toBe(true);
		expect(fileExports(domainsIndexPath, 'useSearchIndex')).toBe(true);
	});
});

describe('stores main index (backwards compatibility)', () => {
	const mainIndexPath = 'index.ts';

	it('re-exports all core stores from main index', () => {
		// Network (legacy export)
		expect(fileExports(mainIndexPath, 'networkState')).toBe(true);

		// Toast
		expect(fileExports(mainIndexPath, 'toastStore')).toBe(true);

		// Theme
		expect(fileExports(mainIndexPath, 'themeStore')).toBe(true);

		// WebSocket
		expect(fileExports(mainIndexPath, 'wsClient')).toBe(true);
		expect(fileExports(mainIndexPath, 'createWebSocketClient')).toBe(true);

		// Sync
		expect(fileExports(mainIndexPath, 'syncStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'createSyncStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useSyncStatus')).toBe(true);

		// Polling
		expect(fileExports(mainIndexPath, 'pollingManager')).toBe(true);
		expect(fileExports(mainIndexPath, 'usePolling')).toBe(true);
		expect(fileExports(mainIndexPath, 'POLLING_TIERS')).toBe(true);

		// Operations
		expect(fileExports(mainIndexPath, 'operationsStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'trackOperation')).toBe(true);

		// SWR
		expect(fileExports(mainIndexPath, 'swrCache')).toBe(true);
		expect(fileExports(mainIndexPath, 'CACHE_KEYS')).toBe(true);
		expect(fileExports(mainIndexPath, 'CACHE_TTLS')).toBe(true);

		// SSE
		expect(fileExports(mainIndexPath, 'sseStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useSSE')).toBe(true);
	});

	it('re-exports all domain stores from main index', () => {
		// Work
		expect(fileExports(mainIndexPath, 'workStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useWork')).toBe(true);

		// Convoys
		expect(fileExports(mainIndexPath, 'convoysStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useConvoys')).toBe(true);

		// Agents
		expect(fileExports(mainIndexPath, 'agentsStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useAgents')).toBe(true);

		// Mail
		expect(fileExports(mainIndexPath, 'mailStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useMail')).toBe(true);

		// Rigs
		expect(fileExports(mainIndexPath, 'rigsStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useRigs')).toBe(true);

		// Queue
		expect(fileExports(mainIndexPath, 'queueStore')).toBe(true);
		expect(fileExports(mainIndexPath, 'useQueue')).toBe(true);

		// Search
		expect(fileExports(mainIndexPath, 'searchIndex')).toBe(true);
		expect(fileExports(mainIndexPath, 'useSearchIndex')).toBe(true);
	});
});

describe('core/domains separation', () => {
	it('core index exists', () => {
		expect(existsSync(join(STORES_DIR, 'core/index.ts'))).toBe(true);
	});

	it('domains index exists', () => {
		expect(existsSync(join(STORES_DIR, 'domains/index.ts'))).toBe(true);
	});

	it('core index does not import from domains', () => {
		const coreIndexPath = join(STORES_DIR, 'core/index.ts');
		const content = readFileSync(coreIndexPath, 'utf-8');
		// Core should not reference domains
		expect(content.includes('../domains')).toBe(false);
		expect(content.includes("'./domains")).toBe(false);
	});
});

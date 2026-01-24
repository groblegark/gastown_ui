/**
 * Layout Components Module Tests
 *
 * Tests for the layout scaffolding components barrel exports.
 * These components provide page structure and navigation patterns.
 *
 * NOTE: In Svelte 5, components are exported as functions (component constructors).
 */
import { describe, it, expect } from 'vitest';

describe('Layout Components Module Exports', () => {
	describe('Navigation components', () => {
		it('exports BottomNav component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.BottomNav).toBe('function');
		});

		it('exports Sidebar component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.Sidebar).toBe('function');
		});

		it('exports SheetNav component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.SheetNav).toBe('function');
		});

		it('exports NavigationLoader component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.NavigationLoader).toBe('function');
		});
	});

	describe('Page structure components', () => {
		it('exports PageHeader component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.PageHeader).toBe('function');
		});

		it('exports pageHeaderVariants as callable function', async () => {
			const { pageHeaderVariants } = await import('./index');
			expect(typeof pageHeaderVariants).toBe('function');
		});

		it('exports DashboardLayout component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.DashboardLayout).toBe('function');
		});

		it('exports Dashboard component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.Dashboard).toBe('function');
		});

		it('exports MobileDashboard component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.MobileDashboard).toBe('function');
		});
	});

	describe('Specialized layout components', () => {
		it('exports LogsLayout component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.LogsLayout).toBe('function');
		});

		it('exports QueueLayout component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.QueueLayout).toBe('function');
		});

		it('exports WorkflowLayout component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.WorkflowLayout).toBe('function');
		});

		it('exports SplitView component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.SplitView).toBe('function');
		});

		it('exports AgentDetailLayout component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.AgentDetailLayout).toBe('function');
		});
	});

	describe('Accessibility components', () => {
		it('exports SkipLink component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.SkipLink).toBe('function');
		});

		it('exports Announcer component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.Announcer).toBe('function');
		});

		it('exports LiveRegion component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.LiveRegion).toBe('function');
		});
	});

	describe('Status and indicator components', () => {
		it('exports OperationCenter component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.OperationCenter).toBe('function');
		});

		it('exports StatusCards component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.StatusCards).toBe('function');
		});

		it('exports QuickActions component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.QuickActions).toBe('function');
		});

		it('exports ActivityFeed component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.ActivityFeed).toBe('function');
		});
	});

	describe('Network status components', () => {
		it('exports OfflineIndicator component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.OfflineIndicator).toBe('function');
		});

		it('exports ConnectionLost component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.ConnectionLost).toBe('function');
		});

		it('exports DegradedModeBanner component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.DegradedModeBanner).toBe('function');
		});
	});

	describe('PWA components', () => {
		it('exports UpdatePrompt component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.UpdatePrompt).toBe('function');
		});
	});

	describe('Keyboard components', () => {
		it('exports KeyboardHelpDialog component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.KeyboardHelpDialog).toBe('function');
		});

		it('exports VimSequenceIndicator component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.VimSequenceIndicator).toBe('function');
		});
	});

	describe('Search components', () => {
		it('exports GlobalSearch component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.GlobalSearch).toBe('function');
		});

		it('exports CommandPalette component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.CommandPalette).toBe('function');
		});
	});

	describe('Log components', () => {
		it('exports LogEntry component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.LogEntry).toBe('function');
		});

		it('exports LogEntrySkeleton component as a function', async () => {
			const module = await import('./index');
			expect(typeof module.LogEntrySkeleton).toBe('function');
		});
	});

	describe('Module Structure', () => {
		it('exports all expected layout component keys', async () => {
			const indexModule = await import('./index');
			const exportKeys = Object.keys(indexModule);

			// Navigation
			expect(exportKeys).toContain('BottomNav');
			expect(exportKeys).toContain('Sidebar');
			expect(exportKeys).toContain('SheetNav');
			expect(exportKeys).toContain('NavigationLoader');

			// Page structure
			expect(exportKeys).toContain('PageHeader');
			expect(exportKeys).toContain('pageHeaderVariants');
			expect(exportKeys).toContain('DashboardLayout');
			expect(exportKeys).toContain('Dashboard');
			expect(exportKeys).toContain('MobileDashboard');

			// Specialized layouts
			expect(exportKeys).toContain('LogsLayout');
			expect(exportKeys).toContain('QueueLayout');
			expect(exportKeys).toContain('WorkflowLayout');
			expect(exportKeys).toContain('SplitView');
			expect(exportKeys).toContain('AgentDetailLayout');

			// Accessibility
			expect(exportKeys).toContain('SkipLink');
			expect(exportKeys).toContain('Announcer');
			expect(exportKeys).toContain('LiveRegion');

			// Status/Operations
			expect(exportKeys).toContain('OperationCenter');
			expect(exportKeys).toContain('StatusCards');
			expect(exportKeys).toContain('QuickActions');
			expect(exportKeys).toContain('ActivityFeed');

			// Network status
			expect(exportKeys).toContain('OfflineIndicator');
			expect(exportKeys).toContain('ConnectionLost');
			expect(exportKeys).toContain('DegradedModeBanner');

			// PWA
			expect(exportKeys).toContain('UpdatePrompt');

			// Keyboard
			expect(exportKeys).toContain('KeyboardHelpDialog');
			expect(exportKeys).toContain('VimSequenceIndicator');

			// Search
			expect(exportKeys).toContain('GlobalSearch');
			expect(exportKeys).toContain('CommandPalette');

			// Logs
			expect(exportKeys).toContain('LogEntry');
			expect(exportKeys).toContain('LogEntrySkeleton');
		});
	});
});

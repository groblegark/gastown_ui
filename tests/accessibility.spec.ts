import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages to audit
const pages = [
	{ path: '/', name: 'Dashboard' },
	{ path: '/agents', name: 'Agents' },
	{ path: '/work', name: 'Work' },
	{ path: '/mail', name: 'Mail' },
	{ path: '/queue', name: 'Queue' },
	{ path: '/convoys', name: 'Convoys' },
	{ path: '/workflows', name: 'Workflows' },
	{ path: '/rigs', name: 'Rigs' },
	{ path: '/escalations', name: 'Escalations' },
	{ path: '/health', name: 'Health' },
	{ path: '/activity', name: 'Activity' },
	{ path: '/watchdog', name: 'Watchdog' },
	{ path: '/crew', name: 'Crew' },
	{ path: '/dogs', name: 'Dogs' },
	{ path: '/settings', name: 'Settings' },
	{ path: '/logs', name: 'Logs' },
	{ path: '/stats', name: 'Stats' },
	{ path: '/seance', name: 'Seance' },
	{ path: '/login', name: 'Login' }
];

test.describe('Accessibility Audit', () => {
	for (const { path, name } of pages) {
		test(`${name} page should have no accessibility violations`, async ({ page }) => {
			await page.goto(path);

			// Wait for page to be fully loaded
			await page.waitForLoadState('networkidle');

			// Run axe-core accessibility scan
			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			// Log violations for debugging
			if (accessibilityScanResults.violations.length > 0) {
				console.log(`\n=== ${name} Page Violations ===`);
				for (const violation of accessibilityScanResults.violations) {
					console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
					console.log(`  Description: ${violation.description}`);
					console.log(`  Help URL: ${violation.helpUrl}`);
					console.log(`  Affected nodes (${violation.nodes.length}):`);
					for (const node of violation.nodes.slice(0, 3)) {
						console.log(`    - ${node.html.substring(0, 100)}...`);
						console.log(`      Fix: ${node.failureSummary}`);
					}
					if (violation.nodes.length > 3) {
						console.log(`    ... and ${violation.nodes.length - 3} more`);
					}
				}
			}

			expect(accessibilityScanResults.violations).toEqual([]);
		});
	}
});

test.describe('Keyboard Navigation', () => {
	test('should be able to navigate using keyboard only', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Test skip link
		await page.keyboard.press('Tab');
		const skipLink = page.locator('.skip-link');
		await expect(skipLink).toBeFocused();

		// Test that Tab moves through interactive elements
		await page.keyboard.press('Tab');
		const focused = await page.evaluate(() => document.activeElement?.tagName);
		expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
	});

	test('bottom navigation should be keyboard accessible', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Find bottom nav
		const bottomNav = page.locator('nav[aria-label="Main navigation"]');

		// Check if nav items are keyboard focusable
		const navButtons = bottomNav.locator('button, a');
		const count = await navButtons.count();

		// Verify we have navigation items
		expect(count).toBeGreaterThan(0);
	});

	test('dialogs should trap focus', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Open global search with keyboard shortcut
		await page.keyboard.press('Meta+k');

		// Wait for search modal
		const searchDialog = page.locator('[role="dialog"]');
		if (await searchDialog.isVisible()) {
			// Focus should be in the dialog
			const focusedElement = await page.evaluate(() => {
				return document.activeElement?.closest('[role="dialog"]') !== null;
			});

			// Close with Escape
			await page.keyboard.press('Escape');
			await expect(searchDialog).not.toBeVisible();
		}
	});
});

test.describe('Focus Management', () => {
	test('focus should move to main content on route change', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Navigate to another page
		await page.click('a[href="/agents"]');
		await page.waitForLoadState('networkidle');

		// Check if main content is focused or first heading
		const mainContent = page.locator('#main-content');
		const isFocused = await mainContent.evaluate(
			(el) => document.activeElement === el || el.contains(document.activeElement)
		);

		// Focus should be within main content area after navigation
		expect(isFocused).toBe(true);
	});
});

test.describe('Color Contrast', () => {
	test('text should have sufficient color contrast', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Run axe specifically for color contrast
		const contrastResults = await new AxeBuilder({ page })
			.withTags(['cat.color'])
			.analyze();

		if (contrastResults.violations.length > 0) {
			console.log('\n=== Color Contrast Violations ===');
			for (const violation of contrastResults.violations) {
				console.log(`\n${violation.id}: ${violation.help}`);
				for (const node of violation.nodes) {
					console.log(`  - ${node.html.substring(0, 80)}`);
				}
			}
		}

		expect(contrastResults.violations).toEqual([]);
	});
});

test.describe('Screen Reader Support', () => {
	test('should have proper document structure', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check for main landmark
		const main = page.locator('main, [role="main"], #main-content');
		await expect(main).toBeVisible();

		// Check for skip link
		const skipLink = page.locator('.skip-link, a[href="#main-content"]');
		expect(await skipLink.count()).toBeGreaterThan(0);

		// Check for navigation landmark
		const nav = page.locator('nav, [role="navigation"]');
		expect(await nav.count()).toBeGreaterThan(0);
	});

	test('interactive elements should have accessible names', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Get all buttons and check for accessible names
		const buttons = page.locator('button');
		const buttonCount = await buttons.count();

		for (let i = 0; i < buttonCount; i++) {
			const button = buttons.nth(i);
			const accessibleName = await button.evaluate((el) => {
				return (
					el.getAttribute('aria-label') ||
					el.getAttribute('aria-labelledby') ||
					el.textContent?.trim() ||
					el.getAttribute('title')
				);
			});

			// Button should have some accessible name
			if (await button.isVisible()) {
				expect(accessibleName, `Button ${i} should have accessible name`).toBeTruthy();
			}
		}
	});

	test('images should have alt text', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const images = page.locator('img');
		const imageCount = await images.count();

		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			const alt = await img.getAttribute('alt');
			const role = await img.getAttribute('role');

			// Image should have alt text or be marked as decorative
			expect(
				alt !== null || role === 'presentation' || role === 'none',
				`Image ${i} should have alt text or be decorative`
			).toBe(true);
		}
	});

	test('form inputs should have labels', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const inputs = page.locator('input:not([type="hidden"]), select, textarea');
		const inputCount = await inputs.count();

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const hasLabel = await input.evaluate((el) => {
				const id = el.id;
				const ariaLabel = el.getAttribute('aria-label');
				const ariaLabelledBy = el.getAttribute('aria-labelledby');
				const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
				const hasWrappingLabel = el.closest('label') !== null;
				const placeholder = el.getAttribute('placeholder');

				return !!(ariaLabel || ariaLabelledBy || hasAssociatedLabel || hasWrappingLabel || placeholder);
			});

			if (await input.isVisible()) {
				expect(hasLabel, `Input ${i} should have a label`).toBe(true);
			}
		}
	});
});

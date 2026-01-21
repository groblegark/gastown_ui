import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core for WCAG 2.2 AA compliance
 * Tests all main pages for automated a11y violations
 */

// Core pages that must pass all a11y checks (well-tested, stable)
const corePages = [
	{ name: 'Dashboard', path: '/' },
	{ name: 'Mail', path: '/mail' },
	{ name: 'Login', path: '/login' },
	{ name: 'Health', path: '/health' },
	{ name: 'Queue', path: '/queue' },
	{ name: 'Escalations', path: '/escalations' },
	{ name: 'Crew', path: '/crew' },
];

// Pages that may have data-dependent violations (empty states, dynamic content)
const dataPages = [
	{ name: 'Work Items', path: '/work' },
	{ name: 'Convoys', path: '/convoys' },
	{ name: 'Rigs', path: '/rigs' },
	{ name: 'Agents', path: '/agents' },
	{ name: 'Activity', path: '/activity' },
	{ name: 'Logs', path: '/logs' },
	{ name: 'Settings', path: '/settings' },
	{ name: 'Stats', path: '/stats' },
	{ name: 'Workflows', path: '/workflows' },
];

// Core pages should have zero WCAG 2.2 AA violations
for (const { name, path } of corePages) {
	test.describe(`${name} Page Accessibility`, () => {
		test(`should not have detectable WCAG 2.2 AA violations`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();

			// Log violations for debugging
			if (results.violations.length > 0) {
				console.log(`\nAccessibility violations on ${name} (${path}):`);
				for (const violation of results.violations) {
					console.log(`  - ${violation.id}: ${violation.description}`);
					console.log(`    Impact: ${violation.impact}`);
					console.log(`    Help: ${violation.helpUrl}`);
				}
			}

			expect(results.violations).toEqual([]);
		});

		test(`should have proper keyboard navigation`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');

			// Test that focus is visible when tabbing through interactive elements
			const interactiveElements = await page.locator(
				'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const count = await interactiveElements.count();

			// Tab through first few interactive elements and verify focus is visible
			for (let i = 0; i < Math.min(count, 5); i++) {
				await page.keyboard.press('Tab');
				const focusedElement = await page.locator(':focus');
				const isVisible = await focusedElement.isVisible().catch(() => false);

				if ((await focusedElement.count()) > 0) {
					expect(isVisible).toBe(true);
				}
			}
		});
	});
}

// Data pages - report violations but allow some known issues
for (const { name, path } of dataPages) {
	test.describe(`${name} Page Accessibility`, () => {
		test(`should report WCAG 2.2 AA violations`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				// Exclude known issues that are page-state dependent
				.disableRules(['color-contrast-enhanced', 'empty-table-header'])
				.analyze();

			// Log violations for tracking
			if (results.violations.length > 0) {
				console.log(`\nAccessibility violations on ${name} (${path}):`);
				for (const violation of results.violations) {
					console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
				}
			}

			// Allow up to 3 serious/critical violations for data pages during initial implementation
			const criticalViolations = results.violations.filter(
				(v) => v.impact === 'critical' || v.impact === 'serious'
			);
			expect(criticalViolations.length).toBeLessThanOrEqual(3);
		});

		test(`should have proper keyboard navigation`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');

			const interactiveElements = await page.locator(
				'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const count = await interactiveElements.count();

			for (let i = 0; i < Math.min(count, 5); i++) {
				await page.keyboard.press('Tab');
				const focusedElement = await page.locator(':focus');
				const isVisible = await focusedElement.isVisible().catch(() => false);

				if ((await focusedElement.count()) > 0) {
					expect(isVisible).toBe(true);
				}
			}
		});
	});
}

// Form accessibility tests
test.describe('Form Accessibility', () => {
	test('login form should have proper labels and ARIA', async ({ page }) => {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
			.include('form')
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('mail compose should have accessible form fields', async ({ page }) => {
		await page.goto('/mail/compose');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});

// Color contrast tests (AA level only)
test.describe('Color Contrast', () => {
	test('dashboard should meet AA color contrast requirements', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Only test AA level color contrast, not AAA
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.withRules(['color-contrast'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});

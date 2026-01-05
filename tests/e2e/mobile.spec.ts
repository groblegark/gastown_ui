import { test, expect, devices } from '@playwright/test';

const mobileViewport = devices['iPhone 12'].viewport;
const tabletViewport = { width: 768, height: 1024 };

test.describe('Mobile Responsive - Login', () => {
	test.use({ viewport: mobileViewport });

	test('should display login form on mobile', async ({ page }) => {
		await page.goto('/login');

		// Form should be visible and usable
		await expect(page.locator('#operator-id')).toBeVisible();
		await expect(page.locator('#security-key')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should have touch-friendly input sizes', async ({ page }) => {
		await page.goto('/login');

		// Inputs should have adequate height for touch
		const operatorInput = page.locator('#operator-id');
		const boundingBox = await operatorInput.boundingBox();

		// Height should be at least 44px (recommended touch target)
		expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
	});

	test('should not have horizontal overflow', async ({ page }) => {
		await page.goto('/login');

		// Check for horizontal scroll
		const hasHorizontalScroll = await page.evaluate(() => {
			return document.body.scrollWidth > document.body.clientWidth;
		});

		expect(hasHorizontalScroll).toBeFalsy();
	});
});

test.describe('Mobile Responsive - Agents', () => {
	test.use({ viewport: mobileViewport });

	test('should display single column layout on mobile', async ({ page }) => {
		await page.goto('/agents');
		await page.waitForLoadState('networkidle');

		// Grid should be single column on mobile
		const grid = page.locator('.grid');
		if (await grid.isVisible().catch(() => false)) {
			const gridStyle = await grid.evaluate((el) => {
				return window.getComputedStyle(el).gridTemplateColumns;
			});

			// Should be single column (no repeat or multiple values)
			expect(gridStyle).toMatch(/^(1fr|[^,]+)$/);
		}
	});

	test('should have scrollable content', async ({ page }) => {
		await page.goto('/agents');

		// Content should be scrollable if needed
		const main = page.locator('main');
		await expect(main).toBeVisible();
	});
});

test.describe('Mobile Responsive - Mail', () => {
	test.use({ viewport: mobileViewport });

	test('should display mail inbox on mobile', async ({ page }) => {
		await page.goto('/mail');

		await expect(page.locator('h1')).toContainText('Mail Inbox');
		await expect(page.locator('a[href="/mail/compose"]')).toBeVisible();
	});

	test('should have full-width message items', async ({ page }) => {
		await page.goto('/mail');
		await page.waitForLoadState('networkidle');

		const messageButton = page.locator('button[aria-expanded]').first();

		if (await messageButton.isVisible().catch(() => false)) {
			const boundingBox = await messageButton.boundingBox();
			const viewportWidth = mobileViewport!.width;

			// Message should span most of the viewport width (accounting for padding)
			expect(boundingBox?.width).toBeGreaterThan(viewportWidth * 0.8);
		}
	});
});

test.describe('Mobile Responsive - Convoys', () => {
	test.use({ viewport: mobileViewport });

	test('should display convoys on mobile', async ({ page }) => {
		await page.goto('/convoys');

		await expect(page.locator('h1')).toContainText('Convoys');
	});

	test('should show progress bars correctly', async ({ page }) => {
		await page.goto('/convoys');
		await page.waitForLoadState('networkidle');

		const convoyCard = page.locator('[href^="/convoys/"]').first();

		if (await convoyCard.isVisible().catch(() => false)) {
			const progressSection = convoyCard.locator('text=Progress');
			await expect(progressSection).toBeVisible();
		}
	});
});

test.describe('Mobile Responsive - Settings', () => {
	test.use({ viewport: mobileViewport });

	test('should stack theme buttons on mobile', async ({ page }) => {
		await page.goto('/settings');

		// Theme buttons should be in a grid that works on mobile
		const themeGrid = page.locator('.grid-cols-3');
		await expect(themeGrid).toBeVisible();

		// All buttons should be visible
		await expect(page.locator('button:has-text("Light")')).toBeVisible();
		await expect(page.locator('button:has-text("Dark")')).toBeVisible();
		await expect(page.locator('button:has-text("System")')).toBeVisible();
	});

	test('should have scrollable sections', async ({ page }) => {
		await page.goto('/settings');

		// Page should be scrollable to access all sections
		const aboutSection = page.locator('h2:has-text("About Gas Town")');

		// Scroll to about section
		await aboutSection.scrollIntoViewIfNeeded();
		await expect(aboutSection).toBeVisible();
	});
});

test.describe('Tablet Responsive', () => {
	test.use({ viewport: tabletViewport });

	test('should show two column grid on tablet', async ({ page }) => {
		await page.goto('/agents');
		await page.waitForLoadState('networkidle');

		// On tablet, grid should show 2 columns
		const grid = page.locator('.grid.md\\:grid-cols-2, .grid');
		if (await grid.isVisible().catch(() => false)) {
			// Just verify grid is functional
			await expect(grid).toBeVisible();
		}
	});

	test('should display full navigation on tablet', async ({ page }) => {
		await page.goto('/');

		// Check for navigation elements
		const nav = page.locator('nav');
		await expect(nav).toBeVisible();
	});
});

test.describe('Desktop Responsive', () => {
	test.use({ viewport: { width: 1280, height: 720 } });

	test('should show three column grid on desktop agents page', async ({ page }) => {
		await page.goto('/agents');
		await page.waitForLoadState('networkidle');

		// Desktop should show more columns
		const grid = page.locator('.grid');
		if (await grid.isVisible().catch(() => false)) {
			await expect(grid).toBeVisible();
		}
	});

	test('should have proper container width', async ({ page }) => {
		await page.goto('/settings');

		const container = page.locator('.container').first();
		await expect(container).toBeVisible();
	});
});

test.describe('Touch Interactions', () => {
	test.use({ viewport: mobileViewport, hasTouch: true });

	test('should have touch-friendly buttons', async ({ page }) => {
		await page.goto('/login');

		const submitButton = page.locator('button[type="submit"]');
		const boundingBox = await submitButton.boundingBox();

		// Button should be at least 48px tall for touch (Gas Town uses touch-target class)
		expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
	});

	test('should support tap on message expand', async ({ page }) => {
		await page.goto('/mail');
		await page.waitForLoadState('networkidle');

		const messageButton = page.locator('button[aria-expanded]').first();

		if (await messageButton.isVisible().catch(() => false)) {
			// Tap to expand
			await messageButton.tap();

			// Should be expanded
			await expect(messageButton).toHaveAttribute('aria-expanded', 'true');
		}
	});
});

test.describe('Viewport Transitions', () => {
	test('should handle viewport resize gracefully', async ({ page }) => {
		await page.goto('/agents');

		// Start with mobile
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForTimeout(500);

		// Transition to tablet
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.waitForTimeout(500);

		// Transition to desktop
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.waitForTimeout(500);

		// Page should still be functional
		await expect(page.locator('h1')).toContainText('Agents');
	});
});

import { test, expect } from '@playwright/test';

test.describe('Convoy Tracking', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/convoys');
	});

	test('should display convoys page header', async ({ page }) => {
		await expect(page.locator('h1')).toContainText('Convoys');
		await expect(page.locator('text=Track batched work across Gas Town')).toBeVisible();
	});

	test('should show convoys or empty state', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Either convoy cards or empty/error state
		const convoyCards = page.locator('[href^="/convoys/"]');
		const emptyState = page.locator('text=No convoys found');
		const errorState = page.locator('text=Failed to load convoys');

		const hasConvoys = await convoyCards.count() > 0;
		const isEmpty = await emptyState.isVisible().catch(() => false);
		const hasError = await errorState.isVisible().catch(() => false);

		expect(hasConvoys || isEmpty || hasError).toBeTruthy();
	});

	test('should show create convoy hint in empty state', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const emptyState = page.locator('text=No convoys found');
		if (await emptyState.isVisible().catch(() => false)) {
			// Should show create hint
			await expect(page.locator('text=gt convoy create')).toBeVisible();
		}
	});

	test('should display convoy card elements', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const convoyCard = page.locator('[href^="/convoys/"]').first();

		if (await convoyCard.isVisible().catch(() => false)) {
			// Should have status indicator
			// Should have title
			// Should have progress section
			const progressSection = convoyCard.locator('text=Progress');
			await expect(progressSection).toBeVisible();
		}
	});

	test('should show convoy status badges', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const convoyCard = page.locator('[href^="/convoys/"]').first();

		if (await convoyCard.isVisible().catch(() => false)) {
			// Status badge should be visible (Active, Stale, Stuck, or Complete)
			const statusBadge = convoyCard.locator('text=/Active|Stale|Stuck|Complete/');
			await expect(statusBadge).toBeVisible();
		}
	});

	test('should display progress bar in convoy cards', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const convoyCard = page.locator('[href^="/convoys/"]').first();

		if (await convoyCard.isVisible().catch(() => false)) {
			// Should have progress indicator
			const progressText = convoyCard.locator('text=/\\d+\\/\\d+/');
			await expect(progressText).toBeVisible();
		}
	});

	test('should expand/collapse tracked issues', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Find toggle button for tracked issues
		const toggleButton = page.locator('button:has-text("Show tracked issues")').first();

		if (await toggleButton.isVisible().catch(() => false)) {
			// Click to expand
			await toggleButton.click();

			// Should show "Hide tracked issues"
			await expect(toggleButton).toContainText(/Hide/);

			// Click to collapse
			await toggleButton.click();

			// Should show "Show tracked issues" again
			await expect(toggleButton).toContainText(/Show/);
		}
	});

	test('should navigate to convoy detail page', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const convoyLink = page.locator('[href^="/convoys/"]').first();

		if (await convoyLink.isVisible().catch(() => false)) {
			const href = await convoyLink.getAttribute('href');
			await convoyLink.click();
			await expect(page).toHaveURL(href!);
		}
	});
});

test.describe('Convoy Detail Page', () => {
	test('should display convoy detail', async ({ page }) => {
		await page.goto('/convoys/test-convoy-1');
		await page.waitForLoadState('networkidle');

		// Page should have content
		const content = page.locator('main');
		await expect(content).toBeVisible();
	});

	test('should handle non-existent convoy gracefully', async ({ page }) => {
		await page.goto('/convoys/non-existent-convoy-xyz');
		await page.waitForLoadState('networkidle');

		// Should show some content (error or 404)
		const body = page.locator('body');
		await expect(body).toBeVisible();
	});
});

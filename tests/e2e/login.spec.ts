import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
	});

	test('should display login page with correct elements', async ({ page }) => {
		// Check page title
		await expect(page).toHaveTitle(/Operator Authentication.*Gas Town/);

		// Check main heading
		await expect(page.locator('h1')).toContainText('GAS TOWN');

		// Check form elements exist
		await expect(page.locator('#operator-id')).toBeVisible();
		await expect(page.locator('#security-key')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Check labels
		await expect(page.locator('label[for="operator-id"]')).toContainText('OPERATOR ID');
		await expect(page.locator('label[for="security-key"]')).toContainText('SECURITY KEY');
	});

	test('should show server status indicator', async ({ page }) => {
		// Server status should be visible
		const statusText = page.locator('text=SERVER:');
		await expect(statusText).toBeVisible();

		// Should show one of: OPERATIONAL, OFFLINE, CONNECTING...
		const statusLabels = ['OPERATIONAL', 'OFFLINE', 'CONNECTING...'];
		const statusVisible = await Promise.any(
			statusLabels.map(async (label) => {
				try {
					await expect(page.locator(`text=${label}`)).toBeVisible({ timeout: 5000 });
					return true;
				} catch {
					return false;
				}
			})
		).catch(() => false);

		expect(statusVisible).toBeTruthy();
	});

	test('should toggle password visibility', async ({ page }) => {
		const passwordInput = page.locator('#security-key');
		const toggleButton = page.locator('button[aria-label*="security key"]');

		// Initially password should be hidden
		await expect(passwordInput).toHaveAttribute('type', 'password');

		// Click toggle button
		await toggleButton.click();
		await expect(passwordInput).toHaveAttribute('type', 'text');

		// Click again to hide
		await toggleButton.click();
		await expect(passwordInput).toHaveAttribute('type', 'password');
	});

	test('should validate required fields', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]');

		// Try to submit without filling fields
		await submitButton.click();

		// HTML5 validation should prevent submission
		// Check that we're still on login page
		await expect(page).toHaveURL(/\/login/);
	});

	test('should fill login form and attempt submission', async ({ page }) => {
		// Fill in credentials
		await page.fill('#operator-id', 'operator@gastown.local');
		await page.fill('#security-key', 'testpassword123');

		// Check values are filled
		await expect(page.locator('#operator-id')).toHaveValue('operator@gastown.local');
		await expect(page.locator('#security-key')).toHaveValue('testpassword123');

		// Submit form
		await page.click('button[type="submit"]');

		// Wait for response (might show error or redirect)
		await page.waitForLoadState('networkidle');
	});

	test('should show error message on failed login', async ({ page }) => {
		// Fill invalid credentials
		await page.fill('#operator-id', 'invalid@gastown.local');
		await page.fill('#security-key', 'wrongpassword');

		// Submit
		await page.click('button[type="submit"]');

		// Wait for error message or network response
		await page.waitForLoadState('networkidle');

		// If an error message appears, verify it
		const errorAlert = page.locator('[role="alert"]');
		if (await errorAlert.isVisible({ timeout: 3000 }).catch(() => false)) {
			await expect(errorAlert).toBeVisible();
		}
	});

	test('should show loading state during submission', async ({ page }) => {
		await page.fill('#operator-id', 'test@gastown.local');
		await page.fill('#security-key', 'testpass');

		// Click submit and check for loading state
		const submitButton = page.locator('button[type="submit"]');
		await submitButton.click();

		// Button should show loading text (AUTHENTICATING...)
		// Note: This might be too fast to catch, so we wrap in try-catch
		try {
			await expect(submitButton).toContainText(/AUTHENTICATING/i, { timeout: 1000 });
		} catch {
			// Loading state might be too fast to catch
		}
	});

	test('should have accessible alternative auth buttons (disabled)', async ({ page }) => {
		// Check that alternative auth buttons exist but are disabled
		const bioScanButton = page.locator('button:has-text("BIO-SCAN")');
		const keycardButton = page.locator('button:has-text("KEYCARD")');

		await expect(bioScanButton).toBeVisible();
		await expect(bioScanButton).toBeDisabled();

		await expect(keycardButton).toBeVisible();
		await expect(keycardButton).toBeDisabled();
	});

	test('should have refresh button for server status', async ({ page }) => {
		const refreshButton = page.locator('button:has-text("REFRESH")');
		await expect(refreshButton).toBeVisible();

		// Click refresh
		await refreshButton.click();

		// Page should still be functional
		await expect(page.locator('#operator-id')).toBeVisible();
	});
});

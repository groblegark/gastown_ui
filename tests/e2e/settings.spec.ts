import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/settings');
	});

	test('should display settings page header', async ({ page }) => {
		await expect(page.locator('h1')).toContainText('Settings');
		await expect(page.locator('text=Configure Gas Town preferences')).toBeVisible();
	});

	test('should have appearance section', async ({ page }) => {
		await expect(page.locator('h2:has-text("Appearance")')).toBeVisible();
		await expect(page.locator('text=Choose your preferred theme')).toBeVisible();
	});

	test('should have theme options', async ({ page }) => {
		// Check for Light, Dark, System theme buttons
		const lightButton = page.locator('button:has-text("Light")');
		const darkButton = page.locator('button:has-text("Dark")');
		const systemButton = page.locator('button:has-text("System")');

		await expect(lightButton).toBeVisible();
		await expect(darkButton).toBeVisible();
		await expect(systemButton).toBeVisible();
	});

	test('should switch theme on button click', async ({ page }) => {
		const darkButton = page.locator('button:has-text("Dark")');
		const lightButton = page.locator('button:has-text("Light")');

		// Click dark theme
		await darkButton.click();

		// Check that dark class is applied to html
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);

		// Click light theme
		await lightButton.click();

		// Check that dark class is removed
		await expect(html).not.toHaveClass(/dark/);
	});

	test('should persist theme preference', async ({ page }) => {
		// Set dark theme
		const darkButton = page.locator('button:has-text("Dark")');
		await darkButton.click();

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Theme should be persisted
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);

		// Cleanup: set back to light
		const lightButton = page.locator('button:has-text("Light")');
		await lightButton.click();
	});

	test('should have default agent section', async ({ page }) => {
		await expect(page.locator('h2:has-text("Default Agent")')).toBeVisible();
		await expect(page.locator('text=Agent used for new workers')).toBeVisible();
	});

	test('should have agent configuration section', async ({ page }) => {
		await expect(page.locator('h2:has-text("Agent Configuration")')).toBeVisible();
		await expect(page.locator('text=Manage available agents')).toBeVisible();
	});

	test('should have add agent button', async ({ page }) => {
		const addAgentButton = page.locator('button:has-text("Add Agent")');
		await expect(addAgentButton).toBeVisible();
	});

	test('should toggle add agent form', async ({ page }) => {
		const addAgentButton = page.locator('button:has-text("Add Agent")');

		// Click to show form
		await addAgentButton.click();

		// Form should be visible
		const nameInput = page.locator('#new-agent-name');
		await expect(nameInput).toBeVisible();

		// Button should say Cancel
		await expect(addAgentButton).toContainText('Cancel');

		// Click to hide form
		await addAgentButton.click();

		// Form should be hidden
		await expect(nameInput).not.toBeVisible();

		// Button should say Add Agent again
		await expect(addAgentButton).toContainText('Add Agent');
	});

	test('should have patrol controls section', async ({ page }) => {
		await expect(page.locator('h2:has-text("Patrol Controls")')).toBeVisible();
		await expect(page.locator('text=Manage agent patrol state')).toBeVisible();
	});

	test('should have about section', async ({ page }) => {
		await expect(page.locator('h2:has-text("About Gas Town")')).toBeVisible();
		await expect(page.locator('text=System information')).toBeVisible();
	});

	test('should display system info in about section', async ({ page }) => {
		// Check for dt/dd pairs
		await expect(page.locator('dt:has-text("Configuration")')).toBeVisible();
		await expect(page.locator('dt:has-text("Default Agent")')).toBeVisible();
		await expect(page.locator('dt:has-text("Available Agents")')).toBeVisible();
	});

	test('should have save button for default agent', async ({ page }) => {
		const saveButton = page.locator('button:has-text("Save Default Agent")');
		await expect(saveButton).toBeVisible();

		// Button should be disabled if selection hasn't changed
		await expect(saveButton).toBeDisabled();
	});

	test('should enable save button when agent selection changes', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		// Find agent radio buttons
		const agentRadios = page.locator('input[type="radio"][name="agent"]');
		const count = await agentRadios.count();

		if (count > 1) {
			// Click a different agent
			const secondAgent = agentRadios.nth(1);
			await secondAgent.click({ force: true });

			// Save button should be enabled
			const saveButton = page.locator('button:has-text("Save Default Agent")');
			await expect(saveButton).toBeEnabled();
		}
	});
});

test.describe('Settings Persistence', () => {
	test('should remember theme across page navigation', async ({ page }) => {
		await page.goto('/settings');

		// Set dark theme
		await page.locator('button:has-text("Dark")').click();

		// Navigate away
		await page.goto('/agents');
		await page.waitForLoadState('networkidle');

		// Theme should still be dark
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);

		// Navigate back to settings
		await page.goto('/settings');

		// Theme button should show dark as selected
		const darkButton = page.locator('button:has-text("Dark")');
		await expect(darkButton).toHaveClass(/border-primary/);

		// Cleanup
		await page.locator('button:has-text("Light")').click();
	});

	test('should use localStorage for theme persistence', async ({ page }) => {
		await page.goto('/settings');

		// Set dark theme
		await page.locator('button:has-text("Dark")').click();

		// Check localStorage
		const theme = await page.evaluate(() => localStorage.getItem('gastown-theme'));
		expect(theme).toBe('dark');

		// Set light theme
		await page.locator('button:has-text("Light")').click();

		const lightTheme = await page.evaluate(() => localStorage.getItem('gastown-theme'));
		expect(lightTheme).toBe('light');
	});
});

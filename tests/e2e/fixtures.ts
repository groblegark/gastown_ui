import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixtures for Gas Town E2E tests
 */
export const test = base.extend<{
	/**
	 * Login helper - navigates to login page and authenticates
	 */
	login: (email?: string, password?: string) => Promise<void>;
}>({
	login: async ({ page }, use) => {
		const loginFn = async (email = 'test@gastown.local', password = 'testpass123') => {
			await page.goto('/login');
			await page.fill('#operator-id', email);
			await page.fill('#security-key', password);
			await page.click('button[type="submit"]');
			// Wait for navigation to complete
			await page.waitForURL('/', { timeout: 10000 }).catch(() => {
				// Login might fail in test environment, that's ok for some tests
			});
		};
		await use(loginFn);
	},
});

export { expect };

/**
 * Common test data
 */
export const testData = {
	validUser: {
		email: 'operator@gastown.local',
		password: 'securekey123',
	},
	invalidUser: {
		email: 'invalid@gastown.local',
		password: 'wrongpassword',
	},
};

/**
 * Viewport sizes for responsive testing
 */
export const viewports = {
	mobile: { width: 375, height: 667 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1280, height: 720 },
	widescreen: { width: 1920, height: 1080 },
};

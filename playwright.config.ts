import { defineConfig, devices } from '@playwright/test';

<<<<<<< HEAD
/**
 * Playwright E2E Test Configuration for Gas Town UI
 * @see https://playwright.dev/docs/test-configuration
 */
=======
>>>>>>> polecat/morsov-mk1ppph6
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
<<<<<<< HEAD

	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	// Run local dev server before starting tests
	webServer: {
		command: 'bun run build && bun run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
=======
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'bun run preview',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
>>>>>>> polecat/morsov-mk1ppph6
});

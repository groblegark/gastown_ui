/**
 * Shared Test Logging Utilities
 *
 * Provides consistent, color-coded logging for all tests.
 * Respects NO_COLOR environment variable for CI environments.
 */

export interface TestLogger {
	step: (name: string) => void;
	info: (msg: string, data?: unknown) => void;
	success: (msg: string) => void;
	fail: (msg: string, error?: unknown) => void;
	timing: (name: string, ms: number) => void;
	request: (method: string, url: string, body?: unknown) => void;
	response: (status: number, body: unknown, headers?: Headers) => void;
	summary: (testName: string, passed: boolean, duration: number, steps: number) => void;
}

const noColor = !!process.env.NO_COLOR;

const colors = noColor
	? {
			reset: '',
			green: '',
			red: '',
			yellow: '',
			blue: '',
			cyan: '',
			dim: ''
		}
	: {
			reset: '\x1b[0m',
			green: '\x1b[32m',
			red: '\x1b[31m',
			yellow: '\x1b[33m',
			blue: '\x1b[34m',
			cyan: '\x1b[36m',
			dim: '\x1b[2m'
		};

export function createTestLogger(testName: string): TestLogger {
	return {
		step: (name: string) => {
			const banner = '='.repeat(60);
			console.log(`\n${colors.cyan}${banner}${colors.reset}`);
			console.log(`${colors.cyan}[STEP]${colors.reset} ${testName}: ${name}`);
			console.log(`${colors.cyan}${banner}${colors.reset}`);
		},

		info: (msg: string, data?: unknown) => {
			console.log(`${colors.dim}[INFO]${colors.reset} ${msg}`);
			if (data !== undefined) {
				console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
			}
		},

		success: (msg: string) => {
			console.log(`${colors.green}[SUCCESS] ✓${colors.reset} ${msg}`);
		},

		fail: (msg: string, error?: unknown) => {
			console.error(`${colors.red}[FAIL] ✗${colors.reset} ${msg}`);
			if (error !== undefined) {
				console.error(`${colors.red}${JSON.stringify(error, null, 2)}${colors.reset}`);
			}
		},

		timing: (name: string, ms: number) => {
			const color = ms > 1000 ? colors.yellow : colors.dim;
			console.log(`${color}[TIMING]${colors.reset} ${name}: ${ms}ms`);
		},

		request: (method: string, url: string, body?: unknown) => {
			console.log(`${colors.blue}[REQUEST]${colors.reset} ${method} ${url}`);
			if (body !== undefined) {
				console.log(`${colors.dim}[REQUEST BODY]${colors.reset}`);
				console.log(`${colors.dim}${JSON.stringify(body, null, 2)}${colors.reset}`);
			}
		},

		response: (status: number, body: unknown, headers?: Headers) => {
			const statusColor = status >= 400 ? colors.red : colors.green;
			console.log(`${statusColor}[RESPONSE] Status: ${status}${colors.reset}`);
			if (headers) {
				console.log(
					`${colors.dim}[HEADERS] Content-Type: ${headers.get('content-type')}${colors.reset}`
				);
			}
			console.log(`${colors.dim}[RESPONSE BODY]${colors.reset}`);
			console.log(`${colors.dim}${JSON.stringify(body, null, 2)}${colors.reset}`);
		},

		summary: (testName: string, passed: boolean, duration: number, steps: number) => {
			const banner = '='.repeat(60);
			const color = passed ? colors.green : colors.red;
			console.log(`\n${color}${banner}${colors.reset}`);
			console.log(`${color}[${passed ? 'PASSED' : 'FAILED'}] ${testName}${colors.reset}`);
			console.log(`${colors.dim}Duration: ${duration}ms | Steps: ${steps}${colors.reset}`);
			console.log(`${color}${banner}${colors.reset}\n`);
		}
	};
}

/**
 * Tests for CLI capabilities detection
 * Validates CLI availability, version checking, and compatibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	probeCapabilities,
	clearCapabilitiesCache,
	checkVersionCompatibility,
	getInstallInstructions,
	getUpgradeInstructions,
	MIN_GT_VERSION,
	MIN_BD_VERSION,
	type CapabilitiesResult
} from '../capabilities';

vi.mock('../process-supervisor', () => ({
	getProcessSupervisor: vi.fn()
}));

import { getProcessSupervisor } from '../process-supervisor';

const mockSupervisor = {
	gt: vi.fn(),
	bd: vi.fn()
};

beforeEach(() => {
	clearCapabilitiesCache();
	vi.mocked(getProcessSupervisor).mockReturnValue(mockSupervisor as never);
	mockSupervisor.gt.mockReset();
	mockSupervisor.bd.mockReset();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('probeCapabilities', () => {
	it('detects both CLI tools available', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: true, data: 'gt 0.3.5' });
		mockSupervisor.bd.mockResolvedValue({ success: true, data: 'bd 0.48.0' });

		const result = await probeCapabilities();

		expect(result.available).toBe(true);
		expect(result.gtVersion).toBe('0.3.5');
		expect(result.bdVersion).toBe('0.48.0');
		expect(result.error).toBeNull();
	});

	it('detects gt unavailable', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: false, error: 'command not found' });
		mockSupervisor.bd.mockResolvedValue({ success: true, data: 'bd 0.48.0' });

		const result = await probeCapabilities();

		expect(result.available).toBe(true);
		expect(result.gtVersion).toBeNull();
		expect(result.bdVersion).toBe('0.48.0');
		expect(result.features.mail).toBe(false);
		expect(result.features.work).toBe(true);
	});

	it('detects bd unavailable', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: true, data: 'gt 0.3.5' });
		mockSupervisor.bd.mockResolvedValue({ success: false, error: 'command not found' });

		const result = await probeCapabilities();

		expect(result.available).toBe(true);
		expect(result.gtVersion).toBe('0.3.5');
		expect(result.bdVersion).toBeNull();
		expect(result.features.mail).toBe(true);
		expect(result.features.work).toBe(false);
	});

	it('detects both CLI tools unavailable', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: false, error: 'gt not found' });
		mockSupervisor.bd.mockResolvedValue({ success: false, error: 'bd not found' });

		const result = await probeCapabilities();

		expect(result.available).toBe(false);
		expect(result.gtVersion).toBeNull();
		expect(result.bdVersion).toBeNull();
		expect(result.error).toContain('not available');
	});

	it('caches results for CACHE_TTL', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: true, data: 'gt 0.3.5' });
		mockSupervisor.bd.mockResolvedValue({ success: true, data: 'bd 0.48.0' });

		await probeCapabilities();
		await probeCapabilities();

		expect(mockSupervisor.gt).toHaveBeenCalledTimes(1);
		expect(mockSupervisor.bd).toHaveBeenCalledTimes(1);
	});

	it('force refresh bypasses cache', async () => {
		mockSupervisor.gt.mockResolvedValue({ success: true, data: 'gt 0.3.5' });
		mockSupervisor.bd.mockResolvedValue({ success: true, data: 'bd 0.48.0' });

		await probeCapabilities();
		await probeCapabilities(true);

		expect(mockSupervisor.gt).toHaveBeenCalledTimes(2);
		expect(mockSupervisor.bd).toHaveBeenCalledTimes(2);
	});
});

describe('checkVersionCompatibility', () => {
	it('returns compatible for versions above minimum', () => {
		const result = checkVersionCompatibility('0.4.0', '0.50.0');
		expect(result.compatible).toBe(true);
		expect(result.gtCompatible).toBe(true);
		expect(result.bdCompatible).toBe(true);
	});

	it('returns compatible for exact minimum versions', () => {
		const result = checkVersionCompatibility(MIN_GT_VERSION, MIN_BD_VERSION);
		expect(result.compatible).toBe(true);
	});

	it('returns incompatible for gt below minimum', () => {
		const result = checkVersionCompatibility('0.2.0', '0.50.0');
		expect(result.compatible).toBe(false);
		expect(result.gtCompatible).toBe(false);
		expect(result.bdCompatible).toBe(true);
	});

	it('returns incompatible for bd below minimum', () => {
		const result = checkVersionCompatibility('0.4.0', '0.40.0');
		expect(result.compatible).toBe(false);
		expect(result.gtCompatible).toBe(true);
		expect(result.bdCompatible).toBe(false);
	});

	it('handles null versions gracefully', () => {
		const result = checkVersionCompatibility(null, '0.50.0');
		expect(result.gtCompatible).toBe(false);
		expect(result.bdCompatible).toBe(true);
	});
});

describe('getInstallInstructions', () => {
	it('returns gt install instructions when gt missing', () => {
		const instructions = getInstallInstructions({ gtMissing: true, bdMissing: false });
		expect(instructions).toContain('gt');
		expect(instructions).toContain('cargo install');
	});

	it('returns bd install instructions when bd missing', () => {
		const instructions = getInstallInstructions({ gtMissing: false, bdMissing: true });
		expect(instructions).toContain('bd');
	});

	it('returns both instructions when both missing', () => {
		const instructions = getInstallInstructions({ gtMissing: true, bdMissing: true });
		expect(instructions).toContain('gt');
		expect(instructions).toContain('bd');
	});
});

describe('getUpgradeInstructions', () => {
	it('returns gt upgrade instructions when gt outdated', () => {
		const instructions = getUpgradeInstructions({ gtOutdated: true, bdOutdated: false });
		expect(instructions).toContain('gt');
		expect(instructions).toContain(MIN_GT_VERSION);
	});

	it('returns bd upgrade instructions when bd outdated', () => {
		const instructions = getUpgradeInstructions({ gtOutdated: false, bdOutdated: true });
		expect(instructions).toContain('bd');
		expect(instructions).toContain(MIN_BD_VERSION);
	});
});

describe('MIN versions', () => {
	it('exports minimum version constants', () => {
		expect(MIN_GT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
		expect(MIN_BD_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
	});
});

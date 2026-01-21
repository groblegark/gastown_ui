/**
 * Toast Helpers Tests - ID Extraction
 *
 * Tests for extracting bead IDs, rig names, and agent names from messages.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestLogger } from '../../../../scripts/smoke/lib/logger';
import {
	extractBeadId,
	extractAllBeadIds,
	extractRigName,
	extractAgentName
} from '../../utils/id-extraction';

const logger = createTestLogger('Unit: ID Extraction Helpers');

describe('ID Extraction Helpers', () => {
	beforeEach(() => {
		logger.step('Testing ID extraction helpers');
	});

	describe('extractBeadId', () => {
		it('extracts gu-xxx format', () => {
			logger.info('Testing gu-xxx extraction');
			const message = 'Started work on gu-abc123';
			const result = extractBeadId(message);
			logger.info('Extracted ID', { result });
			expect(result).toBe('gu-abc123');
			logger.success('gu-xxx format extracted correctly');
		});

		it('extracts hq-xxx format', () => {
			logger.info('Testing hq-xxx extraction');
			const message = 'Mayor assigned hq-7vsv to polecat';
			const result = extractBeadId(message);
			logger.info('Extracted ID', { result });
			expect(result).toBe('hq-7vsv');
			logger.success('hq-xxx format extracted correctly');
		});

		it('returns null for no match', () => {
			logger.info('Testing no match scenario');
			const message = 'No bead ID in this message';
			const result = extractBeadId(message);
			logger.info('Result', { result });
			expect(result).toBeNull();
			logger.success('Returns null when no match');
		});

		it('extracts first ID when multiple present', () => {
			logger.info('Testing multiple IDs - returns first');
			const message = 'Task gu-abc depends on gu-xyz';
			const result = extractBeadId(message);
			logger.info('Extracted first ID', { result });
			expect(result).toBe('gu-abc');
			logger.success('Returns first ID correctly');
		});

		it('handles mixed case', () => {
			logger.info('Testing case insensitivity');
			const message = 'Working on GU-ABC123';
			const result = extractBeadId(message);
			logger.info('Extracted ID (lowercased)', { result });
			expect(result).toBe('gu-abc123');
			logger.success('Case insensitive extraction works');
		});

		it('extracts ID from complex message', () => {
			logger.info('Testing complex message');
			const message = 'Branch: polecat/amp/gu-20z - Feature implementation';
			const result = extractBeadId(message);
			logger.info('Extracted ID', { result });
			expect(result).toBe('gu-20z');
			logger.success('Extracts from complex message');
		});

		it('does not match partial IDs', () => {
			logger.info('Testing word boundary');
			const message = 'The legacy-user ID is not valid';
			const result = extractBeadId(message);
			logger.info('Result', { result });
			expect(result).toBeNull();
			logger.success('Does not match partial IDs');
		});
	});

	describe('extractAllBeadIds', () => {
		it('extracts all IDs from message', () => {
			logger.info('Testing multiple ID extraction');
			const message = 'Task gu-abc depends on gu-xyz and blocks hq-123';
			const result = extractAllBeadIds(message);
			logger.info('Extracted IDs', { result });
			expect(result).toEqual(['gu-abc', 'gu-xyz', 'hq-123']);
			logger.success('All IDs extracted correctly');
		});

		it('returns empty array when no matches', () => {
			logger.info('Testing empty result');
			const message = 'No IDs here';
			const result = extractAllBeadIds(message);
			logger.info('Result', { result });
			expect(result).toEqual([]);
			logger.success('Returns empty array for no matches');
		});

		it('handles duplicates', () => {
			logger.info('Testing duplicate IDs');
			const message = 'gu-abc references gu-abc again';
			const result = extractAllBeadIds(message);
			logger.info('Extracted IDs', { result });
			expect(result).toEqual(['gu-abc', 'gu-abc']);
			logger.success('Duplicates are included');
		});
	});

	describe('extractRigName', () => {
		it('extracts rig name from message', () => {
			logger.info('Testing rig name extraction');
			const message = 'Rig: gastown_ui is ready';
			const result = extractRigName(message);
			logger.info('Extracted rig', { result });
			expect(result).toBe('gastown_ui');
			logger.success('Rig name extracted correctly');
		});

		it('extracts repository name', () => {
			logger.info('Testing repository name extraction');
			const message = 'Repository: my-awesome-repo cloned';
			const result = extractRigName(message);
			logger.info('Extracted rig', { result });
			expect(result).toBe('my-awesome-repo');
			logger.success('Repository name extracted correctly');
		});

		it('extracts repo name (short form)', () => {
			logger.info('Testing repo short form');
			const message = 'Repo: frontend-app updated';
			const result = extractRigName(message);
			logger.info('Extracted rig', { result });
			expect(result).toBe('frontend-app');
			logger.success('Repo short form extracted correctly');
		});

		it('handles quoted names', () => {
			logger.info('Testing quoted rig name');
			const message = 'Rig: "my_project" is configured';
			const result = extractRigName(message);
			logger.info('Extracted rig', { result });
			expect(result).toBe('my_project');
			logger.success('Quoted name extracted correctly');
		});

		it('returns null for no match', () => {
			logger.info('Testing no match');
			const message = 'No rig mentioned here';
			const result = extractRigName(message);
			logger.info('Result', { result });
			expect(result).toBeNull();
			logger.success('Returns null when no match');
		});
	});

	describe('extractAgentName', () => {
		it('extracts agent name', () => {
			logger.info('Testing agent name extraction');
			const message = 'Agent: furiosa is working';
			const result = extractAgentName(message);
			logger.info('Extracted agent', { result });
			expect(result).toBe('furiosa');
			logger.success('Agent name extracted correctly');
		});

		it('extracts polecat name', () => {
			logger.info('Testing polecat name extraction');
			const message = 'Polecat: nux completed task';
			const result = extractAgentName(message);
			logger.info('Extracted agent', { result });
			expect(result).toBe('nux');
			logger.success('Polecat name extracted correctly');
		});

		it('extracts worker name', () => {
			logger.info('Testing worker name extraction');
			const message = 'Worker: alpha-1 assigned';
			const result = extractAgentName(message);
			logger.info('Extracted agent', { result });
			expect(result).toBe('alpha-1');
			logger.success('Worker name extracted correctly');
		});

		it('extracts from path format', () => {
			logger.info('Testing path format extraction');
			const message = 'Working in polecats/furiosa directory';
			const result = extractAgentName(message);
			logger.info('Extracted agent', { result });
			expect(result).toBe('furiosa');
			logger.success('Path format extracted correctly');
		});

		it('returns null for no match', () => {
			logger.info('Testing no match');
			const message = 'No agent mentioned';
			const result = extractAgentName(message);
			logger.info('Result', { result });
			expect(result).toBeNull();
			logger.success('Returns null when no match');
		});

		it('handles quoted names', () => {
			logger.info('Testing quoted agent name');
			const message = 'Agent: "test-agent" started';
			const result = extractAgentName(message);
			logger.info('Extracted agent', { result });
			expect(result).toBe('test-agent');
			logger.success('Quoted name extracted correctly');
		});
	});
});

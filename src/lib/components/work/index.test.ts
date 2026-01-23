/**
 * Work Components Module Tests
 *
 * Tests for the work components barrel exports including:
 * - WorkFilters
 * - WorkList
 * - WorkCreateForm
 * - WorkSlingForm
 */
import { describe, it, expect } from 'vitest';

describe('Work Components Module Exports', () => {
	describe('WorkFilters', () => {
		it('exports WorkFilters component with correct path reference', async () => {
			const module = await import('./index');
			// In test environment, Svelte components are exported as string paths
			expect(typeof module.WorkFilters).toBe('string');
			expect(module.WorkFilters).toMatch(/WorkFilters\.svelte/);
		});

		it('exports workFiltersVariants as callable with expected slots', async () => {
			const { workFiltersVariants } = await import('./index');
			expect(typeof workFiltersVariants).toBe('function');
			const result = workFiltersVariants();
			expect(result).toHaveProperty('container');
			expect(result).toHaveProperty('chip');
			expect(typeof result.container()).toBe('string');
		});
	});

	describe('WorkList', () => {
		it('exports WorkList component with correct path reference', async () => {
			const module = await import('./index');
			expect(typeof module.WorkList).toBe('string');
			expect(module.WorkList).toMatch(/WorkList\.svelte/);
		});

		it('exports workListVariants as callable with expected slots', async () => {
			const { workListVariants } = await import('./index');
			expect(typeof workListVariants).toBe('function');
			const result = workListVariants();
			expect(result).toHaveProperty('container');
			expect(result).toHaveProperty('list');
			expect(typeof result.container()).toBe('string');
		});
	});

	describe('WorkCreateForm', () => {
		it('exports WorkCreateForm component with correct path reference', async () => {
			const module = await import('./index');
			expect(typeof module.WorkCreateForm).toBe('string');
			expect(module.WorkCreateForm).toMatch(/WorkCreateForm\.svelte/);
		});

		it('exports workCreateFormVariants as callable with expected slots', async () => {
			const { workCreateFormVariants } = await import('./index');
			expect(typeof workCreateFormVariants).toBe('function');
			const result = workCreateFormVariants();
			expect(result).toHaveProperty('container');
			expect(result).toHaveProperty('form');
			expect(result).toHaveProperty('submitButton');
			expect(typeof result.container()).toBe('string');
		});

		it('exports issueSchema validation with safeParse method', async () => {
			const { issueSchema } = await import('./index');
			expect(typeof issueSchema.safeParse).toBe('function');
			// Verify it can actually parse
			const validResult = issueSchema.safeParse({ title: 'test', type: 'task', priority: 1 });
			expect(validResult.success).toBe(true);
		});
	});

	describe('WorkSlingForm', () => {
		it('exports WorkSlingForm component with correct path reference', async () => {
			const module = await import('./index');
			expect(typeof module.WorkSlingForm).toBe('string');
			expect(module.WorkSlingForm).toMatch(/WorkSlingForm\.svelte/);
		});

		it('exports workSlingFormVariants as callable with expected slots', async () => {
			const { workSlingFormVariants } = await import('./index');
			expect(typeof workSlingFormVariants).toBe('function');
			const result = workSlingFormVariants();
			expect(result).toHaveProperty('container');
			expect(result).toHaveProperty('form');
			expect(result).toHaveProperty('submitButton');
			expect(typeof result.container()).toBe('string');
		});

		it('exports slingSchema validation with safeParse method', async () => {
			const { slingSchema } = await import('./index');
			expect(typeof slingSchema.safeParse).toBe('function');
			// Verify it can actually parse
			const validResult = slingSchema.safeParse({ issue: 'bd-123', rig: 'test' });
			expect(validResult.success).toBe(true);
		});
	});

	describe('Module Structure', () => {
		it('exports all expected component keys', async () => {
			const indexModule = await import('./index');
			const exportKeys = Object.keys(indexModule);
			expect(exportKeys).toContain('WorkFilters');
			expect(exportKeys).toContain('workFiltersVariants');
			expect(exportKeys).toContain('WorkList');
			expect(exportKeys).toContain('workListVariants');
			expect(exportKeys).toContain('WorkCreateForm');
			expect(exportKeys).toContain('workCreateFormVariants');
			expect(exportKeys).toContain('issueSchema');
			expect(exportKeys).toContain('WorkSlingForm');
			expect(exportKeys).toContain('workSlingFormVariants');
			expect(exportKeys).toContain('slingSchema');
		});
	});

	describe('Validation Schemas', () => {
		it('issueSchema validates valid issue', async () => {
			const { issueSchema } = await import('./index');
			const result = issueSchema.safeParse({
				title: 'Test Issue',
				type: 'task',
				priority: 2
			});
			expect(result.success).toBe(true);
		});

		it('issueSchema rejects empty title', async () => {
			const { issueSchema } = await import('./index');
			const result = issueSchema.safeParse({
				title: '',
				type: 'task',
				priority: 2
			});
			expect(result.success).toBe(false);
		});

		it('issueSchema rejects title less than 3 chars', async () => {
			const { issueSchema } = await import('./index');
			const result = issueSchema.safeParse({
				title: 'ab',
				type: 'task',
				priority: 2
			});
			expect(result.success).toBe(false);
		});

		it('issueSchema rejects invalid type', async () => {
			const { issueSchema } = await import('./index');
			const result = issueSchema.safeParse({
				title: 'Test Issue',
				type: 'invalid',
				priority: 2
			});
			expect(result.success).toBe(false);
		});

		it('issueSchema rejects priority out of range', async () => {
			const { issueSchema } = await import('./index');
			const result = issueSchema.safeParse({
				title: 'Test Issue',
				type: 'task',
				priority: 5
			});
			expect(result.success).toBe(false);
		});

		it('slingSchema validates valid sling', async () => {
			const { slingSchema } = await import('./index');
			const result = slingSchema.safeParse({
				issue: 'bd-123',
				rig: 'gastownui'
			});
			expect(result.success).toBe(true);
		});

		it('slingSchema rejects empty issue', async () => {
			const { slingSchema } = await import('./index');
			const result = slingSchema.safeParse({
				issue: '',
				rig: 'gastownui'
			});
			expect(result.success).toBe(false);
		});

		it('slingSchema rejects empty rig', async () => {
			const { slingSchema } = await import('./index');
			const result = slingSchema.safeParse({
				issue: 'bd-123',
				rig: ''
			});
			expect(result.success).toBe(false);
		});
	});
});

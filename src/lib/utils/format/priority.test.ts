/**
 * Tests for priority conversion utilities
 * Converts between bead integer priorities (0-4) and mail string priorities
 */

import { describe, it, expect } from 'vitest';
import {
	beadPriorityToMail,
	mailPriorityToBead,
	formatPriorityDisplay,
	formatPriorityShort,
	isValidBeadPriority,
	isValidMailPriority,
	type BeadPriority,
	type MailPriority
} from './priority';

describe('beadPriorityToMail', () => {
	it('converts 0 to urgent', () => {
		expect(beadPriorityToMail(0)).toBe('urgent');
	});

	it('converts 1 to high', () => {
		expect(beadPriorityToMail(1)).toBe('high');
	});

	it('converts 2 to normal', () => {
		expect(beadPriorityToMail(2)).toBe('normal');
	});

	it('converts 3 to low', () => {
		expect(beadPriorityToMail(3)).toBe('low');
	});

	it('converts 4 (backlog) to low', () => {
		expect(beadPriorityToMail(4)).toBe('low');
	});

	it('throws for invalid priority above range', () => {
		expect(() => beadPriorityToMail(5 as BeadPriority)).toThrow('Invalid bead priority: 5');
	});

	it('throws for invalid negative priority', () => {
		expect(() => beadPriorityToMail(-1 as BeadPriority)).toThrow('Invalid bead priority: -1');
	});
});

describe('mailPriorityToBead', () => {
	it('converts urgent to 0', () => {
		expect(mailPriorityToBead('urgent')).toBe(0);
	});

	it('converts high to 1', () => {
		expect(mailPriorityToBead('high')).toBe(1);
	});

	it('converts normal to 2', () => {
		expect(mailPriorityToBead('normal')).toBe(2);
	});

	it('converts low to 3', () => {
		expect(mailPriorityToBead('low')).toBe(3);
	});

	it('throws for invalid priority string', () => {
		expect(() => mailPriorityToBead('invalid' as MailPriority)).toThrow(
			'Invalid mail priority: invalid'
		);
	});

	it('throws for empty string', () => {
		expect(() => mailPriorityToBead('' as MailPriority)).toThrow('Invalid mail priority: ');
	});
});

describe('formatPriorityDisplay', () => {
	it('formats 0 as P0 Urgent', () => {
		expect(formatPriorityDisplay(0)).toBe('P0 Urgent');
	});

	it('formats 1 as P1 High', () => {
		expect(formatPriorityDisplay(1)).toBe('P1 High');
	});

	it('formats 2 as P2 Normal', () => {
		expect(formatPriorityDisplay(2)).toBe('P2 Normal');
	});

	it('formats 3 as P3 Low', () => {
		expect(formatPriorityDisplay(3)).toBe('P3 Low');
	});

	it('formats 4 as P4 Backlog', () => {
		expect(formatPriorityDisplay(4)).toBe('P4 Backlog');
	});

	it('throws for invalid priority', () => {
		expect(() => formatPriorityDisplay(5 as BeadPriority)).toThrow('Invalid bead priority: 5');
	});
});

describe('formatPriorityShort', () => {
	it('formats 0 as P0', () => {
		expect(formatPriorityShort(0)).toBe('P0');
	});

	it('formats 1 as P1', () => {
		expect(formatPriorityShort(1)).toBe('P1');
	});

	it('formats 2 as P2', () => {
		expect(formatPriorityShort(2)).toBe('P2');
	});

	it('formats 3 as P3', () => {
		expect(formatPriorityShort(3)).toBe('P3');
	});

	it('formats 4 as P4', () => {
		expect(formatPriorityShort(4)).toBe('P4');
	});

	it('throws for invalid priority', () => {
		expect(() => formatPriorityShort(5 as BeadPriority)).toThrow('Invalid bead priority: 5');
	});
});

describe('isValidBeadPriority', () => {
	it('returns true for valid priorities 0-4', () => {
		expect(isValidBeadPriority(0)).toBe(true);
		expect(isValidBeadPriority(1)).toBe(true);
		expect(isValidBeadPriority(2)).toBe(true);
		expect(isValidBeadPriority(3)).toBe(true);
		expect(isValidBeadPriority(4)).toBe(true);
	});

	it('returns false for negative numbers', () => {
		expect(isValidBeadPriority(-1)).toBe(false);
	});

	it('returns false for numbers above 4', () => {
		expect(isValidBeadPriority(5)).toBe(false);
		expect(isValidBeadPriority(100)).toBe(false);
	});

	it('returns false for non-integers', () => {
		expect(isValidBeadPriority(1.5)).toBe(false);
		expect(isValidBeadPriority(2.1)).toBe(false);
	});
});

describe('isValidMailPriority', () => {
	it('returns true for valid mail priorities', () => {
		expect(isValidMailPriority('urgent')).toBe(true);
		expect(isValidMailPriority('high')).toBe(true);
		expect(isValidMailPriority('normal')).toBe(true);
		expect(isValidMailPriority('low')).toBe(true);
	});

	it('returns false for invalid strings', () => {
		expect(isValidMailPriority('invalid')).toBe(false);
		expect(isValidMailPriority('')).toBe(false);
		expect(isValidMailPriority('URGENT')).toBe(false);
	});
});

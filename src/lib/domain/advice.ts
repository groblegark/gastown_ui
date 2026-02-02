/**
 * Advice domain types and utilities
 */

export type AdviceScope = 'Global' | 'Role' | 'Rig' | 'Agent' | 'Custom';

/**
 * Get scope badge color classes for advice items
 */
export function getScopeBadgeColor(scope: AdviceScope): { bg: string; text: string } {
	switch (scope) {
		case 'Global':
			return { bg: 'bg-blue-500/10', text: 'text-blue-400' };
		case 'Role':
			return { bg: 'bg-purple-500/10', text: 'text-purple-400' };
		case 'Rig':
			return { bg: 'bg-green-500/10', text: 'text-green-400' };
		case 'Agent':
			return { bg: 'bg-orange-500/10', text: 'text-orange-400' };
		case 'Custom':
			return { bg: 'bg-muted/50', text: 'text-muted-foreground' };
	}
}

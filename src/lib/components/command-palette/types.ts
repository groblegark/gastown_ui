/**
 * Type definitions for the Command Palette component
 */
import type { ComponentType } from 'svelte';

export type PaletteMode = 'search' | 'command' | 'formula';

export interface PaletteResult {
	type: 'agent' | 'issue' | 'route' | 'command' | 'formula' | 'recent';
	id: string;
	label: string;
	sublabel?: string;
	icon?: ComponentType;
	category?: string;
	action: () => void;
}

export interface RouteItem {
	path: string;
	label: string;
	icon: ComponentType;
	description: string;
}

export interface CommandItem {
	id: string;
	label: string;
	description: string;
	icon: ComponentType;
	category: string;
}

export interface FormulaItem {
	id: string;
	label: string;
	description: string;
	icon: ComponentType;
	category: string;
}

export interface AgentItem {
	id: string;
	name: string;
	status: string;
	task: string;
	type: string;
}

export interface IssueItem {
	id: string;
	title: string;
	type: string;
	priority: number;
}

export interface RecentItem {
	type: string;
	id: string;
	label: string;
	path: string;
}

export interface SearchSuggestion {
	query: string;
	description: string;
}

export interface ModeConfig {
	icon: ComponentType;
	label: string;
	color: string;
}

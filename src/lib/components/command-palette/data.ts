/**
 * Data constants for the Command Palette component
 */
import {
	Home,
	Bot,
	Target,
	Truck,
	ClipboardList,
	Mail,
	Bell,
	ScrollText,
	Settings,
	Users,
	Dog,
	Plus,
	Square,
	RefreshCw,
	FileText,
	Send,
	Terminal,
	GitBranch,
	Keyboard,
	Search
} from 'lucide-svelte';
import type {
	RouteItem,
	CommandItem,
	FormulaItem,
	AgentItem,
	IssueItem,
	RecentItem,
	SearchSuggestion
} from './types';

// Navigation routes
export const routes: RouteItem[] = [
	{ path: '/', label: 'Dashboard', icon: Home, description: 'Overview and stats' },
	{ path: '/agents', label: 'Agents', icon: Bot, description: 'View all agents' },
	{ path: '/work', label: 'Work', icon: Target, description: 'Issues and tasks' },
	{ path: '/convoys', label: 'Convoys', icon: Truck, description: 'Batch operations' },
	{ path: '/queue', label: 'Queue', icon: ClipboardList, description: 'Merge queue' },
	{ path: '/mail', label: 'Mail', icon: Mail, description: 'Messages' },
	{ path: '/escalations', label: 'Escalations', icon: Bell, description: 'Alerts and issues' },
	{ path: '/logs', label: 'Logs', icon: ScrollText, description: 'System logs' },
	{ path: '/settings', label: 'Settings', icon: Settings, description: 'Configuration' },
	{ path: '/crew', label: 'Crew', icon: Users, description: 'Team members' },
	{ path: '/watchdog', label: 'Watchdog', icon: Dog, description: 'Health monitoring' }
];

// Commands (> prefix)
export const commands: CommandItem[] = [
	{
		id: 'spawn-polecat',
		label: 'Spawn Polecat',
		description: 'Create new worker agent',
		icon: Plus,
		category: 'agents'
	},
	{
		id: 'stop-agent',
		label: 'Stop Agent',
		description: 'Gracefully stop an agent',
		icon: Square,
		category: 'agents'
	},
	{
		id: 'restart-agent',
		label: 'Restart Agent',
		description: 'Restart selected agent',
		icon: RefreshCw,
		category: 'agents'
	},
	{
		id: 'new-issue',
		label: 'New Issue',
		description: 'Create a new issue',
		icon: FileText,
		category: 'work'
	},
	{
		id: 'new-convoy',
		label: 'New Convoy',
		description: 'Create batch operation',
		icon: Truck,
		category: 'work'
	},
	{
		id: 'compose-mail',
		label: 'Compose Mail',
		description: 'Write a new message',
		icon: Send,
		category: 'communication'
	},
	{
		id: 'refresh',
		label: 'Refresh',
		description: 'Reload current page',
		icon: RefreshCw,
		category: 'system'
	},
	{
		id: 'shortcuts',
		label: 'Keyboard Shortcuts',
		description: 'View all shortcuts',
		icon: Keyboard,
		category: 'help'
	}
];

// Formula triggers (: prefix) - bd/gt commands
export const formulas: FormulaItem[] = [
	{
		id: 'bd-ready',
		label: 'bd ready',
		description: 'Show issues ready to work',
		icon: Terminal,
		category: 'beads'
	},
	{
		id: 'bd-list',
		label: 'bd list',
		description: 'List all issues',
		icon: Terminal,
		category: 'beads'
	},
	{
		id: 'bd-create',
		label: 'bd create',
		description: 'Create new issue',
		icon: Terminal,
		category: 'beads'
	},
	{
		id: 'bd-close',
		label: 'bd close <id>',
		description: 'Close an issue',
		icon: Terminal,
		category: 'beads'
	},
	{
		id: 'gt-status',
		label: 'gt status',
		description: 'Show town status',
		icon: Terminal,
		category: 'gasstown'
	},
	{
		id: 'gt-mail',
		label: 'gt mail inbox',
		description: 'Check mail inbox',
		icon: Terminal,
		category: 'gasstown'
	},
	{
		id: 'gt-hook',
		label: 'gt hook',
		description: 'Check hooked work',
		icon: Terminal,
		category: 'gasstown'
	},
	{
		id: 'gt-done',
		label: 'gt done',
		description: 'Submit work to MQ',
		icon: Terminal,
		category: 'gasstown'
	},
	{
		id: 'git-status',
		label: 'git status',
		description: 'Show git status',
		icon: GitBranch,
		category: 'git'
	},
	{
		id: 'git-diff',
		label: 'git diff',
		description: 'Show uncommitted changes',
		icon: GitBranch,
		category: 'git'
	}
];

// Mock data for search results
export const mockAgents: AgentItem[] = [
	{
		id: 'mayor',
		name: 'Mayor',
		status: 'running',
		task: 'Coordinating work',
		type: 'coordinator'
	},
	{
		id: 'witness-1',
		name: 'Witness (gastown_ui)',
		status: 'running',
		task: 'Monitoring polecats',
		type: 'monitor'
	},
	{
		id: 'refinery-1',
		name: 'Refinery (gastown_ui)',
		status: 'idle',
		task: 'Waiting for merges',
		type: 'processor'
	},
	{
		id: 'polecat-morsov',
		name: 'Polecat Morsov',
		status: 'running',
		task: 'Building features',
		type: 'worker'
	},
	{
		id: 'polecat-rictus',
		name: 'Polecat Rictus',
		status: 'idle',
		task: 'Awaiting work',
		type: 'worker'
	},
	{
		id: 'polecat-furiosa',
		name: 'Polecat Furiosa',
		status: 'running',
		task: 'UI polish',
		type: 'worker'
	}
];

export const mockIssues: IssueItem[] = [
	{ id: 'gt-d3a', title: 'Authentication', type: 'epic', priority: 1 },
	{ id: 'gt-2hs', title: 'UI Components', type: 'epic', priority: 2 },
	{ id: 'gt-be4', title: 'Auth Token Refresh', type: 'task', priority: 2 },
	{ id: 'gt-931', title: 'CSRF Protection', type: 'task', priority: 2 },
	{ id: 'gt-3v5', title: 'Command Palette', type: 'task', priority: 2 },
	{ id: 'hq-7vsv', title: 'Global Search', type: 'task', priority: 1 }
];

// Recent items
export const recentItems: RecentItem[] = [
	{ type: 'agent', id: 'polecat-furiosa', label: 'Polecat Furiosa', path: '/agents/polecat-furiosa' },
	{ type: 'issue', id: 'gt-3v5', label: 'Command Palette', path: '/work' },
	{ type: 'route', id: 'convoys', label: 'Convoys', path: '/convoys' }
];

// Search suggestions for empty state
export const searchSuggestions: SearchSuggestion[] = [
	{ query: 'running agents', description: 'Find active agents' },
	{ query: 'P1 issues', description: 'High priority issues' },
	{ query: '>spawn', description: 'Spawn new agent' },
	{ query: ':bd ready', description: 'Check ready work' }
];

// Group labels for result categories
export const groupLabels: Record<string, string> = {
	recent: 'Recent',
	agent: 'Agents',
	issue: 'Issues',
	route: 'Navigation',
	command: 'Commands',
	formula: 'Formulas',
	agents: 'Agent Commands',
	work: 'Work Commands',
	communication: 'Communication',
	system: 'System',
	help: 'Help',
	beads: 'Beads (bd)',
	gasstown: 'Gas Town (gt)',
	git: 'Git'
};

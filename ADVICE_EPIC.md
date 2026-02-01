# Epic: Advice System Support for gastown_ui

**Epic ID**: gt-uh3rii
**Status**: In Progress
**Created**: 2026-02-01
**Owner**: gastown_ui/crew/advice_epic

## Executive Summary

Add comprehensive advice management capabilities to the gastown_ui web interface, enabling users to create, view, edit, and manage advice beads that provide dynamic guidance to Gas Town agents. This epic covers the full lifecycle of advice management including targeting, subscription simulation, and preview capabilities.

---

## Background & Research

### What is the Advice System?

The advice system in Gas Town provides **dynamic, context-aware guidance** to agents without modifying role templates. Advice is stored as special beads (issue type: `advice`) and delivered to agents via `gt prime`.

### How Advice Works Today

1. **Storage**: Advice beads in SQLite database via `bd` CLI
2. **Targeting**: Label-based system (`global`, `role:X`, `rig:X`, `agent:X`)
3. **Delivery**: Injected into agent context by `gt prime` command
4. **Matching**: OR semantics - advice shown if ANY label matches ANY subscription

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Brief advice title |
| `description` | string | Detailed advice content |
| `labels` | string[] | Targeting labels (global, role:X, rig:X, agent:X) |
| `priority` | P0-P4 | Advice priority |
| `status` | open/closed | Whether advice is active |
| `advice_hook_command` | string | Optional shell command to execute |
| `advice_hook_trigger` | enum | When hook runs: session-end, before-commit, etc. |
| `advice_hook_timeout` | int | Hook timeout in seconds |
| `advice_hook_on_failure` | enum | block, warn, ignore |

---

## User Stories

### US-1: View Active Advice
**As a** Gas Town overseer
**I want to** see all active advice beads in a browsable list
**So that** I can understand what guidance is currently being delivered to agents

**Acceptance Criteria:**
- [ ] List view shows advice title, scope indicators, and priority
- [ ] Filtering by scope (Global, Role, Rig, Agent)
- [ ] Search/filter by title or content
- [ ] Sorting by priority, creation date, or scope
- [ ] Visual distinction between hook-enabled and standard advice
- [ ] Show count of matching agents per advice

### US-2: Create New Advice
**As a** Gas Town overseer
**I want to** create new advice through the UI
**So that** I can provide guidance to agents without using the CLI

**Acceptance Criteria:**
- [ ] Form with title and description fields
- [ ] Label/target picker with presets (Global, Role, Rig, Agent)
- [ ] Custom label input for advanced targeting
- [ ] Priority selector
- [ ] Optional hook configuration (command, trigger, timeout, failure handling)
- [ ] Validation before submission
- [ ] Preview panel showing formatted advice

### US-3: Edit Existing Advice
**As a** Gas Town overseer
**I want to** edit advice beads
**So that** I can update guidance as needs change

**Acceptance Criteria:**
- [ ] Edit form pre-populated with current values
- [ ] Inline editing from list view (quick edits)
- [ ] Full editor for comprehensive changes
- [ ] Diff view showing changes before save
- [ ] Audit trail of modifications

### US-4: Preview Advice Targeting
**As a** Gas Town overseer
**I want to** preview which agents will receive an advice bead
**So that** I can verify targeting before deploying

**Acceptance Criteria:**
- [ ] Agent matcher showing all matching agents
- [ ] Grouped by role/rig
- [ ] Simulate "what if" with different labels
- [ ] Show agent count by scope level

### US-5: Deactivate/Archive Advice
**As a** Gas Town overseer
**I want to** deactivate or archive outdated advice
**So that** agents don't receive stale guidance

**Acceptance Criteria:**
- [ ] Close (deactivate) action from list/detail view
- [ ] Bulk close for multiple advice beads
- [ ] "Show closed" toggle in list view
- [ ] Reopen closed advice
- [ ] Permanent delete with confirmation

### US-6: View Agent's Active Advice
**As a** Gas Town overseer
**I want to** see what advice a specific agent is receiving
**So that** I can understand and debug agent behavior

**Acceptance Criteria:**
- [ ] Agent detail view shows subscribed advice
- [ ] Links to advice detail/edit
- [ ] Scope indicators for each advice
- [ ] Filter to show only advice for selected agent

### US-7: Import/Export Advice
**As a** Gas Town overseer
**I want to** import and export advice configurations
**So that** I can share setups across environments

**Acceptance Criteria:**
- [ ] Export all advice as JSON
- [ ] Export selected advice
- [ ] Import from JSON file
- [ ] Conflict resolution for duplicate IDs
- [ ] Dry-run import preview

---

## Component Specifications

### Page Structure

```
/advice                    # Advice list/browser view
/advice/[id]              # Advice detail view
/advice/[id]/edit         # Advice edit form
/advice/create            # Create new advice
/advice/preview           # Targeting preview tool
```

### Components to Create

#### 1. AdviceList.svelte
**Location**: `src/lib/components/domain/AdviceList.svelte`

```svelte
<!-- Core list component -->
Props:
  - advice: AdviceBead[]
  - filters: AdviceFilters
  - loading: boolean

Features:
  - Virtual scrolling for large lists
  - Filter bar (scope, status, search)
  - Sort controls
  - Quick actions (edit, close, delete)
  - Batch selection for bulk operations
```

#### 2. AdviceCard.svelte
**Location**: `src/lib/components/domain/AdviceCard.svelte`

```svelte
<!-- Individual advice display -->
Props:
  - advice: AdviceBead
  - expanded: boolean
  - onEdit: () => void
  - onClose: () => void

Features:
  - Scope badge (Global, Role, Rig, Agent)
  - Priority indicator
  - Hook indicator icon
  - Expandable description
  - Quick actions
```

#### 3. AdviceForm.svelte
**Location**: `src/lib/components/domain/AdviceForm.svelte`

```svelte
<!-- Create/Edit form -->
Props:
  - advice?: AdviceBead (for edit mode)
  - onSubmit: (data) => void
  - onCancel: () => void

Sections:
  - Basic Info (title, description)
  - Targeting (label picker)
  - Priority
  - Hook Configuration (collapsible)
  - Preview Panel
```

#### 4. AdviceTargetPicker.svelte
**Location**: `src/lib/components/domain/AdviceTargetPicker.svelte`

```svelte
<!-- Label/target configuration -->
Props:
  - value: string[]
  - onChange: (labels) => void
  - agents: Agent[] (for agent picker)

Features:
  - Quick presets (Global, All Polecats, All Crew)
  - Role picker dropdown
  - Rig picker dropdown
  - Agent search/picker
  - Custom label input
  - OR semantics explained
```

#### 5. AdvicePreview.svelte
**Location**: `src/lib/components/domain/AdvicePreview.svelte`

```svelte
<!-- Preview rendered advice -->
Props:
  - title: string
  - description: string
  - scope: string

Features:
  - Renders as it appears in gt prime output
  - Markdown preview
  - Scope badge
```

#### 6. AgentMatcher.svelte
**Location**: `src/lib/components/domain/AgentMatcher.svelte`

```svelte
<!-- Show which agents match labels -->
Props:
  - labels: string[]
  - onLabelChange: (labels) => void

Features:
  - List of matching agents
  - Grouped by rig/role
  - Count summary
  - "Simulate" mode for what-if
```

#### 7. HookConfigForm.svelte
**Location**: `src/lib/components/domain/HookConfigForm.svelte`

```svelte
<!-- Hook configuration sub-form -->
Props:
  - hook: HookConfig
  - onChange: (config) => void

Fields:
  - Command input with syntax highlighting
  - Trigger dropdown (session-end, before-commit, etc.)
  - Timeout slider (1-300 seconds)
  - Failure mode select (block, warn, ignore)
```

---

## API Endpoints

### Required Server Routes

```
GET    /api/gastown/advice              # List all advice
GET    /api/gastown/advice/[id]         # Get advice detail
POST   /api/gastown/advice              # Create advice
PUT    /api/gastown/advice/[id]         # Update advice
DELETE /api/gastown/advice/[id]         # Close/delete advice

GET    /api/gastown/advice/for/[agent]  # Get advice for agent
POST   /api/gastown/advice/preview      # Preview matching agents
POST   /api/gastown/advice/import       # Import advice from JSON
GET    /api/gastown/advice/export       # Export advice as JSON
```

### Implementation Pattern

```typescript
// src/routes/api/gastown/advice/+server.ts
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli/process-supervisor';

export const GET: RequestHandler = async ({ url }) => {
  const supervisor = getProcessSupervisor();
  const forAgent = url.searchParams.get('for');

  if (forAgent) {
    // bd advice list --for=<agent> --json
    const result = await supervisor.bd([
      'advice', 'list',
      `--for=${forAgent}`,
      '--json'
    ]);
    return json({ advice: result.data ?? [] });
  }

  // bd list -t advice --json --limit 500
  const result = await supervisor.bd([
    'list', '-t', 'advice', '--json', '--limit', '500'
  ]);
  return json({ advice: result.data ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const supervisor = getProcessSupervisor();

  const args = ['advice', 'add', data.title];

  if (data.description) {
    args.push('-d', data.description);
  }

  for (const label of data.labels) {
    args.push('-l', label);
  }

  if (data.priority) {
    args.push('-p', String(data.priority));
  }

  // Hook configuration
  if (data.hookCommand) {
    args.push('--hook-command', data.hookCommand);
    args.push('--hook-trigger', data.hookTrigger || 'session-end');
    if (data.hookTimeout) {
      args.push('--hook-timeout', String(data.hookTimeout));
    }
    if (data.hookOnFailure) {
      args.push('--hook-on-failure', data.hookOnFailure);
    }
  }

  const result = await supervisor.bd(args);
  return json({ success: !result.error, id: result.data?.id });
};
```

---

## Type Definitions

### Zod Schemas

```typescript
// src/lib/types/schemas/advice.schema.ts
import { z } from 'zod';

export const AdviceHookTriggerSchema = z.enum([
  'session-end',
  'before-commit',
  'before-push',
  'before-handoff'
]);

export const AdviceHookFailureModeSchema = z.enum([
  'block',
  'warn',
  'ignore'
]);

export const AdviceHookConfigSchema = z.object({
  command: z.string().max(1000),
  trigger: AdviceHookTriggerSchema,
  timeout: z.number().min(1).max(300).default(30),
  onFailure: AdviceHookFailureModeSchema.default('warn')
});

export const AdviceBeadSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['open', 'closed']),
  priority: z.number().min(0).max(4),
  labels: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),
  // Hook fields
  adviceHookCommand: z.string().optional(),
  adviceHookTrigger: AdviceHookTriggerSchema.optional(),
  adviceHookTimeout: z.number().optional(),
  adviceHookOnFailure: AdviceHookFailureModeSchema.optional()
}).passthrough();

export type AdviceBead = z.infer<typeof AdviceBeadSchema>;
export type AdviceHookConfig = z.infer<typeof AdviceHookConfigSchema>;
export type AdviceHookTrigger = z.infer<typeof AdviceHookTriggerSchema>;
```

### Helper Types

```typescript
// src/lib/types/advice.ts

export type AdviceScope = 'Global' | 'Role' | 'Rig' | 'Agent' | 'Custom';

export interface AdviceFilters {
  scope?: AdviceScope;
  status?: 'open' | 'closed' | 'all';
  search?: string;
  hasHook?: boolean;
}

export interface AdviceCreateInput {
  title: string;
  description?: string;
  labels: string[];
  priority?: number;
  hook?: {
    command: string;
    trigger: AdviceHookTrigger;
    timeout?: number;
    onFailure?: 'block' | 'warn' | 'ignore';
  };
}

export interface AgentMatch {
  agentId: string;
  rig: string;
  role: string;
  matchedLabels: string[];
}

export function getAdviceScope(labels: string[]): AdviceScope {
  for (const label of labels) {
    if (label.startsWith('agent:')) return 'Agent';
    if (label.startsWith('role:')) return 'Role';
    if (label.startsWith('rig:')) return 'Rig';
    if (label === 'global') return 'Global';
  }
  return 'Custom';
}

export function getScopeBadgeColor(scope: AdviceScope): string {
  switch (scope) {
    case 'Global': return 'bg-blue-100 text-blue-800';
    case 'Role': return 'bg-purple-100 text-purple-800';
    case 'Rig': return 'bg-green-100 text-green-800';
    case 'Agent': return 'bg-orange-100 text-orange-800';
    case 'Custom': return 'bg-gray-100 text-gray-800';
  }
}
```

---

## State Management Approach

### Client-Side State (Svelte 5 Runes)

```svelte
<script lang="ts">
  // Page-level state
  let advice = $state<AdviceBead[]>([]);
  let filters = $state<AdviceFilters>({ status: 'open' });
  let selectedIds = $state<Set<string>>(new Set());
  let loading = $state(false);

  // Derived state
  let filteredAdvice = $derived(
    advice.filter(a => {
      if (filters.status !== 'all' && a.status !== filters.status) return false;
      if (filters.search && !a.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.scope && getAdviceScope(a.labels) !== filters.scope) return false;
      return true;
    })
  );

  let hasSelection = $derived(selectedIds.size > 0);
</script>
```

### Server-Side Loading

```typescript
// src/routes/(app)/advice/+page.server.ts
import type { PageServerLoad } from './$types';
import { getProcessSupervisor } from '$lib/server/cli/process-supervisor';
import { AdviceBeadSchema } from '$lib/types/schemas/advice.schema';

export const load: PageServerLoad = async () => {
  const supervisor = getProcessSupervisor();

  const result = await supervisor.bd([
    'list', '-t', 'advice', '--json', '--limit', '500'
  ]);

  const advice = (result.data ?? [])
    .map(item => AdviceBeadSchema.safeParse(item))
    .filter(r => r.success)
    .map(r => r.data);

  return { advice };
};
```

---

## Integration with Existing Architecture

### Navigation Updates

Add to sidebar navigation:
```typescript
// In navigation config
{
  title: 'Advice',
  href: '/advice',
  icon: Lightbulb, // from lucide-svelte
  badge: openAdviceCount
}
```

### Agent Detail Integration

Add "Active Advice" section to agent detail view:
```svelte
<!-- In /agents/[id]/+page.svelte -->
<section>
  <h3>Active Advice</h3>
  <AdviceList
    advice={agentAdvice}
    compact={true}
    showScope={true}
  />
</section>
```

### Global Search Integration

Add advice to global search results:
```typescript
// In GlobalSearch.svelte search config
{
  type: 'advice',
  getData: () => fetchAdvice(),
  searchKeys: ['title', 'description'],
  renderItem: (item) => ({ title: item.title, icon: 'lightbulb' })
}
```

---

## Implementation Phases

### Phase 1: Core Read Operations (MVP)
**Priority: P0**

Tasks:
1. Create `advice.schema.ts` with Zod validation
2. Create `GET /api/gastown/advice` endpoint
3. Create `AdviceCard.svelte` component
4. Create `AdviceList.svelte` component
5. Create `/advice` page with list view
6. Add basic filtering (status, search)
7. Add to sidebar navigation

**Deliverable**: Users can view all advice in a browsable list

### Phase 2: Create & Edit Operations
**Priority: P1**

Tasks:
1. Create `AdviceForm.svelte` component
2. Create `AdviceTargetPicker.svelte` component
3. Create `HookConfigForm.svelte` component
4. Create `POST /api/gastown/advice` endpoint
5. Create `PUT /api/gastown/advice/[id]` endpoint
6. Create `/advice/create` page
7. Create `/advice/[id]/edit` page
8. Add inline quick-edit from list view

**Deliverable**: Users can create and edit advice

### Phase 3: Preview & Targeting Tools
**Priority: P1**

Tasks:
1. Create `AdvicePreview.svelte` component
2. Create `AgentMatcher.svelte` component
3. Create `GET /api/gastown/advice/for/[agent]` endpoint
4. Create `POST /api/gastown/advice/preview` endpoint
5. Create `/advice/preview` targeting tool page
6. Add preview panel to create/edit forms
7. Integrate with agent detail view

**Deliverable**: Users can preview targeting and see which agents receive advice

### Phase 4: Bulk Operations & Import/Export
**Priority: P2**

Tasks:
1. Add batch selection to list view
2. Add bulk close action
3. Create `POST /api/gastown/advice/import` endpoint
4. Create `GET /api/gastown/advice/export` endpoint
5. Add import/export UI
6. Add conflict resolution for imports

**Deliverable**: Users can manage advice at scale

### Phase 5: Agent Integration & Polish
**Priority: P2**

Tasks:
1. Add advice section to agent detail view
2. Add advice to global search
3. Add advice counts to dashboard
4. Add keyboard shortcuts
5. Performance optimization (virtual scrolling)
6. Accessibility audit and fixes

**Deliverable**: Fully integrated, polished advice management

---

## Success Metrics

- **Usability**: Users can create/edit advice without CLI in < 2 minutes
- **Discoverability**: All active advice visible in one list view
- **Accuracy**: Targeting preview matches actual delivery
- **Performance**: List view loads < 500 advice in < 1 second
- **Adoption**: 80% of advice operations through UI vs CLI

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| bd CLI changes | API breakage | Use Zod `.passthrough()` for forward compatibility |
| Large advice lists | Performance | Virtual scrolling, pagination |
| Complex targeting rules | User confusion | Inline help, preview tool |
| Hook security | Command injection | Server-side validation, sandboxing |

---

## Dependencies

- `bd` CLI with advice commands (✅ Available)
- gastown_ui process supervisor (✅ Available)
- Agent list API (✅ Available at `/api/gastown/agents`)
- Rig list API (✅ Available)

---

## Open Questions

1. **Advice versioning**: Should we track advice history/changes?
2. **Approval workflow**: Should advice require approval before deployment?
3. **Analytics**: Should we track which advice is most viewed/effective?
4. **Notifications**: Should agents be notified when new advice targets them?

---

## Child Tasks

*To be created as beads after epic approval:*

- `[P0]` Create advice Zod schema and types
- `[P0]` Create GET /api/gastown/advice endpoint
- `[P0]` Create AdviceCard component
- `[P0]` Create AdviceList component
- `[P0]` Create /advice page route
- `[P0]` Add advice to sidebar navigation
- `[P1]` Create AdviceForm component
- `[P1]` Create AdviceTargetPicker component
- `[P1]` Create HookConfigForm component
- `[P1]` Create POST/PUT advice endpoints
- `[P1]` Create /advice/create and /advice/[id]/edit pages
- `[P1]` Create AdvicePreview component
- `[P1]` Create AgentMatcher component
- `[P1]` Create advice preview API endpoint
- `[P2]` Add bulk operations to advice list
- `[P2]` Create import/export API and UI
- `[P2]` Integrate advice with agent detail view
- `[P2]` Add advice to global search
- `[P2]` Performance optimization and a11y audit

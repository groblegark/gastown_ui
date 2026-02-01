# Decisions Support Epic for gastown_ui

> Epic ID: gt-7kq3n5
> Status: In Progress
> Owner: gastown_ui/crew/decisions_epic

## Executive Summary

This epic covers the comprehensive implementation of decisions support in the gastown_ui frontend. Decisions are human-in-the-loop gate issues that allow agents to request human judgment on architectural decisions, business tradeoffs, and ambiguous requirements.

## Current State Analysis

### Already Implemented
- Basic decisions list page (`/decisions`)
- Option selection with visual feedback
- Resolve decision functionality
- Demo mode with sample decisions
- API endpoints: `GET /api/gastown/decisions`, `POST /api/gastown/decisions/[id]/resolve`
- Urgency-based sorting and display (high/medium/low)

### Gaps Identified
1. No decision detail view (full context, iteration history)
2. No rationale input when resolving
3. No decision creation from UI
4. No support for text guidance responses (iteration pattern)
5. No history/audit trail view
6. No decision chain visualization
7. No real-time updates (polling/WebSocket)
8. No dedicated Svelte store for decisions
9. No keyboard navigation
10. Limited mobile optimization
11. No cancel decision functionality
12. No parent bead context display

---

## Backend Context

### Decision Data Model (from beads)

```typescript
interface DecisionPoint {
  issueId: string;           // FK to associated issue/bead
  prompt: string;            // The question being asked
  context: string;           // Optional background/analysis
  options: DecisionOption[]; // Available choices
  defaultOption: string;     // Fallback if timeout
  selectedOption: string;    // Chosen option ID
  responseText: string;      // Custom text input
  rationale: string;         // Explanation for choice
  respondedAt: Date;         // When resolved
  respondedBy: string;       // Who resolved
  iteration: number;         // Current iteration (1-indexed)
  maxIterations: number;     // Limit on refinement loops
  priorId: string;           // Previous iteration reference
  guidance: string;          // Human's text that triggered iteration
  urgency: 'high' | 'medium' | 'low';
  requestedBy: string;       // Agent that created decision
  parentBeadId: string;      // Parent epic ID
}

interface DecisionOption {
  id: string;          // Short identifier (e.g., "redis", "yes")
  short: string;       // 1-3 word summary
  label: string;       // Sentence-length description
  description: string; // Optional rich markdown content
  recommended: boolean;
}
```

### Decision Lifecycle
1. **Pending** - Awaiting human response
2. **Responded** - Human selected an option
3. **Iterating** - Human provided text guidance, agent creates refined options
4. **Resolved** - Final decision made or max iterations reached

### Available CLI Commands
- `bd decision list [--all] [--json]` - List decisions
- `bd decision show <id>` - Show decision details
- `bd decision respond <id> --select=<option>` - Resolve with option
- `bd decision respond <id> --guidance="text"` - Provide text feedback
- `bd decision chain <id>` - Show iteration chain
- `bd decision cancel <id>` - Cancel decision

---

## User Stories

### US-1: View Decision Details
**As a** user reviewing a decision,
**I want to** see the full context, options with descriptions, and iteration history,
**So that** I can make an informed decision.

**Acceptance Criteria:**
- Click on decision card opens detail modal/page
- Shows full prompt and context markdown
- Shows all options with full descriptions
- Shows iteration chain if iteration > 1
- Shows parent bead link if applicable
- Shows requester agent information

### US-2: Resolve with Rationale
**As a** user resolving a decision,
**I want to** provide a rationale explaining my choice,
**So that** agents understand my reasoning for future decisions.

**Acceptance Criteria:**
- Optional rationale text input when resolving
- Rationale saved with decision response
- Visible in decision history

### US-3: Provide Text Guidance
**As a** user who doesn't like the options presented,
**I want to** provide text feedback instead of selecting an option,
**So that** the agent can refine the options based on my guidance.

**Acceptance Criteria:**
- "Provide Guidance" button as alternative to selecting option
- Text area for guidance input
- Triggers new iteration (if under max)
- Shows iteration number badge

### US-4: View Decision History
**As a** user,
**I want to** see previously resolved decisions,
**So that** I can review past decisions and their outcomes.

**Acceptance Criteria:**
- Toggle to show "All" vs "Pending Only"
- Resolved decisions show selected option and rationale
- Filter by date range
- Search by prompt text

### US-5: Create Decision (Admin)
**As an** admin user,
**I want to** create decisions manually from the UI,
**So that** I can request input from team members.

**Acceptance Criteria:**
- "New Decision" button (admin only)
- Form for prompt, options, urgency
- Option to set parent bead
- Preview before creation

### US-6: Real-time Updates
**As a** user monitoring decisions,
**I want** the list to update automatically when new decisions arrive,
**So that** I don't miss urgent decisions.

**Acceptance Criteria:**
- Polling every 30 seconds (configurable)
- Toast notification for new high-urgency decisions
- Badge count updates in navigation

### US-7: Keyboard Navigation
**As a** power user,
**I want to** navigate and resolve decisions using keyboard,
**So that** I can work efficiently.

**Acceptance Criteria:**
- `j/k` to navigate between decisions
- `1-9` to select option
- `Enter` to confirm selection
- `r` to open rationale input
- `g` to open guidance input
- `Escape` to close modals

### US-8: Mobile Experience
**As a** mobile user,
**I want** a responsive decisions interface,
**So that** I can resolve urgent decisions on the go.

**Acceptance Criteria:**
- Cards stack vertically on mobile
- Touch-friendly option buttons
- Bottom sheet for details on mobile
- Swipe actions for quick resolve

---

## UI Component Specifications

### 1. DecisionCard (Enhanced)
```
┌─────────────────────────────────────────────────────────┐
│ [!] HIGH │ from rictus │ 5 min ago │ Iteration 2/3    │
├─────────────────────────────────────────────────────────┤
│ How should we handle API versioning?                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. URL path versioning ★                            │ │
│ │    /api/v1/users - Standard approach, clear URLs    │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2. Header versioning                                │ │
│ │    Accept-Version: v1 - Cleaner URLs                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [View Details] [Provide Guidance] [Resolve ✓]          │
└─────────────────────────────────────────────────────────┘
```

### 2. DecisionDetailModal
```
┌─────────────────────────────────────────────────────────┐
│ Decision Details                                    [X] │
├─────────────────────────────────────────────────────────┤
│ PROMPT                                                  │
│ How should we handle API versioning?                    │
│                                                         │
│ CONTEXT                                                 │
│ We need to decide on versioning before the v2 API...   │
│                                                         │
│ ITERATION CHAIN                                         │
│ ○ #1 → guidance: "Consider backwards compat"           │
│ ● #2 (current)                                         │
│                                                         │
│ OPTIONS                                                 │
│ [Full option cards with descriptions...]               │
│                                                         │
│ PARENT BEAD                                             │
│ → gt-abc123: API Redesign Epic                         │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│ Add rationale (optional):                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│               [Cancel] [Provide Guidance] [Resolve]     │
└─────────────────────────────────────────────────────────┘
```

### 3. GuidanceModal
```
┌─────────────────────────────────────────────────────────┐
│ Provide Guidance                                    [X] │
├─────────────────────────────────────────────────────────┤
│ Help the agent refine the options by explaining what    │
│ you're looking for.                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ I'd prefer options that consider backwards          │ │
│ │ compatibility with existing clients...              │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Iteration 2 of 3 will be created.                       │
│                                                         │
│                            [Cancel] [Submit Guidance]   │
└─────────────────────────────────────────────────────────┘
```

### 4. DecisionHistory
```
┌─────────────────────────────────────────────────────────┐
│ Decisions │ [Pending (3)] [All] │ [Search...] [Filter] │
├─────────────────────────────────────────────────────────┤
│ ✓ RESOLVED │ API Versioning │ Option 1 selected        │
│   "URL path versioning is clearest for our use case"   │
│   Resolved by steve • 2h ago                           │
├─────────────────────────────────────────────────────────┤
│ ✓ RESOLVED │ Auth Method │ Option 2 selected           │
│   Resolved by steve • 1d ago                           │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Existing (keep)
- `GET /api/gastown/decisions` - List decisions
- `POST /api/gastown/decisions/[id]/resolve` - Resolve decision

### New Endpoints Needed

#### GET /api/gastown/decisions/[id]
Get single decision with full details.
```typescript
Response: {
  decision: Decision;
  chain: Decision[];  // Iteration chain
  parentBead?: { id: string; title: string };
}
```

#### POST /api/gastown/decisions/[id]/guidance
Submit text guidance for iteration.
```typescript
Request: { guidance: string }
Response: { success: boolean; nextIteration?: Decision }
```

#### POST /api/gastown/decisions/[id]/cancel
Cancel a pending decision.
```typescript
Request: { reason?: string }
Response: { success: boolean }
```

#### POST /api/gastown/decisions (admin only)
Create a new decision.
```typescript
Request: {
  prompt: string;
  options: DecisionOption[];
  urgency: 'high' | 'medium' | 'low';
  parentBeadId?: string;
  maxIterations?: number;
}
Response: { decision: Decision }
```

---

## State Management

### New: decisions.svelte.ts

```typescript
// src/lib/stores/domains/decisions.svelte.ts

interface DecisionStoreState {
  items: Decision[];
  selected: Decision | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  filter: {
    status: 'pending' | 'all';
    urgency: 'all' | 'high' | 'medium' | 'low';
    search: string;
  };
}

class DecisionStore {
  #state = $state<DecisionStoreState>({...});

  // Computed
  get pending() { return this.#state.items.filter(d => d.status === 'pending'); }
  get highUrgency() { return this.pending.filter(d => d.urgency === 'high'); }
  get counts() { /* urgency counts */ }

  // Actions
  async fetch(): Promise<void>;
  async resolve(id: string, optionId: string, rationale?: string): Promise<void>;
  async submitGuidance(id: string, guidance: string): Promise<void>;
  async cancel(id: string, reason?: string): Promise<void>;
  select(decision: Decision | null): void;
  setFilter(filter: Partial<Filter>): void;

  // Polling
  startPolling(intervalMs: number): void;
  stopPolling(): void;
}

export const decisionStore = new DecisionStore();
```

---

## Implementation Tasks

### Phase 1: Core Enhancements (Foundation)

#### Task 1.1: Create Decision Store
- Create `src/lib/stores/domains/decisions.svelte.ts`
- Implement fetch, resolve, guidance, cancel actions
- Add SWR caching integration
- Add polling mechanism
- Export from stores index

#### Task 1.2: Add Decision Detail Modal
- Create `src/lib/components/decisions/DecisionDetailModal.svelte`
- Show full prompt, context, options
- Show iteration chain
- Show parent bead link
- Add rationale input field

#### Task 1.3: Enhance Resolve Flow
- Add rationale textarea to resolve UI
- Update API call to include rationale
- Show success/error toast

#### Task 1.4: Add GET /api/gastown/decisions/[id] Endpoint
- Create `src/routes/api/gastown/decisions/[id]/+server.ts`
- Fetch decision with chain via `bd decision show` and `bd decision chain`
- Return full decision details

### Phase 2: Iteration Support

#### Task 2.1: Add Guidance Modal
- Create `src/lib/components/decisions/GuidanceModal.svelte`
- Text area for guidance input
- Show iteration count
- Validation (non-empty, max length)

#### Task 2.2: Add POST /api/gastown/decisions/[id]/guidance Endpoint
- Create guidance endpoint
- Call `bd decision respond --guidance="..."`
- Return updated decision

#### Task 2.3: Show Iteration Chain in UI
- Add chain visualization component
- Show prior decisions in collapsible section
- Link to prior iterations

### Phase 3: History & Filtering

#### Task 3.1: Add Decision History View
- Add "All/Pending" toggle to page header
- Show resolved decisions with outcome
- Add resolved date, resolver, rationale

#### Task 3.2: Add Filtering
- Urgency filter dropdown
- Search by prompt text
- Date range filter (optional)

#### Task 3.3: Update API for Filtering
- Add query params to decisions endpoint
- Support `status`, `urgency`, `search`, `from`, `to`

### Phase 4: Real-time & Notifications

#### Task 4.1: Add Polling to Decision Store
- Implement configurable polling interval
- Detect new decisions
- Update counts reactively

#### Task 4.2: Add Toast Notifications
- Toast for new high-urgency decisions
- Toast for resolve success/failure
- Integrate with existing toast store

#### Task 4.3: Update Navigation Badge
- Show pending decision count in sidebar
- Highlight if high-urgency pending

### Phase 5: Keyboard & Mobile

#### Task 5.1: Add Keyboard Navigation
- Implement keyboard handler
- j/k navigation
- Number keys for options
- Enter to confirm, Escape to close

#### Task 5.2: Mobile Optimization
- Responsive card layout
- Bottom sheet for details
- Touch-friendly buttons
- Test on mobile viewports

### Phase 6: Admin Features (Optional)

#### Task 6.1: Decision Creation UI
- "New Decision" button (feature-flagged)
- Creation form/wizard
- Option builder
- Preview before submit

#### Task 6.2: Cancel Decision
- Add cancel button to pending decisions
- Confirmation dialog
- POST /api/gastown/decisions/[id]/cancel endpoint

---

## Testing Plan

### Unit Tests
- Decision store actions
- Option parsing utilities
- Urgency sorting logic

### Integration Tests
- Decision list page load
- Resolve flow end-to-end
- Guidance submission
- Keyboard navigation

### E2E Tests (Playwright)
- Full decision resolve flow
- Iteration workflow
- History filtering
- Mobile responsiveness

---

## Success Metrics

1. **Response Time**: Average time from decision creation to resolution
2. **Iteration Rate**: Percentage of decisions requiring iteration
3. **Completion Rate**: Percentage of decisions resolved vs cancelled/timed out
4. **UI Engagement**: Click-through rate on View Details
5. **Error Rate**: Failed resolve attempts

---

## Dependencies

- beads CLI (`bd decision` commands)
- gastown RPC server (optional, for real-time)
- Existing gastown_ui infrastructure (stores, components, API client)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `bd` CLI latency | Slow page loads | Add SWR caching, optimistic updates |
| Daemon connection issues | Feature unavailable | Graceful degradation, demo mode |
| Complex iteration chains | UI confusion | Collapsible chain, clear iteration badges |
| High-urgency spam | Alert fatigue | Rate-limit notifications, configurable |

---

## Timeline Estimate

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1 | 4 tasks | Medium |
| Phase 2 | 3 tasks | Medium |
| Phase 3 | 3 tasks | Low |
| Phase 4 | 3 tasks | Medium |
| Phase 5 | 2 tasks | Low |
| Phase 6 | 2 tasks | Medium |

---

## Appendix: File Locations

| Component | Path |
|-----------|------|
| Decisions Page | `src/routes/(app)/decisions/+page.svelte` |
| Page Server | `src/routes/(app)/decisions/+page.server.ts` |
| Decisions API | `src/routes/api/gastown/decisions/` |
| Decision Store (new) | `src/lib/stores/domains/decisions.svelte.ts` |
| Components (new) | `src/lib/components/decisions/` |
| Utils | `src/lib/utils/index.ts` (decisionUrgencyConfig) |

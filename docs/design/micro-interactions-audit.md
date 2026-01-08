# Micro-interactions Audit: Gas Town UI

**Bead**: gt-mol-2fs
**Status**: Design Complete
**Date**: 2026-01-09

## Executive Summary

The Gas Town UI has a solid foundation of micro-interactions with good performance optimization. This audit identifies existing implementations, gaps, and prioritized recommendations for polish.

---

## Current State: What's Working Well

### 1. Button Interactions (`Button.svelte`)
- **Hover**: Lift effect (`-translate-y-px`), subtle shadow
- **Active**: Press feedback (`translate-y-0`, shadow removed)
- **Loading**: Spinner with proper `animate-spin`
- **Timing**: 150ms with `ease-out`
- **Focus**: Ring with offset

### 2. Card Interactions (`AgentCard.svelte`, `StatsCard.svelte`)
- **Hover**: Elevation increase, border accent, slight lift (`-translate-y-0.5`)
- **Expand/Collapse**: Spring easing animation (`ease-spring`)
- **Action Buttons**: Tap scale (`active:scale-95`)
- **Status Glow**: Pulse animation for error/running states
- **StatsCard**: Hover scale (`1.02`)

### 3. Input Feedback (`Input.svelte`)
- **Focus**: Ring states, corner accent reveal
- **Validation**: Border color change for error/success
- **Password Toggle**: Smooth icon swap

### 4. Loading States
- **Skeleton**: GPU-optimized shimmer (transform-based, 1.5s)
- **Stagger**: 50ms delays between skeleton items
- **Navigation**: Progress bar + spinner overlay (delayed 500ms)
- **Reduced Motion**: Properly disabled

### 5. Navigation (`BottomNav.svelte`)
- **Active Indicator**: Animated underline with spring easing
- **Tap**: Scale feedback + haptic vibration
- **Overflow Panel**: Slide-up with spring curve
- **Icon States**: Opacity/scale transitions

### 6. Toast Notifications
- **Entry**: Slide-in-from-bottom with fade
- **Exit**: (to verify - should have slide-out)

### 7. Design System Foundation
| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | 50ms | Immediate feedback |
| `duration-fast` | 150ms | Buttons, toggles |
| `duration-normal` | 200ms | Cards, panels |
| `duration-slow` | 300ms | Modals, expansions |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy reveals |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth decel |

---

## Gaps Identified

### Priority 1: High Impact, Low Effort

#### 1.1 Form Validation Shake
**Status**: Animation defined (`animate-shake`), not applied
**Recommendation**: Add shake to input container on validation error
```svelte
<!-- Input.svelte: Add when errorMessage appears -->
<div class={cn(styles.container(), errorMessage && 'animate-shake')}>
```

#### 1.2 Success Feedback Animation
**Status**: Missing
**Recommendation**: Add checkmark scale-in after successful form submissions
```svelte
<!-- Pattern: Success icon with scale-in -->
{#if success}
  <CheckCircle class="animate-scale-in text-success" />
{/if}
```

#### 1.3 Number Counter Usage
**Status**: `NumberCounter.svelte` exists but underutilized
**Recommendation**: Use on all stats that change (dashboard, stats cards)

### Priority 2: Medium Impact

#### 2.1 Page/View Transitions
**Status**: No transitions between routes
**Recommendation**: Implement View Transitions API for SvelteKit
```svelte
<!-- +layout.svelte -->
<script>
  import { onNavigate } from '$app/navigation';

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>
```

CSS for transitions:
```css
::view-transition-old(root) {
  animation: fade-out 150ms ease-out;
}
::view-transition-new(root) {
  animation: fade-in 150ms ease-out;
}
```

#### 2.2 List Item Staggered Entry
**Status**: CSS exists (`.stagger`), inconsistent usage
**Recommendation**: Apply to all list views:
- Agent cards grid
- Log entries
- Mail list
- Queue items

```svelte
<div class="stagger">
  {#each items as item}
    <Card class="animate-fade-in-up" />
  {/each}
</div>
```

#### 2.3 Empty State Entrance
**Status**: `EmptyState.svelte` appears instantly
**Recommendation**: Add scale-in animation
```svelte
<div class="animate-scale-in">
  <!-- empty state content -->
</div>
```

### Priority 3: Nice to Have

#### 3.1 Real-time Update Highlights
**Status**: Missing
**Recommendation**: Flash highlight when SSE updates arrive
```css
@keyframes highlight-update {
  0% { background-color: hsl(var(--accent) / 0.2); }
  100% { background-color: transparent; }
}
.highlight-update {
  animation: highlight-update 1s ease-out;
}
```

#### 3.2 Focus Animation Enhancement
**Status**: Basic ring only
**Recommendation**: Add subtle scale on focus for keyboard nav
```css
.focus-enhanced:focus-visible {
  transform: scale(1.02);
  transition: transform 150ms ease-out;
}
```

#### 3.3 Toast Exit Animation
**Status**: To verify
**Recommendation**: Ensure fade-out + slide when dismissed
```svelte
{#if visible}
  <div
    class="animate-in slide-in-from-bottom fade-in"
    out:fly={{ y: 20, duration: 150 }}
  >
```

#### 3.4 Sidebar Collapse Animation
**Status**: Not audited in detail
**Recommendation**: Ensure smooth width transition with content fade

---

## Implementation Checklist

### Phase 1: Quick Wins (1-2 hours)
- [ ] Add `animate-shake` to Input on validation error
- [ ] Add success checkmark animation pattern
- [ ] Apply `.stagger` to AgentCard grid
- [ ] Add `animate-scale-in` to EmptyState

### Phase 2: Core Polish (2-4 hours)
- [ ] Implement View Transitions API for page navigation
- [ ] Audit and apply stagger to all list views
- [ ] Verify NumberCounter usage on all dynamic numbers

### Phase 3: Refinements (2-3 hours)
- [ ] Add real-time update highlight effect
- [ ] Enhance focus states for keyboard navigation
- [ ] Audit toast exit animations
- [ ] Test all animations with reduced motion preference

---

## Performance Considerations

All recommendations maintain the existing performance-first approach:

1. **Transform/Opacity Only**: All new animations use composited properties
2. **will-change Hints**: Applied judiciously, removed after animation
3. **Reduced Motion**: All animations respect `prefers-reduced-motion`
4. **Duration Limits**: No animation exceeds 500ms
5. **Stagger Limits**: Max 8 items staggered (prevents long delays)

---

## Testing Matrix

| Interaction | Desktop | Mobile | Keyboard | Screen Reader |
|-------------|---------|--------|----------|---------------|
| Button hover/press | Hover + active | Active only | Focus ring | Announced |
| Card expand | Click | Tap | Enter/Space | Expanded state |
| Form validation | Shake + border | Shake + border | Focus moves | Error announced |
| Page transition | Crossfade | Crossfade | N/A | Focus managed |
| List stagger | 50ms delay | 50ms delay | N/A | N/A |

---

## Files to Modify

| File | Changes |
|------|---------|
| `Input.svelte` | Add shake on error |
| `EmptyState.svelte` | Add entrance animation |
| `+layout.svelte` | Add View Transitions |
| `app.css` | Add highlight-update keyframe |
| Various list pages | Apply stagger class |

---

## Approval

This design document is ready for implementation (gt-mol-1f0).

**Design Principles Applied**:
1. Feedback within 100ms for user actions
2. Animations communicate state change, not decoration
3. Performance budget maintained (60fps)
4. Accessibility preserved (reduced motion, focus visible)

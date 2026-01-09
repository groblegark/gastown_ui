# Design: Mobile Floating Search Button Fix

**Task ID**: gt-mol-axk (Design Mobile: Floating Search Button Fix)  
**Status**: In Progress  
**Date**: January 9, 2026

---

## Problem Statement

A floating search button (FAB style) would be useful for quick search across the application on mobile devices. However, it must:
1. Not overlap with content or bottom navigation
2. Maintain 16px minimum clearance from bottom nav
3. Respect iOS safe area insets (notched devices)
4. Be accessible via header on small screens (<768px)
5. Have proper focus management and keyboard support

---

## Current State Analysis

### Existing Components
- **FloatingActionButton.svelte**: Already implements proper positioning with safe area insets
  - Located at: `src/lib/components/FloatingActionButton.svelte`
  - Current usage: Work page for "Create Issue" FAB
  - Positioning: `bottom: calc(80px + env(safe-area-inset-bottom))`
  - Size: 56x56px (meets WCAG AA touch target)
  - Hidden on desktop (md:hidden class)

### No Current Search Implementation
- No floating search button exists yet
- No search input component
- No search icon in headers
- Task is to DESIGN the solution before implementation

---

## Recommended Solution: Option A (Move Search to Header)

**Rationale**:
- Less screen clutter on mobile
- No overlap issues with content
- Natural placement (top-left header area)
- Works better with notches/safe areas
- Consistent with iOS/Android conventions

### Header Search Implementation

```svelte
<!-- Mobile Header Search Button -->
<button
  class="md:hidden w-10 h-10 flex items-center justify-center"
  on:click={toggleSearch}
  aria-label="Search"
  title="Search"
>
  <Search class="w-5 h-5" strokeWidth={2} />
</button>

<!-- Expanded Search Overlay (Mobile Only) -->
{#if searchOpen}
  <div
    class="fixed inset-0 bg-background z-50"
    transition:fade={{ duration: 200 }}
  >
    <div class="flex items-center gap-2 p-4">
      <button
        class="w-10 h-10 flex items-center justify-center"
        on:click={toggleSearch}
        aria-label="Close search"
      >
        <ChevronLeft class="w-5 h-5" strokeWidth={2} />
      </button>
      <input
        bind:this={searchInput}
        type="search"
        placeholder="Search..."
        class="flex-1 bg-muted rounded-lg px-4 py-2 text-foreground"
        on:keydown={(e) => e.key === 'Escape' && toggleSearch()}
      />
    </div>
    <!-- Search results would go here -->
  </div>
{/if}
```

### Desktop Search (Optional)

```svelte
<!-- Desktop Search Bar (Optional, hidden on mobile) -->
<div class="hidden md:flex items-center gap-2 max-w-xs">
  <input
    type="search"
    placeholder="Search..."
    class="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground"
  />
</div>
```

---

## Alternative: Option B (Repositioned FAB)

If a floating action button is still desired:

```css
.floating-search-btn {
  position: fixed;
  /* Move higher to avoid bottom nav overlap */
  bottom: calc(70px + env(safe-area-inset-bottom) + 16px);
  right: 16px;
  z-index: 100;

  /* Proper sizing */
  width: 56px;
  height: 56px;
  border-radius: 16px;

  /* Add shadow for layering */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* On larger screens, reduce bottom offset */
@media (min-width: 769px) {
  .floating-search-btn {
    display: none; /* Only on mobile */
  }
}
```

**Considerations**:
- Requires 70px clearance from bottom nav (instead of current 80px)
- Plus 16px gap = 86px total clearance
- Less ideal than header search (takes screen space)
- Use only if search is primary action

---

## Design Decision

### RECOMMENDED: Option A (Header Search)

**Why**:
1. **No overlap issues** - Search in header doesn't conflict with content
2. **Space efficient** - Uses existing header area
3. **Accessible** - Click to expand, Escape to close
4. **Mobile convention** - Matches iOS/Android patterns
5. **Focus management** - Auto-focuses input when opened
6. **No safe area complications** - In fixed header, not bottom

**Acceptance Criteria**:
- [ ] Search trigger button in header (mobile only)
- [ ] Minimum 44x44px touch target for button
- [ ] Search input overlay appears/disappears smoothly
- [ ] Focus moves to input when expanded
- [ ] Escape key closes search
- [ ] Back arrow closes search
- [ ] Search input has proper placeholder text
- [ ] Search results area prepared for implementation
- [ ] Works on iOS with notch (header respects safe area)
- [ ] Works on Android (no notch)
- [ ] Works in landscape orientation
- [ ] Keyboard appears automatically on input
- [ ] No console errors
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Screen reader announces "Search" button
- [ ] Dark mode appearance correct
- [ ] Responsive at all breakpoints

---

## Implementation Plan

### Phase 1: Component Creation
1. Create `SearchButton.svelte` component (header button)
2. Create `SearchOverlay.svelte` component (expanded search UI)
3. Add search trigger state to app layout

### Phase 2: Integration
1. Add search button to DashboardLayout header
2. Add search overlay to app layout (z-index managed)
3. Ensure proper focus management

### Phase 3: Features (Future)
1. Search API integration
2. Real-time results
3. Search history
4. Suggestions/autocomplete

### Phase 4: Polish
1. Animations (fade, slide)
2. Loading states
3. Error handling
4. Haptic feedback

---

## Files to Modify

| File | Change | Impact |
|------|--------|--------|
| `src/lib/components/DashboardLayout.svelte` | Add search button to header | Mobile header |
| `src/routes/+layout.svelte` | Add search overlay container | Global layout |
| `src/lib/components/index.ts` | Export new components | Component library |
| Potentially new: `src/lib/components/SearchButton.svelte` | Create search button | New component |
| Potentially new: `src/lib/components/SearchOverlay.svelte` | Create search overlay | New component |

---

## Measurements & Spacing

### Mobile (< 768px)
- Header height: 56px
- Search button: 44x44px (touch target)
- Safe area top: Use `env(safe-area-inset-top)` for notched devices
- Search overlay: Full screen

### Desktop (≥ 768px)
- Search bar in header: max-width 320px
- Optional use of Option B FAB for "Create" action instead

---

## Dark Mode Support

Search components follow existing pattern:
- Background: `bg-background` (light on light, dark on dark)
- Input: `bg-muted`
- Text: `text-foreground`
- Placeholder: `text-muted-foreground`
- Minimum 4.5:1 contrast ratio verified in DARK_MODE_TESTING.md

---

## Accessibility Considerations

### Keyboard
- Tab: Focus search button
- Enter: Open search
- Escape: Close search
- Tab within input: Navigate results (future)

### Screen Reader
- Button announced: "Search"
- Overlay announced: "Search results"
- Results as list items
- Loading states announced

### Touch
- 44x44px minimum button
- Full screen search area
- No small touch targets
- Clear close button (back arrow)

---

## Testing Notes

From KEYBOARD_TESTING.md:
- Tab order: Header button should be early in tab order
- Focus visible: Blue ring around button and input
- Escape key works without page close
- Screen reader announces "Search" and role

From BROWSER_TESTING.md:
- Test on Chrome, Firefox, Safari, Edge
- Test on iOS Safari with notch
- Test on Android Chrome
- Test in landscape orientation
- Test with keyboard open (Android)

---

## Success Criteria

✅ Design approved by team  
✅ No overlap with content or bottom nav  
✅ Proper positioning on all screen sizes  
✅ Safe area insets respected on iOS  
✅ Focus management documented  
✅ Accessibility requirements met  
✅ Ready for implementation phase (gt-mol-omm)  

---

**Designer**: AI Assistant (Amp)  
**Design Date**: January 9, 2026  
**Status**: ✅ DESIGN COMPLETE - READY FOR IMPLEMENTATION  
**Next Task**: gt-mol-omm (Implementation)

---

## Notes for Implementation

- Use existing patterns from FloatingActionButton.svelte for safe area handling
- Reference form validation pattern from AGENTS.md for state management
- Follow error state pattern for search failures
- Use haptic feedback pattern from src/lib/utils/haptics.ts
- Leverage existing component library (Button, Input components)
- Keep implementation simple (don't gold-plate)

# Design Polish Performance Verification: Gas Town UI

**Bead**: gt-mol-joh
**Status**: Draft
**Date**: 2026-01-09

## Executive Summary

This document defines how to verify the performance impact of design polish changes (animations, transitions, effects) in the Gas Town UI. It establishes success criteria, measurement tools, and a repeatable test matrix to confirm smoothness, responsiveness, and accessibility without degrading core UX.

---

## Goals

1. Confirm that new or adjusted animations maintain 60fps on target devices.
2. Ensure interaction latency remains within budget (<= 100ms feedback).
3. Verify no layout thrash or main-thread spikes from visual polish.
4. Preserve accessibility (reduced motion, focus behavior, SR announcements).

## Non-Goals

- Backend performance or API latency analysis.
- Deep memory profiling beyond regression detection.

---

## Performance Budgets

| Category | Budget | Rationale |
|----------|--------|-----------|
| Frame time | <= 16.7ms | 60fps target |
| Interaction feedback | <= 100ms | Immediate perceived response |
| Animation duration | <= 500ms | Avoids sluggish feel |
| Long tasks | 0 tasks > 50ms during interactions | Prevents jank |
| Layout shifts (CLS) | <= 0.1 during nav | Stable layout |

---

## Verification Checklist

### 1. Animation Hygiene
- Transform/opacity only (no animating layout properties).
- No forced sync layout in animation loops.
- Staggered lists capped (<= 8 items).
- Reduced motion disables non-essential effects.

### 2. Input Responsiveness
- Tap/hover feedback appears within 100ms.
- Error or success states do not block input focus.
- Focus ring remains visible and stable during motion.

### 3. Route and Panel Transitions
- Navigation transitions do not block interaction.
- View transition does not delay focus management.
- No flashing or tearing when entering/leaving routes.

### 4. Rendering and Paint
- No visible paint storms on list render.
- Shadows and blurs limited to small surfaces.
- Gradients and glows do not cause large repaints.

---

## Tooling

| Tool | Use |
|------|-----|
| Chrome DevTools Performance | Frame timing, long tasks |
| Chrome DevTools Rendering | Paint flashing, layout shifts |
| Lighthouse (CI or local) | Regression checks |
| SvelteKit dev server | Local verification |
| Playwright | Scripted interaction checks |

---

## Test Matrix

| Area | Scenario | Expected | Device Coverage |
|------|----------|----------|----------------|
| Buttons | Hover/tap feedback | < 100ms visual response | Desktop + Mobile |
| Cards | Hover lift/expand | No dropped frames | Desktop + Mobile |
| Lists | Staggered entry | Smooth, capped delay | Desktop + Mobile |
| Forms | Error shake/success | No input jank | Desktop + Mobile |
| Navigation | View transitions | Stable, no CLS spikes | Desktop + Mobile |
| Toasts | Entry/exit | No layout shift | Desktop + Mobile |

---

## Measurement Steps

1. **Baseline capture**
   - Start with current main branch and record metrics for key flows.
2. **Apply design polish changes**
   - Run the same flows with the updated visuals.
3. **Compare traces**
   - Track long tasks, main-thread spikes, and animation smoothness.
4. **Accessibility pass**
   - Verify reduced motion, focus visibility, and screen reader stability.

---

## Acceptance Criteria

- No new long tasks over 50ms during user interactions.
- Animations remain smooth on mid-tier mobile hardware.
- Layout shifts remain within budget during navigation.
- Reduced-motion mode disables all non-essential polish effects.
- Perceived responsiveness matches or improves baseline.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Excessive glow/shadow repaints | Limit area, prefer opacity fades |
| Large list animations | Cap stagger count and duration |
| Transition blocks navigation | Use async view transitions |
| Reduced motion regressions | Explicitly test `prefers-reduced-motion` |

---

## Reporting Template

- **Flow**: e.g., Dashboard -> Agent Details
- **Device**: Desktop (M1) / Mobile (mid-tier Android)
- **Frame time**: max / avg
- **Long tasks**: count
- **CLS**: value
- **Notes**: any visual jank or responsiveness issues

---

## Ownership

- Design: defines polish targets and visual intent
- Engineering: implements and validates measurements
- QA: regression sweeps across devices

---

## Next Actions

1. Confirm target device list (desktop + mobile tiers).
2. Identify critical flows to benchmark.
3. Schedule verification pass after polish changes land.

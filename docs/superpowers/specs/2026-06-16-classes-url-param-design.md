# Design: `?classes=` deep-link to a curated class subset

**Date:** 2026-06-16
**Branch:** `regular-lessons` (developed on `regular-lessons-staging`)
**Status:** Approved — ready for implementation plan

## Problem

We want shareable links to the regular schedule site that display only a chosen
subset of classes, selected by class code via a URL parameter. Example:

```
https://schedule.zenitheducationstudio.com/?classes=2026-Class0006,2026-Class0007
```

This shows exactly those classes — no more, no less — for marketing / specific
cohort links, while leaving the normal site behavior intact when the param is
absent.

## Key facts (verified against the live API)

- The schedule API (`GET /schedule?year=<year>`, owned by `db-schedule-updater`)
  returns rows with a `classSlotId` field in exactly the user's expected format,
  e.g. `"classSlotId": "2026-Class0398"`. So `?classes=` values map directly onto
  `classSlotId` with **no format change needed**.
- The front-end `WeeklyClassSlot` type does **not** currently declare
  `classSlotId`, but the field survives at runtime: `page.tsx` builds slots via
  `res.data.map(normaliseSlot)`, and `normaliseSlot` spreads the raw row
  (`{ ...slot, centre, level }`). The `events` memo also spreads (`{ ...s }`), so
  `classSlotId` is present on the objects passed to the calendar/list — just
  untyped today.
- `campaign` and `promocode` params are read from `window.location.search` at
  click-time by `replaceCampaignInUrl` / `replacePromocodeInUrl`
  (`src/utils/campaign.ts`), invoked in `WeeklyClassCalendar.tsx`. They are
  entirely independent of the filter pipeline and the `classes` param.
- The `view` param has its own mount-read + sync effect, independent of filters.
- The filter→URL sync effect (`page.tsx`) only deletes
  `subject/centre/tutor/level/stream` — it never touches `classes`, `campaign`,
  `promocode`, or `view`.
- Jest 30 + React Testing Library are configured on this branch
  (`jest.config.ts`, `jest.setup.ts`, `npm test`). TDD applies.

## Chosen behavior — "Locked curated view"

1. On mount, read `?classes=` → split on `,`, trim each, drop empties →
   `pinnedClassIds: string[]` (the *requested* codes, before matching).
2. After schedule data loads, match each requested code against `classSlotId`
   **case-insensitively**.
3. **Pinned mode** is active iff `pinnedClassIds` is non-empty **and** at least
   one requested code matches a real class in the loaded data.
4. In **pinned mode**:
   - Calendar **and** List show **exactly** the matching slots — no more, no less.
   - The "pick a stream first" empty-state gate is bypassed; pinned classes
     render immediately on load.
   - The filter controls are replaced by an **exit banner** (see below); the
     **Calendar/List view toggle stays** in a minimal header, and the Filter tab
     is removed from the mobile `BottomNav`.
   - Any `stream/level/subject/centre/tutor` params present in the URL are
     **ignored** for display — the curated link is authoritative.
   - Codes that match no class are silently dropped (they contribute no slot).
5. If `classes` is absent, empty, or matches **zero** real classes, pinned mode
   never activates and the site behaves **exactly as today** (normal filters +
   empty-state gate).
6. Non-filtering params keep working in both modes and are never stripped:
   `view` (own effect), `campaign` and `promocode` (read at click-time in
   `campaign.ts`), so prefill / registration links retain their campaign +
   promocode values.

### Exit control — colored banner (chosen by marketing 2026-06-16)

In pinned mode a branded banner strip is shown at the top of the schedule,
above a minimal header that retains the Calendar/List toggle:

> ⓘ You're viewing N selected classes — **Show all classes →**

- "N" is the number of matched (displayed) classes.
- Clicking **Show all classes** exits pinned mode:
  1. Remove the `classes` param from the URL via `history.replaceState`
     (preserve `campaign`, `promocode`, `view`).
  2. Clear `pinnedClassIds` state → `isPinned` becomes `false`.
  3. Reset `filters` to empty. This guarantees the **normal empty-state**
     regardless of any stale filter params that rode along in the shared link
     (e.g. `?classes=A,B&stream=JC`): the existing filter→URL sync effect then
     strips those stale filter params from the URL automatically.
  4. The site reveals its **normal empty-state** — the full filter bar returns
     and the calendar shows "select a stream to view classes", exactly as for a
     first-time visitor (the chosen post-exit behavior).
- Because the URL no longer carries `classes`, a refresh after exiting does **not**
  re-enter pinned mode.
- The banner renders on both desktop and mobile (full-width strip); on mobile the
  banner's link is the exit affordance (the `BottomNav` Filter tab is hidden).

### Why "Locked" over "scope + keep filters"

The locked view most directly guarantees "no more, no less": the viewer cannot
narrow or widen the curated set, so a shared link always renders the intended
classes. Known trade-off: a viewer cannot filter *within* the pinned subset
(e.g. 5 pinned classes down to 2). If that's wanted later, it is a small
follow-up (un-hide the filter bar, scope `filteredOptions`/`events` to
`pinnedSlots` instead of short-circuiting). Out of scope for this change.

## Acceptance criteria

1. **Exact subset.** With `?classes=A,B` where A and B are valid `classSlotId`s,
   the schedule shows exactly classes A and B (both Calendar and List views) —
   no more, no less.
2. **Other filtering params handled gracefully.** With
   `?classes=A,B&stream=JC&level=S3` (or any filter params), pinned mode still
   shows exactly A and B; the filter params are ignored, not errored on.
3. **Non-filtering params apply as usual.** `view=list` still selects the List
   view in pinned mode.
4. **`campaign` param still applies.** With `?classes=A&campaign=PROMO1`, the
   class's registration/trial links have `SCHEDULE` replaced by `PROMO1` exactly
   as on the normal site.
5. **`promocode` param still applies.** With `?classes=A&promocode=XYZ`, the
   registration link has `PROMOCODE` replaced by `XYZ` exactly as on the normal
   site.
6. **Empty / null / no match → normal site.** If `classes` is absent, an empty
   string, or none of the codes match a real class, the site renders its normal
   filters and empty-state gate with no pinned restriction.
7. **Mixed known + unknown codes.** With `?classes=A,DOES-NOT-EXIST`, only the
   known class A is shown; the unknown code is dropped silently.
8. **Case-insensitive matching.** `?classes=2026-class0398` matches
   `classSlotId` `2026-Class0398`.
9. **Exit banner shown.** In pinned mode, a banner appears reading "You're
   viewing N selected classes" with a "Show all classes" action, where N is the
   number of displayed classes. The Calendar/List toggle remains usable.
10. **Exit returns to normal site.** Clicking "Show all classes" removes `classes`
    from the URL, restores the filter bar, and shows the normal empty-state
    ("select a stream"). `campaign`, `promocode`, and `view` params are preserved
    in the URL.
11. **Exit is durable across refresh.** After exiting, reloading the page does
    not re-enter pinned mode (the `classes` param was removed).

## Components & changes

### 1. `src/components/WeeklyClassCalendar.tsx`
- Add `classSlotId?: string` to the exported `WeeklyClassSlot` type. Purely
  additive (safe per repo conventions: "Adding a field is safe; renaming is
  not"). Field already present at runtime.

### 2. `src/app/page.tsx`
- New state `pinnedClassIds: string[]`, populated in the existing mount effect
  from `params.get("classes")?.split(",").map(s => s.trim()).filter(Boolean)`.
- New memo deriving `pinnedSlots` (the `weeklyClassData` rows whose lowercased
  `classSlotId` is in the lowercased requested set) and `isPinned`
  (`pinnedClassIds.length > 0 && pinnedSlots.length > 0`).
- `events` memo: when `isPinned`, return `pinnedSlots` (bypass the empty-state
  gate and ignore `filters` entirely); otherwise keep the existing logic.
- **Pinned-mode header:** when `isPinned`, render the exit banner + a minimal
  header containing only the Calendar/List view toggle, in place of the normal
  filter header (`!isLoading && !isMobilePhone` block). The banner is full-width
  so it also shows on mobile phones (where the normal filter header is absent).
- **Exit handler** `handleExitPinned()`: (1) remove `classes` from the URL via
  `history.replaceState` (preserving `campaign`/`promocode`/`view`),
  (2) `setPinnedClassIds([])` so `isPinned` flips to `false`, and (3) reset
  `filters` to empty so stale filter params from the link don't leak into the
  post-exit view (the filter→URL sync effect then clears them from the URL).
  Wired to the banner's "Show all classes" action.
- Pass `showFilterButton={!isPinned}` to `BottomNav`.
- No change to the filter→URL sync effect (it already preserves `classes`,
  `campaign`, `promocode`, `view`). After exit, `filters` is empty so that effect
  is a no-op.

### 3. `src/components/BottomNav.tsx`
- Add optional prop `showFilterButton?: boolean` (default `true`).
- Render the Filter tab only when `showFilterButton` is true. Calendar/List tabs
  always render.

### 4. Exit banner (new, small) — in `page.tsx` or a tiny `PinnedBanner` component
- Presentational strip: "You're viewing {n} selected classes" + a "Show all
  classes" button that calls `handleExitPinned`. Branded gradient per the chosen
  mock. Kept trivial; extract to its own file only if it clutters `page.tsx`.

## Data flow

```
URL ?classes=… ─► mount effect ─► pinnedClassIds (state)
weeklyClassData (fetched/cached) ─┐
pinnedClassIds ───────────────────┴► useMemo ─► { pinnedSlots, isPinned }
                                                     │
                       isPinned ? pinnedSlots ───────┴─► events ─► Calendar / List
                                : existing filter pipeline

campaign / promocode / view params ─► read independently (unchanged)
```

## Error handling & edge cases

- **Data not yet loaded:** `isPinned` is derived over `weeklyClassData`, so it is
  `false` until data arrives; during load the (already hidden) filter header and
  loading spinner behave as today.
- **All codes unknown / empty / null:** `pinnedSlots` is empty → `isPinned`
  false → normal site (AC 6).
- **Duplicate codes in the param:** harmless; matching is set-membership.
- **Stale filter params in URL alongside `classes`:** ignored for display;
  `campaign`/`promocode`/`view` preserved.
- **Week navigation / today highlight:** unaffected — `events` is just a smaller
  set fed through the same calendar.
- **Exit then refresh:** `handleExitPinned` strips `classes` from the URL, so a
  reload starts clean in normal mode (no re-pin).
- **Browser back after exit:** exit uses `replaceState` (consistent with the
  existing filter/view URL updates), so back does not restore the pinned link.
  Acceptable; revisit only if a "return to my link" affordance is requested.

## Testing (TDD, React Testing Library)

Mock the schedule fetch with a small set of known `classSlotId`s and assert:
- Pinned mode renders exactly the listed classes (AC 1).
- Filter params alongside `classes` are ignored (AC 2).
- `view=list` honored in pinned mode (AC 3).
- `campaign` / `promocode` reflected in rendered registration links (AC 4, 5).
- Absent / empty / all-unknown `classes` → normal empty-state behavior (AC 6).
- Mixed known + unknown → only known shown (AC 7).
- Case-insensitive match (AC 8).
- Exit banner is shown in pinned mode with the right count (AC 9).
- Clicking "Show all classes" strips `classes` from the URL, restores the filter
  bar / empty-state, and preserves `campaign`/`promocode`/`view` (AC 10, 11).

Per standing preference, **new/edited tests stay uncommitted until the user
reviews them**.

## Out of scope

- Filtering *within* the pinned subset (locked view trade-off).
- Any change to the API, CSV pipeline, or `Session` JSON shape.
- Porting to the crash-course branches.

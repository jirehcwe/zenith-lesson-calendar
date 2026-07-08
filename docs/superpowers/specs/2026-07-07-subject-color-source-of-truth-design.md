# Subject color — single source of truth

**Date:** 2026-07-07
**Status:** Design (approved for spec write; implementation not started)
**Scope:** Internal refactor of the calendar/list subject-color system. No user-visible
behavior change — output is byte-identical to the current (post-legend-fix) behavior.

## Problem

Subject colors are defined **twice**, and the two copies are hand-synced:

- **Block-color maps** (`jcSubjectToColorMap`, `secSubjectToColorMap`, `primarySubjectToColorMap`)
  in `src/components/WeeklyClassCalendar.tsx` — keyed by full subject name (e.g. `"Mathematics"`)
  → `{ color, tint }`. These are **synced to the ops "2026 Schedule" sheet** (`tint` is the exact
  ops cell fill), so they are the authoritative color source.
- **Legend lists** (`JC_LEGEND_ITEMS`, `SEC_LEGEND_ITEMS`, `PRIMARY_LEGEND_ITEMS`, and the combined
  `LEGEND_ITEMS`) — keyed by short label (e.g. `"Math"`) → `{ label, color, tint }`.

Nothing ties the two together. When one is edited and the other isn't, they **drift**. This drift
already caused a shipped bug: selecting a JC level (e.g. `J1`) without selecting the JC stream made
the legend resolve against the combined palette (Secondary hues for shared subjects), so JC-colored
blocks matched nothing and most subjects dropped from the legend — the "only 3 colors" report. (That
symptom is now fixed by resolving the legend per slot level; this refactor removes the underlying
duplication so the class of bug cannot recur.)

### Reconciliation: which copy is authoritative?

The block-color maps win by rule (ops-sheet-synced). Verified empirically that the **per-category**
maps and legend lists agree 100% today — no drift to reconcile:

| Category  | Block colors | Legend colors | Orphans |
|-----------|--------------|---------------|---------|
| JC        | 6 distinct   | 6 distinct    | none    |
| Secondary | 10 distinct  | 10 distinct   | none    |
| Primary   | 3 distinct   | 3 distinct    | none    |

The only place drift ever existed is the combined "overview" palette (Secondary colors + JC GP/Econ),
which is not a per-subject color source but a curated single-swatch approximation. In the new model it
becomes an explicit reference list, not a color source, so it can no longer hold a wrong color.

## Design

### Single source of truth

Each color is defined **once**, as a named *swatch*. Both the block color and the legend derive from it.

```ts
export type Swatch = { label: string; color: string; tint: string };

export const FULL_SWATCH: Swatch = { label: "Full", color: "#64748B", tint: "#E5E7EB" };

// One palette of named swatches per category. Colors live here, ONCE.
// - The object key (e.g. `math`) is a handle used to compose the overview list.
// - `subjects` (full subject names) is what builds the block-color index.
// - Insertion order = legend order.
const JC = {
  math:      { label: "Math",      color: "#00757B", tint: "#8AE8EF", subjects: ["Mathematics"] },
  physics:   { label: "Physics",   color: "#650000", tint: "#FF6969", subjects: ["Physics"] },
  chemistry: { label: "Chemistry", color: "#717100", tint: "#FFF176", subjects: ["Chemistry"] },
  biology:   { label: "Biology",   color: "#133586", tint: "#95B0F0", subjects: ["Biology"] },
  gp:        { label: "GP",        color: "#654B01", tint: "#FBBC04", subjects: ["General Paper"] },
  econ:      { label: "Econ",      color: "#007209", tint: "#7BFF85", subjects: ["Economics"] },
} as const;

const SEC = {
  math:       { label: "Math",         color: "#1F4F7A", tint: "#CFE2F3", subjects: ["Mathematics", "E Math"] },
  aMath:      { label: "A Math",       color: "#1F4F7A", tint: "#CFE2F3", subjects: ["A Math"] },
  physics:    { label: "Physics",      color: "#44132D", tint: "#C27BA0", subjects: ["Pure Physics", "Combined Physics", "Physics"] },
  chemistry:  { label: "Chemistry",    color: "#7E1B1B", tint: "#F4CCCC", subjects: ["Chemistry", "Pure Chemistry", "Combined Chemistry"] },
  biology:    { label: "Biology",      color: "#346F20", tint: "#D9EAD3", subjects: ["Pure Biology", "Combined Biology"] },
  science:    { label: "Science",      color: "#990000", tint: "#FFC2C2", subjects: ["Science"] },
  english:    { label: "English",      color: "#4F1C12", tint: "#DD7E6B", subjects: ["English"] },
  history:    { label: "History",      color: "#6C5900", tint: "#FFD504", subjects: ["Pure History", "Combined History"] },
  literature: { label: "Literature",   color: "#567300", tint: "#DCFF74", subjects: ["Pure Literature", "Combined Literature"] },
  geography:  { label: "Geography",    color: "#64748B", tint: "#FFFFFF", subjects: ["Pure Geography", "Combined Geography"] },
  socStudies: { label: "Soc. Studies", color: "#7E0099", tint: "#F0ABFF", subjects: ["Social Studies"] },
} as const;

const PRIMARY = {
  english: { label: "English", color: "#1E4E7B", tint: "#9FC5E8", subjects: ["English"] },
  math:    { label: "Math",    color: "#713D07", tint: "#F6B26B", subjects: ["Mathematics"] },
  science: { label: "Science", color: "#2F5E1B", tint: "#B6D7A8", subjects: ["Science"] },
} as const;
```

Notes:
- **`Math` / `A Math` share `#1F4F7A`** in Secondary — deliberate (ops wants both labels). The two
  swatches now sit adjacent in one list, so the shared color is obvious rather than hidden. Byte-identical
  to today.
- **Geography** stays `#64748B`/`#FFFFFF` (ops has not assigned a 2026 color; kept white).
- The `subjects` grouping reproduces the current block-color maps exactly when flattened.
- **The `"IP "` subject-prefix strip is preserved** (in `subjectToColor`, before index lookup). IP
  vs Express is differentiated on the slot's `stream` field (used by `levelToFilterMapper`), **not**
  by color — ops assigns one fill per subject regardless of track. So `"IP Mathematics"` normalizes
  to `"Mathematics"` and reuses that swatch; the palettes contain no IP-prefixed keys. Removing the
  strip would drop every IP-prefixed subject to the grey fallback. If IP and Express ever needed
  distinct colors, this strip (and the palette) is where that change would be made — a deliberate
  behavior change, out of scope here.

### The overview (combined) list — composed, not re-typed

```ts
// Curated single-swatch-per-subject overview, shown when no stream is selected.
// Secondary colors for shared subjects + JC colors for GP/Econ — exactly today's
// LEGEND_ITEMS order, but each entry references an existing category swatch (no new hexes).
const OVERVIEW: Swatch[] = [
  SEC.math, SEC.aMath, SEC.physics, SEC.chemistry, SEC.biology, SEC.english,
  JC.gp, JC.econ, SEC.history, SEC.literature, SEC.geography, SEC.socStudies,
];
```

### Derived index

```ts
// Built once at module load: full subject name → swatch, per category.
function indexBySubject(palette: Record<string, Swatch & { subjects: readonly string[] }>) {
  const idx: Record<string, Swatch> = {};
  for (const s of Object.values(palette)) for (const subj of s.subjects) idx[subj] = s;
  return idx;
}
const JC_INDEX = indexBySubject(JC);
const SEC_INDEX = indexBySubject(SEC);
const PRIMARY_INDEX = indexBySubject(PRIMARY);
```

### Accessors — signatures unchanged

Category is inferred from the level's first letter, exactly as today (`J`/`S`/`P`).

| Function | Behavior | Consumers |
|---|---|---|
| `subjectToColor(level, subject): Swatch` | strip `"IP "` prefix; category from `level`; `INDEX[subject]` ?? `FULL_SWATCH` | internal (block fill, dialog accents) |
| `getSubjectColor(subject, level): string` | `subjectToColor(level, subject).color` | `ListView.tsx` |
| `getLegendItemsForStream(stream): Swatch[]` | `"JC"`→`Object.values(JC)`; `startsWith("Secondary")`→`SEC`; `"Primary"`→`PRIMARY`; else→`OVERVIEW`; then `+ FULL_SWATCH` | tests, empty-state |
| `legendItemsForLevel(level): Swatch[]` | category from level → `Object.values(CATEGORY) + FULL_SWATCH` | `computeLegendItems` |
| `LEGEND_ORDER: string[]` | colors of `[...Object.values(JC), ...Object.values(SEC), ...Object.values(PRIMARY)]`, for deterministic legend sort | `computeLegendItems` |

`computeLegendItems(slots, selectedStream)` keeps its current logic verbatim; it just imports the
accessors above. Legend accessors return the public `Swatch` shape (`{ label, color, tint }`) — the
internal `subjects` field is not exposed.

### Module boundary

- New file: **`src/utils/subjectColors.ts`** — holds the swatch data, `OVERVIEW`, `FULL_SWATCH`,
  `Swatch`, the indexes, and the accessors (`subjectToColor`, `getSubjectColor`,
  `getLegendItemsForStream`, `legendItemsForLevel`, `LEGEND_ORDER`).
- **`WeeklyClassCalendar.tsx`** keeps `WeeklyClassSlot`, `isSlotFull`, and `computeLegendItems`
  (calendar domain); imports the accessors from the new module; **re-exports** `getSubjectColor` and
  `getLegendItemsForStream` so existing import sites (`ListView.tsx`, test files) need no changes.
- `ListView.tsx` — unchanged (imports `getSubjectColor` from `WeeklyClassCalendar` as today).

## Testing

1. **Existing suite = byte-identical guard.** `WeeklyClassCalendar.test.tsx` already asserts exact
   hexes for `getSubjectColor` (JC/Sec/Primary/IP), per-stream `getLegendItemsForStream` (labels +
   counts + exclusions), and `computeLegendItems` (the J1 bug + Full behavior). All must stay green
   unchanged — that is the proof the merge changed no color.
2. **New invariant test (the "can't drift" guarantee, executable).** For each category, for every
   subject in its index, `subjectToColor(<category level>, subject)` returns a swatch whose
   `{ color, tint }` is present in that category's legend list (`Object.values(CATEGORY)`). Structurally
   true in this model; the test locks it against future edits — this is the check that would have caught
   the original bug at commit time.
3. **Overview composition test.** Every entry in `OVERVIEW` is (referentially) one of the category
   swatches — no orphan hexes; and its color set + order equals today's combined `LEGEND_ITEMS`
   (minus `Full`).

## Non-goals (explicitly out of scope)

- Changing any color, tint, or label.
- Changing the stream/level filter model, or making `category` a first-class data field on slots
  (still inferred from the level string). That was considered (Option 3) and deferred as YAGNI /
  cross-repo.
- Changing what the default (no-filter) legend shows. The overview list is preserved as-is.

## Risks

- **Low.** Public API and outputs are unchanged; the existing exact-hex tests are the guard. The main
  care point is transcribing the swatch data so the flattened `subjects` reproduce the current
  block-color maps and the `Object.values` order reproduces the current legend order — both covered by
  the existing tests.

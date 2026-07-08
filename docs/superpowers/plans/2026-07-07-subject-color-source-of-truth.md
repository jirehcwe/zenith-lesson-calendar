# Subject Color — Single Source of Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two hand-synced subject-color tables (block-color maps + legend lists) into one source of truth per category, so block colors and the legend can never drift.

**Architecture:** A new `src/utils/subjectColors.ts` module defines each color once as a named *swatch* (`{ label, color, tint }` + the full subject names that map to it). Block colors and legend items both derive from these swatches. `WeeklyClassCalendar.tsx` imports the accessors and re-exports the two the rest of the app uses, so consumers and the existing test suite need no import changes.

**Tech Stack:** TypeScript, React 19, Next.js 15 (static export), Jest + Testing Library.

## Global Constraints

- **Byte-identical output.** No color, tint, or label changes. The existing exact-hex tests in `src/components/WeeklyClassCalendar.test.tsx` MUST stay green unchanged.
- **Public API signatures unchanged:** `subjectToColor(level, subject)`, `getSubjectColor(subject, level)`, `getLegendItemsForStream(stream)`, `legendItemsForLevel(level)`, `computeLegendItems(slots, selectedStream)`, `LEGEND_ORDER`.
- **Colors are ops-sheet-synced** ("2026 Schedule"); block-color maps are the authority. `tint` = exact ops cell fill (except the documented JC Chemistry/Math legibility exceptions).
- **Preserve the `"IP "` subject-prefix strip** in `subjectToColor` — IP vs Express is a `stream`-field/filter concern, not a color one.
- **No committing** unless the user asks (per working agreement). Implement and stop.
- Path alias `@/*` → `./src/*`. Functional components, ALL_CAPS constants, strict TS.

---

### Task 1: Create the `subjectColors` module + guard tests

**Files:**
- Create: `src/utils/subjectColors.ts`
- Create: `src/utils/subjectColors.test.ts`

**Interfaces:**
- Produces:
  - `type Swatch = { label: string; color: string; tint: string }`
  - `const FULL_SWATCH: Swatch`
  - `const JC`, `const SEC`, `const PRIMARY` — objects of named `Swatch & { subjects: readonly string[] }`
  - `const OVERVIEW: readonly (Swatch & { subjects: readonly string[] })[]`
  - `function subjectToColor(level: string, subject: string): Swatch`
  - `function getSubjectColor(subject: string, level: string): string`
  - `function getLegendItemsForStream(stream: string | null): Swatch[]`
  - `function legendItemsForLevel(level: string): Swatch[]`
  - `const LEGEND_ORDER: string[]`

- [ ] **Step 1: Write the module**

Create `src/utils/subjectColors.ts`:

```ts
// Subject color — single source of truth. Each color is defined ONCE as a named
// swatch; block colors and the legend both derive from these swatches so they
// cannot drift. Colors are synced to the ops "2026 Schedule" sheet; `tint` is the
// exact ops cell fill, `color` a darkened shade for legible text/border accents.
// Exceptions kept for on-screen legibility: JC Chemistry (#FFF176) and JC Math
// (#8AE8EF) tints are softened/deepened from the ops fills — do not re-sync.

export type Swatch = { label: string; color: string; tint: string };
type CategorySwatch = Swatch & { subjects: readonly string[] };

export const FULL_SWATCH: Swatch = { label: "Full", color: "#64748B", tint: "#E5E7EB" };

export const JC = {
  math:      { label: "Math",      color: "#00757B", tint: "#8AE8EF", subjects: ["Mathematics"] },
  physics:   { label: "Physics",   color: "#650000", tint: "#FF6969", subjects: ["Physics"] },
  chemistry: { label: "Chemistry", color: "#717100", tint: "#FFF176", subjects: ["Chemistry"] },
  biology:   { label: "Biology",   color: "#133586", tint: "#95B0F0", subjects: ["Biology"] },
  gp:        { label: "GP",        color: "#654B01", tint: "#FBBC04", subjects: ["General Paper"] },
  econ:      { label: "Econ",      color: "#007209", tint: "#7BFF85", subjects: ["Economics"] },
} satisfies Record<string, CategorySwatch>;

export const SEC = {
  math:       { label: "Math",         color: "#1F4F7A", tint: "#CFE2F3", subjects: ["Mathematics", "E Math"] },
  aMath:      { label: "A Math",       color: "#1F4F7A", tint: "#CFE2F3", subjects: ["A Math"] },
  physics:    { label: "Physics",      color: "#44132D", tint: "#C27BA0", subjects: ["Pure Physics", "Combined Physics", "Physics"] },
  chemistry:  { label: "Chemistry",    color: "#7E1B1B", tint: "#F4CCCC", subjects: ["Chemistry", "Pure Chemistry", "Combined Chemistry"] },
  biology:    { label: "Biology",      color: "#346F20", tint: "#D9EAD3", subjects: ["Pure Biology", "Combined Biology"] },
  science:    { label: "Science",      color: "#990000", tint: "#FFC2C2", subjects: ["Science"] },
  english:    { label: "English",      color: "#4F1C12", tint: "#DD7E6B", subjects: ["English"] },
  history:    { label: "History",      color: "#6C5900", tint: "#FFD504", subjects: ["Pure History", "Combined History"] },
  literature: { label: "Literature",   color: "#567300", tint: "#DCFF74", subjects: ["Pure Literature", "Combined Literature"] },
  // Geography is not offered in 2026; kept white until ops assigns a color.
  geography:  { label: "Geography",    color: "#64748B", tint: "#FFFFFF", subjects: ["Pure Geography", "Combined Geography"] },
  socStudies: { label: "Soc. Studies", color: "#7E0099", tint: "#F0ABFF", subjects: ["Social Studies"] },
} satisfies Record<string, CategorySwatch>;

export const PRIMARY = {
  english: { label: "English", color: "#1E4E7B", tint: "#9FC5E8", subjects: ["English"] },
  math:    { label: "Math",    color: "#713D07", tint: "#F6B26B", subjects: ["Mathematics"] },
  science: { label: "Science", color: "#2F5E1B", tint: "#B6D7A8", subjects: ["Science"] },
} satisfies Record<string, CategorySwatch>;

// Curated single-swatch-per-subject overview, shown when no stream is selected.
// Secondary colors for shared subjects + JC colors for GP/Econ. Each entry is a
// reference to an existing category swatch — no independent hexes.
export const OVERVIEW: readonly CategorySwatch[] = [
  SEC.math, SEC.aMath, SEC.physics, SEC.chemistry, SEC.biology, SEC.english,
  JC.gp, JC.econ, SEC.history, SEC.literature, SEC.geography, SEC.socStudies,
];

// Built once: full subject name → swatch, per category.
function indexBySubject(palette: Record<string, CategorySwatch>): Record<string, Swatch> {
  const idx: Record<string, Swatch> = {};
  for (const s of Object.values(palette)) {
    for (const subject of s.subjects) idx[subject] = { label: s.label, color: s.color, tint: s.tint };
  }
  return idx;
}
const JC_INDEX = indexBySubject(JC);
const SEC_INDEX = indexBySubject(SEC);
const PRIMARY_INDEX = indexBySubject(PRIMARY);

// The palette a block is colored from, inferred from the level's first letter
// (J/S/P) — the single color axis. Returns null for unknown levels.
function indexForLevel(level: string): Record<string, Swatch> | null {
  if (level.includes("J")) return JC_INDEX;
  if (level.includes("S")) return SEC_INDEX;
  if (level.includes("P")) return PRIMARY_INDEX;
  return null;
}

function paletteToItems(palette: Record<string, CategorySwatch>): Swatch[] {
  return Object.values(palette).map((s) => ({ label: s.label, color: s.color, tint: s.tint }));
}

// IP vs Express is differentiated by the slot's `stream` field, not by color, so
// "IP Mathematics" normalizes to "Mathematics" and reuses that swatch.
export function subjectToColor(level: string, subject: string): Swatch {
  const normalised = subject.startsWith("IP ") ? subject.slice(3) : subject;
  const idx = indexForLevel(level);
  return (idx && idx[normalised]) || FULL_SWATCH;
}

export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).color;
}

export function getLegendItemsForStream(stream: string | null): Swatch[] {
  if (stream === "JC") return [...paletteToItems(JC), FULL_SWATCH];
  if (stream?.startsWith("Secondary")) return [...paletteToItems(SEC), FULL_SWATCH];
  if (stream === "Primary") return [...paletteToItems(PRIMARY), FULL_SWATCH];
  return [...OVERVIEW.map((s) => ({ label: s.label, color: s.color, tint: s.tint })), FULL_SWATCH];
}

export function legendItemsForLevel(level: string): Swatch[] {
  if (level.includes("J")) return [...paletteToItems(JC), FULL_SWATCH];
  if (level.includes("S")) return [...paletteToItems(SEC), FULL_SWATCH];
  if (level.includes("P")) return [...paletteToItems(PRIMARY), FULL_SWATCH];
  return getLegendItemsForStream(null);
}

// Master ordering across all stream palettes so a legend mixing streams sorts
// deterministically. Every resolved swatch color is present here.
export const LEGEND_ORDER: string[] = [
  ...Object.values(JC), ...Object.values(SEC), ...Object.values(PRIMARY),
].map((s) => s.color);
```

- [ ] **Step 2: Write the guard tests**

Create `src/utils/subjectColors.test.ts`:

```ts
import {
  subjectToColor, getSubjectColor, getLegendItemsForStream, legendItemsForLevel,
  JC, SEC, PRIMARY, OVERVIEW, FULL_SWATCH,
} from "./subjectColors";

describe("single source of truth invariant", () => {
  const cases: [string, Record<string, { color: string; tint: string; subjects: readonly string[] }>][] = [
    ["J1", JC], ["Sec 3", SEC], ["P5", PRIMARY],
  ];

  it("every subject resolves to a swatch present in its category's legend", () => {
    for (const [level, palette] of cases) {
      const legend = new Set(legendItemsForLevel(level).map((s) => `${s.color}|${s.tint}`));
      for (const swatch of Object.values(palette)) {
        for (const subject of swatch.subjects) {
          const { color, tint } = subjectToColor(level, subject);
          expect(legend.has(`${color}|${tint}`)).toBe(true);
        }
      }
    }
  });

  it("resolves each subject to its own swatch's color and tint", () => {
    for (const [level, palette] of cases) {
      for (const swatch of Object.values(palette)) {
        for (const subject of swatch.subjects) {
          expect(subjectToColor(level, subject)).toEqual({
            label: swatch.label, color: swatch.color, tint: swatch.tint,
          });
        }
      }
    }
  });
});

describe("OVERVIEW composition", () => {
  it("is composed only of real category swatches (no orphan hexes)", () => {
    const all = new Set<unknown>([
      ...Object.values(JC), ...Object.values(SEC), ...Object.values(PRIMARY),
    ]);
    for (const swatch of OVERVIEW) expect(all.has(swatch)).toBe(true);
  });

  it("matches the historical combined palette order and colors", () => {
    expect(OVERVIEW.map((s) => `${s.label}:${s.color}`)).toEqual([
      "Math:#1F4F7A", "A Math:#1F4F7A", "Physics:#44132D", "Chemistry:#7E1B1B",
      "Biology:#346F20", "English:#4F1C12", "GP:#654B01", "Econ:#007209",
      "History:#6C5900", "Literature:#567300", "Geography:#64748B", "Soc. Studies:#7E0099",
    ]);
  });
});

describe("IP prefix", () => {
  it("shares Express colors (IP is a stream/filter concern, not a color one)", () => {
    expect(getSubjectColor("IP Mathematics", "Sec 3")).toBe("#1F4F7A");
    expect(getSubjectColor("IP Chemistry", "Sec 4")).toBe("#7E1B1B");
  });
});

describe("fallback", () => {
  it("returns the Full swatch for unknown subjects and unknown levels", () => {
    expect(subjectToColor("Sec 3", "Art")).toEqual(FULL_SWATCH);
    expect(subjectToColor("Unknown", "Mathematics")).toEqual(FULL_SWATCH);
  });
});

describe("getLegendItemsForStream", () => {
  it("appends a single Full swatch and keeps IP === Express", () => {
    expect(getLegendItemsForStream("JC").at(-1)).toEqual(FULL_SWATCH);
    expect(getLegendItemsForStream("Secondary (IP)")).toEqual(getLegendItemsForStream("Secondary (Express)"));
  });
});
```

- [ ] **Step 3: Run the new tests + typecheck**

Run: `yarn test subjectColors && npx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 4: Commit** (only if the user asks — otherwise skip and continue)

---

### Task 2: Rewire `WeeklyClassCalendar` to the module and delete the duplication

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (delete lines ~16–162 color data/helpers; add import + re-export)

**Interfaces:**
- Consumes (from Task 1): `subjectToColor`, `getSubjectColor`, `getLegendItemsForStream`, `legendItemsForLevel`, `LEGEND_ORDER`, `type Swatch`, `FULL_SWATCH`.
- Produces: unchanged `computeLegendItems`, `isSlotFull`, `WeeklyClassSlot`; re-exported `getSubjectColor`, `getLegendItemsForStream`.

- [ ] **Step 1: Delete the old color data and helpers**

In `src/components/WeeklyClassCalendar.tsx`, remove these now-duplicated definitions:
- `FULL_SLOT_COLOR`, `LEGEND_ITEMS`, `JC_LEGEND_ITEMS`, `SEC_LEGEND_ITEMS`, `PRIMARY_LEGEND_ITEMS`
- `getLegendItemsForStream`, `legendItemsForLevel`, `LEGEND_ORDER`
- `jcSubjectToColorMap`, `secSubjectToColorMap`, `primarySubjectToColorMap`
- `getSubjectColor`, `subjectToColor`
- The comment block describing the ops-sheet color sync (moves to the module).

Keep: `isSlotFull`, the `WeeklyClassSlot` type, and `computeLegendItems`.

- [ ] **Step 2: Add the import and re-export**

At the top of `WeeklyClassCalendar.tsx` (with the other imports):

```ts
import {
  subjectToColor,
  getSubjectColor,
  getLegendItemsForStream,
  legendItemsForLevel,
  LEGEND_ORDER,
} from "@/utils/subjectColors";

// Re-exported so existing consumers (ListView, tests) import from here unchanged.
export { getSubjectColor, getLegendItemsForStream };
```

`computeLegendItems` keeps its body verbatim — it now references the imported `subjectToColor`, `legendItemsForLevel`, `getLegendItemsForStream`, and `LEGEND_ORDER`.

- [ ] **Step 3: Run the FULL suite + typecheck + lint**

Run: `yarn test && npx tsc --noEmit && yarn lint`
Expected: all suites PASS (the existing exact-hex `WeeklyClassCalendar.test.tsx` cases prove byte-identical output), `tsc` exit 0, lint shows only pre-existing warnings.

- [ ] **Step 4: Smoke test** (see the smoke-test section below).

- [ ] **Step 5: Commit** (only if the user asks).

## Self-Review Notes

- **Spec coverage:** swatch data (Task 1 Step 1), overview composition (Task 1), all accessors with unchanged signatures (Task 1), module boundary + re-export (Task 2), IP-strip preserved (Task 1 `subjectToColor`), invariant test (Task 1 Step 2). ✓
- **Byte-identical guard:** the existing `WeeklyClassCalendar.test.tsx` is untouched and must pass in Task 2 Step 3.
- **Type consistency:** `Swatch` shape (`label/color/tint`) is used consistently; `subjectToColor` returns `Swatch` (superset of the old `{color,tint}` — callers read `.color`/`.tint`, unaffected by the extra `label`).

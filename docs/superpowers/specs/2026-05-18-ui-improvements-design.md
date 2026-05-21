# UI Improvements Design — 2026-05-18

## Summary

Four focused UI polish changes to the Zenith lesson calendar. No new components; all changes are confined to existing files.

---

## Change 1 — Hide dot separator for Primary-level cards

**Problem:** The dialog header in `WeeklyClassCalendar.tsx:436` renders `{stream} · {level}`. Primary slots have no stream value, producing `· P4`.

**Fix:** Conditionally render `{stream} · ` only when `stream` is non-empty.

```tsx
// Before
{selectedEvent.stream} · {selectedEvent.level}

// After
{selectedEvent.stream ? `${selectedEvent.stream} · ` : ""}{selectedEvent.level}
```

**Files:** `src/components/WeeklyClassCalendar.tsx`

**Tests:** No new tests. Trivial conditional render; full component rendering is not exercised in the existing test suite.

---

## Change 2 — 24hr → 12hr time format

**Goal:** All user-visible times display as `9:00 AM`, `2:30 PM`, etc.

**Utility function** (exported named export in `WeeklyClassCalendar.tsx`):

```ts
export function to12hr(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
```

**Locations updated:**
- `WeeklyClassCalendar.tsx:474` — dialog time row: `{to12hr(selectedEvent.startTime)} – {to12hr(selectedEvent.endTime)}`
- `ListView.tsx:72` — list card time row: `{to12hr(session.startTime)} – {to12hr(session.endTime)}` (import `to12hr` from `./WeeklyClassCalendar`)
- FullCalendar slot axis: add `slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}` to the `<FullCalendar>` props

**Files:** `src/components/WeeklyClassCalendar.tsx`, `src/components/ListView.tsx`

**Tests:**
- `WeeklyClassCalendar.test.tsx`: new `describe("to12hr")` block — `"10:00"→"10:00 AM"`, `"14:30"→"2:30 PM"`, `"12:00"→"12:00 PM"`, `"00:00"→"12:00 AM"`
- `ListView.test.tsx`: new test rendering a slot with `startTime: "14:00"`, `endTime: "16:00"`, asserting `screen.getByText(/2:00 PM – 4:00 PM/)` is in the document

---

## Change 3 — Filter color legend by selected stream

**Goal:** When JC is selected the legend shows only JC subjects; Secondary shows only Secondary subjects; Primary shows only Primary subjects; no filter shows all.

**New prop:** Add `selectedStream?: string | null` to `WeeklyClassCalendar`.

**New exported helper:**

```ts
export function getLegendItemsForStream(stream: string | null): typeof LEGEND_ITEMS[number][] {
  if (stream === "JC") return JC_LEGEND_ITEMS;
  if (stream?.startsWith("Secondary")) return SEC_LEGEND_ITEMS;
  if (stream === "Primary") return PRIMARY_LEGEND_ITEMS;
  return ALL_LEGEND_ITEMS;
}
```

Define `JC_LEGEND_ITEMS`, `SEC_LEGEND_ITEMS`, `PRIMARY_LEGEND_ITEMS` as subsets of `LEGEND_ITEMS` matching each stream's subject color map keys (plus the "Full" gray item in each).

**Legend render:** Replace `LEGEND_ITEMS.map(...)` with `getLegendItemsForStream(selectedStream).map(...)`.

**Wiring:** In `page.tsx`, pass `selectedStream={filters.stream}` to `<WeeklyClassCalendar>`.

**Files:** `src/components/WeeklyClassCalendar.tsx`, `src/app/page.tsx`

**Tests:**
- `WeeklyClassCalendar.test.tsx`: new `describe("getLegendItemsForStream")` block:
  - `"JC"` → returns only GP, Bio, Physics, Chem, Math, Econ + Full
  - `"Secondary (Express)"` → returns Secondary subjects + Full
  - `"Primary"` → returns English, Math, Science + Full
  - `null` → returns all items

---

## Change 4 — Interactive empty calendar state

**Goal:** The "Select a stream" overlay should guide the user to the filters when clicked — opening the filter sheet on mobile, and pulsing the stream pills on desktop/iPad.

### Props added to `WeeklyClassCalendar`

```ts
onEmptyStateClick?: () => void;
```

Remove `pointer-events-none` from the overlay div; make the inner container a `<button>` that calls `onEmptyStateClick` with visible affordance ("Tap to open filters" hint text on mobile, "Click to get started" on desktop).

### State added to `page.tsx`

```ts
const [streamHighlighted, setStreamHighlighted] = useState(false);
```

**Mobile handler:**
```ts
onEmptyStateClick={() => setFilterSheetOpen(true)}
```

**Desktop/iPad handler:**
```ts
onEmptyStateClick={() => {
  setStreamHighlighted(true);
  setTimeout(() => setStreamHighlighted(false), 2000);
}}
```

Pass `streamHighlighted` to `<Filters>` as a new optional prop.

### Filters.tsx change

Add `streamHighlighted?: boolean` prop. When true, wrap the stream pills container with a `ring-2 ring-blue-400 rounded-xl animate-pulse` class (applied for the 2s window, auto-removed when state resets).

**Files:** `src/components/WeeklyClassCalendar.tsx`, `src/app/page.tsx`, `src/components/Filters.tsx`

**Tests:** No new tests. The interactive overlay is render-level behavior not currently exercised in the test suite.

---

## Affected files summary

| File | Changes |
|------|---------|
| `src/components/WeeklyClassCalendar.tsx` | dot fix, `to12hr`, `getLegendItemsForStream`, `selectedStream` + `onEmptyStateClick` props, FullCalendar slotLabelFormat |
| `src/components/ListView.tsx` | import + use `to12hr` |
| `src/components/Filters.tsx` | `streamHighlighted` prop + pulse animation |
| `src/app/page.tsx` | pass `selectedStream`, `onEmptyStateClick`, `streamHighlighted` |
| `src/components/WeeklyClassCalendar.test.tsx` | `to12hr` tests, `getLegendItemsForStream` tests |
| `src/components/ListView.test.tsx` | 12hr time format render test |

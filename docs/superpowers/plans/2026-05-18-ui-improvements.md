# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply four focused UI polish changes — hide the dot separator for Primary level cards, convert all time displays to 12hr format, filter the color legend by selected stream, and make the empty calendar state interactive.

**Architecture:** `to12hr` is extracted to `src/utils/time.ts` (keeps it mockable-free for ListView tests). `getLegendItemsForStream` and new props live in `WeeklyClassCalendar.tsx`. Interactivity state (`streamHighlighted`) lives in `page.tsx` and flows down through props.

**Tech Stack:** React 19, Next.js 15 App Router, TypeScript strict, Jest 30 + React Testing Library, FullCalendar v6

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/utils/time.ts` | **Create** | `to12hr` utility |
| `src/utils/time.test.ts` | **Create** | `to12hr` unit tests |
| `src/components/WeeklyClassCalendar.tsx` | **Modify** | `to12hr` usage in dialog; dot fix; per-stream legend arrays; `getLegendItemsForStream`; `selectedStream` + `onEmptyStateClick` props; FullCalendar `slotLabelFormat` |
| `src/components/ListView.tsx` | **Modify** | Import + use `to12hr` |
| `src/components/Filters.tsx` | **Modify** | `streamHighlighted` prop + pulse animation on stream pills |
| `src/app/page.tsx` | **Modify** | Wire `selectedStream`, `onEmptyStateClick`, `streamHighlighted` state |
| `src/components/WeeklyClassCalendar.test.tsx` | **Modify** | `getLegendItemsForStream` tests |
| `src/components/ListView.test.tsx` | **Modify** | 12hr time render test |

---

## Task 1: `to12hr` utility — TDD

**Files:**
- Create: `src/utils/time.ts`
- Create: `src/utils/time.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/time.test.ts`:

```ts
import { to12hr } from "./time";

describe("to12hr", () => {
  it("converts morning hours to AM", () => {
    expect(to12hr("09:00")).toBe("9:00 AM");
    expect(to12hr("10:30")).toBe("10:30 AM");
    expect(to12hr("11:45")).toBe("11:45 AM");
  });

  it("converts noon to 12:00 PM", () => {
    expect(to12hr("12:00")).toBe("12:00 PM");
  });

  it("converts afternoon hours to PM", () => {
    expect(to12hr("13:00")).toBe("1:00 PM");
    expect(to12hr("14:30")).toBe("2:30 PM");
    expect(to12hr("21:00")).toBe("9:00 PM");
  });

  it("converts midnight to 12:00 AM", () => {
    expect(to12hr("00:00")).toBe("12:00 AM");
  });

  it("pads single-digit minutes to two digits", () => {
    expect(to12hr("09:05")).toBe("9:05 AM");
    expect(to12hr("14:01")).toBe("2:01 PM");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn test src/utils/time.test.ts
```

Expected: FAIL — `Cannot find module './time'`

- [ ] **Step 3: Implement `to12hr`**

Create `src/utils/time.ts`:

```ts
export function to12hr(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test src/utils/time.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/time.ts src/utils/time.test.ts
git commit -m "feat: add to12hr time formatting utility"
```

---

## Task 2: Apply `to12hr` to ListView — TDD

**Files:**
- Modify: `src/components/ListView.test.tsx`
- Modify: `src/components/ListView.tsx`

- [ ] **Step 1: Add the failing test**

Add this test to the bottom of the `describe("ListView")` block in `src/components/ListView.test.tsx`:

```ts
it("renders time in 12-hour format", () => {
  render(<ListView sessions={[makeSlot({ startTime: "14:00", endTime: "16:00" })]} />);
  expect(screen.getByText("2:00 PM – 4:00 PM")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
yarn test src/components/ListView.test.tsx
```

Expected: FAIL — `Unable to find an element with the text: 2:00 PM – 4:00 PM`

- [ ] **Step 3: Update `ListView.tsx`**

Add the import after the existing imports at the top of `src/components/ListView.tsx`:

```ts
import { to12hr } from "@/utils/time";
```

Find the time display line (shows `session.startTime` and `session.endTime`):

```tsx
<span className="font-medium text-gray-700">{session.startTime} – {session.endTime}</span>
```

Replace with:

```tsx
<span className="font-medium text-gray-700">{to12hr(session.startTime)} – {to12hr(session.endTime)}</span>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test src/components/ListView.test.tsx
```

Expected: PASS — all tests including the new one

- [ ] **Step 5: Commit**

```bash
git add src/components/ListView.tsx src/components/ListView.test.tsx
git commit -m "feat: display times in 12-hour format in list view"
```

---

## Task 3: Apply `to12hr` to calendar dialog and slot axis

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx`

- [ ] **Step 1: Import `to12hr`**

At the top of `src/components/WeeklyClassCalendar.tsx`, add to the existing imports:

```ts
import { to12hr } from "@/utils/time";
```

- [ ] **Step 2: Update the dialog time row**

Find the dialog time display (inside the details section, the `<span>` that shows start and end times):

```tsx
<span className="text-sm font-semibold text-gray-800">
  {selectedEvent.startTime} – {selectedEvent.endTime}
</span>
```

Replace with:

```tsx
<span className="text-sm font-semibold text-gray-800">
  {to12hr(selectedEvent.startTime)} – {to12hr(selectedEvent.endTime)}
</span>
```

- [ ] **Step 3: Add 12hr format to FullCalendar slot axis**

In the `<FullCalendar ... />` props block, add `slotLabelFormat` after `slotMaxTime`:

```tsx
slotMaxTime="22:00:00"
slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
```

- [ ] **Step 4: Run all tests**

```bash
yarn test
```

Expected: PASS — all tests (WeeklyClassCalendar tests only exercise pure functions, so no change there)

- [ ] **Step 5: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: display times in 12-hour format in calendar dialog and slot axis"
```

---

## Task 4: Fix dot separator for Primary level dialog header

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx`

- [ ] **Step 1: Fix the conditional render**

Find the dialog hero header section. Look for this line (inside the header `<div>` at the top of the dialog):

```tsx
<div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 pr-10">
  {selectedEvent.stream} · {selectedEvent.level}
</div>
```

Replace with:

```tsx
<div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 pr-10">
  {selectedEvent.stream && `${selectedEvent.stream} · `}{selectedEvent.level}
</div>
```

This renders nothing before the level when `stream` is an empty string (Primary slots), and renders `"JC · J1"` or `"Secondary (Express) · S3"` when stream is present.

- [ ] **Step 2: Run all tests**

```bash
yarn test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "fix: hide dot separator in dialog when slot has no stream (Primary)"
```

---

## Task 5: `getLegendItemsForStream` — TDD

**Files:**
- Modify: `src/components/WeeklyClassCalendar.test.tsx`
- Modify: `src/components/WeeklyClassCalendar.tsx`

- [ ] **Step 1: Write the failing tests**

At the top of `src/components/WeeklyClassCalendar.test.tsx`, update the import to include `getLegendItemsForStream`:

```ts
import { isSlotFull, getSubjectColor, getLegendItemsForStream, WeeklyClassSlot } from "./WeeklyClassCalendar";
```

Add this new describe block at the bottom of the file:

```ts
describe("getLegendItemsForStream", () => {
  it("returns only JC subjects for JC stream", () => {
    const items = getLegendItemsForStream("JC");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Math", "Physics", "Chemistry", "Biology", "GP", "Econ", "Full"])
    );
    expect(labels).not.toContain("A Math");
    expect(labels).not.toContain("History");
    expect(labels).not.toContain("Science");
  });

  it("returns Secondary subjects for Secondary (Express)", () => {
    const items = getLegendItemsForStream("Secondary (Express)");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Math", "A Math", "Physics", "Chemistry", "Biology",
        "English", "History", "Literature", "Geography", "Soc. Studies", "Full",
      ])
    );
    expect(labels).not.toContain("GP");
    expect(labels).not.toContain("Econ");
    expect(labels).not.toContain("Science");
  });

  it("returns the same Secondary items for Secondary (IP)", () => {
    const express = getLegendItemsForStream("Secondary (Express)").map((i) => i.label);
    const ip = getLegendItemsForStream("Secondary (IP)").map((i) => i.label);
    expect(ip).toEqual(express);
  });

  it("returns Primary subjects for Primary stream", () => {
    const items = getLegendItemsForStream("Primary");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(["English", "Math", "Science", "Full"])
    );
    expect(labels).not.toContain("A Math");
    expect(labels).not.toContain("GP");
    expect(labels).not.toContain("Physics");
  });

  it("returns all items when stream is null", () => {
    const items = getLegendItemsForStream(null);
    const labels = items.map((i) => i.label);
    expect(labels).toContain("GP");
    expect(labels).toContain("A Math");
    expect(labels).toContain("Econ");
    expect(labels).toContain("History");
    expect(items.length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
yarn test src/components/WeeklyClassCalendar.test.tsx
```

Expected: FAIL — `getLegendItemsForStream is not a function`

- [ ] **Step 3: Define the per-stream legend arrays**

In `src/components/WeeklyClassCalendar.tsx`, replace the existing `LEGEND_ITEMS` constant with these four arrays. The original `LEGEND_ITEMS` becomes the all-items fallback:

```ts
const LEGEND_ITEMS = [
  { label: "Math",         color: "#B45309", tint: "#FEF3C7" },
  { label: "A Math",       color: "#1E40AF", tint: "#DBEAFE" },
  { label: "Physics",      color: "#BE123C", tint: "#FECDD3" },
  { label: "Chemistry",    color: "#15803D", tint: "#DCFCE7" },
  { label: "Biology",      color: "#166534", tint: "#BBFBD0" },
  { label: "English",      color: "#0369A1", tint: "#BAE6FD" },
  { label: "GP",           color: "#9A3412", tint: "#FED7AA" },
  { label: "Econ",         color: "#4338CA", tint: "#E0E7FF" },
  { label: "History",      color: "#92400E", tint: "#FFEDD5" },
  { label: "Literature",   color: "#831843", tint: "#FCE7F3" },
  { label: "Geography",    color: "#065F46", tint: "#ECFDF5" },
  { label: "Soc. Studies", color: "#6B21A8", tint: "#F3E8FF" },
  { label: "Full",         color: "#64748B", tint: "#E5E7EB" },
] as const;

const JC_LEGEND_ITEMS = [
  { label: "Math",      color: "#B45309", tint: "#FEF3C7" },
  { label: "Physics",   color: "#BE123C", tint: "#FECDD3" },
  { label: "Chemistry", color: "#15803D", tint: "#DCFCE7" },
  { label: "Biology",   color: "#166534", tint: "#BBFBD0" },
  { label: "GP",        color: "#9A3412", tint: "#FED7AA" },
  { label: "Econ",      color: "#4338CA", tint: "#E0E7FF" },
  { label: "Full",      color: "#64748B", tint: "#E5E7EB" },
] as const;

const SEC_LEGEND_ITEMS = [
  { label: "Math",         color: "#B45309", tint: "#FEF3C7" },
  { label: "A Math",       color: "#1E40AF", tint: "#DBEAFE" },
  { label: "Physics",      color: "#BE123C", tint: "#FECDD3" },
  { label: "Chemistry",    color: "#15803D", tint: "#DCFCE7" },
  { label: "Biology",      color: "#166534", tint: "#BBFBD0" },
  { label: "English",      color: "#0369A1", tint: "#BAE6FD" },
  { label: "History",      color: "#92400E", tint: "#FFEDD5" },
  { label: "Literature",   color: "#831843", tint: "#FCE7F3" },
  { label: "Geography",    color: "#065F46", tint: "#ECFDF5" },
  { label: "Soc. Studies", color: "#6B21A8", tint: "#F3E8FF" },
  { label: "Full",         color: "#64748B", tint: "#E5E7EB" },
] as const;

const PRIMARY_LEGEND_ITEMS = [
  { label: "English", color: "#0369A1", tint: "#BAE6FD" },
  { label: "Math",    color: "#B45309", tint: "#FEF3C7" },
  { label: "Science", color: "#BE123C", tint: "#FECDD3" },
  { label: "Full",    color: "#64748B", tint: "#E5E7EB" },
] as const;
```

- [ ] **Step 4: Export `getLegendItemsForStream`**

Add this exported function immediately after the four legend arrays:

```ts
export function getLegendItemsForStream(
  stream: string | null
): { label: string; color: string; tint: string }[] {
  if (stream === "JC") return [...JC_LEGEND_ITEMS];
  if (stream?.startsWith("Secondary")) return [...SEC_LEGEND_ITEMS];
  if (stream === "Primary") return [...PRIMARY_LEGEND_ITEMS];
  return [...LEGEND_ITEMS];
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn test src/components/WeeklyClassCalendar.test.tsx
```

Expected: PASS — all tests including the 5 new `getLegendItemsForStream` tests

- [ ] **Step 6: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx src/components/WeeklyClassCalendar.test.tsx
git commit -m "feat: add getLegendItemsForStream to filter legend by stream"
```

---

## Task 6: Wire `selectedStream` prop — legend render + page.tsx

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `selectedStream` prop to `WeeklyClassCalendar`**

Find the component signature:

```tsx
export default function WeeklyClassCalendar({ slots, isVisible = true, hasActiveFilters = false }: { slots: WeeklyClassSlot[]; isVisible?: boolean; hasActiveFilters?: boolean }) {
```

Replace with:

```tsx
export default function WeeklyClassCalendar({
  slots,
  isVisible = true,
  hasActiveFilters = false,
  selectedStream = null,
}: {
  slots: WeeklyClassSlot[];
  isVisible?: boolean;
  hasActiveFilters?: boolean;
  selectedStream?: string | null;
}) {
```

- [ ] **Step 2: Wire the legend render to use `getLegendItemsForStream`**

Find the legend row render (below the FullCalendar closing tag):

```tsx
<div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5 border-t border-slate-200 bg-gray-50">
  {LEGEND_ITEMS.map(({ label, color, tint }) => (
```

Replace `LEGEND_ITEMS.map` with:

```tsx
<div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5 border-t border-slate-200 bg-gray-50">
  {getLegendItemsForStream(selectedStream).map(({ label, color, tint }) => (
```

- [ ] **Step 3: Pass `selectedStream` from `page.tsx`**

In `src/app/page.tsx`, find the `<WeeklyClassCalendar>` usage:

```tsx
<WeeklyClassCalendar slots={events} isVisible={currentView === "calendar"} hasActiveFilters={hasActiveFilters} />
```

Replace with:

```tsx
<WeeklyClassCalendar
  slots={events}
  isVisible={currentView === "calendar"}
  hasActiveFilters={hasActiveFilters}
  selectedStream={filters.stream}
/>
```

- [ ] **Step 4: Run all tests**

```bash
yarn test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx src/app/page.tsx
git commit -m "feat: filter color legend based on selected stream"
```

---

## Task 7: Make the empty calendar state overlay interactive

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx`

- [ ] **Step 1: Add `onEmptyStateClick` prop**

Update the component signature from Task 6 to include the new prop:

```tsx
export default function WeeklyClassCalendar({
  slots,
  isVisible = true,
  hasActiveFilters = false,
  selectedStream = null,
  onEmptyStateClick,
}: {
  slots: WeeklyClassSlot[];
  isVisible?: boolean;
  hasActiveFilters?: boolean;
  selectedStream?: string | null;
  onEmptyStateClick?: () => void;
}) {
```

- [ ] **Step 2: Replace the overlay div**

Find the empty-state overlay block:

```tsx
{slots.length === 0 && !hasActiveFilters && (
  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
    <div className="text-center px-6">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-600">Select a stream to see classes</p>
      <p className="text-xs text-gray-400 mt-1">Filter by stream, level, subject, or centre</p>
    </div>
  </div>
)}
```

Replace with:

```tsx
{slots.length === 0 && !hasActiveFilters && (
  <div
    className={`absolute inset-0 z-10 flex items-center justify-center ${onEmptyStateClick ? "cursor-pointer" : "pointer-events-none"}`}
    onClick={onEmptyStateClick}
    role={onEmptyStateClick ? "button" : undefined}
    tabIndex={onEmptyStateClick ? 0 : undefined}
    onKeyDown={onEmptyStateClick ? (e) => { if (e.key === "Enter" || e.key === " ") onEmptyStateClick(); } : undefined}
  >
    <div className="text-center px-6">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-600">Select a stream to see classes</p>
      <p className="text-xs text-gray-400 mt-1">Filter by stream, level, subject, or centre</p>
      {onEmptyStateClick && (
        <p className="text-xs text-blue-500 mt-2 font-medium">Open filters →</p>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Run all tests**

```bash
yarn test
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: make empty calendar overlay clickable with onEmptyStateClick prop"
```

---

## Task 8: Wire interactive empty state — page.tsx and Filters.tsx

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Filters.tsx`

- [ ] **Step 1: Add `streamHighlighted` state in `page.tsx`**

Find the existing state declarations near the top of the `Page` component (around the `filterSheetOpen` state):

```tsx
const [filterSheetOpen, setFilterSheetOpen] = useState(false);
```

Add the new state directly below it:

```tsx
const [filterSheetOpen, setFilterSheetOpen] = useState(false);
const [streamHighlighted, setStreamHighlighted] = useState(false);
```

- [ ] **Step 2: Wire `onEmptyStateClick` in `page.tsx`**

Find the `<WeeklyClassCalendar>` usage updated in Task 6:

```tsx
<WeeklyClassCalendar
  slots={events}
  isVisible={currentView === "calendar"}
  hasActiveFilters={hasActiveFilters}
  selectedStream={filters.stream}
/>
```

Replace with:

```tsx
<WeeklyClassCalendar
  slots={events}
  isVisible={currentView === "calendar"}
  hasActiveFilters={hasActiveFilters}
  selectedStream={filters.stream}
  onEmptyStateClick={
    isMobilePhone
      ? () => setFilterSheetOpen(true)
      : () => {
          setStreamHighlighted(true);
          setTimeout(() => setStreamHighlighted(false), 2000);
        }
  }
/>
```

- [ ] **Step 3: Add `streamHighlighted` prop to `FiltersProps`**

In `src/components/Filters.tsx`, find the end of the `FiltersProps` type (the `openUpward?: boolean;` line) and add one line after it:

```ts
  openUpward?: boolean;
  streamHighlighted?: boolean;
};
```

- [ ] **Step 4: Destructure `streamHighlighted` in the `Filters` function**

Find the last parameter in the `Filters` destructure (`openUpward = false,`) and add `streamHighlighted = false` on the line after it:

```tsx
  openUpward = false,
  streamHighlighted = false,
}: FiltersProps) {
```

- [ ] **Step 5: Apply pulse highlight to stream pills**

Find the inner `div` containing the stream pill buttons:

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {streams.map((stream) => (
```

Replace with:

```tsx
<div className={`flex items-center gap-2 flex-wrap rounded-xl transition-all duration-300 ${streamHighlighted ? "ring-2 ring-blue-400 px-2 py-1 animate-pulse" : ""}`}>
  {streams.map((stream) => (
```

- [ ] **Step 6: Pass `streamHighlighted` to the desktop `Filters` component**

In `src/app/page.tsx`, find the desktop `<Filters>` render (the one inside the sticky header, not the mobile filter sheet one):

```tsx
<Filters
  streams={streamOptions}
  levels={filteredOptions.levels}
  subjects={filteredOptions.subjects}
  centres={filteredOptions.centres}
  tutors={filteredOptions.tutors}
  filters={filters}
  onFilterChange={handleFilterChange}
  currentView={currentView}
  onViewChange={setCurrentView}
  totalCount={events.length}
  showViewToggle={false}
/>
```

Replace with:

```tsx
<Filters
  streams={streamOptions}
  levels={filteredOptions.levels}
  subjects={filteredOptions.subjects}
  centres={filteredOptions.centres}
  tutors={filteredOptions.tutors}
  filters={filters}
  onFilterChange={handleFilterChange}
  currentView={currentView}
  onViewChange={setCurrentView}
  totalCount={events.length}
  showViewToggle={false}
  streamHighlighted={streamHighlighted}
/>
```

(The mobile filter sheet `<Filters>` does not need `streamHighlighted` — on mobile the sheet opens instead.)

- [ ] **Step 7: Run all tests**

```bash
yarn test
```

Expected: PASS — all tests

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components/Filters.tsx
git commit -m "feat: empty calendar state opens filter sheet on mobile, pulses stream pills on desktop"
```

---

## Done

All 4 UI improvements are implemented. Manual smoke test checklist:

- [ ] Open the app with no filters → empty calendar shows "Open filters →" hint
- [ ] Click the empty overlay on mobile → filter sheet opens
- [ ] Click the empty overlay on desktop → stream pills pulse briefly (ring + fade)
- [ ] Select JC → legend shows only Math, Physics, Chemistry, Biology, GP, Econ, Full
- [ ] Select Secondary (Express) → legend shows only Secondary subjects
- [ ] Select Primary → legend shows English, Math, Science, Full (no "Physics" label)
- [ ] Click a Primary slot → dialog shows `P4` (no `· P4`)
- [ ] Click any slot → time shows as `9:00 AM – 11:00 AM` (not `09:00 – 11:00`)
- [ ] Calendar left axis shows `9 AM`, `10 AM` etc.
- [ ] List view cards show 12hr times

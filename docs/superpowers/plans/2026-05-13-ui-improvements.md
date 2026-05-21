# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement visual UI improvements from `docs/superpowers/specs/2026-05-12-ui-improvements-design.md` — deeper indigo hero, eyebrow pill, richer filter bar, redesigned list cards, modal redesign, and mobile filter tab.

**Architecture:** Pure React/CSS changes — no API or data model changes. State lives in `page.tsx` (existing pattern). New props added to `Filters` and `BottomNav`. `getSubjectColor` exported from `WeeklyClassCalendar` for reuse in `ListView`. ⚠️ Spec Section 5 says "CalendarView.tsx — Modal" but `CalendarView.tsx` is dead code (imports old `Session` type, never rendered in `page.tsx`). The live calendar modal is the `<Dialog>` inside `WeeklyClassCalendar.tsx` — Task 8 targets that instead.

**Tech Stack:** Next.js 15 (App Router, static export), React 19, Tailwind CSS 4, headlessui/react, Jest + Testing Library. Run tests with `yarn test --no-coverage`. No test for CSS or FullCalendar modal (manual verify instead).

---

## File Map

| File | What changes |
|---|---|
| `src/app/globals.css` | hero-gradient + new CSS custom properties |
| `src/components/SignupBanner.tsx` | eyebrow pill above headline |
| `src/components/SignupBanner.test.tsx` | assert eyebrow pill text |
| `src/components/Filters.tsx` | search input, view toggle segmented control, summary row |
| `src/components/Filters.test.tsx` | new required props on every render + new assertions |
| `src/app/page.tsx` | searchQuery + filterSheetOpen state, sticky wrapper update, ViewSelector removed from render, new props passed to Filters, filter sheet overlay |
| `src/components/WeeklyClassCalendar.tsx` | export `getSubjectColor`, modal Dialog redesign |
| `src/components/ListView.tsx` | full card redesign |
| `src/components/ListView.test.tsx` | updated mock + new assertions |
| `src/components/BottomNav.tsx` | Filter tab, active indicator bar, safe area |
| `src/components/ViewSelector.tsx` | **NOT changed** — kept for `ViewType` export |
| `src/components/CalendarView.tsx` | **NOT changed** — dead code |
| `src/components/CalendarView.test.tsx` | **NOT changed** — tests dead code |

---

## Task 1: Design tokens — globals.css

**Files:** Modify `src/app/globals.css`

- [ ] **Step 1: Update globals.css**

Replace the entire `:root` block with (keep everything after it unchanged):

```css
:root {
  --background: #ffffff;
  --foreground: #2d3748;
  --primary-blue: #4a90e2;
  --secondary-blue: #5b9bd5;
  --accent-orange: #ffa726;
  --text-dark: #2d3748;
  --text-light: #718096;
  --brand: #2F4AC0;
  --brand-50: #EEF2FF;
  --brand-100: #DCE3FB;
  --accent: #F59E0B;
  --surface: #FFFFFF;
  --bg: #F6F7FB;
  --t1: #0F172A;
  --t2: #475569;
  --t3: #94A3B8;
  --line: #E5E7EB;
}
```

Replace the `.hero-gradient` rule:

```css
.hero-gradient {
  background: linear-gradient(135deg, #2438A0 0%, #2F4AC0 45%, #4F6BE8 100%);
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn build 2>&1 | tail -5
```
Expected: exit 0, no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css && git commit -m "feat(design): add brand/accent CSS tokens, update hero-gradient to deep indigo"
```

---

## Task 2: SignupBanner — eyebrow pill

**Files:** Modify `src/components/SignupBanner.tsx`, `src/components/SignupBanner.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `src/components/SignupBanner.test.tsx` (after the last existing test):

```tsx
it("renders the eyebrow pill in the desktop layout", () => {
  render(<SignupBanner />);
  expect(screen.getByText(/Now booking/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --testPathPattern=SignupBanner --no-coverage 2>&1 | tail -15
```
Expected: FAIL — "Unable to find an element with the text: /Now booking/i"

- [ ] **Step 3: Add eyebrow pill to desktop layout**

In `src/components/SignupBanner.tsx`, inside the `{/* Center - Text Content */}` div (the `flex-1 text-white space-y-6` div in the `hidden lg:flex` section), add the eyebrow pill as the first child of the inner `<div className="space-y-4">`, before the `<h1>`:

```tsx
{/* Eyebrow pill */}
<div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 w-fit">
  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block flex-shrink-0" />
  <span className="text-xs font-semibold uppercase tracking-widest text-white/85">
    Now booking · 2026 academic year
  </span>
</div>
```

Also add the same pill in the mobile expanded state, inside `<div className="space-y-4 relative">` above the `{/* Title Section */}` div:

```tsx
{/* Eyebrow pill */}
<div className="flex justify-center">
  <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block flex-shrink-0" />
    <span className="text-xs font-semibold uppercase tracking-widest text-white/85">
      Now booking · 2026 academic year
    </span>
  </div>
</div>
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass (35 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/SignupBanner.tsx src/components/SignupBanner.test.tsx && git commit -m "feat(ui): add eyebrow pill to SignupBanner hero"
```

---

## Task 3: Filters — search input + page.tsx state

**Files:** Modify `src/components/Filters.tsx`, `src/components/Filters.test.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Write failing tests**

Replace the entire content of `src/components/Filters.test.tsx` with (adds `searchQuery`/`onSearchChange` to all renders + 2 new tests):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

type OptionWithCount = { value: string; count: number; selected: boolean };
const opt = (value: string, count = 1): OptionWithCount => ({ value, count, selected: false });
const defaultFilters = { subject: [], centre: [], tutor: [], level: [], stream: null };

const baseProps = {
  streams: [] as string[],
  levels: [] as OptionWithCount[],
  subjects: [] as OptionWithCount[],
  centres: [] as OptionWithCount[],
  tutors: [] as OptionWithCount[],
  filters: defaultFilters,
  onFilterChange: jest.fn(),
  searchQuery: "",
  onSearchChange: jest.fn(),
};

describe("Filters", () => {
  it("renders stream buttons for each stream", () => {
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} />);
    expect(screen.getByRole("button", { name: "JC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary (Express)" })).toBeInTheDocument();
  });

  it("renders Level, Subject, and Centre dropdown labels", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Centre")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected stream when a stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole("button", { name: "JC" }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: "JC" }));
  });

  it("calls onFilterChange with stream=null when clear stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters {...baseProps} streams={["JC"]} filters={{ ...defaultFilters, stream: "JC" }} onFilterChange={onFilterChange} />
    );
    await user.click(screen.getByLabelText("Clear stream selection"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: null }));
  });

  it("shows placeholder when no subject is selected", () => {
    render(<Filters {...baseProps} subjects={[opt("Math")]} />);
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected subject when a subject option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} subjects={[opt("Math"), opt("English")]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText("Select Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ subject: ["Math"] }));
  });

  it("renders a search input with correct placeholder", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByPlaceholderText("Search subject or centre…")).toBeInTheDocument();
  });

  it("calls onSearchChange when the search input changes", async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();
    render(<Filters {...baseProps} onSearchChange={onSearchChange} />);
    await user.type(screen.getByPlaceholderText("Search subject or centre…"), "Math");
    expect(onSearchChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --testPathPattern=Filters --no-coverage 2>&1 | tail -15
```
Expected: TypeScript error — `searchQuery` prop does not exist on `FiltersProps`

- [ ] **Step 3: Update FiltersProps and add search input in Filters.tsx**

In `src/components/Filters.tsx`, update `FiltersProps` — add two new fields at the bottom of the type:

```tsx
type FiltersProps = {
  streams: string[];
  levels: OptionWithCount[];
  subjects: OptionWithCount[];
  centres: OptionWithCount[];
  tutors: OptionWithCount[];
  filters: {
    subject: string[];
    centre: string[];
    tutor: string[];
    level: string[];
    stream: string | null;
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};
```

Update the `Filters` function signature to destructure the new props:

```tsx
export default function Filters({
  streams,
  levels,
  subjects,
  centres,
  tutors,
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: FiltersProps) {
```

Add the search input as the first element inside the outer `<div className="space-y-4">`, before the stream section div:

```tsx
{/* Search input */}
<div className="relative w-full max-w-xs">
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
    fill="none" stroke="currentColor" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    placeholder="Search subject or centre…"
    className="w-full rounded-xl border-2 border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
  />
</div>
```

- [ ] **Step 4: Update page.tsx**

Add `searchQuery` state (after the existing `filtersCollapsed` state):

```tsx
const [searchQuery, setSearchQuery] = useState("");
```

Pass the new props to the existing `<Filters>` render in the main content area:

```tsx
searchQuery={searchQuery}
onSearchChange={setSearchQuery}
```

Replace the existing `events` useMemo entirely:

```tsx
const events = useMemo(() => {
  if (
    searchQuery === "" &&
    filters.stream === null &&
    filters.level.length === 0 &&
    filters.subject.length === 0 &&
    filters.centre.length === 0
  ) {
    return [];
  }
  const filtered = weeklyClassData.filter((s) => {
    return (
      (searchQuery === "" ||
        s.subjects.some((subj) =>
          subj.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        s.centre.toLowerCase().includes(searchQuery.toLowerCase())) &&
      levelToFilterMapper(filters.stream, s.level, s.stream) &&
      (filters.level.length === 0 || filters.level.includes(s.level)) &&
      (filters.subject.length === 0 ||
        s.subjects.some((subj) => filters.subject.includes(subj))) &&
      (filters.centre.length === 0 || filters.centre.includes(s.centre))
    );
  });
  return filtered.map((s) => ({ ...s }));
}, [weeklyClassData, filters, searchQuery]);
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Filters.tsx src/components/Filters.test.tsx src/app/page.tsx && git commit -m "feat(ui): add search input to Filters, wire search state and filter in page"
```

---

## Task 4: Filters — view toggle + sticky wrapper

**Files:** Modify `src/components/Filters.tsx`, `src/components/Filters.test.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Write failing tests**

Replace `src/components/Filters.test.tsx` entirely — adds `currentView`/`onViewChange` to `baseProps` and adds 2 new tests. All existing tests stay identical; only `baseProps` gains two new fields:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

type OptionWithCount = { value: string; count: number; selected: boolean };
const opt = (value: string, count = 1): OptionWithCount => ({ value, count, selected: false });
const defaultFilters = { subject: [], centre: [], tutor: [], level: [], stream: null };

const baseProps = {
  streams: [] as string[],
  levels: [] as OptionWithCount[],
  subjects: [] as OptionWithCount[],
  centres: [] as OptionWithCount[],
  tutors: [] as OptionWithCount[],
  filters: defaultFilters,
  onFilterChange: jest.fn(),
  searchQuery: "",
  onSearchChange: jest.fn(),
  currentView: "calendar" as const,
  onViewChange: jest.fn(),
};

describe("Filters", () => {
  it("renders stream buttons for each stream", () => {
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} />);
    expect(screen.getByRole("button", { name: "JC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary (Express)" })).toBeInTheDocument();
  });

  it("renders Level, Subject, and Centre dropdown labels", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Centre")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected stream when a stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole("button", { name: "JC" }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: "JC" }));
  });

  it("calls onFilterChange with stream=null when clear stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters {...baseProps} streams={["JC"]} filters={{ ...defaultFilters, stream: "JC" }} onFilterChange={onFilterChange} />
    );
    await user.click(screen.getByLabelText("Clear stream selection"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: null }));
  });

  it("shows placeholder when no subject is selected", () => {
    render(<Filters {...baseProps} subjects={[opt("Math")]} />);
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected subject when a subject option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} subjects={[opt("Math"), opt("English")]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText("Select Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ subject: ["Math"] }));
  });

  it("renders a search input with correct placeholder", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByPlaceholderText("Search subject or centre…")).toBeInTheDocument();
  });

  it("calls onSearchChange when the search input changes", async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();
    render(<Filters {...baseProps} onSearchChange={onSearchChange} />);
    await user.type(screen.getByPlaceholderText("Search subject or centre…"), "Math");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("renders Calendar and List view toggle buttons", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByRole("button", { name: /Calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /List/i })).toBeInTheDocument();
  });

  it("calls onViewChange with 'list' when List button is clicked", async () => {
    const user = userEvent.setup();
    const onViewChange = jest.fn();
    render(<Filters {...baseProps} onViewChange={onViewChange} />);
    await user.click(screen.getByRole("button", { name: /List/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --testPathPattern=Filters --no-coverage 2>&1 | tail -15
```
Expected: TypeScript error — `currentView` and `onViewChange` props do not exist

- [ ] **Step 3: Update Filters.tsx — add view toggle**

Add import at the top of `src/components/Filters.tsx`:

```tsx
import { ViewType } from "./ViewSelector";
```

Add to `FiltersProps`:

```tsx
currentView: ViewType;
onViewChange: (view: ViewType) => void;
```

Add to the function signature:

```tsx
export default function Filters({
  streams, levels, subjects, centres, tutors,
  filters, onFilterChange,
  searchQuery, onSearchChange,
  currentView, onViewChange,
}: FiltersProps) {
```

Replace the standalone search input `<div className="relative w-full max-w-xs">` with a flex row containing both search and view toggle:

```tsx
{/* Search + view toggle row */}
<div className="flex items-center gap-4 flex-wrap">
  <div className="relative">
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search subject or centre…"
      className="rounded-xl border-2 border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none w-full max-w-xs"
    />
  </div>

  <div className="ml-auto flex bg-gray-100 rounded-xl p-1 gap-0.5">
    <button
      onClick={() => onViewChange("calendar")}
      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
        currentView === "calendar" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-gray-800"
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Calendar
    </button>
    <button
      onClick={() => onViewChange("list")}
      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
        currentView === "list" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-gray-800"
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
      List
    </button>
  </div>
</div>
```

- [ ] **Step 4: Update page.tsx**

1. Change the `ViewSelector` import — remove the default import, keep the named type:
```tsx
import { ViewType } from "@/components/ViewSelector";
```

2. Remove `<ViewSelector currentView={currentView} onViewChange={setCurrentView} />` from the JSX.

3. Pass the new props to the `<Filters>` in the main content:
```tsx
currentView={currentView}
onViewChange={setCurrentView}
```

4. Update the sticky filter wrapper classes (the `md:static sticky top-0` div):
```tsx
<div className="md:static sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Filters.tsx src/components/Filters.test.tsx src/app/page.tsx && git commit -m "feat(ui): move view toggle into Filters bar, update sticky wrapper styling"
```

---

## Task 5: Filters — summary row

**Files:** Modify `src/components/Filters.tsx`, `src/components/Filters.test.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Write failing tests**

Add `totalCount: 0` to `baseProps` in `Filters.test.tsx`, and add 4 new tests at the bottom of the `describe` block:

Update `baseProps`:
```tsx
const baseProps = {
  // ...all existing fields...
  totalCount: 0,
};
```

Add tests:
```tsx
it("shows summary row with count when filters are active", () => {
  render(
    <Filters
      {...baseProps}
      streams={["JC"]}
      filters={{ ...defaultFilters, stream: "JC" }}
      totalCount={5}
    />
  );
  expect(screen.getByText("5")).toBeInTheDocument();
  expect(screen.getByText(/classes/i)).toBeInTheDocument();
});

it("shows a chip for the active stream filter", () => {
  render(
    <Filters
      {...baseProps}
      streams={["JC"]}
      filters={{ ...defaultFilters, stream: "JC" }}
      totalCount={3}
    />
  );
  // "JC" appears as stream button AND as chip in summary row
  expect(screen.getAllByText("JC").length).toBeGreaterThanOrEqual(2);
});

it("calls onFilterChange to reset all when Clear all is clicked", async () => {
  const user = userEvent.setup();
  const onFilterChange = jest.fn();
  render(
    <Filters
      {...baseProps}
      streams={["JC"]}
      filters={{ ...defaultFilters, stream: "JC" }}
      onFilterChange={onFilterChange}
      totalCount={3}
    />
  );
  await user.click(screen.getByText("Clear all"));
  expect(onFilterChange).toHaveBeenCalledWith({
    subject: [], centre: [], tutor: [], level: [], stream: null,
  });
});

it("does not show summary row when no filters are active", () => {
  render(<Filters {...baseProps} totalCount={0} />);
  expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --testPathPattern=Filters --no-coverage 2>&1 | tail -15
```
Expected: TypeScript error — `totalCount` prop missing

- [ ] **Step 3: Add totalCount and summary row to Filters.tsx**

Add to `FiltersProps`:
```tsx
totalCount: number;
```

Add to function signature:
```tsx
export default function Filters({
  // ...all previous params...
  totalCount,
}: FiltersProps) {
```

Add the summary row at the very bottom of the returned JSX, after the Subject/Centre grid div:

```tsx
{/* Summary row — visible when any filter is active */}
{(filters.stream !== null ||
  filters.level.length > 0 ||
  filters.subject.length > 0 ||
  filters.centre.length > 0) && (
  <div className="flex flex-wrap items-center gap-2 pt-1">
    <span className="text-sm text-gray-600">
      <span className="font-bold text-blue-700">{totalCount}</span> classes
    </span>

    {filters.stream && (
      <button
        onClick={() => setFilter("stream", null)}
        className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:border-red-300 transition-colors"
      >
        {filters.stream} <span className="text-gray-400 ml-0.5">×</span>
      </button>
    )}
    {filters.level.map((l) => (
      <button
        key={l}
        onClick={() => setFilter("level", filters.level.filter((x) => x !== l))}
        className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:border-red-300 transition-colors"
      >
        {l} <span className="text-gray-400 ml-0.5">×</span>
      </button>
    ))}
    {filters.subject.map((s) => (
      <button
        key={s}
        onClick={() => setFilter("subject", filters.subject.filter((x) => x !== s))}
        className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:border-red-300 transition-colors"
      >
        {s} <span className="text-gray-400 ml-0.5">×</span>
      </button>
    ))}
    {filters.centre.map((c) => (
      <button
        key={c}
        onClick={() => setFilter("centre", filters.centre.filter((x) => x !== c))}
        className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 hover:border-red-300 transition-colors"
      >
        {c} <span className="text-gray-400 ml-0.5">×</span>
      </button>
    ))}

    <button
      onClick={() => onFilterChange({ subject: [], centre: [], tutor: [], level: [], stream: null })}
      className="text-xs text-gray-400 hover:text-red-500 font-semibold ml-2 transition-colors"
    >
      Clear all
    </button>
  </div>
)}
```

- [ ] **Step 4: Update page.tsx**

Pass `totalCount` to the `<Filters>` in the main content:
```tsx
totalCount={events.length}
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Filters.tsx src/components/Filters.test.tsx src/app/page.tsx && git commit -m "feat(ui): add filter summary row with count, chips, and clear all"
```

---

## Task 6: WeeklyClassCalendar — export getSubjectColor

**Files:** Modify `src/components/WeeklyClassCalendar.tsx`, `src/components/ListView.test.tsx`

- [ ] **Step 1: Update ListView.test.tsx mock first**

In `src/components/ListView.test.tsx`, update the mock for `./WeeklyClassCalendar` to export `getSubjectColor`:

```tsx
jest.mock("./WeeklyClassCalendar", () => ({
  isSlotFull: (slot: { title: string }) => slot.title.startsWith("[FULL]"),
  getSubjectColor: () => "#9ca3af",
}));
```

- [ ] **Step 2: Run tests to confirm still green**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass (mock updated, ListView doesn't import getSubjectColor yet so nothing breaks)

- [ ] **Step 3: Export getSubjectColor from WeeklyClassCalendar.tsx**

In `src/components/WeeklyClassCalendar.tsx`, add this export after the `primarySubjectToColorMap` declaration and before the `subjectToColor` function declaration:

```typescript
export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).backgroundColor;
}
```

(`subjectToColor` is a `function` declaration so it is hoisted — this order is safe.)

- [ ] **Step 4: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx src/components/ListView.test.tsx && git commit -m "feat(ui): export getSubjectColor helper from WeeklyClassCalendar"
```

---

## Task 7: ListView — card redesign

**Files:** Modify `src/components/ListView.tsx`, `src/components/ListView.test.tsx`

- [ ] **Step 1: Write failing tests**

In `src/components/ListView.test.tsx`, update the full-slot text assertion and add 2 new tests:

Replace:
```tsx
it("shows full message and hides action buttons for full slots", () => {
  render(<ListView sessions={[makeSlot({ title: "[FULL] Math class" })]} />);
  expect(screen.getByText(/This class is currently full/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Sign up for FREE Trial/i })).not.toBeInTheDocument();
});
```

With:
```tsx
it("shows full message and hides action buttons for full slots", () => {
  render(<ListView sessions={[makeSlot({ title: "[FULL] Math class" })]} />);
  expect(screen.getByText(/Class Full/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Sign up for FREE Trial/i })).not.toBeInTheDocument();
});
```

Add after the last existing test:
```tsx
it("renders tutor initial in the avatar and tutor name", () => {
  render(<ListView sessions={[makeSlot({ tutor: "Alice" })]} />);
  expect(screen.getByText("A")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
});

it("renders day header with a class count badge", () => {
  render(
    <ListView
      sessions={[
        makeSlot({ day: 1 }),
        makeSlot({ day: 1, subjects: ["English"] }),
      ]}
    />
  );
  expect(screen.getByText("2 classes")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --testPathPattern=ListView --no-coverage 2>&1 | tail -15
```
Expected: FAIL — "Class Full" not found, "A" not found, "2 classes" not found

- [ ] **Step 3: Rewrite ListView.tsx**

Replace the entire contents of `src/components/ListView.tsx` with:

```tsx
"use client";

import { WeeklyClassSlot, isSlotFull, getSubjectColor } from "./WeeklyClassCalendar";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

export default function ListView({ sessions }: { sessions: WeeklyClassSlot[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No classes found matching your criteria</div>
        <p className="text-gray-400">Try adjusting your filters to see more classes</p>
      </div>
    );
  }

  const sessionsByDay = sessions.reduce((acc, session) => {
    const adjustedDay = session.day === 0 ? 7 : session.day;
    if (!acc[adjustedDay]) acc[adjustedDay] = [];
    acc[adjustedDay].push(session);
    return acc;
  }, {} as Record<number, WeeklyClassSlot[]>);

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sortedDays = Object.keys(sessionsByDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {sortedDays.map((day) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-blue-200 pb-2">
            <h3 className="text-xl font-extrabold text-gray-800">{dayNames[day]}</h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {sessionsByDay[day].length} classes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsByDay[day]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session, index) => {
                const full = isSlotFull(session);
                const accentColor = getSubjectColor(session.subjects[0], session.level);
                return (
                  <div
                    key={`${session.startTime}-${session.tutor}-${session.centre}-${session.day}-${index}`}
                    className={`rounded-xl overflow-hidden shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 ${
                      full ? "bg-gray-50 border-gray-300 opacity-60" : "bg-white border-gray-200"
                    }`}
                  >
                    {/* Accent bar */}
                    <div className="h-1 w-full" style={{ background: accentColor }} />

                    <div className="p-5 flex flex-col space-y-3">
                      {/* Header: subject + level pill */}
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-lg text-gray-800">
                          {session.subjects.join(" + ")}
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-200 ml-2 flex-shrink-0">
                          {session.level}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-700">{session.startTime} – {session.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-600">{session.centre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: accentColor }}
                          >
                            {session.tutor.charAt(0)}
                          </div>
                          <span className="text-gray-600">{session.tutor}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-gray-100">
                        {full ? (
                          <div className="w-full bg-gray-200 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm text-center">
                            Class Full
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <a
                              href={replacePromocodeInUrl(replaceCampaignInUrl(session.prefillTrialLink))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <button className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-xs py-2 px-3 rounded-lg transition-all duration-200">
                                Sign up for FREE Trial
                              </button>
                            </a>
                            <a
                              href={replacePromocodeInUrl(replaceCampaignInUrl(
                                session.prefillRegistrationLink ?? getFallbackRegistrationLinkByLevel(session.level)
                              ))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-all duration-200">
                                Register now
                              </button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/ListView.tsx src/components/ListView.test.tsx && git commit -m "feat(ui): redesign ListView cards — accent bar, tutor avatar, equal-weight buttons, day count badge"
```

---

## Task 8: WeeklyClassCalendar — modal redesign

**Files:** Modify `src/components/WeeklyClassCalendar.tsx`

> ⚠️ No automated test is practical here — the Dialog opens on FullCalendar event click which cannot be simulated in Jest without full FullCalendar mocking. Manual verification required.

- [ ] **Step 1: Replace the Dialog block in WeeklyClassCalendar.tsx**

Locate the `<Dialog open={isDialogOpen} ...>` block (starts around line 452). Replace the entire `<DialogPanel>` content. The outer `<Dialog>` and `<div className="fixed inset-0 ...">` wrapper stay; only `<DialogPanel>` changes:

```tsx
<DialogPanel className="max-w-sm w-full bg-white rounded-2xl shadow-2xl relative overflow-hidden border-0">
  {/* Hero header band */}
  {selectedEvent && (
    <div
      className="px-5 pt-5 pb-4 relative"
      style={{
        backgroundColor:
          subjectToColor(selectedEvent.level, selectedEvent.subjects[0]).backgroundColor + "33",
      }}
    >
      <button
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-colors focus:outline-none"
        onClick={() => setIsDialogOpen(false)}
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 pr-10">
        {selectedEvent.stream} · {selectedEvent.level}
      </div>
      <DialogTitle className="text-2xl font-extrabold text-gray-900 mb-1">
        {selectedEvent.subjects.join(" + ")}
      </DialogTitle>
      <div className="text-sm text-gray-500">
        {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedEvent.day]}
        {" · "}{selectedEvent.startTime} – {selectedEvent.endTime}
        {" · "}{selectedEvent.centre}
      </div>
    </div>
  )}

  {/* Info tiles + CTAs */}
  {selectedEvent && (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Time</div>
          <div className="font-bold text-gray-800 text-sm">
            {selectedEvent.startTime} – {selectedEvent.endTime}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Venue</div>
          <div className="font-bold text-gray-800 text-sm">{selectedEvent.centre}</div>
        </div>
      </div>

      {isSlotFull(selectedEvent) ? (
        <div className="w-full bg-gray-100 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm text-center">
          This class is currently full
        </div>
      ) : (
        <div className="flex gap-2.5">
          {selectedEvent.prefillTrialLink && (
            <a
              href={replacePromocodeInUrl(replaceCampaignInUrl(selectedEvent.prefillTrialLink))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => console.log("form_click_prefilled")}
              className="flex-1"
            >
              <button className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-lg transition-all duration-200">
                Sign up for FREE Trial
              </button>
            </a>
          )}
          <a
            href={replacePromocodeInUrl(replaceCampaignInUrl(
              selectedEvent.prefillRegistrationLink ??
                getFallbackRegistrationLinkByLevel(selectedEvent.level ?? "Unknown")
            ))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-all duration-200">
              Register now
            </button>
          </a>
        </div>
      )}
    </div>
  )}
</DialogPanel>
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass (WeeklyClassCalendar has no Jest test suite)

- [ ] **Step 3: Manual verification**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn dev
```

Open http://localhost:3000. Select any stream filter, click a calendar event. Verify:
- Modal has tinted hero background (subject colour at ~20% opacity)
- Stream · Level eyebrow text visible
- Subject name large and bold
- Day · Time · Centre subtitle
- Time + Venue info tiles in 2-column grid
- Close button is circular with shadow (not plain ×)
- Both buttons are filled (amber trial, blue register), equal visual weight

- [ ] **Step 4: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx && git commit -m "feat(ui): redesign WeeklyClassCalendar modal — tinted hero, info tiles, new CTA buttons"
```

---

## Task 9: BottomNav — Filter tab + page.tsx filter sheet

**Files:** Modify `src/components/BottomNav.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Rewrite BottomNav.tsx**

Replace the entire contents of `src/components/BottomNav.tsx` with:

```tsx
"use client";

import { ViewType } from "./ViewSelector";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenFilter: () => void;
}

export default function BottomNav({ currentView, onViewChange, onOpenFilter }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Calendar tab */}
        <button
          onClick={() => onViewChange("calendar")}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "calendar" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {currentView === "calendar" && (
            <span className="absolute top-0 inset-x-[25%] h-0.5 bg-blue-600 rounded-b-full" />
          )}
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${currentView === "calendar" ? "scale-110" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={currentView === "calendar" ? 2.5 : 2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-xs ${currentView === "calendar" ? "font-semibold" : "font-medium"}`}>
            Calendar
          </span>
        </button>

        {/* List tab */}
        <button
          onClick={() => onViewChange("list")}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "list" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {currentView === "list" && (
            <span className="absolute top-0 inset-x-[25%] h-0.5 bg-blue-600 rounded-b-full" />
          )}
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${currentView === "list" ? "scale-110" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={currentView === "list" ? 2.5 : 2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className={`text-xs ${currentView === "list" ? "font-semibold" : "font-medium"}`}>
            List
          </span>
        </button>

        {/* Filter tab */}
        <button
          onClick={onOpenFilter}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-gray-500 transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-xs font-medium">Filter</span>
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update page.tsx**

Add `filterSheetOpen` state (after `filtersCollapsed`):
```tsx
const [filterSheetOpen, setFilterSheetOpen] = useState(false);
```

Update the `<BottomNav>` render to pass the new prop:
```tsx
<BottomNav
  currentView={currentView}
  onViewChange={setCurrentView}
  onOpenFilter={() => setFilterSheetOpen(true)}
/>
```

Add the filter sheet overlay immediately after `<BottomNav ... />`, before the closing `</div>` of the outermost `min-h-screen` div:

```tsx
{/* Mobile filter sheet */}
{filterSheetOpen && (
  <div
    className="fixed inset-0 z-50 md:hidden bg-black/40"
    onClick={() => setFilterSheetOpen(false)}
  >
    <div
      className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>
        <button
          onClick={() => setFilterSheetOpen(false)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close filter sheet"
        >
          ✕
        </button>
      </div>
      <div className="px-4 pb-8">
        <Filters
          streams={["JC", "Secondary (Express)", "Secondary (IP)", "Primary"]}
          levels={filteredOptions.levels}
          subjects={filteredOptions.subjects}
          centres={filteredOptions.centres}
          tutors={filteredOptions.tutors}
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentView={currentView}
          onViewChange={setCurrentView}
          totalCount={events.length}
        />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn test --no-coverage 2>&1 | tail -10
```
Expected: all pass

- [ ] **Step 4: Run build**

```bash
cd /Users/bryansim/Documents/zenith/zenith-lesson-calendar && yarn build 2>&1 | tail -10
```
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomNav.tsx src/app/page.tsx && git commit -m "feat(ui): add Filter tab to BottomNav with active indicator, add mobile filter sheet"
```

---

## Spec Coverage

| Spec section | Task |
|---|---|
| 1. globals.css tokens + hero-gradient | Task 1 ✓ |
| 2. SignupBanner eyebrow pill (existing text kept) | Task 2 ✓ |
| 3a. Sticky filter wrapper restyle | Task 4 ✓ |
| 3b. Search input + state + filter logic | Task 3 ✓ |
| 3c. View toggle absorbed into Filters | Task 4 ✓ |
| 3d. Summary row (count + chips + clear all) | Task 5 ✓ |
| 4a. Day headers with count pill | Task 7 ✓ |
| 4b. Card redesign — accent bar, icons, tutor avatar, equal-weight buttons | Task 7 ✓ |
| 4c. Card hover transition | Task 7 ✓ |
| 5. Modal redesign (in WeeklyClassCalendar, not CalendarView) | Task 8 ✓ |
| 6. BottomNav Filter tab + active indicator | Task 9 ✓ |
| 6. Mobile filter sheet | Task 9 ✓ |

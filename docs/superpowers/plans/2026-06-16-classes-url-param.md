# `?classes=` Curated Deep-Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `?classes=<id,id,...>` URL param that pins the regular-lessons schedule to exactly those `classSlotId`s ("pinned mode"), with a colored exit banner that returns to the normal site.

**Architecture:** Pure helpers (`parseClassesParam`, `matchPinnedSlots`) do the parsing/matching; `page.tsx` derives `pinnedSlots`/`isPinned`, short-circuits the `events` memo, swaps the filter header for a `PinnedBanner` + `ViewToggle`, and exposes an exit handler. `BottomNav` hides its Filter tab in pinned mode.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript, Tailwind, Jest 30 + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-16-classes-url-param-design.md` (11 acceptance criteria).

---

## Commit policy (IMPORTANT)

The user requires **test files stay uncommitted until they review them**. For every
task below: write tests (TDD), use them to drive the implementation, but in the
commit step **`git add` only the non-test files**. Leave `*.test.ts`/`*.test.tsx`
in the working tree uncommitted. Task 8 is the test-review gate.

## File Structure

- Create `src/utils/pinnedClasses.ts` — pure helpers `parseClassesParam`, `matchPinnedSlots`.
- Create `src/utils/pinnedClasses.test.ts` — unit tests for the helpers.
- Create `src/components/PinnedBanner.tsx` — the colored exit banner.
- Create `src/components/PinnedBanner.test.tsx` — banner tests.
- Create `src/components/ViewToggle.tsx` — Calendar/List toggle, reused in the pinned header.
- Create `src/components/ViewToggle.test.tsx` — toggle test.
- Modify `src/components/WeeklyClassCalendar.tsx` — add `classSlotId?: string` to `WeeklyClassSlot`.
- Modify `src/components/BottomNav.tsx` — add `showFilterButton?: boolean`.
- Modify `src/app/page.tsx` — wire pinned mode end-to-end.
- Create `src/app/page.test.tsx` — integration tests for pinned mode + exit.

---

## Task 1: `parseClassesParam` helper

**Files:**
- Create: `src/utils/pinnedClasses.ts`
- Test: `src/utils/pinnedClasses.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/pinnedClasses.test.ts`:

```ts
import { parseClassesParam } from "./pinnedClasses";

describe("parseClassesParam", () => {
  it("returns [] when classes param is absent", () => {
    expect(parseClassesParam("?view=list")).toEqual([]);
  });

  it("returns [] for an empty string search", () => {
    expect(parseClassesParam("")).toEqual([]);
  });

  it("returns [] when classes is present but empty", () => {
    expect(parseClassesParam("?classes=")).toEqual([]);
  });

  it("splits a comma-separated list", () => {
    expect(parseClassesParam("?classes=2026-Class0001,2026-Class0002")).toEqual([
      "2026-Class0001",
      "2026-Class0002",
    ]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parseClassesParam("?classes=2026-Class0001 , ,2026-Class0002,")).toEqual([
      "2026-Class0001",
      "2026-Class0002",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/pinnedClasses.test.ts`
Expected: FAIL — "Cannot find module './pinnedClasses'" or "parseClassesParam is not a function".

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/pinnedClasses.ts`:

```ts
/**
 * Parse the `classes` query param into a list of requested class codes.
 * Splits on comma, trims each, drops empties. Returns [] when absent/empty.
 */
export function parseClassesParam(search: string): string[] {
  const raw = new URLSearchParams(search).get("classes");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/pinnedClasses.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (implementation only)**

```bash
git add src/utils/pinnedClasses.ts
git commit -m "feat(schedule): add parseClassesParam helper for ?classes= deep-link"
```

(Leave `src/utils/pinnedClasses.test.ts` uncommitted — test-review gate is Task 8.)

---

## Task 2: `matchPinnedSlots` helper

**Files:**
- Modify: `src/utils/pinnedClasses.ts`
- Test: `src/utils/pinnedClasses.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/utils/pinnedClasses.test.ts`:

```ts
import { matchPinnedSlots } from "./pinnedClasses";

const slot = (classSlotId: string) => ({ classSlotId, title: classSlotId });

describe("matchPinnedSlots", () => {
  const slots = [slot("2026-Class0001"), slot("2026-Class0002"), slot("2026-Class0003")];

  it("returns [] when no ids requested", () => {
    expect(matchPinnedSlots(slots, [])).toEqual([]);
  });

  it("returns only the slots whose classSlotId is requested", () => {
    const result = matchPinnedSlots(slots, ["2026-Class0001", "2026-Class0003"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches case-insensitively", () => {
    const result = matchPinnedSlots(slots, ["2026-class0002"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0002"]);
  });

  it("drops unknown ids, keeping only known matches", () => {
    const result = matchPinnedSlots(slots, ["2026-Class0001", "DOES-NOT-EXIST"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001"]);
  });

  it("returns [] when none of the ids match", () => {
    expect(matchPinnedSlots(slots, ["NOPE"])).toEqual([]);
  });

  it("ignores slots without a classSlotId", () => {
    const mixed = [{ title: "no id" } as { classSlotId?: string; title: string }, slot("2026-Class0001")];
    const result = matchPinnedSlots(mixed, ["2026-Class0001"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/pinnedClasses.test.ts`
Expected: FAIL — "matchPinnedSlots is not a function".

- [ ] **Step 3: Write minimal implementation**

Append to `src/utils/pinnedClasses.ts`:

```ts
/**
 * Filter `slots` down to those whose `classSlotId` is in `pinnedIds`
 * (case-insensitive). Returns [] when no ids are requested. Preserves the
 * order of `slots`. Slots without a classSlotId never match.
 */
export function matchPinnedSlots<T extends { classSlotId?: string }>(
  slots: T[],
  pinnedIds: string[],
): T[] {
  if (pinnedIds.length === 0) return [];
  const wanted = new Set(pinnedIds.map((id) => id.toLowerCase()));
  return slots.filter((s) => s.classSlotId != null && wanted.has(s.classSlotId.toLowerCase()));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/pinnedClasses.test.ts`
Expected: PASS (all parseClassesParam + matchPinnedSlots tests).

- [ ] **Step 5: Commit (implementation only)**

```bash
git add src/utils/pinnedClasses.ts
git commit -m "feat(schedule): add matchPinnedSlots helper (case-insensitive classSlotId match)"
```

---

## Task 3: Add `classSlotId` to `WeeklyClassSlot` type

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (the `export type WeeklyClassSlot = {...}` block, ~line 80)

This is an additive type change so `page.tsx` can read `slot.classSlotId` without a TS error. The field already arrives at runtime (the fetch spreads the raw API row). No behavior change, so there is no new unit test — it is verified by the type-check/build in Step 3.

- [ ] **Step 1: Make the edit**

In `src/components/WeeklyClassCalendar.tsx`, change the type:

```ts
export type WeeklyClassSlot = {
  classSlotId?: string;
  title: string;
  day: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "12:00"
  subjects: string[];
  tutor: string;
  centre: string;
  stream: string;
  level: string;
  prefillTrialLink: string;
  prefillRegistrationLink?: string;
};
```

- [ ] **Step 2: Verify type-check and existing tests still pass**

Run: `npx tsc --noEmit && npm test -- src/components/WeeklyClassCalendar.test.ts`

Expected: tsc exits 0 (no type errors); WeeklyClassCalendar tests PASS unchanged
(`classSlotId` is optional, so existing `makeSlot` factories that omit it still compile).

- [ ] **Step 3: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat(schedule): add optional classSlotId to WeeklyClassSlot type"
```

---

## Task 4: `PinnedBanner` component

**Files:**
- Create: `src/components/PinnedBanner.tsx`
- Test: `src/components/PinnedBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/PinnedBanner.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import PinnedBanner from "./PinnedBanner";

describe("PinnedBanner", () => {
  it("shows the count with pluralized 'classes'", () => {
    render(<PinnedBanner count={2} onShowAll={() => {}} />);
    expect(screen.getByText(/2 selected classes/i)).toBeInTheDocument();
  });

  it("uses singular 'class' when count is 1", () => {
    render(<PinnedBanner count={1} onShowAll={() => {}} />);
    expect(screen.getByText(/1 selected class\b/i)).toBeInTheDocument();
  });

  it("calls onShowAll when the button is clicked", () => {
    const onShowAll = jest.fn();
    render(<PinnedBanner count={3} onShowAll={onShowAll} />);
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/PinnedBanner.test.tsx`
Expected: FAIL — "Cannot find module './PinnedBanner'".

- [ ] **Step 3: Write minimal implementation**

Create `src/components/PinnedBanner.tsx`:

```tsx
"use client";

export default function PinnedBanner({
  count,
  onShowAll,
}: {
  count: number;
  onShowAll: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] italic font-bold"
        >
          i
        </span>
        You&apos;re viewing {count} selected {count === 1 ? "class" : "classes"}
      </span>
      <button
        onClick={onShowAll}
        className="underline font-bold whitespace-nowrap hover:opacity-90"
      >
        Show all classes →
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/PinnedBanner.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit (implementation only)**

```bash
git add src/components/PinnedBanner.tsx
git commit -m "feat(schedule): add PinnedBanner exit banner for pinned mode"
```

---

## Task 5: `BottomNav` `showFilterButton` prop

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Test: `src/components/BottomNav.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `src/components/BottomNav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import BottomNav from "./BottomNav";

const baseProps = {
  currentView: "calendar" as const,
  onViewChange: () => {},
  onOpenFilter: () => {},
};

describe("BottomNav", () => {
  it("shows the Filter tab by default", () => {
    render(<BottomNav {...baseProps} />);
    expect(screen.getByText("Filter")).toBeInTheDocument();
  });

  it("hides the Filter tab when showFilterButton is false", () => {
    render(<BottomNav {...baseProps} showFilterButton={false} />);
    expect(screen.queryByText("Filter")).not.toBeInTheDocument();
    // view toggle remains
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/BottomNav.test.tsx`
Expected: FAIL — the second test fails because the Filter tab always renders today.

- [ ] **Step 3: Write minimal implementation**

In `src/components/BottomNav.tsx`, update the interface and the Filter tab.

Change the interface:

```tsx
interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenFilter: () => void;
  hasActiveFilters?: boolean;
  showFilterButton?: boolean;
}

export default function BottomNav({ currentView, onViewChange, onOpenFilter, hasActiveFilters, showFilterButton = true }: BottomNavProps) {
```

Wrap the existing `{/* Filter tab */}` `<button>...</button>` block in a conditional:

```tsx
        {/* Filter tab */}
        {showFilterButton && (
        <button
          onClick={onOpenFilter}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-gray-500 transition-all duration-200"
        >
          <div className="relative">
            <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border-2 border-white" />
            )}
          </div>
          <span className="text-xs font-medium">Filter</span>
        </button>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/BottomNav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit (implementation only)**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat(schedule): add showFilterButton prop to BottomNav"
```

---

## Task 6: `ViewToggle` component

A small Calendar/List toggle for the pinned-mode desktop header (desktop has no
`BottomNav`). The existing header keeps its own inline toggle untouched.

**Files:**
- Create: `src/components/ViewToggle.tsx`
- Test: `src/components/ViewToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ViewToggle.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ViewToggle from "./ViewToggle";

describe("ViewToggle", () => {
  it("renders Calendar and List buttons", () => {
    render(<ViewToggle currentView="calendar" onViewChange={() => {}} />);
    expect(screen.getByRole("button", { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list/i })).toBeInTheDocument();
  });

  it("calls onViewChange('list') when List is clicked", () => {
    const onViewChange = jest.fn();
    render(<ViewToggle currentView="calendar" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("button", { name: /list/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ViewToggle.test.tsx`
Expected: FAIL — "Cannot find module './ViewToggle'".

- [ ] **Step 3: Write minimal implementation**

Create `src/components/ViewToggle.tsx`:

```tsx
"use client";

type ViewType = "calendar" | "list";

export default function ViewToggle({
  currentView,
  onViewChange,
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
      <button
        onClick={() => onViewChange("calendar")}
        className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          currentView === "calendar" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Calendar
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          currentView === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        List
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ViewToggle.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit (implementation only)**

```bash
git add src/components/ViewToggle.tsx
git commit -m "feat(schedule): add ViewToggle component for pinned-mode header"
```

---

## Task 7: Wire pinned mode into `page.tsx` + integration tests

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/app/page.test.tsx` (create)

### Step 1: Write the failing integration test

Create `src/app/page.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page from "./page";

// FullCalendar renders nothing in jsdom; assert via the List view instead.
jest.mock("@fullcalendar/react", () => ({ __esModule: true, default: () => null }));
jest.mock("@fullcalendar/timegrid", () => ({}));
jest.mock("@fullcalendar/scrollgrid", () => ({}));
// next/image needs a plain <img/> in jsdom (used by SignupBanner).
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, jsx-a11y/alt-text
  default: (props: any) => <img {...props} />,
}));

const SLOTS = [
  {
    classSlotId: "2026-Class0001",
    title: "JC Physics A",
    day: 6, startTime: "16:00", endTime: "18:00",
    subjects: ["Physics"], tutor: "T1", centre: "Tampines", stream: "H2", level: "J2",
    prefillTrialLink: "https://forms/trial?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg?campaign=SCHEDULE&promocode=PROMOCODE",
  },
  {
    classSlotId: "2026-Class0002",
    title: "JC Econ B",
    day: 4, startTime: "17:00", endTime: "19:00",
    subjects: ["Economics"], tutor: "T2", centre: "Jurong East", stream: "H2", level: "J1",
    prefillTrialLink: "https://forms/trial2?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg2?campaign=SCHEDULE&promocode=PROMOCODE",
  },
  {
    classSlotId: "2026-Class0003",
    title: "Sec Math C",
    day: 1, startTime: "10:00", endTime: "12:00",
    subjects: ["Mathematics"], tutor: "T3", centre: "Bishan", stream: "EXP", level: "Secondary 3",
    prefillTrialLink: "https://forms/trial3?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg3?campaign=SCHEDULE&promocode=PROMOCODE",
  },
];

function setUrl(search: string) {
  window.history.replaceState({}, "", search);
}

beforeEach(() => {
  localStorage.clear();
  setUrl("/");
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
  ) as unknown as typeof fetch;
});

describe("pinned mode (?classes=)", () => {
  // NOTE: ListView renders `session.subjects.join(" + ")` as the visible label
  // (NOT `session.title`), so assertions target the subject text.
  it("shows exactly the pinned classes, hiding the rest (AC 1)", async () => {
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    render(<Page />);
    expect(await screen.findByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("Economics")).toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("ignores extra filter params; still shows only the pinned set (AC 2)", async () => {
    // stream=JC would normally surface BOTH JC classes (Physics + Econ); pinned wins.
    setUrl("/?classes=2026-Class0001&stream=JC&view=list");
    render(<Page />);
    expect(await screen.findByText("Physics")).toBeInTheDocument();
    expect(screen.queryByText("Economics")).not.toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("matches classSlotId case-insensitively (AC 8)", async () => {
    setUrl("/?classes=2026-class0001&view=list");
    render(<Page />);
    expect(await screen.findByText("Physics")).toBeInTheDocument();
  });

  it("shows the exit banner with the displayed count (AC 9)", async () => {
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    render(<Page />);
    expect(await screen.findByText(/2 selected classes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument();
  });

  it("preserves campaign & promocode params in the rendered links (AC 4, 5)", async () => {
    setUrl("/?classes=2026-Class0001&campaign=PROMO1&promocode=XYZ&view=list");
    const { container } = render(<Page />);
    await screen.findByText("Physics");
    // campaign SCHEDULE -> PROMO1, promocode placeholder -> XYZ
    expect(container.querySelector('a[href*="campaign=PROMO1"]')).not.toBeNull();
    expect(container.querySelector('a[href*="promocode=XYZ"]')).not.toBeNull();
  });

  it("falls back to the normal empty-state when no code matches (AC 6)", async () => {
    setUrl("/?classes=NOPE&view=list");
    render(<Page />);
    expect(await screen.findByText(/select a stream to see classes/i)).toBeInTheDocument();
    expect(screen.queryByText(/selected class/i)).not.toBeInTheDocument();
  });

  it("exits to the normal empty-state and strips classes, keeping campaign (AC 10, 11)", async () => {
    setUrl("/?classes=2026-Class0001&campaign=PROMO1&view=list");
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: /show all classes/i }));
    await waitFor(() =>
      expect(screen.getByText(/select a stream to see classes/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("Physics")).not.toBeInTheDocument();
    expect(window.location.search).not.toContain("classes");
    expect(window.location.search).toContain("campaign=PROMO1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/page.test.tsx`
Expected: FAIL — pinned behavior not implemented yet (pinned classes not isolated, no banner).

### Step 3: Implement the wiring in `src/app/page.tsx`

- [ ] **3a. Add imports** near the top (after the existing component imports):

```tsx
import PinnedBanner from "@/components/PinnedBanner";
import ViewToggle from "@/components/ViewToggle";
import { parseClassesParam, matchPinnedSlots } from "@/utils/pinnedClasses";
```

- [ ] **3b. Add pinned state** next to the other `useState` calls (after the `filters` state):

```tsx
  const [pinnedClassIds, setPinnedClassIds] = useState<string[]>([]);
```

- [ ] **3c. Populate it in the mount effect.** In the `useEffect(() => { ... }, [])`
that reads filters from the URL, add this line right after `setFilters(initialFilters);`:

```tsx
    setPinnedClassIds(parseClassesParam(window.location.search));
```

- [ ] **3d. Derive `pinnedSlots` / `isPinned`.** Add directly above the `events` memo
(after the `streamOptions` memo):

```tsx
  const pinnedSlots = useMemo(
    () => matchPinnedSlots(weeklyClassData, pinnedClassIds),
    [weeklyClassData, pinnedClassIds],
  );
  const isPinned = pinnedSlots.length > 0;
```

- [ ] **3e. Short-circuit the `events` memo.** Replace the existing `events` memo with:

```tsx
  const events = useMemo(() => {
    if (isPinned) {
      return pinnedSlots.map((s) => ({ ...s }));
    }
    if (
      filters.stream === null &&
      filters.level.length === 0 &&
      filters.subject.length === 0 &&
      filters.centre.length === 0
    ) {
      return [];
    }
    const filtered = weeklyClassData.filter((s) => {
      return (
        levelToFilterMapper(filters.stream, s.level, s.stream) &&
        (filters.level.length === 0 || filters.level.includes(s.level)) &&
        (filters.subject.length === 0 ||
          s.subjects.some((subj) => filters.subject.includes(subj))) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
      );
    });
    return filtered.map((s) => ({ ...s }));
  }, [weeklyClassData, filters, isPinned, pinnedSlots]);
```

- [ ] **3f. Add the exit handler.** Add next to `handleFilterChange`:

```tsx
  const handleExitPinned = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("classes");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    setPinnedClassIds([]);
    setFilters({ subject: [], centre: [], tutor: [], level: [], stream: null });
  };
```

- [ ] **3g. Render the pinned header.** Find the desktop sticky header block that
begins `{!isLoading && !isMobilePhone && (` and add `&& !isPinned` to its guard:

```tsx
      {!isLoading && !isMobilePhone && !isPinned && (
```

Then, immediately **before** that block, add the pinned-mode header (banner on all
viewports + a desktop-only `ViewToggle`):

```tsx
      {!isLoading && isPinned && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <PinnedBanner count={events.length} onShowAll={handleExitPinned} />
          {!isMobilePhone && (
            <div className="max-w-7xl mx-auto px-4 py-2 md:px-8 md:py-3 flex justify-end">
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>
          )}
        </div>
      )}
```

- [ ] **3h. Hide the mobile Filter tab in pinned mode.** Find the `<BottomNav ... />`
usage and add the prop:

```tsx
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenFilter={() => setFilterSheetOpen(true)}
          hasActiveFilters={hasActiveFilters}
          showFilterButton={!isPinned}
        />
```

- [ ] **Step 4: Run the integration test to verify it passes**

Run: `npm test -- src/app/page.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Run the full suite + lint + type-check**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: all tests PASS, lint clean, tsc exits 0.

- [ ] **Step 6: Commit (implementation only)**

```bash
git add src/app/page.tsx
git commit -m "feat(schedule): pin schedule to ?classes= subset with exit banner"
```

---

## Task 8: Test-review gate, build, and acceptance verification

- [ ] **Step 1: Full green check**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`
Expected: all tests PASS, lint clean, tsc exits 0, static export builds without error.

- [ ] **Step 2: Manual smoke test (dev server)**

```bash
npm run dev
```

Then visit, replacing the ids with two real `classSlotId`s from
`https://api.schedule.myzenithstudy.com/schedule?year=2026`:
- `http://localhost:3000/?classes=<id1>,<id2>` → only those two classes; blue banner with "2 selected classes".
- Click **Show all classes →** → banner gone, filter bar back, "select a stream" empty-state, URL no longer has `classes`.
- `http://localhost:3000/?classes=<id1>,<id2>&view=list` → list view honored.
- `http://localhost:3000/?classes=garbage` → normal site (no banner).

Stop the dev server when done.

- [ ] **Step 3: Present the uncommitted test files to the user for review**

List the still-uncommitted test files:

```bash
git status --porcelain
```

Expected uncommitted (new) files:
- `src/utils/pinnedClasses.test.ts`
- `src/components/PinnedBanner.test.tsx`
- `src/components/BottomNav.test.tsx`
- `src/components/ViewToggle.test.tsx`
- `src/app/page.test.tsx`

Show them to the user and wait for approval **before** committing.

- [ ] **Step 4: Commit the tests once approved**

```bash
git add src/utils/pinnedClasses.test.ts src/components/PinnedBanner.test.tsx \
  src/components/BottomNav.test.tsx src/components/ViewToggle.test.tsx src/app/page.test.tsx
git commit -m "test(schedule): cover ?classes= pinned mode + exit banner"
```

---

## Acceptance criteria coverage map

| AC | Covered by |
|----|------------|
| 1 Exact subset | Task 2 (`matchPinnedSlots`), Task 7 page test "shows exactly the pinned classes" |
| 2 Filter params ignored | Task 7 page test "ignores extra filter params" |
| 3 view=list honored | Task 7 (all tests use `view=list`); Task 8 manual |
| 4 campaign applies | Task 7 page test "preserves campaign & promocode" |
| 5 promocode applies | Task 7 page test "preserves campaign & promocode" |
| 6 no match → normal | Task 7 page test "falls back to the normal empty-state" |
| 7 mixed known/unknown | Task 2 `matchPinnedSlots` "drops unknown ids" |
| 8 case-insensitive | Task 2 + Task 7 "matches classSlotId case-insensitively" |
| 9 exit banner shown | Task 4 PinnedBanner tests + Task 7 "shows the exit banner" |
| 10 exit → normal site | Task 7 "exits to the normal empty-state and strips classes" |
| 11 durable across refresh | Task 7 (classes stripped from URL) + Task 8 manual reload |

## Post-implementation (handled by the main agent, not subagents)

After all tasks pass and tests are approved/committed: push the branch to
`regular-lessons-staging`, monitor the Cloudflare Pages deploy to green, and return
the staging preview URL for the user to verify before any prod merge.
(Per project rules: never touch the prod branch / env without explicit approval.)

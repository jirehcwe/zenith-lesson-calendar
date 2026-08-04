# `?tutor=` deep-link and `AllSec` stream — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `?tutor=<code>` deep-link that pins the schedule to one or more tutors' classes, and a `?stream=AllSec` param that selects Secondary Express and IP together.

**Architecture:** Both are frontend-only. The existing `?classes=` pin is generalised from "a list of class IDs" into a `PinRequest` union that is either kind, and pinned mode becomes derived from the URL rather than from the match count — which is what makes a "this link matched nothing" state reachable. `AllSec` is a fifth `stream` value whose chip is injected into the filter bar only while it is selected.

**Tech Stack:** Next.js 15 (App Router, static export), React 19, TypeScript strict, Tailwind 4, Jest 30 + React Testing Library.

**Spec:** [`docs/superpowers/specs/2026-07-28-tutor-link-and-allsec-design.md`](../specs/2026-07-28-tutor-link-and-allsec-design.md)

## Global Constraints

- **Package manager is Yarn 4.9.2 via Corepack.** Never run `npm install`.
- **No API change.** Do not touch `CACHE_VERSION`, the fetch shape, or anything in telebot. Both features read fields the API already returns (`tutor`, `stream`, `level`).
- **Chip label is exactly `Secondary (All)`.** The internal stream value is exactly `AllSec` — the label lives only in `streamLabel()`.
- **Banner copy is exact.** `You're viewing Alicia's classes` / `You're viewing classes taught by Alicia and DJ` / `You're viewing 2 selected classes` / `We couldn't find any classes for this link.`
- **Tutor matching is exact after case-folding, never by prefix.** Live data contains both `Phoebe` and `Phebe`, and both `Joshua` and `Joshua Teo`.
- **Commit source files only.** Per the standing preference recorded in the `?classes=` spec, *new and edited test files stay uncommitted until the user reviews them.* Every commit step below lists exact paths — never use `git add -A` or `git add .`.
- **TypeScript strict mode.** No `any` without an eslint-disable comment carrying a reason.
- Verify with `yarn test` and `yarn lint` before each commit.

---

### Task 1: Generalise the pin module

Creates the pure logic as a new module. Nothing imports it yet, so the app keeps building and every existing test keeps passing. The old `pinnedClasses.ts` is deleted in Task 2, when its last consumer goes away.

**Files:**
- Create: `src/utils/pinnedSlots.ts`
- Test: `src/utils/pinnedSlots.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PinRequest`, `parsePinRequest(search: string): PinRequest`, `matchPinnedSlots<T extends Pinnable>(slots: T[], req: PinRequest): T[]`, `describePin(req: PinRequest, matched: Pinnable[]): string`. Task 2 consumes all four.

- [ ] **Step 1: Write the failing test**

Create `src/utils/pinnedSlots.test.ts`:

```ts
import { parsePinRequest, matchPinnedSlots, describePin } from "./pinnedSlots";

describe("parsePinRequest", () => {
  it("returns kind 'none' when neither param is present", () => {
    expect(parsePinRequest("?view=list")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' for an empty search string", () => {
    expect(parsePinRequest("")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' when classes is present but empty", () => {
    expect(parsePinRequest("?classes=")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' when tutor is present but yields no entries", () => {
    expect(parsePinRequest("?tutor= , ,")).toEqual({ kind: "none" });
  });

  it("parses a classes list", () => {
    expect(parsePinRequest("?classes=2026-Class0001,2026-Class0002")).toEqual({
      kind: "classes",
      ids: ["2026-Class0001", "2026-Class0002"],
    });
  });

  it("parses a tutor list", () => {
    expect(parsePinRequest("?tutor=Alicia,DJ")).toEqual({
      kind: "tutor",
      codes: ["Alicia", "DJ"],
    });
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parsePinRequest("?tutor=Alicia , ,DJ,")).toEqual({
      kind: "tutor",
      codes: ["Alicia", "DJ"],
    });
  });

  it("decodes an encoded multi-word tutor code", () => {
    expect(parsePinRequest("?tutor=Dr.%20Han%20Wei")).toEqual({
      kind: "tutor",
      codes: ["Dr. Han Wei"],
    });
  });

  it("lets classes win when both params are present", () => {
    expect(parsePinRequest("?classes=2026-Class0001&tutor=Alicia")).toEqual({
      kind: "classes",
      ids: ["2026-Class0001"],
    });
  });
});

const slot = (classSlotId: string, tutor: string) => ({ classSlotId, tutor });

describe("matchPinnedSlots", () => {
  const slots = [
    slot("2026-Class0001", "Alicia"),
    slot("2026-Class0002", "DJ"),
    slot("2026-Class0003", "Alicia"),
    slot("2026-Class0004", "Joshua Teo"),
    slot("2026-Class0005", "Joshua"),
  ];

  it("returns [] for kind 'none'", () => {
    expect(matchPinnedSlots(slots, { kind: "none" })).toEqual([]);
  });

  it("matches classes by classSlotId, preserving input order", () => {
    const result = matchPinnedSlots(slots, {
      kind: "classes",
      ids: ["2026-Class0003", "2026-Class0001"],
    });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches classes case-insensitively", () => {
    const result = matchPinnedSlots(slots, { kind: "classes", ids: ["2026-class0002"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0002"]);
  });

  it("matches every slot for a tutor", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches the union for several tutors", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia", "DJ"] });
    expect(result.map((s) => s.classSlotId)).toEqual([
      "2026-Class0001",
      "2026-Class0002",
      "2026-Class0003",
    ]);
  });

  it("matches tutors case-insensitively", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["alicia"] });
    expect(result).toHaveLength(2);
  });

  it("matches tutor codes exactly, never by prefix", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Joshua"] });
    expect(result.map((s) => s.tutor)).toEqual(["Joshua"]);
  });

  it("drops unknown entries, keeping known matches", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia", "NOBODY"] });
    expect(result).toHaveLength(2);
  });

  it("returns [] when nothing matches", () => {
    expect(matchPinnedSlots(slots, { kind: "tutor", codes: ["Phebee"] })).toEqual([]);
  });

  it("ignores slots missing the matched field", () => {
    const mixed = [{ tutor: "Alicia" }, slot("2026-Class0001", "Alicia")];
    const result = matchPinnedSlots(mixed, { kind: "classes", ids: ["2026-Class0001"] });
    expect(result).toHaveLength(1);
  });
});

describe("describePin", () => {
  const matched = (...tutors: string[]) => tutors.map((tutor) => ({ tutor }));

  it("reports a dead link when nothing matched", () => {
    expect(describePin({ kind: "tutor", codes: ["Phebee"] }, [])).toBe(
      "We couldn't find any classes for this link.",
    );
  });

  it("reports a dead classes link when nothing matched", () => {
    expect(describePin({ kind: "classes", ids: ["NOPE"] }, [])).toBe(
      "We couldn't find any classes for this link.",
    );
  });

  it("names a single tutor", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia"] }, matched("Alicia", "Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("uses the canonical casing from the data, not the URL", () => {
    expect(describePin({ kind: "tutor", codes: ["alicia"] }, matched("Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("joins two tutors with 'and'", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia", "DJ"] }, matched("Alicia", "DJ"))).toBe(
      "You're viewing classes taught by Alicia and DJ",
    );
  });

  it("joins three tutors with commas and a final 'and'", () => {
    const result = describePin(
      { kind: "tutor", codes: ["Alicia", "DJ", "Gwen"] },
      matched("Alicia", "DJ", "Gwen"),
    );
    expect(result).toBe("You're viewing classes taught by Alicia, DJ and Gwen");
  });

  it("names only tutors that actually matched", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia", "NOBODY"] }, matched("Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("counts classes for a classes pin", () => {
    expect(describePin({ kind: "classes", ids: ["a", "b"] }, matched("X", "Y"))).toBe(
      "You're viewing 2 selected classes",
    );
  });

  it("uses the singular for a single class", () => {
    expect(describePin({ kind: "classes", ids: ["a"] }, matched("X"))).toBe(
      "You're viewing 1 selected class",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/pinnedSlots.test.ts`
Expected: FAIL — `Cannot find module './pinnedSlots'`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/pinnedSlots.ts`:

```ts
/**
 * A pin request is what the URL *asked for*, independent of whether anything
 * matched. Pinned mode is derived from this — NOT from the number of matched
 * slots — so a link whose codes match nothing announces itself as broken
 * instead of silently rendering the ordinary homepage. This deliberately
 * reverses AC 6 of the 2026-06-16 `?classes=` design.
 */
export type PinRequest =
  | { kind: "none" }
  | { kind: "classes"; ids: string[] }
  | { kind: "tutor"; codes: string[] };

/** Slots carry `tutor` always and `classSlotId` optionally. */
type Pinnable = { classSlotId?: string; tutor?: string };

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse `?classes=` / `?tutor=` into a PinRequest. `classes` wins when both are
 * present — arbitrary, but it has to be decided rather than left emergent. A
 * param that is present but yields no usable entries (`?tutor=,`) counts as
 * absent.
 */
export function parsePinRequest(search: string): PinRequest {
  const params = new URLSearchParams(search);

  const ids = parseList(params.get("classes"));
  if (ids.length > 0) return { kind: "classes", ids };

  const codes = parseList(params.get("tutor"));
  if (codes.length > 0) return { kind: "tutor", codes };

  return { kind: "none" };
}

/**
 * Filter `slots` to those the request asks for, preserving input order.
 *
 * Matching is case-insensitive and EXACT — never by prefix or substring. The
 * live schedule contains both `Phoebe` and `Phebe`, and both `Joshua` and
 * `Joshua Teo`; a prefix match would silently show the wrong person's timetable.
 */
export function matchPinnedSlots<T extends Pinnable>(slots: T[], req: PinRequest): T[] {
  if (req.kind === "none") return [];

  const wanted = new Set(
    (req.kind === "classes" ? req.ids : req.codes).map((s) => s.toLowerCase()),
  );
  const field = req.kind === "classes" ? "classSlotId" : "tutor";

  return slots.filter((s) => {
    const value = s[field];
    return value != null && wanted.has(value.toLowerCase());
  });
}

/** "A" · "A and B" · "A, B and C" */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Copy for the pinned header. `matched` is the slots actually being rendered,
 * so tutor names come out in the data's canonical casing rather than however
 * the link happened to spell them, and unmatched codes are never named.
 */
export function describePin(req: PinRequest, matched: Pinnable[]): string {
  if (matched.length === 0) return "We couldn't find any classes for this link.";

  if (req.kind === "tutor") {
    const names = [...new Set(matched.map((s) => s.tutor).filter((t): t is string => t != null))];
    if (names.length === 1) return `You're viewing ${names[0]}'s classes`;
    return `You're viewing classes taught by ${joinNames(names)}`;
  }

  return `You're viewing ${matched.length} selected ${matched.length === 1 ? "class" : "classes"}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/utils/pinnedSlots.test.ts`
Expected: PASS, 28 tests.

- [ ] **Step 5: Verify nothing else broke**

Run: `yarn test && yarn lint`
Expected: the full suite passes (the old `pinnedClasses.ts` is still in place and still used by `page.tsx`).

- [ ] **Step 6: Commit the source file only**

```bash
git add src/utils/pinnedSlots.ts
git commit -m "feat(pin): generalise the pin into a PinRequest union

Adds parsePinRequest / matchPinnedSlots / describePin, covering both the
existing ?classes= pin and a new ?tutor= pin. Not wired up yet.

Tutor matching is exact after case-folding: the live schedule contains both
Phoebe and Phebe, and both Joshua and Joshua Teo."
```

The test file stays uncommitted for review.

---

### Task 2: Wire the tutor pin into the page

Switches `page.tsx` onto the new module, makes pinned mode URL-derived, and gives the banner its message. Deletes the old module once its last consumer is gone.

**Files:**
- Modify: `src/components/PinnedBanner.tsx`
- Modify: `src/components/ListView.tsx:8` (empty-state suppression)
- Modify: `src/app/page.tsx` (imports, pin state, `events`, exit handler, banner, view props)
- Delete: `src/utils/pinnedClasses.ts`, `src/utils/pinnedClasses.test.ts`
- Test: `src/components/PinnedBanner.test.tsx`, `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `PinRequest`, `parsePinRequest`, `matchPinnedSlots`, `describePin` from Task 1.
- Produces: `PinnedBanner` now takes `{ message: string; onShowAll: () => void }`. `ListView` takes an optional `suppressEmptyState?: boolean`.

**Why `ListView` changes:** when a pin matches nothing, both views currently render *"Select a stream to see classes"* with an **Open filters** button — but pinned mode hides the filter bar and the mobile Filter tab, so that prompt points at controls that are not there. The calendar already gates its prompt behind `!hasActiveFilters` (`WeeklyClassCalendar.tsx:410`), so passing `hasActiveFilters || isPinned` suppresses it; `ListView` has no such gate and needs the new prop. Without this, AC 5 and AC 6 ("not the homepage") cannot pass.

- [ ] **Step 1: Write the failing banner test**

Replace the body of `src/components/PinnedBanner.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import PinnedBanner from "./PinnedBanner";

describe("PinnedBanner", () => {
  it("renders the message it is given", () => {
    render(<PinnedBanner message="You're viewing Alicia's classes" onShowAll={() => {}} />);
    expect(screen.getByText("You're viewing Alicia's classes")).toBeInTheDocument();
  });

  it("renders a multi-tutor message", () => {
    render(
      <PinnedBanner message="You're viewing classes taught by Alicia and DJ" onShowAll={() => {}} />,
    );
    expect(screen.getByText(/taught by Alicia and DJ/)).toBeInTheDocument();
  });

  it("renders the dead-link message", () => {
    render(
      <PinnedBanner message="We couldn't find any classes for this link." onShowAll={() => {}} />,
    );
    expect(screen.getByText(/couldn't find any classes/i)).toBeInTheDocument();
  });

  it("still offers the escape hatch when the link is dead", () => {
    const onShowAll = jest.fn();
    render(
      <PinnedBanner message="We couldn't find any classes for this link." onShowAll={onShowAll} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test src/components/PinnedBanner.test.tsx`
Expected: FAIL — the component still expects `count`, so the message text never renders.

- [ ] **Step 3: Update `PinnedBanner`**

In `src/components/PinnedBanner.tsx`, change the signature and the rendered span. Keep all styling exactly as-is:

```tsx
"use client";

export default function PinnedBanner({
  message,
  onShowAll,
}: {
  message: string;
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
        {message}
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

- [ ] **Step 4: Run the banner test to verify it passes**

Run: `yarn test src/components/PinnedBanner.test.tsx`
Expected: PASS, 4 tests. `yarn test src/app/page.test.tsx` will now FAIL to compile — expected; Step 6 fixes it.

- [ ] **Step 5: Add the `ListView` empty-state gate**

In `src/components/ListView.tsx`, change the signature on line 8 and guard the empty block:

```tsx
export default function ListView({
  sessions,
  onEmptyStateClick,
  suppressEmptyState = false,
}: {
  sessions: WeeklyClassSlot[];
  onEmptyStateClick?: () => void;
  suppressEmptyState?: boolean;
}) {
  if (sessions.length === 0) {
    // In pinned mode the filter bar and the mobile Filter tab are hidden, so
    // "Select a stream" / "Open filters" would point at controls that are not
    // on screen. The pinned banner carries the explanation instead.
    if (suppressEmptyState) return null;
    return (
```

Everything below that line is unchanged.

- [ ] **Step 6: Rewire `page.tsx`**

Six edits.

**(a)** Replace the pin import (line 16):

```tsx
import {
  parsePinRequest,
  matchPinnedSlots,
  describePin,
  type PinRequest,
} from "@/utils/pinnedSlots";
```

**(b)** Replace the pin state declaration (line 125), and add a load-failure flag beside it:

```tsx
  const [pinRequest, setPinRequest] = useState<PinRequest>({ kind: "none" });
  // Distinguishes "the schedule never arrived" from "your link matched nothing".
  // Without it, a network/CORS failure on a perfectly valid link tells the user
  // their link is broken — see the banner message in (f).
  const [loadFailed, setLoadFailed] = useState(false);
```

In the mount effect's `.catch` (line 182), set the flag alongside the existing log:

```tsx
      .catch((error) => {
        console.error("Error fetching schedule data:", error);
        setLoadFailed(true);
        setIsLoading(false);
      });
```

**(c)** In the mount effect, replace the `setPinnedClassIds(...)` call (line 146):

```tsx
    setPinRequest(parsePinRequest(window.location.search));
```

**(d)** Replace the `pinnedSlots` / `isPinned` memo block (lines 352-355):

```tsx
  const pinnedSlots = useMemo(
    () => matchPinnedSlots(weeklyClassData, pinRequest),
    [weeklyClassData, pinRequest],
  );
  // Derived from the URL, not the match count, so a link that matches nothing
  // still enters pinned mode and can report itself as broken.
  const isPinned = pinRequest.kind !== "none";
```

**(e)** Replace `handleExitPinned` (lines 402-413):

```tsx
  const handleExitPinned = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("classes");
    params.delete("tutor");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    setPinRequest({ kind: "none" });
    setFilters({ subject: [], centre: [], tutor: [], level: [], stream: null });
  };
```

**(f)** Pass the message to the banner, and suppress the misleading empty states. In the pinned header block, replace the `<PinnedBanner .../>` line:

```tsx
          <PinnedBanner
            message={
              loadFailed
                ? "We couldn't load the schedule. Please try again."
                : describePin(pinRequest, pinnedSlots)
            }
            onShowAll={handleExitPinned}
          />
```

Pinned mode is now derived from the URL, so it stays active even when the fetch fails — and `describePin` sees zero matched slots and blames the link. A valid `?tutor=Alicia` link would read "We couldn't find any classes for this link." after a network or CORS failure, which is a false statement the old match-count-derived behaviour never produced. `loadFailed` is what keeps the dead-link copy honest.

On `<WeeklyClassCalendar>`, change the `hasActiveFilters` prop:

```tsx
                  hasActiveFilters={hasActiveFilters || isPinned}
```

On `<ListView>`, add the new prop:

```tsx
                  suppressEmptyState={isPinned}
```

- [ ] **Step 7: Update the page tests**

In `src/app/page.test.tsx`, add `tutor` values that support the new cases. The existing `SLOTS` fixture already gives `T1`, `T2`, `T3` — reuse them rather than editing the shared array, so existing assertions keep their counts.

Rewrite the AC 6 test (currently `falls back to the normal empty-state when no code matches`) and append the new ones inside the existing `describe("pinned mode (?classes=)")` block:

```tsx
  it("reports a dead classes link instead of the homepage (AC 6)", async () => {
    setUrl("/?classes=NOPE");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't find any classes for this link/i)).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).queryByText(/select a stream/i)).not.toBeInTheDocument();
  });

  it("shows exactly one tutor's classes (AC 1)", async () => {
    setUrl("/?tutor=T1");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(within(listRegion(container)).getByText("Physics")).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).queryByText("Economics")).not.toBeInTheDocument();
  });

  it("matches tutor codes case-insensitively (AC 2)", async () => {
    setUrl("/?tutor=t1");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(within(listRegion(container)).getByText("Physics")).toBeInTheDocument(),
    );
  });

  it("shows the union for several tutors (AC 4)", async () => {
    setUrl("/?tutor=T1,T2");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(within(listRegion(container)).getByText("Physics")).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).getByText("Economics")).toBeInTheDocument();
  });

  it("names the tutor in the banner (AC 9)", async () => {
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
  });

  it("reports a dead tutor link instead of the homepage (AC 5)", async () => {
    setUrl("/?tutor=NoSuchTutor");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't find any classes for this link/i)).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).queryByText(/select a stream/i)).not.toBeInTheDocument();
  });

  it("ignores stale filter params alongside a tutor pin (AC 10)", async () => {
    setUrl("/?tutor=T1&stream=JC&level=S3");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(within(listRegion(container)).getByText("Physics")).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("lets classes win when both pin params are present (AC 8)", async () => {
    setUrl("/?classes=2026-Class0002&tutor=T1");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(within(listRegion(container)).getByText("Economics")).toBeInTheDocument(),
    );
    expect(within(listRegion(container)).queryByText("Physics")).not.toBeInTheDocument();
  });

  it("does not blame the link when the schedule fails to load", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't load the schedule/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
  });

  it("strips both pin params on exit (AC 12)", async () => {
    setUrl("/?tutor=T1&campaign=SCHEDULE1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    await waitFor(() => expect(window.location.search).not.toContain("tutor="));
    expect(window.location.search).not.toContain("classes=");
    expect(window.location.search).toContain("campaign=SCHEDULE1");
  });
```

- [ ] **Step 8: Delete the superseded module**

```bash
git rm src/utils/pinnedClasses.ts src/utils/pinnedClasses.test.ts
```

- [ ] **Step 9: Run the full suite**

Run: `yarn test && yarn lint`
Expected: all pass. If any existing `?classes=` test fails, read it before changing it — only the all-unknown case (old AC 6) is meant to change behaviour.

- [ ] **Step 10: Commit source files only**

```bash
git add src/app/page.tsx src/components/PinnedBanner.tsx src/components/ListView.tsx
git add -u src/utils/pinnedClasses.ts src/utils/pinnedClasses.test.ts
git commit -m "feat(schedule): pin the schedule to a tutor via ?tutor=

?tutor=Alicia (or ?tutor=Alicia,DJ) pins the view to those tutors' classes,
reusing the ?classes= locked view. Keyed on the tutor field the API already
sends, which is telebot's unique Tutor.formNameCode.

Pinned mode is now derived from the URL rather than the match count, so a link
matching nothing says so instead of silently rendering the homepage. This
reverses AC 6 of the 2026-06-16 ?classes= design. Both views' 'Select a stream'
prompt is suppressed while pinned, since it points at controls pinned mode
hides."
```

---

### Task 3: Remove the dead `filters.tutor` state

`?tutor=` now has a real owner. The vestigial filter state must go, or one param has two owners with different lifetimes — and the filter one gets wiped whenever the stream changes.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Filters.tsx`
- Test: `src/components/Filters.test.tsx`, `src/app/page.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `FiltersProps` loses its `tutors` field and its `filters.tutor` field. Any call site passing them stops compiling — that is the point.

- [ ] **Step 1: Strip it from `page.tsx`**

- In the `filters` state initialiser (line 118-124), delete the `tutor: [] as string[],` line.
- In the mount effect's `initialFilters` (line 141), delete the `tutor:` line.
- In the filter→URL sync effect, delete `params.delete("tutor");` (line 195) and the whole `if (filters.tutor.length > 0) { ... }` block (lines 206-208).
- In `filteredOptions`, delete the `allTutors` binding (line 254), the `field === "tutor"` branch of `getResultCount` (lines 265-266), the entire `tutorsWithCounts` block (lines 320-332), and `tutors: tutorsWithCounts,` from the returned object.
- In `handleFilterChange`, delete `tutor: [],` from the reset object.
- In `handleExitPinned` and the "clear all" reset, change `setFilters({ subject: [], centre: [], tutor: [], level: [], stream: null })` to `setFilters({ subject: [], centre: [], level: [], stream: null })`.
- At both `<Filters ... />` call sites (the desktop bar and the mobile sheet), delete the `tutors={filteredOptions.tutors}` prop.

- [ ] **Step 2: Strip it from `Filters.tsx`**

- In `FiltersProps`, delete `tutors: OptionWithCount[];` and the `tutor: string[];` line inside `filters`.
- In the component signature, delete the `tutors,` destructure **and** the now-pointless `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comment directly above it.
- In both "Clear all" handlers, change `onFilterChange({ subject: [], centre: [], tutor: [], level: [], stream: null })` to `onFilterChange({ subject: [], centre: [], level: [], stream: null })`.

- [ ] **Step 3: Update the tests**

In `src/components/Filters.test.tsx`: delete `tutors: [] as OptionWithCount[],` from the default props (line 14), and remove `tutor: [],` from the two filter objects (lines 7 and 135).

In `src/app/page.test.tsx`: run `grep -n "tutor: \[\]" src/app/page.test.tsx` and delete each hit. Those are filter-state objects. The `SLOTS` fixture keeps its `tutor: "T1"` values — that is slot data, not filter state, and Task 2's tests depend on it.

- [ ] **Step 4: Run the suite**

Run: `yarn test && yarn lint`
Expected: PASS. TypeScript will point at any call site still passing `tutors`.

- [ ] **Step 5: Commit source files only**

```bash
git add src/app/page.tsx src/components/Filters.tsx
git commit -m "refactor(filters): drop the vestigial tutor filter state

filters.tutor was parsed from the URL and written back, but never applied in
the events pipeline, and Filters rendered no tutor control -- ?tutor=Alicia
showed an empty calendar. Now that ?tutor= drives the pin, leaving this in
place would give one param two owners, and the filter one is wiped whenever
the stream changes."
```

---

### Task 4: The `AllSec` stream

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Filters.tsx` (`streamLabel`)
- Modify: `src/utils/subjectColors.ts` (`getLegendItemsForStream`)
- Test: `src/app/page.test.tsx`, `src/utils/subjectColors.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the stream value `"AllSec"`, held in a module-local `ALL_SEC` constant in `page.tsx`. Do **not** export it — an App Router page file should expose only its default export, and the tests assert the literal string anyway.

- [ ] **Step 1: Write the failing tests**

Append to `src/app/page.test.tsx` a new top-level `describe`. It overrides `fetch` locally so the shared `SLOTS` fixture — and every assertion that counts it — is untouched:

```tsx
describe("AllSec stream (?stream=AllSec)", () => {
  const SEC_SLOTS = [
    {
      classSlotId: "2026-Class1001",
      title: "Sec Express Math",
      day: 1, startTime: "10:00", endTime: "12:00",
      subjects: ["Mathematics"], tutor: "T1", centre: "Bishan",
      stream: "EXP", level: "Secondary 3",
      prefillTrialLink: "https://forms/t1", prefillRegistrationLink: "https://forms/r1",
    },
    {
      classSlotId: "2026-Class1002",
      title: "Sec IP Chemistry",
      day: 2, startTime: "10:00", endTime: "12:00",
      subjects: ["Chemistry"], tutor: "T2", centre: "Bishan",
      stream: "IP", level: "Secondary 3",
      prefillTrialLink: "https://forms/t2", prefillRegistrationLink: "https://forms/r2",
    },
    {
      classSlotId: "2026-Class1003",
      title: "JC Physics",
      day: 3, startTime: "10:00", endTime: "12:00",
      subjects: ["Physics"], tutor: "T3", centre: "Bishan",
      stream: "H2", level: "J1",
      prefillTrialLink: "https://forms/t3", prefillRegistrationLink: "https://forms/r3",
    },
    {
      classSlotId: "2026-Class1004",
      title: "Primary Science",
      day: 4, startTime: "10:00", endTime: "12:00",
      subjects: ["Science"], tutor: "T4", centre: "Bishan",
      stream: "", level: "Primary 5",
      prefillTrialLink: "https://forms/t4", prefillRegistrationLink: "https://forms/r4",
    },
    {
      // A second Secondary level, so the S1-S4 union is observable.
      classSlotId: "2026-Class1005",
      title: "Sec 1 English",
      day: 5, startTime: "10:00", endTime: "12:00",
      subjects: ["English"], tutor: "T5", centre: "Bishan",
      stream: "EXP", level: "Secondary 1",
      prefillTrialLink: "https://forms/t5", prefillRegistrationLink: "https://forms/r5",
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SEC_SLOTS }) }),
    ) as unknown as typeof fetch;
  });

  // Mirrors the helper the ?classes= describe block already uses: it returns a
  // `within(...)` queries object, so call it as `listRegion(container).getByText`
  // — do NOT wrap it in `within(...)` again.
  const listRegion = (container: HTMLElement) => {
    const card = Array.from(
      container.querySelectorAll<HTMLElement>("div.modern-card"),
    ).find((el) => !el.className.includes("hidden"));
    if (!card) throw new Error("visible list region not found");
    return within(card);
  };

  // NOTE: every test that scopes to `listRegion` must request `&view=list`. In
  // the default calendar view the list wrapper's className is the bare string
  // "hidden" with no `modern-card` class, so the helper finds nothing.

  it("shows Express and IP together (AC 1)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Chemistry")).toBeInTheDocument();
  });

  it("excludes JC and Primary (AC 2)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
    expect(listRegion(container).queryByText("Science")).not.toBeInTheDocument();
  });

  it("shows the Secondary (All) chip while selected (AC 3)", async () => {
    setUrl("/?stream=AllSec");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getAllByText("Secondary (All)").length).toBeGreaterThan(0),
    );
  });

  it("hides the chip for an ordinary visitor (AC 4)", async () => {
    setUrl("/");
    render(<Page />);
    await waitFor(() => expect(screen.getAllByText("JC").length).toBeGreaterThan(0));
    expect(screen.queryByText("Secondary (All)")).not.toBeInTheDocument();
  });

  it("accepts a lowercase param (AC 6)", async () => {
    setUrl("/?stream=allsec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(screen.getAllByText("Secondary (All)").length).toBeGreaterThan(0);
  });

  it("offers every Secondary level, not just one track's (AC 5)", async () => {
    // Levels are normalised to short codes ("Secondary 1" -> "S1") before they
    // reach the filter, so narrowing AllSec to S1 proves S1 is addressable
    // under it — i.e. the level options are the S1-S4 union, not EXP-only.
    setUrl("/?stream=AllSec&level=S1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("English")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
    expect(listRegion(container).queryByText("Chemistry")).not.toBeInTheDocument();
  });

  it("clears the stream and hides the chip when deselected (AC 7)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(screen.getAllByText("Secondary (All)").length).toBeGreaterThan(0),
    );
    fireEvent.click(screen.getAllByText("Secondary (All)")[0].closest("button")!);
    await waitFor(() =>
      expect(screen.queryByText("Secondary (All)")).not.toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
  });
});
```

Append to `src/utils/subjectColors.test.ts`:

```ts
describe("AllSec colours", () => {
  it("uses the Secondary palette for the empty-calendar legend (AC 9)", () => {
    const allSec = getLegendItemsForStream("AllSec").map((s) => s.label);
    const secExpress = getLegendItemsForStream("Secondary (Express)").map((s) => s.label);
    expect(allSec).toEqual(secExpress);
  });

  it("colours Secondary blocks from the Secondary palette regardless of track (AC 8)", () => {
    // Guards the level-based colour axis. AllSec mixes EXP and IP in one view,
    // so a future refactor keying colour off `stream` would silently split the
    // palette in two — this fails if that ever happens.
    expect(getSubjectColor("Mathematics", "S3")).toBe(SEC.math.color);
    expect(getSubjectColor("Chemistry", "S3")).toBe(SEC.chemistry.color);
  });
});
```

Make sure `getLegendItemsForStream`, `getSubjectColor`, and `SEC` are all in that file's import list.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test src/app/page.test.tsx src/utils/subjectColors.test.ts`
Expected: FAIL — no `AllSec` case, so the stream filters nothing out and no chip renders.

- [ ] **Step 3: Add the stream to `page.tsx`**

Add the constant just above `levelToFilterMapper` (line 84):

```tsx
// Link-only stream selecting every Secondary level regardless of track. Kept as
// the literal URL value so it round-trips without a bidirectional mapping; the
// display label lives in Filters' streamLabel().
const ALL_SEC = "AllSec";

// The AllSec deep-link is case-insensitive; every other stream passes through.
function normaliseStreamParam(raw: string | null): string | null {
  if (!raw) return null;
  return raw.toLowerCase() === ALL_SEC.toLowerCase() ? ALL_SEC : raw;
}
```

Add the case to `levelToFilterMapper`, directly after the `"Secondary (IP)"` case:

```tsx
    case ALL_SEC:
      // Deliberately level-based rather than EXP||IP: a Secondary slot with a
      // blank stream should surface here rather than vanish from every
      // Secondary view. No such rows exist today (325 EXP + 38 IP = 363 = the
      // exact Secondary row count).
      return level.startsWith("S");
```

In the mount effect's `initialFilters`, replace the `stream` line:

```tsx
      stream: normaliseStreamParam(params.get("stream")),
```

Replace the `streamOptions` memo (lines 344-350):

```tsx
  const streamOptions = useMemo(() => {
    // AllSec is link-only: its chip exists solely while it is the selected
    // stream, so ordinary visitors still see the usual four.
    const values: string[] = [...STREAM_VALUES];
    if (filters.stream === ALL_SEC) values.push(ALL_SEC);
    return values.map((stream) => ({
      value: stream,
      count: weeklyClassData.filter((s) => levelToFilterMapper(stream, s.level, s.stream)).length,
      selected: filters.stream === stream,
    }));
  }, [weeklyClassData, filters.stream]);
```

- [ ] **Step 4: Add the label in `Filters.tsx`**

In `streamLabel`, add before the final `return stream;`:

```tsx
  if (stream === "AllSec") return "Secondary (All)";
```

Deliberately the long form, not the `Sec …` abbreviation used by its siblings: this chip is reached by link, so its typical viewer has never seen the filter bar.

- [ ] **Step 5: Add the legend case in `subjectColors.ts`**

In `getLegendItemsForStream`, widen the Secondary branch:

```ts
  if (stream?.startsWith("Secondary") || stream === "AllSec") {
    return [...paletteToItems(SEC), FULL_SWATCH];
  }
```

Only reached when no slots are rendered — once slots exist the legend is derived per-slot from `level`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn test src/app/page.test.tsx src/utils/subjectColors.test.ts`
Expected: PASS.

- [ ] **Step 7: Run the full suite**

Run: `yarn test && yarn lint && yarn build`
Expected: all pass. `yarn build` is the static-export check — run it here because this is the last task.

- [ ] **Step 8: Commit source files only**

```bash
git add src/app/page.tsx src/components/Filters.tsx src/utils/subjectColors.ts
git commit -m "feat(filters): add the AllSec stream for Secondary Express + IP

?stream=AllSec selects every Secondary level regardless of track, surfaced as
a fifth 'Secondary (All)' chip that appears only while it is the selected
stream. Matching is level-based so a blank-stream Secondary row would surface
here rather than vanish from every Secondary view.

Block colours already key off level, so only the empty-calendar legend needed
an explicit case."
```

---

## Final review gate

- [ ] Show the user every uncommitted test file — `src/utils/pinnedSlots.test.ts`, `src/components/PinnedBanner.test.tsx`, `src/components/Filters.test.tsx`, `src/app/page.test.tsx`, `src/utils/subjectColors.test.ts` — per the standing preference that tests are reviewed before they are committed.
- [ ] After approval, commit them together.
- [ ] Update the spec's Status line to `Implemented`.
- [ ] Push and mark PR #25 ready for review against `regular-lessons-staging`.
- [ ] Run the spec's manual check table against the Cloudflare Pages preview build before anyone promotes to `regular-lessons`.

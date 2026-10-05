# 2027 Schedule Changeover (lesson-calendar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The public calendar reads the feed's calendar mode, says 2027, shows each slot's syllabus, and filters by school.

**Architecture:** The feed decides which year each platform shows, so the site drops its year logic. Two small pure modules hold the new rules: `scheduleYear.ts` and `syllabus.ts`. `page.tsx` wires them into the fetch, the filters and the three slot views.

**Tech Stack:** Next.js static export, React, TypeScript, Jest 30 with jsdom and React Testing Library.

**Spec:** `/Volumes/JirehExternal/Documents/zenith/telebot/.claude/worktrees/schedule-2027/docs/superpowers/specs/2026-10-05-schedule-2027-changeover-design.md` (section 7). Read it before you start.

## Global Constraints

- The site holds no flip dates. It never reads the browser clock to choose a year.
- The request is `GET <base>/schedule?view=calendar`. It carries no `year` param.
- Feed rows gain `track: string | null`. Old cached rows and old feed rows have no `track` field; treat a missing field as no track.
- The filter is named "Syllabus" in the UI and `syllabus` in the URL.
- `All Schools`, `NA` and a blank are never filter options.
- JC note text, exactly: `JC 2027 classes open on 1 Jan 2027`.
- Sign-up buttons stay in `src/components/SignupActions.tsx`. `signupButtons.guard.test.ts` must stay green.
- Package manager is yarn. Never run `npm install` or `yarn install` in this worktree; `node_modules` is a symlink to the main checkout.
- Tests: `yarn test <path>`. jsdom renders the phone layout by default; see the `setScreen` helper in `src/app/page.test.tsx`.
- Commit messages: conventional commits, and end each with these two trailer lines:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01XYkBdgrGJyMzi6zmXKb3jz`
- Work only in the worktree `/Volumes/JirehExternal/Documents/zenith/zenith-lesson-calendar/.claude/worktrees/schedule-2027`, on branch `jireh/feat/schedule-2027`. Do not push.
- Write code comments in short, plain sentences. This codebase has long comments; do not copy that length.

## Review Focus

1. A visitor with a version-4 cache from before the release: the page must fetch again, not show a year-keyed copy. (Task 2)
2. A feed row with no `track` field at all (the 2026 slots): no label, no filter option, no crash. (Tasks 1, 3, 4)
3. `?syllabus=` with a school that no slot names: the page loads and shows the stream's classes. (Task 4)
4. A school name that is a prefix of another (`RI`, `RJC`, `RVHS`): a pick matches whole names only. (Task 1)
5. A syllabus pick left over after the visitor changes stream: it must clear, or the list goes empty with no visible cause. (Task 4)

## File Structure

| File | Role |
|---|---|
| `src/utils/scheduleYear.ts` (new) | `SCHEDULE_YEAR`, `slotYear`, `showJcNextYearNote`. Pure. |
| `src/utils/syllabus.ts` (new) | Label, school split, match, options. Pure. |
| `src/components/WeeklyClassCalendar.tsx` | Type gains `track`; label on the block and the popup. |
| `src/components/ListView.tsx` | Label on the card. |
| `src/components/Filters.tsx` | "Syllabus" MultiSelect and its summary chips. |
| `src/app/page.tsx` | Fetch, cache, filter state, URL, JC note. |
| `src/app/layout.tsx`, `src/components/SignupBanner.tsx` | Year text. |

---

### Task 1: Pure rules for year and syllabus

**Files:**
- Create: `src/utils/scheduleYear.ts`, `src/utils/scheduleYear.test.ts`
- Create: `src/utils/syllabus.ts`, `src/utils/syllabus.test.ts`

**Interfaces:**
- Produces:
  - `SCHEDULE_YEAR: number` (2027)
  - `slotYear(classSlotId: string | undefined): number | null`
  - `showJcNextYearNote(stream: string | null, slots: { level: string; classSlotId?: string }[]): boolean`
  - `syllabusLabel(track: string | null | undefined): string | null`
  - `syllabusSchools(track: string | null | undefined): string[]`
  - `matchesSyllabus(track: string | null | undefined, picks: string[]): boolean`
  - `syllabusOptions(tracks: (string | null | undefined)[]): string[]`

- [ ] **Step 1: Write the failing tests**

`src/utils/scheduleYear.test.ts`:

```ts
import { SCHEDULE_YEAR, showJcNextYearNote, slotYear } from "./scheduleYear";

describe("slotYear", () => {
  it("reads the year prefix of a class slot id", () => {
    expect(slotYear("2026-Class0001")).toBe(2026);
    expect(slotYear("2027-Class0930")).toBe(2027);
  });

  it("returns null when there is no year prefix", () => {
    expect(slotYear(undefined)).toBeNull();
    expect(slotYear("")).toBeNull();
    expect(slotYear("Class0001")).toBeNull();
  });
});

describe("showJcNextYearNote", () => {
  const jc2026 = { level: "J2", classSlotId: "2026-Class0001" };
  const jc2027 = { level: "J2", classSlotId: "2027-Class0001" };
  const sec2026 = { level: "S4", classSlotId: "2026-Class0002" };

  it("shows when the JC stream is picked and JC still shows last year's slots", () => {
    expect(SCHEDULE_YEAR).toBe(2027);
    expect(showJcNextYearNote("JC", [jc2026, sec2026])).toBe(true);
  });

  it("hides once JC shows this schedule year's slots", () => {
    expect(showJcNextYearNote("JC", [jc2027])).toBe(false);
  });

  it("hides for every other stream, and for no stream", () => {
    for (const stream of ["Secondary Exp", "Secondary IP", "Primary", "AllSec", null]) {
      expect(showJcNextYearNote(stream, [jc2026, sec2026])).toBe(false);
    }
  });

  it("hides when there are no JC slots, and ignores a non-JC old slot", () => {
    expect(showJcNextYearNote("JC", [])).toBe(false);
    expect(showJcNextYearNote("JC", [sec2026])).toBe(false);
  });
});
```

`src/utils/syllabus.test.ts`:

```ts
import {
  matchesSyllabus,
  syllabusLabel,
  syllabusOptions,
  syllabusSchools,
} from "./syllabus";

describe("syllabusLabel", () => {
  it("shows the track as written", () => {
    expect(syllabusLabel("RGS Aligned")).toBe("RGS Aligned");
    expect(syllabusLabel("All Schools")).toBe("All Schools");
    expect(syllabusLabel("  TMJC Aligned ")).toBe("TMJC Aligned");
  });

  it("shows nothing for no track, a blank or NA", () => {
    for (const none of [undefined, null, "", "   ", "NA", "na", " N/A "]) {
      expect(syllabusLabel(none)).toBeNull();
    }
  });
});

describe("syllabusSchools", () => {
  it("splits a group into single schools and drops Aligned", () => {
    expect(syllabusSchools("RGS + RI + CHIJ St Nicholas + Cat High Aligned")).toEqual([
      "RGS", "RI", "CHIJ St Nicholas", "Cat High",
    ]);
    expect(syllabusSchools("RGS Aligned")).toEqual(["RGS"]);
    expect(syllabusSchools("TJC+Dunman High +  Cedar Girls aligned")).toEqual([
      "TJC", "Dunman High", "Cedar Girls",
    ]);
  });

  it("drops a doubled Aligned", () => {
    expect(syllabusSchools("RVHS aligned Aligned")).toEqual(["RVHS"]);
  });

  it("gives no schools for All Schools, NA, a blank or no track", () => {
    for (const none of ["All Schools", "all schools", "NA", "", undefined, null]) {
      expect(syllabusSchools(none)).toEqual([]);
    }
  });
});

describe("matchesSyllabus", () => {
  it("matches everything when nothing is picked", () => {
    expect(matchesSyllabus(undefined, [])).toBe(true);
    expect(matchesSyllabus("RGS Aligned", [])).toBe(true);
  });

  it("matches a class that names the school, alone or in a group", () => {
    expect(matchesSyllabus("RGS Aligned", ["RGS"])).toBe(true);
    expect(matchesSyllabus("RGS + RI + CHIJ St Nicholas + Cat High Aligned", ["RGS"])).toBe(true);
    expect(matchesSyllabus("RGS + RI + CHIJ St Nicholas + Cat High Aligned", ["Cat High"])).toBe(true);
  });

  it("matches an All Schools class under any pick", () => {
    expect(matchesSyllabus("All Schools", ["RGS"])).toBe(true);
    expect(matchesSyllabus("All Schools", ["HCI", "RI"])).toBe(true);
  });

  it("does not match another school's class", () => {
    expect(matchesSyllabus("HCI Aligned", ["RGS"])).toBe(false);
    expect(matchesSyllabus("TJC + Dunman High + Cedar Girls Aligned", ["RGS"])).toBe(false);
  });

  it("does not match a class with no syllabus", () => {
    for (const none of [undefined, null, "", "NA"]) {
      expect(matchesSyllabus(none, ["RGS"])).toBe(false);
    }
  });

  it("matches whole school names only", () => {
    expect(matchesSyllabus("RJC Aligned", ["RI"])).toBe(false);
    expect(matchesSyllabus("RVHS Aligned", ["RI"])).toBe(false);
    expect(matchesSyllabus("RI Aligned", ["R"])).toBe(false);
    expect(matchesSyllabus("RGS Aligned", ["RGS Aligned"])).toBe(false);
  });

  it("ignores case, and matches any one of several picks", () => {
    expect(matchesSyllabus("RGS Aligned", ["rgs"])).toBe(true);
    expect(matchesSyllabus("HCI Aligned", ["RGS", "HCI"])).toBe(true);
  });
});

describe("syllabusOptions", () => {
  it("lists each school once, sorted", () => {
    expect(
      syllabusOptions([
        "RGS Aligned",
        "RGS + RI + CHIJ St Nicholas + Cat High Aligned",
        "HCI Aligned",
        "rgs Aligned",
      ])
    ).toEqual(["Cat High", "CHIJ St Nicholas", "HCI", "RGS", "RI"]);
  });

  it("never lists All Schools, NA or a blank", () => {
    expect(syllabusOptions(["All Schools", "NA", "", undefined, null])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them and confirm that they fail**

Run: `yarn test src/utils/scheduleYear.test.ts src/utils/syllabus.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`src/utils/scheduleYear.ts`:

```ts
// The year in the page title. The feed decides which year's slots each
// platform shows, so this is text only. Change it at the next rollover.
export const SCHEDULE_YEAR = 2027;

// Class slot ids are "<year>-ClassNNNN".
export function slotYear(classSlotId: string | undefined): number | null {
  const match = /^(\d{4})-/.exec(classSlotId ?? "");
  return match ? Number(match[1]) : null;
}

// JC moves to the new year later than Secondary and Primary. Until it does,
// a JC visitor sees last year's slots under this year's title.
export function showJcNextYearNote(
  stream: string | null,
  slots: { level: string; classSlotId?: string }[]
): boolean {
  if (stream !== "JC") return false;
  return slots.some((slot) => {
    const year = slotYear(slot.classSlotId);
    return slot.level.startsWith("J") && year !== null && year < SCHEDULE_YEAR;
  });
}
```

`src/utils/syllabus.ts`:

```ts
// The school track from the master sheet ("IP Track Name"), shown as
// "Syllabus". Examples: "RGS Aligned", "TJC + Dunman High + Cedar Girls
// Aligned", "All Schools". "NA" or no value means the class has none.

type Track = string | null | undefined;

const fold = (text: string) => text.trim().toLowerCase();

function clean(track: Track): string | null {
  const text = (track ?? "").trim();
  if (text === "" || /^n\/?a$/i.test(text)) return null;
  return text;
}

function isAllSchools(track: Track): boolean {
  return fold(clean(track) ?? "") === "all schools";
}

// The text on a slot, or null for no label.
export function syllabusLabel(track: Track): string | null {
  return clean(track);
}

// The single schools that a track names. All Schools names none.
export function syllabusSchools(track: Track): string[] {
  const text = clean(track);
  if (text === null || isAllSchools(text)) return [];
  return text
    .replace(/(\s+aligned)+\s*$/i, "")
    .split("+")
    .map((school) => school.trim())
    .filter((school) => school !== "");
}

// No pick matches everything. An All Schools class matches any pick.
export function matchesSyllabus(track: Track, picks: string[]): boolean {
  if (picks.length === 0) return true;
  if (isAllSchools(track)) return true;
  const schools = syllabusSchools(track).map(fold);
  return picks.some((pick) => schools.includes(fold(pick)));
}

// The filter options for a set of slots: each school once, sorted.
export function syllabusOptions(tracks: Track[]): string[] {
  const byFolded = new Map<string, string>();
  for (const track of tracks) {
    for (const school of syllabusSchools(track)) {
      if (!byFolded.has(fold(school))) byFolded.set(fold(school), school);
    }
  }
  return [...byFolded.values()].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}
```

- [ ] **Step 4: Run the tests and confirm that they pass**

Run: `yarn test src/utils/scheduleYear.test.ts src/utils/syllabus.test.ts`
Expected: PASS. If the sort order of `Cat High` and `CHIJ St Nicholas` differs, keep the implementation and correct the expected array to what `localeCompare` with `sensitivity: "base"` gives.

- [ ] **Step 5: Commit**

```bash
git add src/utils/scheduleYear.ts src/utils/scheduleYear.test.ts src/utils/syllabus.ts src/utils/syllabus.test.ts
git commit -m "feat: pure rules for the schedule year and the syllabus filter"
```

---

### Task 2: Read the calendar mode; say 2027

**Files:**
- Modify: `src/app/page.tsx` (cache helpers near lines 25-171; the mount effect near lines 376-470)
- Modify: `src/components/WeeklyClassCalendar.tsx` (type `WeeklyClassSlot`, lines 23-40)
- Modify: `src/app/layout.tsx` (lines 28-29), `src/components/SignupBanner.tsx` (lines 32, 57, 81)
- Modify: `src/app/page.test.tsx`, `src/components/SignupBanner.test.tsx`

**Interfaces:**
- Consumes: `SCHEDULE_YEAR` (Task 1).
- Produces: `WeeklyClassSlot.track?: string | null`; `getCachedData(): WeeklyClassSlot[] | null`; `setCachedData(data: WeeklyClassSlot[]): void`.

- [ ] **Step 1: Write the failing tests**

In `src/app/page.test.tsx`:

1. Find the two year tests near lines 685-760 ("refuses LAST year's cache when this year's pinned fetch fails" and "still falls back to a SAME-year cache") and the `pinYear` helper near line 117. Replace the first test with the two tests below. Keep the second test, but remove its `pinYear` call and rename it "still falls back to the cache when a pinned fetch fails". Delete `pinYear` if nothing else uses it.

```tsx
  it("asks the feed for the calendar view and sends no year", async () => {
    render(<Home />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url).toContain("/schedule?");
    expect(url).toContain("view=calendar");
    expect(url).not.toContain("year=");
  });

  it("refuses a cache written by the year-keyed version of the page", async () => {
    localStorage.setItem("weeklyClassData", JSON.stringify(SLOTS));
    localStorage.setItem("weeklyClassDataTimestamp", Date.now().toString());
    localStorage.setItem("weeklyClassDataVersion", "4");
    localStorage.setItem("weeklyClassDataYear", "2026");

    render(<Home />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
```

   Match the imports, render call and helper names that the file already uses.

2. Search the file for `weeklyClassDataVersion` and `weeklyClassDataYear`. Each test that seeds a valid cache must now seed version `"5"`; remove the year key from those seeds.

In `src/components/SignupBanner.test.tsx`, change the line-98 assertion to `"Zenith 2027 Schedule"`, and add:

```tsx
  it("names the 2027 academic year in the pill", () => {
    render(<SignupBanner />);
    expect(screen.getAllByText(/2027 academic year/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/2026/)).toBeNull();
  });
```

Run: `yarn test src/app/page.test.tsx src/components/SignupBanner.test.tsx`
Expected: the new tests FAIL.

- [ ] **Step 2: Implement the fetch and the cache**

In `src/app/page.tsx`:

1. Set `const CACHE_VERSION = 5;`. Add one line above it: `// 5: the feed's calendar view replaced the year-keyed request.`
2. `getCachedData()` and `setCachedData(data)` lose the `year` parameter. Remove the `cachedYear` read and comparison, and the `CACHE_YEAR_KEY` write. Keep `CACHE_YEAR_KEY` only in `clearCachedData`, so old entries are removed. Trim the comments that explain the year key.
3. In the mount effect: delete `const year = new Date().getFullYear();` and its comment. Replace the URL lines with:

```ts
    // The feed picks the year for each platform; see telebot salesYear.ts.
    const scheduleUrl = new URL("/schedule", process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL!);
    scheduleUrl.searchParams.set("view", "calendar");
```

4. Update the three call sites: `getCachedData()` twice and `setCachedData(normalised)`.
5. In the comment near "Never cache an empty schedule", replace the sentence about `year=<current>` and 1 January with: "The feed can return none while a year's schedule is not published."

In `WeeklyClassCalendar.tsx`, add to `WeeklyClassSlot`:

```ts
  // School track from the master sheet. Missing on old rows; null for none.
  track?: string | null;
```

- [ ] **Step 3: Implement the year text**

- `src/app/layout.tsx`: import `SCHEDULE_YEAR` from `@/utils/scheduleYear`; title `` `Zenith ${SCHEDULE_YEAR} Schedule` ``; description `` `View the Zenith ${SCHEDULE_YEAR} Schedule and sign up for trial classes!` ``.
- `src/components/SignupBanner.tsx`: the same constant at lines 32, 57 and 81: `Registrations Open · {SCHEDULE_YEAR} academic year` and `Zenith {SCHEDULE_YEAR} Schedule`.
- Run `grep -rn "2026" src --include=*.tsx --include=*.ts | grep -v "\.test\."`. Fix any remaining user-visible 2026 text. Comments that name `Master Sheet (2026)` columns in `slotStatus.ts` should say `Master Sheet (2026) BU/BY, Master Sheet (2027) CG/CH`. Leave `subjectColors.ts` comments and test fixtures as they are.

- [ ] **Step 4: Run the whole suite**

Run: `yarn test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: read the feed's calendar view and show the 2027 title"
```

---

### Task 3: Syllabus label on each slot

**Files:**
- Modify: `src/components/ListView.tsx` (card header, lines 86-98)
- Modify: `src/components/WeeklyClassCalendar.tsx` (`eventContent` status lines near 417-431; popup near 501-511)
- Modify: `src/components/ListView.test.tsx`, `src/components/WeeklyClassCalendar.popup.test.tsx`

**Interfaces:**
- Consumes: `syllabusLabel` (Task 1), `WeeklyClassSlot.track` (Task 2).

- [ ] **Step 1: Write the failing tests**

Use each file's `makeSlot` factory. In `ListView.test.tsx`:

```tsx
  it("shows the syllabus on a card that has one", () => {
    render(<ListView events={[makeSlot({ track: "RGS Aligned" })]} />);
    expect(screen.getByText("RGS Aligned")).toBeInTheDocument();
  });

  it.each([undefined, null, "", "NA"])("shows no syllabus for track %p", (track) => {
    render(<ListView events={[makeSlot({ track })]} />);
    expect(screen.queryByTestId("syllabus-label")).toBeNull();
    expect(screen.queryByText("NA")).toBeNull();
  });
```

Match the props that `ListView` takes in the existing tests. In `WeeklyClassCalendar.popup.test.tsx`, follow the pattern of the "Waitlist only" tests and add four cases: the block shows `All Schools` for a slot with that track; the block shows no syllabus line for a slot with `track: "NA"`; the popup shows `TJC + Dunman High + Cedar Girls Aligned` after the block is clicked; the popup shows no syllabus line for a slot with no `track` field.

Run: `yarn test src/components/ListView.test.tsx src/components/WeeklyClassCalendar.popup.test.tsx`
Expected: the new tests FAIL.

- [ ] **Step 2: Implement**

In each place compute `const syllabus = syllabusLabel(slot.track);` and render only when it is not null. Give each element `data-testid="syllabus-label"`.

- **List card:** under the header row and above the info rows, a line in the style of the level pill but indigo: `className="self-start bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md border border-indigo-100"`.
- **Calendar block:** one more 10px line after the "Waitlist only" line, with the same inline style as its siblings, single line with ellipsis (`overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"`), and a `title` attribute that holds the full text.
- **Popup:** after the waitlist badge, `className="inline-block mt-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100"`. If both badges show, they sit side by side with `mr-2` on the first.

- [ ] **Step 3: Run the whole suite**

Run: `yarn test`
Expected: all PASS, `signupButtons.guard.test.ts` included.

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "feat: show each slot's syllabus on the card, the block and the popup"
```

---

### Task 4: Syllabus filter

**Files:**
- Modify: `src/components/Filters.tsx` (props lines 13-31; MultiSelects at 273-282; summary chips and "Clear all" near 229 and 314-366)
- Modify: `src/app/page.tsx` (filter state 302-307; URL read 339-346; URL write 500-525; `filteredOptions` 544-624; `events` 646-668; `handleFilterChange` 671-686; both `<Filters>` uses)
- Modify: `src/components/Filters.test.tsx`, `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `matchesSyllabus`, `syllabusOptions` (Task 1).
- Produces: `filters.syllabus: string[]`; `FiltersProps.syllabuses: OptionWithCount[]`.

- [ ] **Step 1: Write the failing page tests**

Add a fixture and a `describe("Syllabus filter", ...)` block to `src/app/page.test.tsx`. Use the file's helpers (`setUrl`, the fetch mock, the List view). Raw API shape:

```tsx
const ip = (n: number, subject: string, track?: string | null) => ({
  classSlotId: `2027-Class10${n}`,
  title: `Bishan | Sat 9AM - 11AM | T${n} (S3 ${subject} 2027)`,
  day: 6, startTime: "09:00", endTime: "11:00",
  subjects: [subject], tutor: `T${n}`, centre: "Bishan",
  stream: "IP", level: "Secondary 3",
  prefillTrialLink: "https://example.com/t", prefillRegistrationLink: "https://example.com/r",
  trialOpen: true, registrationOpen: true,
  ...(track === undefined ? {} : { track }),
});
const SYLLABUS_SLOTS = [
  ip(1, "RgsOnly", "RGS Aligned"),
  ip(2, "RgsGroup", "RGS + RI + CHIJ St Nicholas + Cat High Aligned"),
  ip(3, "AnySchool", "All Schools"),
  ip(4, "HciOnly", "HCI Aligned"),
  ip(5, "RjcOnly", "RJC Aligned"),
  ip(6, "NoTrackNA", "NA"),
  ip(7, "NoTrackField"),
  { ...ip(8, "ExpressClass", null), stream: "EXP" },
];
```

Each subject name is unique, so a test can find a card by its subject. Write these tests, each with the feed mocked to return `SYLLABUS_SLOTS`:

| Test name | URL | Assert |
|---|---|---|
| shows the classes that name the school, alone or in a group, and All Schools | `?stream=Secondary IP&syllabus=RGS&view=list` | `RgsOnly`, `RgsGroup`, `AnySchool` shown |
| hides another school's class and a class with no syllabus | same | `HciOnly`, `RjcOnly`, `NoTrackNA`, `NoTrackField` not shown |
| matches whole names only | `?stream=Secondary IP&syllabus=RI&view=list` | `RgsGroup`, `AnySchool` shown; `RjcOnly`, `RgsOnly` not shown |
| shows every class of the stream when no school is picked | `?stream=Secondary IP&view=list` | all seven IP subjects shown |
| offers single schools and never NA or All Schools | `?stream=Secondary IP&view=list` | open the "Syllabus" dropdown: options `Cat High`, `CHIJ St Nicholas`, `HCI`, `RGS`, `RI`, `RJC` present; no option `NA`, `All Schools`, or `RGS Aligned` |
| hides the Syllabus filter for a stream with no syllabus values | `?stream=Secondary Exp&view=list` | no control labelled "Syllabus" |
| ignores an unknown school in the URL | `?stream=Secondary IP&syllabus=Hogwarts&view=list` | all seven IP subjects shown; after load the URL has no `syllabus=` |
| ignores a syllabus pick on a stream that has no such school | `?stream=Secondary Exp&syllabus=RGS&view=list` | `ExpressClass` shown |
| clears the pick when the stream changes | start at `?stream=Secondary IP&syllabus=RGS&view=list`, click the "Primary" stream chip | `window.location.search` has no `syllabus=` |
| keeps the pick in the URL | `?stream=Secondary IP&view=list`, pick `HCI` in the dropdown | `window.location.search` contains `syllabus=HCI`; only `HciOnly` and `AnySchool` shown |

Use `screen.queryByText("RgsOnly")` style assertions, after `await screen.findByText(...)` on one card that must be present. To open a dropdown, copy how the existing tests open "Level" or "Subject".

In `Filters.test.tsx`, add: with `syllabuses={[opt("RGS", 2)]}` a control labelled "Syllabus" renders; with `syllabuses={[]}` it does not; a selected syllabus shows a removal chip and "Clear all" empties `filters.syllabus`. Update the file's default props so every existing render passes `syllabuses={[]}` and `filters.syllabus: []`.

Run: `yarn test src/app/page.test.tsx src/components/Filters.test.tsx`
Expected: the new tests FAIL.

- [ ] **Step 2: Implement `Filters.tsx`**

- Add `syllabuses: OptionWithCount[];` to `FiltersProps` and `syllabus: string[];` to `FiltersProps["filters"]`.
- In both MultiSelect rows (full and compact), after "Centre": `{syllabuses.length > 0 && <MultiSelect label="Syllabus" selected={filters.syllabus} options={syllabuses} onChange={(val) => setFilter("syllabus", val)} openUpward={openUpward} />}` (add `compact` in the compact row). Widen `setFilter`'s key type to include `"syllabus"`.
- Include `filters.syllabus.length > 0` in the "has any filter" test near line 229, render its removal chips beside the other chips, and reset it in "Clear all".

- [ ] **Step 3: Implement `page.tsx`**

1. State: add `syllabus: [] as string[],`.
2. URL read: add `syllabus: params.get("syllabus")?.split(",").filter(Boolean) || [],` to the accepted branch and `syllabus: []` to the rejected branch.
3. URL write: `params.delete("syllabus");` with the other deletes, and `if (filters.syllabus.length > 0) params.set("syllabus", filters.syllabus.join(","));`.
4. `filteredOptions`: after `allCentres`, `const allSyllabuses = syllabusOptions(streamFilteredData.map((s) => s.track));`. In `getResultCount`, add the branch `else if (field === "syllabus") testFilters.syllabus = [value];` and add `matchesSyllabus(s.track, testFilters.syllabus)` to the predicate. Build `syllabusesWithCounts` like `centresWithCounts` and return it as `syllabuses`.
5. `events`: add `filters.syllabus.length === 0` to the "nothing picked" test, and `matchesSyllabus(s.track, filters.syllabus)` to the predicate.
6. `handleFilterChange`: add `syllabus: []` to the stream-changed reset.
7. Prune unknown picks once data is loaded, after `filteredOptions`:

```ts
  // A pick that no class in this stream names came from a stale link.
  // Drop it, or the list would be filtered by a school nobody can see.
  useEffect(() => {
    if (weeklyClassData.length === 0 || filters.syllabus.length === 0) return;
    const known = new Set(filteredOptions.syllabuses.map((o) => o.value.toLowerCase()));
    const kept = filters.syllabus.filter((pick) => known.has(pick.toLowerCase()));
    if (kept.length !== filters.syllabus.length) {
      setFilters((current) => ({ ...current, syllabus: kept }));
    }
  }, [weeklyClassData, filteredOptions.syllabuses, filters.syllabus]);
```

8. Pass `syllabuses={filteredOptions.syllabuses}` at both `<Filters>` uses.
9. Run `grep -n "centre: \[\]" src/app/page.tsx` and add `syllabus: []` at each place that builds a whole filter object.

- [ ] **Step 4: Run the whole suite and the type check**

Run: `yarn test` then `yarn tsc --noEmit`
Expected: all PASS, no type errors.

- [ ] **Step 5: Prove the negative tests can fail**

Temporarily make `matchesSyllabus` return `true` for every input. Run `yarn test src/app/page.test.tsx -t "Syllabus filter"` and confirm that the "hides another school's class" and "matches whole names only" tests FAIL. Restore the function with `git checkout src/utils/syllabus.ts`, confirm `git status --short` shows only this task's files, and run the suite again.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: Syllabus filter by school"
```

---

### Task 5: JC note

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `showJcNextYearNote` (Task 1).

- [ ] **Step 1: Write the failing tests**

```tsx
describe("JC next-year note", () => {
  const NOTE = "JC 2027 classes open on 1 Jan 2027";
  const jc = (year: number) => ({
    classSlotId: `${year}-Class0001`,
    title: `Bishan | Sat 9AM - 11AM | T (J2 Economics ${year})`,
    day: 6, startTime: "09:00", endTime: "11:00",
    subjects: ["Economics"], tutor: "T", centre: "Bishan",
    stream: "H2", level: "J2",
    prefillTrialLink: "https://example.com/t", prefillRegistrationLink: "https://example.com/r",
    trialOpen: true, registrationOpen: true,
  });

  it("shows when JC is picked and JC still shows 2026 slots", async () => {
    // feed mock returns [jc(2026)]
    setUrl("?stream=JC&view=list");
    render(<Home />);
    expect(await screen.findByText(NOTE)).toBeInTheDocument();
  });

  it("hides once JC shows 2027 slots", async () => {
    // feed mock returns [jc(2027)]
    setUrl("?stream=JC&view=list");
    render(<Home />);
    await screen.findByText("Economics");
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it("hides for another stream", async () => {
    // feed mock returns [jc(2026), ...SYLLABUS_SLOTS]
    setUrl("?stream=Secondary IP&view=list");
    render(<Home />);
    await screen.findByText("RgsOnly");
    expect(screen.queryByText(NOTE)).toBeNull();
  });
});
```

Set the feed mock in each test in the file's own way. Run and confirm that the first test FAILS.

- [ ] **Step 2: Implement**

In `page.tsx`: `const jcNote = useMemo(() => showJcNextYearNote(filters.stream, weeklyClassData), [filters.stream, weeklyClassData]);`. Render, in both the phone and the desktop layout, directly under the filters and only when `jcNote && !isPinned`:

```tsx
<p role="note" className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2">
  JC 2027 classes open on 1 Jan 2027
</p>
```

If both layouts are in the DOM at once in tests, use `findAllByText` in the test and assert a length of one or more.

- [ ] **Step 3: Run the whole suite**

Run: `yarn test`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app
git commit -m "feat: note that JC 2027 classes open on 1 Jan"
```

---

### Task 6: Whole-branch check

- [ ] **Step 1:** `yarn test`. Record the pass count.
- [ ] **Step 2:** `yarn tsc --noEmit` and `yarn lint`. Expected: no errors.
- [ ] **Step 3:** `NEXT_PUBLIC_SCHEDULE_API_BASE_URL=https://api.schedule.myzenithstudy.com yarn build`. Expected: the static export builds. Then `grep -c "Zenith 2027 Schedule" out/index.html`; expected 1 or more.
- [ ] **Step 4:** `git status --short` (ignore `node_modules` and `out`) and `git log --oneline origin/regular-lessons-staging..HEAD`. Expected: a clean tree and one commit per task plus the plan commit.

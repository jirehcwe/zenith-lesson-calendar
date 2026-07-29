# Design: `?tutor=` deep-link and the `AllSec` stream

**Date:** 2026-07-28
**Branch:** `jireh/feat/tutor-link-allsec` → `regular-lessons-staging` → `regular-lessons`
**Status:** Approved 2026-07-28 — implementation in progress

## Problem

Two independent additions to the regular-lesson schedule site:

1. **A tutor deep-link.** We already have `?classes=` for pinning a curated set
   of classes ([2026-06-16 spec](./2026-06-16-classes-url-param-design.md)). We
   want the same locked view keyed by *tutor* instead, so a link shows exactly
   one tutor's classes:

   ```
   https://schedule.zenitheducationstudio.com/?tutor=Alicia
   ```

2. **An `AllSec` stream.** Secondary is currently split into two mutually
   exclusive filter chips, Express and IP. A parent who does not know which
   track their child is in cannot see both at once. A URL parameter should
   select the union:

   ```
   https://schedule.zenitheducationstudio.com/?stream=AllSec
   ```

Both are frontend-only. Neither requires a change to `db-schedule-updater`, the
API response shape, or `CACHE_VERSION`.

## Key facts (verified against the live API and the telebot schema, 2026-07-28)

### Tutor identity

- **Tutors already have unique codes, and the API already sends them.** The
  `tutor` field on each schedule row is not a display name — it is telebot's
  `Tutor.formNameCode`, which is `@unique` in `prisma/schema.prisma`
  (`schedule.service.ts:532`: `tutor: cs.tutor.formNameCode || ""`).
- Live `GET /schedule?year=2026` returns 877 rows across **98 distinct tutor
  codes**: `Alicia`, `Shi Neng`, `DJ`, `Dr. Han Wei`, `Mel B`, `FY`.
- Every row also carries `tutorId` (the integer PK). We are **not** using it —
  see "Why `formNameCode` and not `tutorId`" below.
- A third code, `Tutor.scheduleCode`, also exists and is also `@unique`
  (e.g. `SN` → the tutor whose `formNameCode` is `Shi Neng`). It is **not**
  exposed by the schedule API. Using it would require a telebot change plus a
  `CACHE_VERSION` bump, and buys nothing.
- The tutor code is **already public**: it is embedded in the `title` of every
  class the calendar renders, e.g.
  `Kovan | Fri 7.15PM - 9.15PM | Alicia (J2 Mathematics 2026)`. So using it
  verbatim in banner copy exposes nothing new and needs no display-name field.

### The existing `?tutor=` param is inert

`page.tsx` reads `?tutor=` into `filters.tutor` on mount (line 141) and writes
it back to the URL (line 206), so it round-trips correctly. But:

- `filters.tutor` is **never applied** in the `events` memo — that filter chain
  covers only `stream`, `level`, `subject`, and `centre`.
- `getResultCount` likewise ignores it when computing option badges.
- `Filters.tsx` accepts a `tutors` prop and declares `tutor: string[]` in its
  filter type, but **never renders a tutor control**; the field appears only in
  the two "clear all" reset handlers.

So today `?tutor=Alicia` renders an *empty* calendar (no filters set → the
empty-state gate returns `[]`). The param name is free to repurpose, and the
dead state must be removed so the param has exactly one owner.

### Stream and level data

- Live stream values and counts: `H2` 396, `EXP` 325, `H1` 59, `IP` 38, and
  `""` 59.
- Live level counts: `J1`/`J2` 455, `Secondary 1`–`4` 363, `Primary 4`–`6` 59.
- **Every Secondary row carries either `EXP` or `IP`** — 325 + 38 = 363, exactly
  the Secondary level count. The 59 blank-stream rows are all Primary.
- `levelToFilterMapper` (`page.tsx:84`) already switches on the stream string;
  Secondary is split only by `stream.includes("EXP")` vs `stream.includes("IP")`.

### Colour and legend safety

- **Block colours key off `level`, not the stream filter.** `indexForLevel` in
  `subjectColors.ts` dispatches on the level's first letter (J/S/P), so an
  `AllSec` view colours correctly with **zero** change.
- The legend is derived from the visible slots, resolved per-slot via
  `legendItemsForLevel` (`computeLegendItems`, `WeeklyClassCalendar.tsx:50`), so
  it is also correct with no change once slots render.
- The only stream-string path is `getLegendItemsForStream`, used **only** when
  the slot list is empty. Its Secondary branch tests
  `stream?.startsWith("Secondary")`, which `"AllSec"` fails — so this one
  function needs an explicit `AllSec` case.
- `Filters.tsx` already routes chip text through a `streamLabel()` helper, so a
  chip's stored value and its displayed label can differ without new machinery.
  That helper shortens the existing labels to `"Sec Express"` and `"Sec IP"`;
  the new chip deliberately does not follow that abbreviation (see Feature 2).

## Feature 1 — `?tutor=` pinned tutor view

### Chosen behaviour

The **same locked view** as `?classes=`: filters hidden, exit banner shown, the
Calendar/List toggle retained. Generalise the existing pin from "a list of class
IDs" to "a pin request", which is either kind.

```ts
export type PinRequest =
  | { kind: "none" }
  | { kind: "classes"; ids: string[] }
  | { kind: "tutor"; codes: string[] };

export function parsePinRequest(search: string): PinRequest;
export function matchPinnedSlots<T extends { classSlotId?: string; tutor?: string }>(
  slots: T[],
  req: PinRequest,
): T[];
```

Parsing rules are unchanged from `parseClassesParam`: split on `,`, trim, drop
empties. Matching is case-insensitive for both kinds.

**Tutor codes match `slot.tutor` exactly** (after case-folding) — never by
prefix, substring, or fuzzy comparison. The live data contains two distinct
near-miss pairs, and they guard **different** failure modes:

- `Joshua` and `Joshua Teo` — the prefix hazard. One code is a strict prefix of
  the other, so prefix matching returns the wrong person.
- `Phoebe` and `Phebe` — *not* a prefix pair (they diverge at the third
  character). This one guards against fuzzy, normalised, or edit-distance
  matching — the kind of "be helpful about typos" change someone adds later.

Both belong in the test fixture; neither on its own covers both hazards.

**Precedence:** if a link carries both `classes` and `tutor`, `classes` wins.
This is arbitrary but must be decided rather than left emergent.

### The silent-failure fix (revises AC 6 of the 2026-06-16 spec)

Today `isPinned` is `pinnedClassIds.length > 0 && pinnedSlots.length > 0` — it
depends on the *result count*. So a `?classes=` link whose codes match nothing
silently degrades to the normal empty-state page, indistinguishable from a
first-time visitor. The June spec made that explicit in AC 6 ("Empty / null / no
match → normal site").

**We are deliberately reversing that.** `isPinned` becomes
`pinRequest.kind !== "none"` — a property of the URL, not of the result set.
This is what makes a "we couldn't find any classes for this link" state
reachable at all, and it applies to both pin kinds. A recipient of a dead link
now learns the link is dead instead of silently seeing the homepage.

Note this only affects the **all-unknown** case. Mixed known/unknown codes
behave exactly as before: unknown entries contribute no slots and are dropped
silently (June AC 7 stands).

### Pin state stays outside `filters`

`handleFilterChange` resets `tutor: []` whenever the stream changes, and both
"clear all" buttons reset it too. Storing the pin in `filters.tutor` would have
it silently erased by an unrelated interaction. The pin lives in its own
`pinRequest` state, exactly as `pinnedClassIds` does today.

### Banner copy

`PinnedBanner` takes a message string instead of a bare count:

| Situation | Copy |
| --- | --- |
| One tutor, ≥1 match | `You're viewing Alicia's classes` |
| Several tutors, ≥1 match | `You're viewing classes taught by Alicia and DJ` |
| Classes pin, ≥1 match | `You're viewing N selected classes` (unchanged) |
| Zero matches, either kind | `We couldn't find any classes for this link.` |

All four keep the `Show all classes →` escape. Multi-tutor lists join with
commas and a final "and". The banner renders full-width on desktop and mobile,
as today.

### Why `formNameCode` and not `tutorId`

`tutorId` is a stable integer PK and immune to renames, which initially looks
safer. We are not using it because:

- `formNameCode` is the **join key between the ops "2026 Schedule" Google Sheet
  (column BR) and the `Tutor` table** — `schedule.service.ts:312` looks tutors
  up by it. Renaming one means re-editing every sheet row for that tutor, so a
  rename is a deliberate, coordinated act, not a casual edit. It is stable
  enough in practice.
- `?tutor=Alicia` is legible and hand-authorable by marketing; `?tutor=44`
  requires a lookup table nobody maintains.

If a rename ever does break live links, the fix is a redirect or an alias map,
not a change of key.

### Targeted cleanup, in scope

Delete the vestigial `filters.tutor` state and its URL round-trip, plus the
unused `tutors` prop threading and the `tutorsWithCounts` computation. This is
not tidiness: leaving `filters.tutor` alive while `?tutor=` gains real meaning
gives one URL param two owners with different lifetimes, one of which is wiped
by unrelated filter interactions.

### Acceptance criteria

1. **Exact subset.** `?tutor=Alicia` shows exactly the classes whose `tutor`
   field is `Alicia`, in both Calendar and List views — no more, no less.
2. **Case-insensitive.** `?tutor=alicia` matches `Alicia`.
3. **Exact match only.** `?tutor=Joshua` shows Joshua's classes and **not**
   Joshua Teo's. `?tutor=Phebe` does not match `Phoebe`.
4. **Multiple tutors.** `?tutor=Alicia,DJ` shows the union of both tutors'
   classes.
5. **Unknown code → explicit empty state.** `?tutor=Phebee` shows the "we
   couldn't find any classes for this link" banner and an empty calendar — not
   the normal filter page.
6. **Unknown `classes` code → same explicit empty state.** `?classes=NOPE`
   behaves as in AC 5 (this is the reversal of June AC 6).
7. **Mixed known + unknown.** `?tutor=Alicia,NOBODY` shows Alicia's classes; the
   unknown code is dropped silently.
8. **Precedence.** `?classes=A&tutor=Alicia` shows exactly class A.
9. **Filters hidden.** In tutor-pinned mode the filter bar is absent, the
   Calendar/List toggle remains usable, and the mobile `BottomNav` Filter tab is
   hidden — identical to `?classes=` pinned mode.
10. **Stale filter params ignored.** `?tutor=Alicia&stream=JC&level=S3` still
    shows exactly Alicia's classes.
11. **Non-filtering params preserved.** `view`, `campaign`, and `promocode`
    behave exactly as on the normal site and are never stripped.
12. **Exit clears both params.** Clicking "Show all classes" removes **both**
    `classes` and `tutor` from the URL, restores the filter bar, and shows the
    normal empty-state. A refresh afterwards does not re-enter pinned mode.

### Components & changes

**`src/utils/pinnedClasses.ts` → `src/utils/pinnedSlots.ts`** — replace
`parseClassesParam` / `matchPinnedSlots(slots, ids)` with `PinRequest`,
`parsePinRequest(search)`, and `matchPinnedSlots(slots, req)`. The file is
renamed (along with its test) because the module no longer deals only in
classes, and the old name would actively mislead. Churn is two files and one
import site.

**`src/components/WeeklyClassCalendar.tsx`** — no type change needed; `tutor` is
already declared on `WeeklyClassSlot`.

**`src/app/page.tsx`** —
- Replace `pinnedClassIds: string[]` state with `pinRequest: PinRequest`.
- `isPinned = pinRequest.kind !== "none"` (was: derived from match count).
- Remove `tutor` from the `filters` object, from the mount-read effect, from the
  filter→URL sync effect, and from both reset handlers.
- Remove `allTutors` / `tutorsWithCounts` from the `filteredOptions` memo and
  the `tutors` prop passed to both `Filters` render sites.
- `handleExitPinned` deletes **both** `classes` and `tutor` from the URL.
- Compute the banner message from `pinRequest` and the matched count.

**`src/components/PinnedBanner.tsx`** — accept a `message: string` prop instead
of `count: number`. `page.tsx` owns the call, since it is the only place holding
both the `pinRequest` and the matched slots; the banner stays purely
presentational. Presentation otherwise unchanged.

> **Amendment (2026-07-28, during implementation).** The message *string* is
> produced by a fourth export from the pin module, `describePin(req, matched)`,
> rather than composed inline in `page.tsx` as this section originally said.
> It takes the matched slots rather than the requested codes, so tutor names
> render in the data's canonical casing (`?tutor=alicia` → "Alicia") and codes
> that matched nothing are never named. Keeping it pure makes the copy table
> above unit-testable instead of only reachable through a full page render.

**`src/components/Filters.tsx`** — drop the `tutors` prop and the `tutor` field
from its filter type and reset handlers.

### Data flow

```
URL ?classes= / ?tutor= ─► mount effect ─► pinRequest (state)
                                              │
                            isPinned = kind !== "none"
                                              │
weeklyClassData ──────────────► matchPinnedSlots(slots, pinRequest)
                                              │
                    isPinned ? pinnedSlots ───┴─► events ─► Calendar / List
                             : existing filter pipeline

banner message ◄── (pinRequest.kind, tutor codes, matched count)
```

## Feature 2 — `?stream=AllSec`

### Chosen behaviour

`AllSec` becomes a fifth stream value matching **all** Secondary levels
regardless of track. Its chip is injected into the filter bar **only when it is
the selected stream** — so it appears for link recipients, stays visible while
active, and disappears once the visitor picks a different stream. Walk-in
visitors see the usual four chips.

`AllSec` is kept as the literal internal state value so it round-trips through
the URL untouched, with no bidirectional mapping to keep in sync. The
user-facing label is **"Secondary (All)"**, supplied by the existing
`streamLabel()` helper.

> **Copy decision (2026-07-28).** The long form is deliberate, and deliberately
> unlike its siblings: `streamLabel()` shortens the other two to `Sec Express`
> and `Sec IP`, giving `JC · Sec Express · Sec IP · Secondary (All) · Primary`.
> The abbreviated `Sec All` was considered and rejected. This chip is reached by
> link, so its typical viewer has never seen the filter bar and has no `Sec →
> Secondary` mapping in their head; legibility beats visual symmetry here, and
> the extra width also helps the chip read as the distinct, wider-scoped option
> that it is.

Matching is `level.startsWith("S")` rather than an explicit
`EXP || IP` test. Today those are equivalent (verified above: 325 + 38 = 363,
the exact Secondary row count). They diverge only if ops ever authors a
Secondary slot with a blank stream — in which case the forgiving form surfaces
it under `AllSec` instead of letting it vanish from every Secondary view. That
is the deliberate choice.

### Acceptance criteria

1. **Union.** `?stream=AllSec` shows every Secondary class, both Express and IP.
2. **Exclusion.** No JC or Primary classes appear under `AllSec`.
3. **Chip shown when active.** Arriving via `?stream=AllSec` renders a fifth
   chip labelled "Secondary (All)", displayed as selected, with the correct
   count.
4. **Chip hidden otherwise.** A visitor who has not used the link never sees the
   chip; the filter bar shows the usual four.
5. **Level dropdown.** With `AllSec` active, the Level dropdown offers the
   S1–S4 union.
6. **Case-insensitive.** `?stream=allsec` and `?stream=ALLSEC` are accepted and
   normalise to the canonical `AllSec` in state and in the URL.
7. **Deselect.** Clicking the active "Secondary (All)" chip clears the stream,
   as with any other chip; the chip then disappears.
8. **Colours.** Class blocks render in the Secondary palette (this follows from
   level-based colouring and needs no new code — assert it so a future
   refactor to stream-based colouring cannot regress it silently).
9. **Legend on an empty calendar.** With `AllSec` selected and no slots
   rendered, the legend shows the Secondary palette, not the combined overview.

### Components & changes

| File | Change |
| --- | --- |
| `src/app/page.tsx` | `levelToFilterMapper`: add `case "AllSec": return level.startsWith("S")` |
| `src/app/page.tsx` | `streamOptions`: append the `AllSec` option only when `filters.stream === "AllSec"` |
| `src/app/page.tsx` | mount effect: case-fold an incoming `stream` param to canonical `AllSec` |
| `src/components/Filters.tsx` | `streamLabel()`: map `AllSec` → `"Secondary (All)"` |
| `src/utils/subjectColors.ts` | `getLegendItemsForStream`: treat `AllSec` as Secondary |

No change to block colouring, the legend derived from visible slots, the level
dropdown, or `STREAM_VALUES` itself.

## Error handling & edge cases

- **Data not yet loaded.** `isPinned` now depends only on the URL, so the pinned
  banner renders before data arrives. The banner must show the zero-match copy
  only *after* loading completes — gate it on `!isLoading`, as the current
  pinned header already is.
- **Schedule failed to load** (added 2026-07-28 during implementation review).
  Because pinned mode is now URL-derived, it stays active when the fetch
  rejects — and with zero matched slots the banner would blame the *link*. A
  valid `?tutor=Alicia` would read "We couldn't find any classes for this link."
  after a network or CORS failure, a false statement the old match-count-derived
  behaviour never produced. `page.tsx` tracks a `loadFailed` flag in its
  `.catch` and shows "We couldn't load the schedule. Please try again." instead.
- **Both pin params present.** `classes` wins (AC 8); `tutor` is ignored, not
  errored on.
- **Duplicate codes.** Harmless — matching is set membership.
- **Tutor codes needing URL encoding.** `Dr. Han Wei` and `Mel B` contain dots
  and spaces. `URLSearchParams.get` decodes `%20` and `+`, so encoded links work
  as-is; the plan should include one test with an encoded multi-word code.
- **`AllSec` combined with a pin.** Pinned mode hides filters entirely, so the
  stream value is irrelevant there. No interaction.
- **Blank-stream Secondary rows.** None exist today; if introduced they surface
  under `AllSec` only (see rationale above).
- **Browser back after exit.** Exit uses `replaceState`, consistent with the
  existing filter/view URL updates, so back does not restore the pinned link.
  Unchanged from the June design.

## Testing

Jest 30 + React Testing Library, matching the existing suites.

**`src/utils/pinnedSlots.test.ts`** — both pin kinds parse; precedence when
both params present (including the `?classes=&tutor=X` case, where an empty
`classes` must count as absent); case-insensitive matching; **exact match**
against both near-miss pairs (`Joshua`/`Joshua Teo` for prefix,
`Phoebe`/`Phebe` for fuzzy); unknown code yields an empty match list while the
request itself remains non-`none`; and `describePin` returns an empty string for
`kind: "none"`, so the two states never render the same copy.

**`src/components/PinnedBanner.test.tsx`** — all four copy states, including the
multi-tutor join and the zero-match message.

**`src/app/page.test.tsx`** — pin derived from the URL rather than the match
count; a dead link renders the empty state rather than the filter page; exit
clears both params; tutor pin shows exactly that tutor's classes; stale filter
params alongside a tutor pin are ignored; an encoded multi-word tutor code
resolves.

**Stream coverage** (`page.test.tsx`) — `AllSec` spans EXP and IP and excludes J
and P rows; the chip is present iff selected; `?stream=allsec` normalises;
Secondary palette asserted for both blocks and the empty-calendar legend.

Per standing preference, **new/edited tests stay uncommitted until the user
reviews them**.

## Rollout — staging first

This follows the path the `?classes=` feature took (PR #23):

```
jireh/feat/tutor-link-allsec
        └─► PR into regular-lessons-staging
                └─► validate on the Cloudflare Pages preview build
                        └─► separate PR: regular-lessons-staging ─► regular-lessons
```

Nothing merges to `regular-lessons` until the preview build has been checked by
hand. Both features are URL-param-driven and invisible to anyone who does not
use the link, so the promotion risk is low — but the `?classes=` behaviour
change is **not** invisible, and that is the one to watch on staging.

**Staging validates against the production schedule API** (decided 2026-07-28).
`GET /schedule` is read-only, so pointing the preview build at production data
carries no write risk, and it guarantees the tutor codes in the table below
actually resolve — a staging backend with different tutor records would make
these checks meaningless and force a repeat after promotion.

Note this diverges from the repo's `CLAUDE.md`, which documents the Preview
environment as taking the dev/staging host. Confirm the Preview value in
Cloudflare Pages → Settings → Variables and Secrets matches the production host
before relying on these checks, and update that `CLAUDE.md` paragraph if the
production-for-preview setting becomes permanent rather than just for this
validation.

Manual checks on the preview URL, beyond the automated suite:

| Link | Expected |
| --- | --- |
| `?tutor=Alicia` | Pinned view; banner names the tutor |
| `?tutor=Alicia,DJ` | Union of both; multi-tutor banner copy |
| `?tutor=Dr.%20Han%20Wei` | Encoded multi-word code resolves |
| `?tutor=Phebee` | "Couldn't find any classes" banner — **not** the homepage |
| `?classes=NOPE` | Same as above (the reversal of June AC 6, in a real browser) |
| `?tutor=Alicia&stream=JC` | Stale filter param ignored; still Alicia's classes |
| `?tutor=Alicia&campaign=X` | Registration link still carries the campaign |
| `?stream=AllSec` | Fifth chip reads "Secondary (All)"; Express **and** IP present; Secondary palette |
| `?stream=allsec` | Normalises to the canonical `AllSec` |
| `?stream=AllSecc` | Typo'd value lands on the ordinary homepage, **not** a wrong-platform calendar |
| `?stream=AllSec` on a phone | Filtering is correct, but the chip itself sits behind the bottom-nav filter sheet |
| `?stream=AllSec` → tap `Sec IP` | One-way door: the chip disappears and cannot be re-selected without reopening the link |
| no params | Unchanged homepage — four chips, empty-state gate |

Three of those rows are judgement calls rather than pass/fail checks, and the
preview build is the last chance to change them:

- **Phone visibility.** The chip renders only in the sticky desktop filter bar;
  on a phone it lives behind the bottom-nav filter sheet. This is pre-existing
  and applies equally to all five chips — but it bites hardest here, because
  this chip's whole premise is a viewer who arrived by link and has never seen
  the filter bar.
- **Chip order.** `AllSec` is appended, so it renders *after* `Primary` rather
  than beside its two Secondary siblings. Splicing it in at index 3 is a
  one-line change if that reads better.
- **One-way door.** Once the visitor selects any other stream, `AllSec` leaves
  the options list and only the link brings it back. That is exactly what
  "appears only while it is the selected stream" means, so it is correct by
  design — but the natural exploratory gesture (tap `Sec IP`, then try to go
  back) is a dead end worth seeing in a real browser before shipping.

The last row is the regression check that matters most: the whole change should
be inert for an ordinary visitor.

## Out of scope

- Building a real tutor filter control in the filter bar. The dead `filters.tutor`
  state is being removed, not completed. If a tutor filter is wanted later it is
  a separate piece of work — and it would need the `events` pipeline and
  `getResultCount` extended, which this change does not touch.
- Exposing `Tutor.scheduleCode` or a tutor display name through the schedule API.
- Filtering *within* a pinned subset (the locked-view trade-off, unchanged from
  the June design).
- Making "Secondary (All)" a permanent public filter chip.
- Any change to `db-schedule-updater`, the API response shape, or `CACHE_VERSION`.
- Porting either feature to the crash-course branches.

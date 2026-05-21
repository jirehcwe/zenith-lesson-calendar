# UI Improvements Design Spec
**Date:** 2026-05-12
**Branch:** bryan/feat/ui-improvements
**Approach:** Incremental, component by component

---

## Background

The current site is based on `jirehcwe/zenith-lesson-calendar/regular-lessons`. A design mockup (`design-mockup/`) proposes visual improvements. This spec covers pure UI changes — no new data fields, no backend changes.

Excluded by decision: shortlist/bookmark feature, seats availability (no enrollment count in data), stream pills (data already has `purpose` field but implementation deferred).

---

## 1. Design Tokens (globals.css)

Update `hero-gradient` and add new CSS custom properties used across components.

**Changes to `globals.css`:**

- Replace `hero-gradient` background: `linear-gradient(135deg, #4a90e2 0%, #5b9bd5 50%, #7bb3f0 100%)` → `linear-gradient(135deg, #2438A0 0%, #2F4AC0 45%, #4F6BE8 100%)`
- Add `--brand: #2F4AC0`, `--brand-50: #EEF2FF`, `--brand-100: #DCE3FB`
- Add `--accent: #F59E0B` (amber, for primary CTAs)
- Add `--surface: #FFFFFF`, `--bg: #F6F7FB`
- Add `--t1: #0F172A`, `--t2: #475569`, `--t3: #94A3B8`
- Add `--line: #E5E7EB`

These vars are used by the updated components below.

---

## 2. SignupBanner.tsx

**Goal:** Richer hero matching the mockup — deeper indigo, eyebrow pill, keep existing collapsible behaviour and all existing text.

**Changes:**
- The gradient already comes from `hero-gradient` class — handled by the globals.css token change above. No direct style changes needed in the component for the gradient.
- Add an **eyebrow pill** above the headline (desktop and mobile expanded state):
  - Content: `● Now booking · 2026 academic year`
  - Style: small pill with `bg-white/10 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/85`
  - The `●` dot is a green pulse: `w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse`
- **All existing text stays unchanged** — keep "2026 Weekly Class Schedule" headline, existing subtitle ("Flexible scheduling • Expert tutors • Proven results • Free trial for all subjects"), "Find Your Perfect Class Schedule" section heading, and blurb text. No copy changes.
- Keep existing social proof avatars + trust line — no change

**Files changed:** `src/components/SignupBanner.tsx`, `src/app/globals.css`

---

## 3. Filters.tsx + ViewSelector.tsx + page.tsx

**Goal:** Sticky filter bar with search, consolidated view toggle, and a summary row showing active filters.

### 3a. Sticky wrapper

Wrap the filter area in `page.tsx` with:
```
sticky top-0 z-40 bg-white/92 backdrop-blur-sm border-b border-gray-200
```

### 3b. Search input (new state in page.tsx)

Add `const [searchQuery, setSearchQuery] = useState("")` in `page.tsx`.

Pass `searchQuery` + `onSearchChange` as new props to `Filters`.

Inside filtering logic in `page.tsx`, add search filter:
```
sessions where subject or centre includes searchQuery (case-insensitive)
```

In `Filters.tsx` render a search `<input>` as the first element of the refinements row:
- Icon: magnifier SVG on the left, absolutely positioned
- Placeholder: `"Search subject or centre…"`
- Style: `rounded-xl border-2 border-gray-200 pl-9 pr-3 py-2.5 text-sm w-full max-w-xs`
- Focus ring: `focus:border-blue-400 focus:outline-none`

### 3c. View toggle moves into Filters

Remove `ViewSelector.tsx` from above the filters in `page.tsx`. Pass `currentView` + `onViewChange` as props to `Filters`. Render the segmented control inside `Filters` in the refinements row, after the selects, pushed to the right with `ml-auto`.

Style: white bg, 2px border, `rounded-xl`, each button `px-3 py-2 text-xs font-semibold`. Active button: `bg-brand-50 text-brand`.

### 3d. Summary row

A third row below the selects, visible only when any filter is active (stream, level, subject, or centre selected).

- Count: `"<N> classes"` — bold `<N>` in brand blue
- Active filter chips: one dismissible pill per active filter value
  - Style: `bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1`
  - × button on right to remove that single filter value
- "Clear all" button: `text-xs text-gray-400 hover:text-red-500 font-semibold`

Pass `totalCount` (number of sessions matching current filters) as prop to `Filters`.

**Files changed:** `src/components/Filters.tsx`, `src/app/page.tsx`, `src/app/globals.css`
**Files removed from render tree:** `ViewSelector` is kept as a file (it exports the `ViewType` type used elsewhere) but is no longer rendered — its UI is replaced by the inline segmented control inside `Filters`.

---

## 4. ListView.tsx

**Goal:** Richer cards with subject colour accent, icon rows, tutor avatar, styled action buttons. Day headers gain a count pill.

### 4a. Day headers

Current: `<h3>Monday</h3>`
New: `<h3>Monday</h3>` + a pill badge `<span>3 classes</span>` right-aligned in the same flex row.
Style: `text-xl font-extrabold text-gray-800` + pill `bg-brand-50 text-brand text-xs font-bold px-2.5 py-0.5 rounded-full`

### 4b. Card structure

Replace the current card `<div>` with this layout:

```
┌─────────────────────────────┐
│ [3px coloured top bar]      │  ← accent bar, colour = subject colour
│ Subject name    [Level pill]│  ← font-bold text-lg + small badge
│ ──────────────────────────  │
│ 🕐 10:00 – 12:00            │  ← icon + time
│ 📍 Bishan                   │  ← icon + centre
│ 👤 Alice (tutor avatar)     │  ← initials circle + tutor name
│ ──────────────────────────  │
│ [Free Trial btn] [Register] │  ← amber primary + outlined secondary
└─────────────────────────────┘
```

**Accent bar:** `h-1 w-full rounded-t-xl` with inline `style={{ background: subjectColor }}`. Reuse `jcSubjectToColorMap` / `secSubjectToColorMap` from `WeeklyClassCalendar.tsx` — export a helper `getSubjectColor(subject, stream)` from that file.

**Subject colour lookup:** exported helper function `getSubjectColor(subject: string, stream: string): string` — takes the first subject string, returns its background colour from the existing colour maps, falling back to `#9ca3af`.

**Level pill:** `bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-200`

**Tutor avatar:** `w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold` with background from `getSubjectColor`. Initials: first letter of tutor name.

**Buttons (equal visual weight — both filled, no primary/secondary hierarchy):**
- Free Trial: `bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-xs py-2 px-3 rounded-lg flex-1`
- Register: `bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex-1`

Both buttons are solid-fill of identical sizing — the amber/blue colour difference distinguishes action type (trial vs. enrolment) without implying one is more important than the other.

**Full state:**
- Card: `opacity-60 bg-gray-50`
- Replace both buttons with a single `"Class Full"` disabled grey button

### 4c. Card hover

`transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5`

**Files changed:** `src/components/ListView.tsx`, `src/components/WeeklyClassCalendar.tsx` (export `getSubjectColor`)

---

## 5. CalendarView.tsx — Modal

**Goal:** Tinted hero header, info tiles, amber CTA.

**Changes to the Dialog panel only** (FullCalendar itself is untouched):

- **Hero header band:** A `<div>` at the top of `DialogPanel` with `style={{ backgroundColor: selectedEvent.backgroundColor + '20' }}` (20 = 12% opacity hex). Contains:
  - Small eyebrow: stream/level info `text-xs font-bold uppercase tracking-wide text-gray-500`
  - Subject name: `text-2xl font-extrabold text-gray-900`
  - Subtitle: `"Day · HH:MM – HH:MM · Centre"` in `text-sm text-gray-500`
- **Info tiles grid:** 2-column grid below the hero. Each tile: white bg, border, `rounded-lg p-3`.
  - Time tile: clock icon + "Time" label + `startTime – endTime` value
  - Venue tile: pin icon + "Venue" label + centre value
- **Close button:** style from `text-gray-400 hover:text-gray-700 text-xl` → `w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white`
- **CTA button:** `bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold` instead of blue

**Files changed:** `src/components/CalendarView.tsx`

---

## 6. BottomNav.tsx

**Goal:** Add Filter tab, apply mockup's active-indicator style.

**Changes:**
- Add a third tab: **Filter** (funnel icon), calls `onOpenFilter()` callback
- Add `onOpenFilter: () => void` to `BottomNavProps`
- Active indicator: instead of just colour, add a `<span className="absolute top-0 inset-x-1/4 h-0.5 bg-blue-600 rounded-b-full" />` above the active icon
- Dividers between tabs removed (cleaner)
- Safe area padding: `pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`

**Mobile filter sheet:** `page.tsx` adds `const [filterSheetOpen, setFilterSheetOpen] = useState(false)` and passes `onOpenFilter={() => setFilterSheetOpen(true)}` to `BottomNav`. When open, a full-screen overlay `<div>` slides up from the bottom containing the existing `<Filters>` component — no new component needed. The overlay is a `fixed inset-0 z-50` div with a white sheet panel sliding via `translate-y` transition.

**Files changed:** `src/components/BottomNav.tsx`, `src/app/page.tsx`

---

## Implementation Order

1. `globals.css` — design tokens (foundation for all other changes)
2. `SignupBanner.tsx` — self-contained, no prop changes
3. `Filters.tsx` + `page.tsx` — search state, view toggle absorbed, summary row
4. `ListView.tsx` + `WeeklyClassCalendar.tsx` — card redesign, export colour helper
5. `CalendarView.tsx` — modal redesign only
6. `BottomNav.tsx` + `page.tsx` — Filter tab, mobile sheet

---

## Tests to Update After Implementation

- `Filters.test.tsx` — new `searchQuery`/`onSearchChange`/`currentView`/`onViewChange`/`totalCount` props
- `ListView.test.tsx` — card structure assertions (accent bar, tutor avatar, button labels)
- `BottomBanner.test.tsx` — no changes needed
- `CalendarView.test.tsx` — dialog hero structure, button label remains "Register (prefilled)"
- `SignupBanner.test.tsx` — eyebrow pill text ("Now booking · 2026 academic year"); existing headline/subtitle text assertions stay as-is

---

## Out of Scope

- Shortlist / bookmark / saved drawer
- Seats availability bar (no enrollment count in data)
- `design-mockup/app.js` tweaks panel (density/accent/theme toggles)
- Any data schema changes

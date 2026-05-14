# Calendar Visual Overhaul — Design Spec

**Date:** 2026-05-14  
**Branch:** bryan/feat/ui-improvements  
**Scope:** Visual-only redesign of `WeeklyClassCalendar.tsx` to match `design-mockup/Zenith 2026 - Improved.html`. No changes to functionality, data flow, filtering, or modal behavior.

---

## Approved Design Decisions

### 1. Event Card Style (most impactful change)

**Current:** Solid pastel background fill (e.g., `#FDE68A`) with black text (`#000000`). No border accent.

**Target:**
- Background: subject tint color (light version, e.g., `#FEF3C7` for Math)
- Left border: `3px solid` dark subject color (e.g., `#B45309`)
- Text color: dark subject color (`color` matches border)
- Font: Manrope 11px / weight 700 for the title
- Reduced box-shadow (subtler than current)

Implementation note: FullCalendar injects `backgroundColor` and `textColor` as inline styles on the `.fc-v-event` element. The left border and tint background must be applied inside `eventContent` using the event's `extendedProps` to look up colors — do not rely on FullCalendar's built-in color props for the new style.

### 2. Subject Color Palette (full remap)

Replace the existing pastel `backgroundColor` values with the new dark accent + light tint system. Both the dark color and tint must be stored per subject, replacing the current `{ backgroundColor, textColor }` shape with `{ color, tint }`.

| Subject | Dark color (`color`) | Light tint (`tint`) |
|---|---|---|
| Math / E Math | `#B45309` | `#FEF3C7` |
| A Math | `#1E40AF` | `#DBEAFE` |
| Physics / Pure Physics / Combined Physics | `#BE123C` | `#FECDD3` |
| Chemistry / Pure Chemistry / Combined Chemistry | `#15803D` | `#DCFCE7` |
| Biology / Pure Biology / Combined Biology | `#166534` | `#BBFBD0` |
| English | `#0369A1` | `#BAE6FD` |
| General Paper | `#9A3412` | `#FED7AA` |
| Economics | `#4338CA` | `#E0E7FF` |
| Full slot | `#64748B` | `#E5E7EB` |

All three existing maps (`jcSubjectToColorMap`, `secSubjectToColorMap`, `primarySubjectToColorMap`) must be updated. The `subjectToColor` return type changes from `{ backgroundColor, textColor }` to `{ color, tint }`. The `getSubjectColor` export and `FULL_SLOT_COLOR` constant must also be updated.

FullCalendar event objects should set `backgroundColor: tint` and `textColor: color` so FullCalendar doesn't fight the new card style with its own defaults.

### 3. Event Card Content

**Current:** Title (`${level} ${subjects}`) → centre name → "Free Trial/Registration" underlined link text.

**Target:**
- Title only: `${level} ${subjects}` (Manrope 11px/700, color = dark subject color)
- Venue line: SVG location pin icon (8×10 px, `fill="currentColor"`) + centre name (10px, `font-weight: 400`, `opacity: 0.78`)
- Remove "Free Trial/Registration" text from card entirely — clicking the card still opens the modal as before

### 4. Column Day Header

**Current:** Day abbreviation only (e.g., "Mon"), rendered via `dayHeaderContent`.

**Target:** Day abbreviation (uppercase, e.g., "MON") + class count below (e.g., "3 classes", 10px, muted color). Class count = number of events on that day.

Implementation: update `dayHeaderContent` to count events for the day being rendered and display the count as a second line. Use `events` from component scope (the memoized array) to compute the count by matching the event's `start` date to the header's date.

### 5. Event Hover Animation

**Current:** `scale(1.05) translateY(-1px)` + `filter: brightness(0.9)` (scale up + darken).

**Target:** `translateY(-1px) scale(1.02)` + `box-shadow: 0 6px 16px rgba(0,0,0,0.12)` + `filter: brightness(1.04)` (subtler scale, brighter).

### 6. Legend Bar

**Current:** None.

**Target:** A row of subject color swatches + labels rendered below the FullCalendar grid. Shows subjects that have at least one visible event. Each swatch uses the tint background + dark left border to match the event card style. Subjects shown: Math, A Math, Physics, Chemistry, Biology, English, General Paper, Economics, Full.

The legend renders as a flex-wrap row. Always show all subjects (not filtered to visible ones) for visual consistency — this avoids the legend shifting as filters change.

### 7. Calendar Container

**Current:** `rounded-xl border border-gray-200 shadow-sm`

**Target:** Softer shadow, same border radius and border color. Apply via Tailwind or inline style update on the wrapper `div`. Exact target from mockup: `border-radius: 16px`, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`, `border: 1px solid #e2e8f0`.

### 8. Class Detail Modal — NO CHANGE

The class detail modal keeps its current design exactly: tinted hero band, icon-row details (calendar/clock/pin badges), two CTA buttons (amber Free Trial + blue Register). No changes to the modal.

### 9. Pro Tip Banner — NO CHANGE

The existing blue-gradient pro tip banner with dismiss button is unchanged.

---

## Out of Scope

- Current datetime indicator (explicitly excluded from mockup adoption)
- Any changes to filter behavior, data fetching, or state management
- Mobile-specific layout changes
- The class detail modal
- The pro tip banner

---

## Files Changed

| File | Change |
|---|---|
| `src/components/WeeklyClassCalendar.tsx` | All visual changes above |

No new files. One new font dependency: **Manrope** must be added to `src/app/layout.tsx` via `next/font/google` (same pattern as the existing Geist import). It is not currently loaded in the project.

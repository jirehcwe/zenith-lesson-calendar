# Calendar Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually redesign `WeeklyClassCalendar.tsx` to match `design-mockup/Zenith 2026 - Improved.html` — new event card style, richer color palette, class count in day headers, subject legend bar, and updated hover animation. Modal and pro tip banner are unchanged.

**Architecture:** All changes are isolated to `src/components/WeeklyClassCalendar.tsx` (color maps, event renderer, day header, CSS, legend) and `src/app/layout.tsx` (Manrope font). FullCalendar's own background/border styling is overridden via the existing `<style jsx>` global CSS block so the inner `eventContent` div controls all visual appearance.

**Tech Stack:** Next.js 15, React 19, FullCalendar 6 (timeGrid + scrollGrid), Tailwind CSS 4, `next/font/google` for Manrope, TypeScript strict mode.

**Reference files (read-only):**
- `design-mockup/Zenith 2026 - Improved.html` — full mockup
- `design-mockup/app.js` — subject metadata and color bar values
- `design-mockup/styles.css` — CSS variables and card rules
- `docs/superpowers/specs/2026-05-14-calendar-visual-overhaul-design.md` — approved design spec

---

## File Map

| File | Change |
|---|---|
| `src/app/layout.tsx` | Add Manrope font via `next/font/google` |
| `src/components/WeeklyClassCalendar.tsx` | All visual changes (color maps, eventContent, dayHeaderContent, CSS, legend, container) |

---

## Task 1: Add Manrope font

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Manrope import and variable**

Replace the existing font section in `src/app/layout.tsx` (lines 2–13). The full file becomes:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenith 2026 Schedule",
  description: "View the Zenith 2026 Schedule and sign up for trial classes!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify lint passes**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Manrope font variable for calendar event cards"
```

---

## Task 2: Remap color palette and update color type

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (lines 21–249)

This is the structural foundation for all visual changes. The color shape changes from `{ backgroundColor: string; textColor: string }` to `{ color: string; tint: string }` where `color` is the dark accent and `tint` is the light background.

- [ ] **Step 1: Replace FULL_SLOT_COLOR and all three color maps**

Replace lines 21–172 in `src/components/WeeklyClassCalendar.tsx` with:

```typescript
const FULL_SLOT_COLOR = { color: "#64748B", tint: "#E5E7EB" };

const jcSubjectToColorMap: Record<string, { color: string; tint: string }> = {
  "General Paper": { color: "#9A3412", tint: "#FED7AA" },
  Biology:         { color: "#166534", tint: "#BBFBD0" },
  Physics:         { color: "#BE123C", tint: "#FECDD3" },
  Chemistry:       { color: "#15803D", tint: "#DCFCE7" },
  Mathematics:     { color: "#B45309", tint: "#FEF3C7" },
  Economics:       { color: "#4338CA", tint: "#E0E7FF" },
};

const secSubjectToColorMap: Record<string, { color: string; tint: string }> = {
  Mathematics:          { color: "#B45309", tint: "#FEF3C7" },
  "A Math":             { color: "#1E40AF", tint: "#DBEAFE" },
  "E Math":             { color: "#B45309", tint: "#FEF3C7" },
  "Pure Physics":       { color: "#BE123C", tint: "#FECDD3" },
  "Combined Physics":   { color: "#BE123C", tint: "#FECDD3" },
  Chemistry:            { color: "#15803D", tint: "#DCFCE7" },
  Physics:              { color: "#BE123C", tint: "#FECDD3" },
  Science:              { color: "#BE123C", tint: "#FECDD3" },
  "Pure Chemistry":     { color: "#15803D", tint: "#DCFCE7" },
  "Combined Chemistry": { color: "#15803D", tint: "#DCFCE7" },
  "Pure Biology":       { color: "#166534", tint: "#BBFBD0" },
  "Combined Biology":   { color: "#166534", tint: "#BBFBD0" },
  English:              { color: "#0369A1", tint: "#BAE6FD" },
  "Pure History":       { color: "#92400E", tint: "#FFEDD5" },
  "Combined History":   { color: "#92400E", tint: "#FFEDD5" },
  "Pure Literature":    { color: "#831843", tint: "#FCE7F3" },
  "Combined Literature":{ color: "#831843", tint: "#FCE7F3" },
  "Pure Geography":     { color: "#065F46", tint: "#ECFDF5" },
  "Combined Geography": { color: "#065F46", tint: "#ECFDF5" },
  "Social Studies":     { color: "#6B21A8", tint: "#F3E8FF" },
};

const primarySubjectToColorMap: Record<string, { color: string; tint: string }> = {
  English:     { color: "#0369A1", tint: "#BAE6FD" },
  Mathematics: { color: "#B45309", tint: "#FEF3C7" },
  Science:     { color: "#BE123C", tint: "#FECDD3" },
};
```

- [ ] **Step 2: Update getSubjectColor export (line 174–176)**

Replace:
```typescript
export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).backgroundColor;
}
```

With:
```typescript
export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).color;
}
```

- [ ] **Step 3: Update subjectToColor return type and fallbacks (lines 204–249)**

Replace the entire `subjectToColor` function (including the commented-out hash function above it, lines 178–249) with:

```typescript
function subjectToColor(
  level: string,
  subject: string
): { color: string; tint: string } {
  const normalisedSubject = subject.startsWith("IP ")
    ? subject.slice(3)
    : subject;

  if (level.includes("J")) {
    return jcSubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  if (level.includes("S")) {
    return secSubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  if (level.includes("P")) {
    return primarySubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  return FULL_SLOT_COLOR;
}
```

- [ ] **Step 4: Update events useMemo to use new color shape (lines 320–333)**

In the `events` useMemo, find:
```typescript
      const color = full
        ? FULL_SLOT_COLOR
        : subjectToColor(slot.level, slot.subjects[0] ?? "");
      return {
        title: `${slot.level} ${slot.subjects.join(" + ")} ${
          slot.stream ? `(${slot.stream})` : ""
        }`,
        start,
        end,
        extendedProps: slot,
        backgroundColor: color.backgroundColor,
        textColor: color.textColor,
      };
```

Replace with:
```typescript
      const colors = full
        ? FULL_SLOT_COLOR
        : subjectToColor(slot.level, slot.subjects[0] ?? "");
      return {
        title: `${slot.level} ${slot.subjects.join(" + ")} ${
          slot.stream ? `(${slot.stream})` : ""
        }`,
        start,
        end,
        extendedProps: slot,
        backgroundColor: colors.tint,
        textColor: colors.color,
      };
```

- [ ] **Step 5: Update modal's two subjectToColor references**

In the modal JSX, find (around line 469):
```typescript
                    backgroundColor:
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").backgroundColor + "66",
```
Replace `.backgroundColor` with `.tint`:
```typescript
                    backgroundColor:
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint + "66",
```

Then find (around line 498):
```typescript
                    backgroundColor:
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").backgroundColor + "33",
```
Replace `.backgroundColor` with `.tint`:
```typescript
                    backgroundColor:
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint + "33",
```

- [ ] **Step 6: Run lint — TypeScript will catch any missed `.backgroundColor` / `.textColor` references**

```bash
yarn lint
```

Expected: no errors. If you see `Property 'backgroundColor' does not exist`, find and fix the remaining reference.

- [ ] **Step 7: Run existing tests to confirm no regressions**

```bash
yarn test
```

Expected: all tests pass. `ListView.test.tsx` mocks `getSubjectColor` entirely, so the signature change has no effect.

- [ ] **Step 8: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: remap subject color palette to dark-accent + light-tint system"
```

---

## Task 3: Update eventContent renderer

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (`eventContent` prop, around lines 422–448)

Replace the entire `eventContent` prop value. Find:

```typescript
          eventContent={(arg) => {
            const centre = arg.event.extendedProps.centre;
            const full = isSlotFull(arg.event.extendedProps as WeeklyClassSlot);
            return (
              <div className="p-1 h-full flex flex-col justify-between overflow-hidden">
                <div className="flex-1 min-h-0">
                  <div className="font-semibold truncate text-sm">
                    {arg.event.title}
                  </div>
                  {centre && (
                    <div className="text-xs opacity-80 truncate">
                      {formatLocationDisplay(centre)}
                    </div>
                  )}
                </div>
                {full ? (
                  <div className="text-xs font-semibold opacity-90 truncate flex-shrink-0">
                    FULL
                  </div>
                ) : (
                  <div className="text-xs underline opacity-90 truncate flex-shrink-0">
                    Free Trial/Registration
                  </div>
                )}
              </div>
            );
          }}
```

Replace with:

```typescript
          eventContent={(arg) => {
            const slotData = arg.event.extendedProps as WeeklyClassSlot;
            const full = isSlotFull(slotData);
            const colors = full
              ? FULL_SLOT_COLOR
              : subjectToColor(slotData.level, slotData.subjects[0] ?? "");
            return (
              <div
                style={{
                  height: "100%",
                  background: colors.tint,
                  borderLeft: `3px solid ${colors.color}`,
                  borderRadius: "2px",
                  padding: "4px 6px",
                  color: colors.color,
                  fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {arg.event.title}
                </div>
                {slotData.centre && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "10px",
                      fontWeight: 400,
                      opacity: 0.78,
                      overflow: "hidden",
                    }}
                  >
                    <svg
                      width="8"
                      height="10"
                      viewBox="0 0 10 13"
                      fill="currentColor"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S4.17 3.5 5 3.5 6.5 4.17 6.5 5 5.83 6.5 5 6.5z" />
                    </svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatLocationDisplay(slotData.centre)}
                    </span>
                  </div>
                )}
                {full && (
                  <div style={{ fontSize: "10px", fontWeight: 600, opacity: 0.7 }}>
                    Class is full
                  </div>
                )}
              </div>
            );
          }}
```

- [ ] **Step 1: Apply the replacement above**

- [ ] **Step 2: Verify lint passes**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 3: Start dev server and visually verify event cards**

```bash
yarn dev
```

Open http://localhost:3000. Navigate to Calendar view. Confirm:
- Event cards show tinted background + left dark accent border
- Text is dark subject color (not black)
- Pin icon appears before venue name
- "Free Trial/Registration" text is gone
- Full slots show grey tint + "Class is full" text

- [ ] **Step 4: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: apply tinted card style with left accent border to calendar events"
```

---

## Task 4: Update dayHeaderContent with class count

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (`dayHeaderContent` prop, around lines 405–410)

Find:
```typescript
          dayHeaderContent={(args: any) => {
            // Show only the day name, not the date
            return args.date.toLocaleDateString(undefined, {
              weekday: "short",
            });
          }}
```

Replace with:
```typescript
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dayHeaderContent={(args: any) => {
            const dayName = args.date
              .toLocaleDateString(undefined, { weekday: "short" })
              .toUpperCase();
            const count = events.filter(
              (e) => e.start.toDateString() === args.date.toDateString()
            ).length;
            return (
              <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{dayName}</div>
                {count > 0 && (
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 400, marginTop: "1px" }}>
                    {count} class{count !== 1 ? "es" : ""}
                  </div>
                )}
              </div>
            );
          }}
```

Also remove the now-redundant `dayHeaderFormat` prop (it's superseded by `dayHeaderContent`):
```typescript
          dayHeaderFormat={{ weekday: "short" }}
```
Delete that line.

- [ ] **Step 1: Apply both changes above**

- [ ] **Step 2: Verify lint passes**

```bash
yarn lint
```

- [ ] **Step 3: Visually verify in browser (dev server from Task 3 can remain running)**

Confirm each day column header shows "MON", "TUE" etc. with a class count below (e.g., "3 classes", "1 class").

- [ ] **Step 4: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: add class count below day name in calendar column headers"
```

---

## Task 5: Update hover animation and reset FullCalendar event styles

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (`<style jsx>` block, lines 346–357)

Find the entire style block:
```typescript
      <style jsx>{`
        :global(.fc-v-event) {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        :global(.fc-v-event:hover) {
          transform: scale(1.05) translateY(-1px) !important;
          filter: brightness(0.9) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>
```

Replace with:
```typescript
      <style jsx>{`
        :global(.fc-v-event) {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          background: transparent !important;
          border: none !important;
        }
        :global(.fc-v-event:hover) {
          transform: translateY(-1px) scale(1.02) !important;
          filter: brightness(1.04) !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
        }
      `}</style>
```

The `background: transparent` and `border: none` lines prevent FullCalendar from painting its own background over the inner card div rendered in `eventContent`. Without these, FullCalendar's inline styles would cover the tinted background.

- [ ] **Step 1: Apply the replacement above**

- [ ] **Step 2: Visually verify in browser**

Hover over events. Confirm:
- Cards lift slightly (1px up) with a very subtle scale
- Cards get slightly brighter (not darker) on hover
- No double background from FullCalendar's own styles

- [ ] **Step 3: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: update event hover animation and reset FullCalendar default styles"
```

---

## Task 6: Add subject legend bar

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx`

- [ ] **Step 1: Add LEGEND_ITEMS constant**

After the `primarySubjectToColorMap` declaration (around line 172), add:

```typescript
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
```

- [ ] **Step 2: Add legend JSX after the FullCalendar wrapper div**

In the return JSX, find the closing `</div>` of the FullCalendar container div (the one with `className="relative overflow-hidden..."`). Add the legend immediately after it:

```tsx
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
        {LEGEND_ITEMS.map(({ label, color, tint }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              color,
              fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                background: tint,
                borderLeft: `2px solid ${color}`,
                borderRadius: "2px",
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        ))}
      </div>
```

- [ ] **Step 3: Verify lint passes**

```bash
yarn lint
```

- [ ] **Step 4: Visually verify in browser**

Confirm the legend row appears below the calendar grid showing all 13 subject swatches with matching tint + border colors.

- [ ] **Step 5: Commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: add subject color legend below calendar grid"
```

---

## Task 7: Update calendar container styling

**Files:**
- Modify: `src/components/WeeklyClassCalendar.tsx` (around line 391)

Find:
```tsx
      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
```

Replace with:
```tsx
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
```

`rounded-2xl` = 16px border-radius. `border-slate-200` = `#E2E8F0`. The softer shadow replaces Tailwind's `shadow-sm`.

- [ ] **Step 1: Apply the replacement above**

- [ ] **Step 2: Run full verification**

```bash
yarn lint && yarn test
```

Expected: lint clean, all tests pass.

- [ ] **Step 3: Visually verify the full calendar in browser**

Check the complete feature end-to-end:
- Calendar container has rounded corners and soft shadow
- Event cards: tinted bg, left border, dark text, pin icon + venue, no CTA text
- Day headers: uppercase + class count
- Full slots: grey tint, "Class is full"
- Hovering events: slight lift + brighten
- Legend bar visible below calendar
- Clicking an event opens the modal (unchanged layout)
- Pro tip banner still shows/dismisses correctly
- Filters still work

- [ ] **Step 4: Final commit**

```bash
git add src/components/WeeklyClassCalendar.tsx
git commit -m "feat: soften calendar container shadow and border-radius"
```

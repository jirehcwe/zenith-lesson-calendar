# Jest Testing Setup — Design Spec

**Date:** 2026-05-12
**Branch:** bryan/feat/ui-improvements
**Status:** Approved

---

## Overview

Add Jest unit testing to the `zenith-lesson-calendar` Next.js 15 project. Tests cover pure utility functions and React components. Developers run tests via `npm run test` or `yarn test`.

---

## 1. Configuration & Setup

### New files

| File | Purpose |
|---|---|
| `jest.config.ts` | Wraps `next/jest()` factory; sets `jsdom` test environment; points at `jest.setup.ts` |
| `jest.setup.ts` | Imports `@testing-library/jest-dom` to extend Jest matchers |

### package.json script additions

```json
"test": "jest",
"test:coverage": "jest --coverage"
```

### New dev dependencies

| Package | Version constraint | Purpose |
|---|---|---|
| `jest` | `^29` | Test runner |
| `jest-environment-jsdom` | `^29` | Browser-like DOM for component tests |
| `@testing-library/react` | `^16` | Component render + query utilities |
| `@testing-library/jest-dom` | `^6` | Custom matchers (`.toBeInTheDocument`, `.toHaveTextContent`) |
| `@testing-library/user-event` | `^14` | Simulates real user interactions (clicks, typing) |
| `@types/jest` | `^29` | TypeScript types for Jest globals |

---

## 2. Pure Function Extraction

Two functions are extracted from components into standalone utility files so they can be unit tested independently.

### `src/utils/filters.ts`

Extracted from `src/app/page.tsx`. Exports `applyFilters(sessions, filters)`.

`page.tsx` imports it back — no behaviour change, just a boundary shift.

### `src/utils/dates.ts`

Extracted from `src/components/ListView.tsx`. Exports `normalizeDate(raw)`.

`ListView.tsx` imports it back — no behaviour change.

### Not extracted

`toggleOption` in `Filters.tsx` is 2 lines of inline logic. It is tested through `MultiSelect` component interaction rather than extracted (extraction would be over-engineering for this size).

---

## 3. Test File Structure

Tests are co-located with their source files using the `.test.tsx` / `.test.ts` suffix.

```
src/
  utils/
    filters.ts
    dates.ts
    __tests__/
      filters.test.ts
      dates.test.ts
  components/
    Filters.tsx
    Filters.test.tsx
    ListView.tsx
    ListView.test.tsx
    CalendarView.tsx
    CalendarView.test.tsx
    SignupBanner.tsx
    SignupBanner.test.tsx
    BottomBanner.tsx
    BottomBanner.test.tsx
```

---

## 4. Test Coverage Plan

### Pure function tests (no DOM)

**`filters.test.ts` — `applyFilters`**
- Empty filters → returns all sessions unchanged
- Single subject filter → returns only matching sessions
- Multiple filters combined → intersection of all active filters
- No sessions match → returns empty array

**`dates.test.ts` — `normalizeDate`**
- Valid date string ("24 May") → returns "2025-05-24"
- Invalid string → returns `null`
- Empty string → returns `null`

### Component tests (React Testing Library)

**`Filters.test.tsx`**
- Renders Subject, Topic, and Centre dropdowns
- Clicking an option calls `onFilterChange` with the selected value included
- Clicking a selected option calls `onFilterChange` with the value removed (deselect)

**`ListView.test.tsx`**
- Renders a card for each session in the `sessions` prop
- When `calendarFilter` is set, only sessions matching that date are displayed
- When no sessions match the filter, no cards are rendered

**`CalendarView.test.tsx`**
- Dialog is closed on initial render
- Clicking an event (via FullCalendar mock) opens the dialog with correct session details
- Clicking the close button dismisses the dialog
- Registration link renders when `prefill` is non-empty on the selected event

**`SignupBanner.test.tsx` / `BottomBanner.test.tsx`**
- Component renders without crashing
- Signup link is present in the DOM

---

## 5. Mocking Strategy

### FullCalendar (`@fullcalendar/react`)

FullCalendar renders almost nothing in jsdom. It is replaced with a Jest manual mock:

```tsx
// src/__mocks__/@fullcalendar/react.tsx
const FullCalendar = ({ eventClick, events }: any) => (
  <div data-testid="fullcalendar">
    {events?.map((e: any, i: number) => (
      <button key={i} onClick={() => eventClick({ event: e })}>
        {e.title}
      </button>
    ))}
  </div>
);
export default FullCalendar;
```

### Vercel Analytics (`@vercel/analytics`)

Mocked inline in tests that import components using `track`:

```ts
jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));
```

This prevents real network calls and allows asserting `track` was invoked.

### CSS / global styles

Handled automatically by `next/jest` — CSS imports return empty objects.

---

## 6. Out of Scope

- `src/app/page.tsx` component render test — the full page fetches data via `useEffect` and requires extensive mocking of `fetch`. Not worth the complexity for this initial setup; covered indirectly through `Filters`, `ListView`, and utility tests.
- `src/app/layout.tsx` — layout boilerplate, no testable logic.
- FullCalendar interaction testing beyond dialog open/close — the library's internal calendar grid does not render in jsdom.
- E2E / integration tests (Playwright, Cypress) — out of scope for this spec.

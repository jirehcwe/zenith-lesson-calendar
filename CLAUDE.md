# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `yarn dev` — Start Next.js dev server (http://localhost:3000)
- `yarn build` — Static export to `/out` directory
- `yarn lint` — ESLint with Next.js rules
- `yarn extract-form` — Extract Google Forms prefill options (requires `.env`)

Package manager is **Yarn 4.9.2** (via Corepack). No test suite is configured.

## Architecture

**Static Next.js 15 app** (App Router, `output: "export"`) with React 19, deployed to Vercel. Fully client-side rendered — all components use `"use client"`.

### Data Flow

Schedule data is fetched from `https://api.schedule.myzenithstudy.com/schedule?year=<currentYear>` and cached in localStorage for 5 minutes (`CACHE_DURATION`) with version-based invalidation (`CACHE_VERSION` — bump it when the API response shape changes to force all clients to re-fetch). The endpoint is owned by the telebot `db-schedule-updater` Lambda (`telebot/scripts/lambdas/db-schedule-updater/`), reading from `telebot.ClassSlot`; do **not** confuse it with lms-backend's `lms-api.myzenithstudy.com/schedule`, which is a separate Sheet-reading read-through route. Response rows include `classSlotId`, `title`, `day`, `startTime`, `endTime`, `subjects` (array — formerly `subject` singular; bump `CACHE_VERSION` if you depend on the shape), `tutor`, `centre`, `stream`, `level`, plus `prefillTrialLink` / `prefillRegistrationLink`. The main `page.tsx` is the central state container — it holds all filter state, fetched data, and passes filtered results down to view components.

### Filter System

Filters use progressive disclosure: stream is the primary filter that constrains available levels. Each filter option displays a count of matching results. Filter state is persisted in URL query parameters and localStorage. Options with zero results show as disabled with strikethrough.

### Views

Two display modes toggled via URL param: **Calendar** (FullCalendar TimeGrid, color-coded by subject with separate palettes for JC/Secondary/Primary streams) and **List** (tabular view). Desktop uses `ViewSelector` top nav; mobile uses `BottomNav`.

### Registration Flow

Clicking a class links to Google Forms with prefilled fields. Prefill URLs are mapped by level in `src/utils/prefillRegistration.ts`. Campaign tracking codes pass through URL parameters (`src/utils/campaign.ts`).

## Key Types

```typescript
type WeeklyClassSlot = {
  day: number; startTime: string; endTime: string;
  subjects: string[]; tutor: string; centre: string;
  stream: string; level: string;
  prefillTrialLink: string; prefillRegistrationLink?: string;
};
```

`subjects` is an array to support combined classes (e.g. Combined + Pure Humanities, A Math + E Math taught in one session). Render with `subjects.join(" + ")`; use `subjects[0]` only for icon/color anchoring (see `WeeklyClassCalendar.tsx:319,471`).

## Path Alias

`@/*` maps to `./src/*`

## Styling

Tailwind CSS 4 with custom CSS variables and utility classes defined in `src/app/globals.css` (`.btn-primary`, `.btn-secondary`, `.hero-gradient`, `.modern-card`). Components use inline Tailwind classes.

## Conventions

- Functional components only, PascalCase filenames
- Constants in ALL_CAPS (e.g., `CACHE_KEY`, `FILTERS_COLLAPSED_STORAGE_KEY`)
- TypeScript strict mode enabled
- CORS headers configured for `https://www.zenitheducationstudio.com`
- ESLint ignores `/scripts/` directory

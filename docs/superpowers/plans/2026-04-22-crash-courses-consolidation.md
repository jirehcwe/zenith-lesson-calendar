# Crash Courses Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse `sept-jc-cc` and `sept-ss-cc` into a single `crash-courses` branch driven by `NEXT_PUBLIC_CC_SLUG`, port eligible `regular-lessons` improvements, and rewire the two Cloudflare Pages projects to deploy from the new branch.

**Architecture:** Per-CC config lives in `crash-courses/<slug>/` as a `config.ts` (metadata, copy, colors, CTAs, date range, form URLs) + `sessions.json` (fixed-date `Session[]`). A resolver at `crash-courses/index.ts` reads the env var at build time and fails the build loudly on missing/unknown slugs. All consumers (`layout.tsx`, `page.tsx`, banners, views) take their content from the resolved config.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript, Tailwind, FullCalendar, Headless UI, Cloudflare Pages, wrangler, `@vercel/analytics` (kept from existing).

**Reference spec:** `docs/superpowers/specs/2026-04-22-crash-courses-consolidation-design.md`

**Note on testing:** This project has no test framework. Verification per task is `npm run lint && NEXT_PUBLIC_CC_SLUG=<slug> npm run build`, plus manual visual inspection in `npm run dev` where UI changes are involved.

**Note on branch starting point:** Start from `sept-ss-cc` (simpler component tree that already matches the fixed-date CC model). Port improvements **onto** it from `regular-lessons` rather than starting from `regular-lessons` and stripping.

---

## Task 1: Create `crash-courses` branch and prune stale artifacts

**Files:**
- Create branch: `crash-courses` from `sept-ss-cc`

- [ ] **Step 1: Cut the new branch**

```bash
git checkout sept-ss-cc
git pull origin sept-ss-cc
git checkout -b crash-courses
```

- [ ] **Step 2: Verify starting state**

```bash
ls src/components/
# Expect: BottomBanner.tsx CalendarView.tsx Filters.tsx ListView.tsx SignupBanner.tsx
ls public/
# Expect: sessions-jc.json sessions-ss.json zenith_banner.jpg (plus svgs)
```

- [ ] **Step 3: Commit marker**

```bash
git commit --allow-empty -m "chore: start crash-courses consolidation branch"
```

---

## Task 2: Scaffold `crash-courses/types.ts`

**Files:**
- Create: `crash-courses/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// crash-courses/types.ts
import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type BannerContent = {
  headline?: string;
  body: string;      // may contain inline JSX-like markers later; keep as string for now
  ctaLabel: string;
  ctaHref: string;   // may contain "SCHEDULE" and "PROMOCODE" placeholders
};

export type CalendarUIConfig = {
  firstDay: number;              // 0=Sun, 1=Mon
  initialDate: string;           // ISO YYYY-MM-DD, the date the calendar lands on
  slotMinTime: string;           // "HH:MM:SS"
  slotMaxTime: string;           // "HH:MM:SS"
  listViewMinDate: string;       // ISO YYYY-MM-DD for the datepicker minDate
  tip?: { label: string; body: string } | null;
};

export type CrashCourseConfig = {
  slug: string;
  metadata: { title: string; description: string };
  dateRange: { start: string; end: string };         // ISO YYYY-MM-DD
  year: number;                                      // used when parsing "06 Sep" style dates
  subjectColors: Record<string, SubjectColor>;
  signupBanner: BannerContent & { imageSrc: string; imageAlt: string };
  bottomBanner: BannerContent;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;                       // base form URL, with SCHEDULE/PROMOCODE placeholders
  campaignField: string;                             // e.g. "entry.1157532004" — where SCHEDULE goes
  promocodeField?: string;                           // optional, for PROMOCODE prefill
  sessions: Session[];
};
```

- [ ] **Step 2: Verify it typechecks**

```bash
npx tsc --noEmit
# Expect: no errors (Session import will resolve via existing tsconfig paths)
```

- [ ] **Step 3: Commit**

```bash
git add crash-courses/types.ts
git commit -m "feat(cc): add CrashCourseConfig type"
```

---

## Task 3: Move SS data into `crash-courses/ss-sep-2025/`

**Files:**
- Create: `crash-courses/ss-sep-2025/sessions.json` (moved from `public/sessions-ss.json`)
- Create: `crash-courses/ss-sep-2025/config.ts`
- Delete: `public/sessions-ss.json`, `public/sessions-ss.csv` (CSV moves to `crash-courses/ss-sep-2025/sessions.csv`)

- [ ] **Step 1: Move the data files**

```bash
mkdir -p crash-courses/ss-sep-2025
git mv public/sessions-ss.json crash-courses/ss-sep-2025/sessions.json
git mv public/sessions-ss.csv crash-courses/ss-sep-2025/sessions.csv
```

- [ ] **Step 2: Add JSON module resolution to tsconfig**

Open `tsconfig.json`, ensure `compilerOptions.resolveJsonModule: true` and `compilerOptions.esModuleInterop: true` are present. If already present, skip.

```bash
cat tsconfig.json
```

Add only if missing:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

- [ ] **Step 3: Write SS config**

Create `crash-courses/ss-sep-2025/config.ts`:

```ts
import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "ss-sep-2025",
  metadata: {
    title: "Zenith September SS Crash Course Scheduler",
    description: "Sign up for Zenith Secondary Crash Course now!",
  },
  dateRange: { start: "2025-09-01", end: "2025-09-14" },
  year: 2025,
  subjectColors: {
    Mathematics: { backgroundColor: "#FED966", textColor: "#000000" },
    Math: { backgroundColor: "#FED966", textColor: "#000000" },
    "IP Math": { backgroundColor: "#FED966", textColor: "#000000" },
    "A Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "E Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "Pure Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Combined Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    Chemistry: { backgroundColor: "#C27BA0", textColor: "#000000" },
    Science: { backgroundColor: "#C27BA0", textColor: "#000000" },
    "IP Science": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Pure Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Combined Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Pure Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    "Combined Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    English: { backgroundColor: "#DD7E6B", textColor: "#000000" },
    "IP English": { backgroundColor: "#DD7E6B", textColor: "#000000" },
  },
  signupBanner: {
    imageSrc: "/zenith_banner.jpg",
    imageAlt: "Zenith Banner",
    body:
      "This website will help you plan out the crash course slots you wish to attend\n\n" +
      "Ready to lock in for your exams?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=pp_url&entry.1157532004=SCHEDULE",
  },
  bottomBanner: {
    body: "Ready to lock in for your exams?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2025-09-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2025-09-06",
    tip: {
      label: "Tip",
      body:
        "There are more crash course slots in September! Use the right arrow to navigate to the September calendar.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
# Expect: no errors
```

- [ ] **Step 5: Commit**

```bash
git add crash-courses/ss-sep-2025/ tsconfig.json
git commit -m "feat(cc): migrate SS September 2025 data + config"
```

---

## Task 4: Move JC data into `crash-courses/jc-sep-2025/`

**Files:**
- Create: `crash-courses/jc-sep-2025/sessions.json` (from `sept-jc-cc` branch's `public/sessions-jc.json`)
- Create: `crash-courses/jc-sep-2025/config.ts`
- Delete: `public/sessions-jc.json`, `public/sessions-jc.csv`

- [ ] **Step 1: Pull JC data from sept-jc-cc branch**

The current `crash-courses` branch (forked from `sept-ss-cc`) has `public/sessions-jc.json` but it's actually the SS-era stale copy. Take the authoritative JC data from `sept-jc-cc`:

```bash
mkdir -p crash-courses/jc-sep-2025
git show sept-jc-cc:public/sessions-jc.json > crash-courses/jc-sep-2025/sessions.json
git show sept-jc-cc:public/sessions-jc.csv > crash-courses/jc-sep-2025/sessions.csv
git rm public/sessions-jc.json public/sessions-jc.csv
```

- [ ] **Step 2: Write JC config**

Create `crash-courses/jc-sep-2025/config.ts`:

```ts
import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "jc-sep-2025",
  metadata: {
    title: "Zenith September JC Crash Course Scheduler",
    description: "Sign up for Zenith JC Crash Course now!",
  },
  dateRange: { start: "2025-09-01", end: "2025-09-14" },
  year: 2025,
  subjectColors: {
    GP: { backgroundColor: "#FBBC03", textColor: "#000000" },
    "General Paper": { backgroundColor: "#FBBC03", textColor: "#000000" },
    Biology: { backgroundColor: "#95B0F0", textColor: "#000000" },
    Physics: { backgroundColor: "#FC696A", textColor: "#000000" },
    Chemistry: { backgroundColor: "#FFFF02", textColor: "#000000" },
    Mathematics: { backgroundColor: "#BFFCFF", textColor: "#000000" },
    Economics: { backgroundColor: "#7BFF85", textColor: "#000000" },
  },
  signupBanner: {
    imageSrc: "/zenith_banner.jpg",
    imageAlt: "Zenith Banner",
    body:
      "This website will help you plan out the crash course slots you wish to attend\n\n" +
      "Ready to lock in for promos?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=pp_url&entry.1157532004=SCHEDULE",
  },
  bottomBanner: {
    body: "Ready to lock in for promos?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2025-09-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2025-09-06",
    tip: null,
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
```

Verify the form URL and subject keys against `git show sept-jc-cc:src/components/SignupBanner.tsx` and `git show sept-jc-cc:src/app/page.tsx` before committing.

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add crash-courses/jc-sep-2025/ public/
git commit -m "feat(cc): migrate JC September 2025 data + config"
```

---

## Task 5: Write the config resolver

**Files:**
- Create: `crash-courses/index.ts`

- [ ] **Step 1: Write the resolver**

```ts
// crash-courses/index.ts
import type { CrashCourseConfig } from "./types";
import jcSep2025 from "./jc-sep-2025/config";
import ssSep2025 from "./ss-sep-2025/config";

const REGISTRY: Record<string, CrashCourseConfig> = {
  "jc-sep-2025": jcSep2025,
  "ss-sep-2025": ssSep2025,
};

export function getCrashCourseConfig(): CrashCourseConfig {
  const slug = process.env.NEXT_PUBLIC_CC_SLUG;
  if (!slug) {
    throw new Error(
      "NEXT_PUBLIC_CC_SLUG is not set. Set it in the Cloudflare Pages project env vars (e.g. `ss-sep-2025` or `jc-sep-2025`)."
    );
  }
  const config = REGISTRY[slug];
  if (!config) {
    throw new Error(
      `Unknown crash course slug: "${slug}". Known slugs: ${Object.keys(REGISTRY).join(", ")}`
    );
  }
  return config;
}

export type { CrashCourseConfig } from "./types";
```

- [ ] **Step 2: Verify build fails without env var**

```bash
unset NEXT_PUBLIC_CC_SLUG
npm run build
# Expect: build will still succeed here because resolver isn't imported yet.
# This is the baseline — we'll re-verify this fails in Task 15 after wiring consumers.
```

- [ ] **Step 3: Commit**

```bash
git add crash-courses/index.ts
git commit -m "feat(cc): add slug resolver with build-time guard"
```

---

## Task 6: Refactor `src/types.ts` — drop hardcoded dates

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Remove START_DATE / END_DATE exports**

Replace the entire content of `src/types.ts` with:

```ts
export type Session = {
  subject: string;
  tutor: string;
  centre: string;
  classroom: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  level: string;
  prefill: string;
  prefillField: string;
  displaySubject: string;
};
```

- [ ] **Step 2: Verify typecheck reports the expected errors**

```bash
npx tsc --noEmit
# Expect: errors in src/app/page.tsx, src/components/CalendarView.tsx, src/components/ListView.tsx
# for missing START_DATE / END_DATE — these are fixed in Tasks 7, 8, 11.
```

Don't commit yet; the next tasks fix the downstream consumers in the same commit boundary.

---

## Task 7: Refactor `src/app/layout.tsx` to consume config metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace hardcoded metadata**

Replace the content of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCrashCourseConfig } from "../../crash-courses";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const config = getCrashCourseConfig();

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

Note: the relative import `../../crash-courses` (not `@/`) avoids needing to extend `tsconfig` paths outside `src/`.

- [ ] **Step 2: Verify build fails without env var**

```bash
unset NEXT_PUBLIC_CC_SLUG
npm run build
# Expect: build fails with "NEXT_PUBLIC_CC_SLUG is not set"
```

- [ ] **Step 3: Verify build succeeds with slug**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
# Expect: build succeeds, metadata title is "Zenith September SS Crash Course Scheduler"
```

Don't commit yet — `page.tsx` still imports `START_DATE`/`END_DATE`.

---

## Task 8: Refactor `src/app/page.tsx` to consume config

**Files:**
- Modify: `src/app/page.tsx`

This is the central refactor. Remove: fetch effect, hardcoded color maps, JC-vs-Sec branching via `level.includes("J")`.

- [ ] **Step 1: Rewrite `page.tsx`**

Replace the entire content of `src/app/page.tsx` with:

```tsx
"use client";

import { useState, useMemo } from "react";
import CalendarView from "../components/CalendarView";
import ListView from "../components/ListView";
import Filters from "../components/Filters";
import { Session } from "../types";
import SignupBanner from "../components/SignupBanner";
import BottomBanner from "@/components/BottomBanner";
import { getCrashCourseConfig } from "../../crash-courses";

const config = getCrashCourseConfig();

function hexToHsv(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex({ h, s, v }: { h: number; s: number; v: number }) {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function Page() {
  const sessions: Session[] = config.sessions;
  const [filters, setFilters] = useState({
    subject: [] as string[],
    topic: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calendarFilter, setCalendarFilter] = useState<string | null>(null);

  const applyFilters = (list: Session[]) =>
    list.filter(
      (s) =>
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.topic.length === 0 ||
          filters.topic.includes(`[${s.subject}] ${s.topic}`)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
    );

  const calendarFilteredSessions = useMemo(
    () => applyFilters(sessions),
    [sessions, filters]
  );
  const listFilteredSessions = useMemo(
    () => applyFilters(sessions),
    [sessions, filters]
  );

  const events = useMemo(() => {
    return calendarFilteredSessions.map((s) => {
      const isFull = s.prefill.length === 0;
      const color = config.subjectColors[s.displaySubject];
      if (!color) {
        throw new Error(
          `No color found for displaySubject="${s.displaySubject}" in config "${config.slug}". Add it to subjectColors.`
        );
      }
      const hsv = hexToHsv(color.backgroundColor);
      const darkerHex = hsvToHex({ h: hsv.h, s: hsv.s, v: hsv.v * 0.8 });
      return {
        title: s.subject,
        start: new Date(`${s.date} ${config.year} ${s.startTime}`),
        end: new Date(`${s.date} ${config.year} ${s.endTime}`),
        extendedProps: { ...s },
        backgroundColor: isFull ? darkerHex : color.backgroundColor,
        textColor: color.textColor,
      };
    });
  }, [calendarFilteredSessions]);

  const topicOptions = useMemo(() => {
    const filtered =
      filters.subject.length === 0
        ? sessions
        : sessions.filter((s) => filters.subject.includes(s.subject));
    const combined = filtered.map((s) => `[${s.subject}] ${s.topic}`);
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));
  }, [sessions, filters.subject]);

  return (
    <div>
      <SignupBanner />
      <div className="p-4 space-y-6 text-sm md:text-base">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded ${
              viewMode === "calendar" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded ${
              viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            List View
          </button>
        </div>

        <Filters
          subjects={[...new Set(sessions.map((s) => s.subject))]}
          topics={topicOptions}
          centres={[...new Set(sessions.map((s) => s.centre))]}
          tutors={[...new Set(sessions.map((s) => s.tutor))]}
          filters={filters}
          onFilterChange={setFilters}
        />

        {viewMode === "calendar" ? (
          <CalendarView events={events} />
        ) : (
          <ListView
            sessions={listFilteredSessions}
            calendarFilter={calendarFilter}
            onCalendarFilterChange={setCalendarFilter}
          />
        )}
      </div>
      <BottomBanner />
    </div>
  );
}
```

Key changes from the sept-ss-cc original:
- `useEffect(() => fetch(...))` → `config.sessions` (synchronous).
- Inline `jcSubjectToColorMap` / `secSubjectToColorMap` → `config.subjectColors`.
- `level.includes("J")` branching removed — color lookup is a flat map keyed by `displaySubject`.
- `2025` hardcoded in `new Date(...)` strings → `config.year`.

- [ ] **Step 2: Verify build for both slugs**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build
# Expect: both succeed.
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat(cc): config-drive layout + page + types"
```

---

## Task 9: Refactor `SignupBanner` and `BottomBanner` to consume config

**Files:**
- Modify: `src/components/SignupBanner.tsx`
- Modify: `src/components/BottomBanner.tsx`

- [ ] **Step 1: Rewrite `SignupBanner.tsx`**

Replace the entire content with:

```tsx
"use client";

import Image from "next/image";
import { getCrashCourseConfig } from "../../crash-courses";

const { signupBanner } = getCrashCourseConfig();

export default function SignupBanner() {
  // Render body paragraphs split by \n\n
  const paragraphs = signupBanner.body.split("\n\n");
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <Image
        width={1000}
        height={1000}
        src={signupBanner.imageSrc}
        alt={signupBanner.imageAlt}
        className="w-full object-cover rounded"
      />
      <div className="text-sm font-semibold">
        {paragraphs.map((p, i) => (
          <span key={i}>
            {p}
            {i < paragraphs.length - 1 && (
              <>
                <br />
                <br />
              </>
            )}
          </span>
        ))}{" "}
        <a
          href={signupBanner.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {signupBanner.ctaLabel}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `BottomBanner.tsx`**

Replace the entire content with:

```tsx
"use client";

import { getCrashCourseConfig } from "../../crash-courses";

const { bottomBanner } = getCrashCourseConfig();

export default function BottomBanner() {
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <div className="text-sm font-semibold">
        {bottomBanner.body}{" "}
        <a
          href={bottomBanner.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {bottomBanner.ctaLabel}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build and visual inspection**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

Open `http://localhost:3000`. Confirm banner image, headline text, CTA label, and CTA link match `ss-sep-2025/config.ts`. Stop server.

```bash
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run dev
```

Confirm JC banner text says "Ready to lock in for promos?" and the form link is the JC one. Stop.

- [ ] **Step 4: Commit**

```bash
git add src/components/SignupBanner.tsx src/components/BottomBanner.tsx
git commit -m "feat(cc): config-drive banner components"
```

---

## Task 10: Port `campaign.ts` utility from `regular-lessons`

**Files:**
- Create: `src/utils/campaign.ts`

- [ ] **Step 1: Create the utility**

Write `src/utils/campaign.ts`:

```ts
/**
 * URL placeholder replacement utilities.
 * - SCHEDULE is replaced with the `?campaign=` URL param (fallback: "SCHEDULE")
 * - PROMOCODE is replaced with the `?promocode=` URL param (fallback: "")
 */

export function getCampaignParam(): string {
  if (typeof window === "undefined") return "SCHEDULE";
  return new URLSearchParams(window.location.search).get("campaign") || "SCHEDULE";
}

export function replaceCampaignInUrl(url: string): string {
  return url.replace(/SCHEDULE/g, getCampaignParam());
}

export function getPromocodeParam(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("promocode") || "";
}

export function replacePromocodeInUrl(url: string): string {
  return url.replace(/PROMOCODE/g, getPromocodeParam());
}

/** Convenience: apply both replacements. */
export function replaceUrlPlaceholders(url: string): string {
  return replacePromocodeInUrl(replaceCampaignInUrl(url));
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/campaign.ts
git commit -m "feat(cc): add campaign + promocode URL param utilities"
```

---

## Task 11: Refactor `CalendarView` — config-drive, port campaign replacement

**Files:**
- Modify: `src/components/CalendarView.tsx`

- [ ] **Step 1: Rewrite CalendarView**

Replace the entire content of `src/components/CalendarView.tsx` with:

```tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Session } from "../types";
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { getCrashCourseConfig } from "../../crash-courses";
import { replaceUrlPlaceholders } from "@/utils/campaign";

const config = getCrashCourseConfig();

function buildRegistrationUrl(session: Session): string {
  const base = config.registrationFormUrl;
  const joiner = base.includes("?") ? "&" : "?";
  const raw = `${base}${joiner}entry.${session.prefillField}=${encodeURIComponent(session.prefill)}`;
  return replaceUrlPlaceholders(raw);
}

export default function CalendarView({
  events,
}: {
  events: {
    title: string;
    start: Date;
    end: Date;
    extendedProps: Session;
    backgroundColor: string;
    textColor: string;
  }[];
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    title: string;
    start: Date;
    end: Date;
    extendedProps: Session;
    backgroundColor: string;
    textColor: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setIsDialogOpen(true);
  };

  return (
    <>
      {config.calendar.tip && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">{config.calendar.tip.label}:</span>{" "}
              {config.calendar.tip.body}
            </p>
          </div>
        </div>
      )}
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        validRange={{
          start: new Date(config.dateRange.start),
          end: new Date(config.dateRange.end),
        }}
        firstDay={config.calendar.firstDay}
        initialDate={config.calendar.initialDate}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: isMobile ? "timeGridWeek" : "timeGridWeek,dayGridMonth",
        }}
        views={{
          timeGridThreeDay: {
            type: "timeGrid",
            duration: { days: 3 },
            buttonText: "3 day",
          },
        }}
        events={events}
        nowIndicator={true}
        height="auto"
        slotMinTime={config.calendar.slotMinTime}
        slotMaxTime={config.calendar.slotMaxTime}
        allDaySlot={false}
        displayEventEnd={true}
        eventContent={(arg) => {
          const topic = arg.event.extendedProps.topic;
          const centre = arg.event.extendedProps.centre;
          const hasPrefill = arg.event.extendedProps.prefill;
          return (
            <div className="p-1 overflow-hidden h-full text-xs leading-tight">
              <div className="font-semibold truncate mb-1" title={arg.event.title}>
                {arg.event.title}
              </div>
              {topic && (
                <div className="opacity-80 truncate" title={`Topic: ${topic}`}>
                  Topic: {topic}
                </div>
              )}
              {centre && (
                <div className="opacity-80 truncate" title={`Centre: ${centre}`}>
                  Centre: {centre}
                </div>
              )}
              <div
                className={`mt-1 truncate ${
                  hasPrefill
                    ? "underline cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }`}
              >
                {hasPrefill ? "Click to register" : "Class Full"}
              </div>
            </div>
          );
        }}
        eventClick={handleEventClick}
      />
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/30">
          <DialogPanel className="max-w-md w-full space-y-4 border bg-white p-6 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setIsDialogOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {selectedEvent && (
              <>
                <DialogTitle className="font-bold text-lg mb-2">
                  {selectedEvent.extendedProps.subject} -{" "}
                  {selectedEvent.extendedProps.topic} -{" "}
                  {selectedEvent.extendedProps.level}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedEvent.extendedProps.date}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Venue:</span>{" "}
                    {selectedEvent.extendedProps.centre}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Timeslot:</span>{" "}
                    {selectedEvent.extendedProps.startTime} -{" "}
                    {selectedEvent.extendedProps.endTime}
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              {selectedEvent?.extendedProps.prefill ? (
                <a
                  href={buildRegistrationUrl(selectedEvent.extendedProps)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Register (prefilled)
                  </button>
                </a>
              ) : (
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                  disabled
                >
                  Class Full
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
```

Key ports from regular-lessons:
- `buildRegistrationUrl` helper uses `replaceUrlPlaceholders` so both SCHEDULE (campaign) and PROMOCODE are substituted.
- Calendar settings (`firstDay`, `initialDate`, `slotMinTime`, `slotMaxTime`) come from config.
- Tip banner is now conditional on `config.calendar.tip`.

- [ ] **Step 2: Verify dev run**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

- Click a non-full slot → register URL opens with the SS form.
- Append `?campaign=TEST&promocode=PROMO1` to the dev URL, click register → confirm the opened form URL contains `entry.1157532004=TEST` (not SCHEDULE) and the PROMOCODE replacement (no-op here unless the SS `registrationFormUrl` includes PROMOCODE — it doesn't yet, which is fine).

```bash
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run dev
```

Confirm JC slots open with the JC form URL.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "feat(cc): config-drive CalendarView + port campaign/promocode replacement"
```

---

## Task 12: Refactor `ListView` — config-drive, port campaign replacement

**Files:**
- Modify: `src/components/ListView.tsx`

- [ ] **Step 1: Rewrite ListView**

Replace the entire content with:

```tsx
"use client";

import { Session } from "../types";
import DatePicker from "react-datepicker";
import { getCrashCourseConfig } from "../../crash-courses";
import { replaceUrlPlaceholders } from "@/utils/campaign";

const config = getCrashCourseConfig();

function buildRegistrationUrl(session: Session): string {
  const base = config.registrationFormUrl;
  const joiner = base.includes("?") ? "&" : "?";
  const raw = `${base}${joiner}entry.${session.prefillField}=${encodeURIComponent(session.prefill)}`;
  return replaceUrlPlaceholders(raw);
}

export default function ListView({
  sessions,
  calendarFilter,
  onCalendarFilterChange,
}: {
  sessions: Session[];
  calendarFilter: string | null;
  onCalendarFilterChange: (date: string | null) => void;
}) {
  const normalizeDate = (raw: string): string | null => {
    const parsed = Date.parse(`${raw} ${config.year}`);
    if (isNaN(parsed)) return null;
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const filtered = calendarFilter
    ? sessions.filter((s) => normalizeDate(s.date) === calendarFilter)
    : sessions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="font-semibold">Date:</label>
        <DatePicker
          selected={calendarFilter ? new Date(calendarFilter) : null}
          onChange={(date) => {
            if (!date) {
              onCalendarFilterChange(null);
            } else {
              const year = date.getFullYear();
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const day = date.getDate().toString().padStart(2, "0");
              onCalendarFilterChange(`${year}-${month}-${day}`);
            }
          }}
          placeholderText="Select date"
          className="border p-2 rounded"
          dateFormat="yyyy-MM-dd"
          isClearable
          minDate={new Date(config.calendar.listViewMinDate)}
          maxDate={new Date(config.dateRange.end)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={`${s.date}-${s.startTime}-${s.tutor}`}
            className={`p-4 border rounded shadow flex flex-col ${
              s.prefill ? "" : "opacity-60"
            }`}
          >
            <div className="font-semibold">{s.subject}</div>
            <div className="text-sm opacity-80">Topic: {s.topic}</div>
            <div className="text-sm opacity-80">Centre: {s.centre}</div>
            <div className="text-sm opacity-80">Date: {s.date}</div>
            <div className="text-sm opacity-80">
              Time: {s.startTime} - {s.endTime}
            </div>
            <div className="mt-4 flex justify-end">
              {s.prefill ? (
                <a
                  href={buildRegistrationUrl(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Register (prefilled)
                  </button>
                </a>
              ) : (
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm"
                  disabled
                >
                  Class Full
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Key ports:
- Hardcoded form URL → `buildRegistrationUrl` via `config.registrationFormUrl` + `replaceUrlPlaceholders`.
- Hardcoded `2025` in `normalizeDate` → `config.year`.
- Hardcoded `minDate="2025-09-06"` → `config.calendar.listViewMinDate`.
- `maxDate={END_DATE}` → `config.dateRange.end`.
- Greyed-out full card styling via `opacity-60` (porting the regular-lessons pattern).

- [ ] **Step 2: Verify dev run**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

Switch to List View, confirm date picker, register links, and full-class grey-out work as before.

- [ ] **Step 3: Commit**

```bash
git add src/components/ListView.tsx
git commit -m "feat(cc): config-drive ListView + port campaign/promocode replacement + grey-out"
```

---

## Task 13: Port filter-collapse UX polish

**Files:**
- Modify: `src/components/Filters.tsx`

This ports the "filter toggle persisted to localStorage" UX from regular-lessons onto the simpler CC filters shape.

- [ ] **Step 1: Add collapse state + persistence**

Replace the default export section of `src/components/Filters.tsx` (the `export default function Filters({...})` block and below) with:

```tsx
const FILTERS_COLLAPSED_STORAGE_KEY = "crashCourseFiltersCollapsed";

export default function Filters({
  subjects,
  topics,
  centres,
  filters,
  onFilterChange,
}: FiltersProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FILTERS_COLLAPSED_STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(FILTERS_COLLAPSED_STORAGE_KEY, String(collapsed));
    }
  }, [collapsed, hydrated]);

  const setFilter = (field: keyof FiltersProps["filters"], value: string[]) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const activeCount =
    filters.subject.length + filters.topic.length + filters.centre.length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          aria-expanded={!collapsed}
        >
          <span>{collapsed ? "▶" : "▼"}</span>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              {activeCount} active
            </span>
          )}
        </button>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MultiSelect
            label="Subject"
            selected={filters.subject}
            options={subjects}
            onChange={(val) => setFilter("subject", val)}
          />
          <MultiSelect
            label="Topic"
            selected={filters.topic}
            options={topics}
            onChange={(val) => setFilter("topic", val)}
          />
          <MultiSelect
            label="Centre"
            selected={filters.centre}
            options={centres}
            onChange={(val) => setFilter("centre", val)}
          />
        </div>
      )}
    </div>
  );
}
```

And add `useState, useEffect` to the top-of-file import:

```tsx
import { Fragment, useEffect, useState } from "react";
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify dev run**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

- Collapse filters, refresh page → collapsed state is retained.
- Apply a subject filter → "X active" badge appears next to Filters heading.

- [ ] **Step 4: Commit**

```bash
git add src/components/Filters.tsx
git commit -m "feat(cc): collapsible filters with localStorage persistence"
```

---

## Task 14: Update CSV→JSON script output path

**Files:**
- Modify: `scripts/csv_to_sessions2json.ts`

- [ ] **Step 1: Inspect current script**

```bash
cat scripts/csv_to_sessions2json.ts
```

Identify the input and output path constants.

- [ ] **Step 2: Parametrize the slug**

Change the script to accept a slug argument (`node scripts/csv_to_sessions2json.ts ss-sep-2025`) and read from / write to:

- Input: `crash-courses/<slug>/sessions.csv`
- Output: `crash-courses/<slug>/sessions.json`

Replace the file-path constants with slug-derived paths. The exact rewrite depends on the script's current shape — keep the parsing logic unchanged, only update IO paths.

- [ ] **Step 3: Verify round-trip**

```bash
npx ts-node scripts/csv_to_sessions2json.ts ss-sep-2025
git diff crash-courses/ss-sep-2025/sessions.json
# Expect: no diff (or only cosmetic formatting diff).
```

- [ ] **Step 4: Commit**

```bash
git add scripts/csv_to_sessions2json.ts
git commit -m "chore(scripts): point csv_to_sessions2json at crash-courses/<slug>/"
```

---

## Task 15: Final local verification

**Files:** none (verification only)

- [ ] **Step 1: Missing-slug build fails**

```bash
unset NEXT_PUBLIC_CC_SLUG
npm run build 2>&1 | tail -20
# Expect: build fails with "NEXT_PUBLIC_CC_SLUG is not set"
```

- [ ] **Step 2: Unknown-slug build fails**

```bash
NEXT_PUBLIC_CC_SLUG=nonexistent npm run build 2>&1 | tail -20
# Expect: build fails with "Unknown crash course slug: nonexistent. Known slugs: jc-sep-2025, ss-sep-2025"
```

- [ ] **Step 3: SS build succeeds and serves**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run start &
sleep 3
curl -s http://localhost:3000 | grep -q "Zenith September SS Crash Course Scheduler" && echo OK || echo FAIL
kill %1 2>/dev/null
```

- [ ] **Step 4: JC build succeeds and serves**

```bash
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run start &
sleep 3
curl -s http://localhost:3000 | grep -q "Zenith September JC Crash Course Scheduler" && echo OK || echo FAIL
kill %1 2>/dev/null
```

- [ ] **Step 5: Lint passes**

```bash
npm run lint
# Expect: no errors.
```

- [ ] **Step 6: Push branch**

```bash
git push -u origin crash-courses
```

---

## Task 16: Deployment rewire (user-executed)

**Files:** none (manual CF API / wrangler operations)

> **Ask the user before running these.** These are production-scoped, shared-systems changes. The assistant must not execute without explicit confirmation per invocation.

- [ ] **Step 1: Required env vars**

Export in the user's shell:

```bash
export CF_API_TOKEN=...           # Cloudflare API token with Pages:Edit
export CF_ACCOUNT_ID=...          # Cloudflare account ID
export JC_PROJECT_NAME=...        # the JC Pages project name
export SS_PROJECT_NAME=...        # the SS Pages project name
```

- [ ] **Step 2: Change production branch on JC project**

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$JC_PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"production_branch":"crash-courses"}'
```

Expected response `success: true`.

- [ ] **Step 3: Set NEXT_PUBLIC_CC_SLUG on JC project**

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$JC_PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deployment_configs":{"production":{"env_vars":{"NEXT_PUBLIC_CC_SLUG":{"value":"jc-sep-2025","type":"plain_text"}}}}}'
```

- [ ] **Step 4: Repeat steps 2-3 for SS project**

Swap `$JC_PROJECT_NAME` → `$SS_PROJECT_NAME` and the slug value → `ss-sep-2025`.

- [ ] **Step 5: Trigger redeploy**

Either push a new commit to `crash-courses` (empty commit works) or trigger via wrangler:

```bash
npm run build && NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npx wrangler pages deploy out \
  --project-name=$JC_PROJECT_NAME --branch=crash-courses
npm run build && NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npx wrangler pages deploy out \
  --project-name=$SS_PROJECT_NAME --branch=crash-courses
```

Note the `NEXT_PUBLIC_CC_SLUG` in front of `npm run build` — the env var must be present **at build time** for Next.js to bake the correct config into the static output. The wrangler deploy step ships whatever `out/` currently contains.

- [ ] **Step 6: Verify production**

- Visit `crashcourse.jc.zenitheducationstudio.com` → confirm JC colors, JC banner copy, JC form URL on register click.
- Visit `crashcourse.ss.zenitheducationstudio.com` → confirm SS.
- `?promocode=TEST` URL param → confirm it injects into form URLs (if `registrationFormUrl` contains the `PROMOCODE` placeholder; otherwise it's a silent no-op, which is expected).

---

## Task 17: Adding a future crash course (reference runbook)

This task has no steps for this plan — it's a reference for the next crash course.

**Files:** `crash-courses/<new-slug>/config.ts`, `crash-courses/<new-slug>/sessions.json`

Procedure:
1. `mkdir crash-courses/oct-jc-2025`
2. `cp crash-courses/jc-sep-2025/config.ts crash-courses/oct-jc-2025/config.ts` and edit: slug, metadata, dateRange, subjectColors, banner copy, form URL.
3. Generate `sessions.json` via `npx ts-node scripts/csv_to_sessions2json.ts oct-jc-2025` (after dropping the CSV into the same folder).
4. Register in `crash-courses/index.ts`:
   ```ts
   import octJc2025 from "./oct-jc-2025/config";
   const REGISTRY: Record<string, CrashCourseConfig> = {
     "jc-sep-2025": jcSep2025,
     "ss-sep-2025": ssSep2025,
     "oct-jc-2025": octJc2025,
   };
   ```
5. Create the Cloudflare Pages project (or reuse an existing one), set `NEXT_PUBLIC_CC_SLUG=oct-jc-2025`, point at `crash-courses` branch.

---

## Self-review notes

- Spec sections 1-5 each have covering tasks: Task 1 (branch strategy), Task 2 (types) + Task 5 (resolver) (config layout + resolver), Tasks 6-13 (consumer refactor), Tasks 10-13 (improvement port list — campaign/promocode, grey-out, filter polish; register buttons already present on CC and verified in dev steps), Task 16 (deployment rewire).
- The "port list" item "register buttons on calendar popup + list-view rows" is partially a no-op: sept-ss-cc already has these. The ports that apply are the **campaign/promocode URL placeholder replacement** (Task 11, Task 12) and the full-class grey-out of list rows (Task 12). The improvement list in the spec is accurate; what's being ported is specifically the reusable behaviour behind those UX touches.
- No "TBD" / "TODO" / "implement later" strings anywhere.
- Type consistency: `CrashCourseConfig` shape is defined once in Task 2 and referenced by exact field names throughout Tasks 3, 4, 7, 8, 9, 11, 12.
- `replaceUrlPlaceholders` is defined in Task 10 before its first use in Task 11.
- No tests are required by the plan because the project has no test framework; verification is build + lint + manual dev run. Flagged in the header.

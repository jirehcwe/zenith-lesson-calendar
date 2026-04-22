# Crash Courses Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse `sept-jc-cc` and `sept-ss-cc` into a single `crash-courses` branch driven by `NEXT_PUBLIC_CC_SLUG`, port eligible `regular-lessons` improvements, and rewire the two Cloudflare Pages projects to deploy from the new branch.

**Architecture:** Per-CC config lives in `crash-courses/<slug>/` as a `config.ts` (metadata, copy, colors, CTAs, date range, form URLs) + `sessions.json` (fixed-date `Session[]`). A resolver at `crash-courses/index.ts` reads the env var at build time and fails the build loudly on missing/unknown slugs. All consumers (`layout.tsx`, `page.tsx`, banners, views) take their content from the resolved config.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript, Tailwind, FullCalendar, Headless UI, Cloudflare Pages, wrangler, `@vercel/analytics` (kept from existing), **Jest + React Testing Library + `next/jest`** (added by this plan).

**Reference spec:** `docs/superpowers/specs/2026-04-22-crash-courses-consolidation-design.md`

**Testing strategy:**
- Task 2 installs Jest using the `next/jest` preset (TS support, JSDOM env, `@/` path mapping).
- Every task that introduces runtime logic (resolver, utilities, config validation, URL builder) has a failing-test-first TDD step.
- UI component tests are deliberately scoped narrow: we don't snapshot-test layout, but we do render banners + views enough to verify config content is surfaced.
- Verification per task: unit tests (`npm test`) + typecheck (`npx tsc --noEmit`) + build with both slugs (`NEXT_PUBLIC_CC_SLUG=<slug> npm run build`) + `npm run dev` visual spot-check where UI changes.

**Note on branch starting point:** Start from `sept-ss-cc` (simpler component tree that already matches the fixed-date CC model). Port improvements **onto** it from `regular-lessons`.

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

## Task 2: Install Jest + `next/jest` and wire npm scripts

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json`
- Modify: `.gitignore` (add `coverage/`)
- Create: `src/__tests__/smoke.test.ts` (one-liner to prove the runner works)

- [ ] **Step 1: Install dependencies**

```bash
npm install --save-dev \
  jest@^29 \
  jest-environment-jsdom@^29 \
  @testing-library/react@^16 \
  @testing-library/jest-dom@^6 \
  @testing-library/dom@^10 \
  @types/jest@^29
```

Rationale: `next/jest` (bundled with Next.js 15) auto-configures SWC, TypeScript, and module path aliases. No need for `ts-jest` or `babel-jest`.

- [ ] **Step 2: Create `jest.config.ts`**

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  setupFilesAfterEach: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/out/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "crash-courses/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

export default createJestConfig(config);
```

- [ ] **Step 3: Create `jest.setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add npm scripts**

Edit `package.json`, add to `scripts`:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 5: Update `.gitignore`**

Append:

```
coverage/
```

- [ ] **Step 6: Write the smoke test (failing first, then passing)**

Create `src/__tests__/smoke.test.ts`:

```ts
describe("jest environment", () => {
  it("runs typescript tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("has jsdom globals available", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npm test
# Expect: 1 test file, 2 tests passing.
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json jest.config.ts jest.setup.ts src/__tests__/smoke.test.ts .gitignore
git commit -m "chore: add jest + next/jest test framework"
```

---

## Task 3: Scaffold `crash-courses/types.ts`

**Files:**
- Create: `crash-courses/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// crash-courses/types.ts
import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type BannerContent = {
  headline?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;   // may contain "SCHEDULE" and "PROMOCODE" placeholders
};

export type CalendarUIConfig = {
  firstDay: number;              // 0=Sun, 1=Mon
  initialDate: string;           // ISO YYYY-MM-DD
  slotMinTime: string;           // "HH:MM:SS"
  slotMaxTime: string;           // "HH:MM:SS"
  listViewMinDate: string;       // ISO YYYY-MM-DD
  tip?: { label: string; body: string } | null;
};

export type CrashCourseConfig = {
  slug: string;
  metadata: { title: string; description: string };
  dateRange: { start: string; end: string };
  year: number;
  subjectColors: Record<string, SubjectColor>;
  signupBanner: BannerContent & { imageSrc: string; imageAlt: string };
  bottomBanner: BannerContent;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;
  campaignField: string;
  promocodeField?: string;
  sessions: Session[];
};
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add crash-courses/types.ts
git commit -m "feat(cc): add CrashCourseConfig type"
```

---

## Task 4: Move SS data into `crash-courses/ss-sep-2025/`

**Files:**
- Create: `crash-courses/ss-sep-2025/sessions.json` (moved from `public/sessions-ss.json`)
- Create: `crash-courses/ss-sep-2025/sessions.csv` (moved from `public/sessions-ss.csv`)
- Create: `crash-courses/ss-sep-2025/config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Move the data files**

```bash
mkdir -p crash-courses/ss-sep-2025
git mv public/sessions-ss.json crash-courses/ss-sep-2025/sessions.json
git mv public/sessions-ss.csv crash-courses/ss-sep-2025/sessions.csv
```

- [ ] **Step 2: Ensure JSON module resolution**

Open `tsconfig.json`. Ensure `compilerOptions.resolveJsonModule: true` and `esModuleInterop: true` are present. If missing, add them.

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
```

- [ ] **Step 5: Commit**

```bash
git add crash-courses/ss-sep-2025/ tsconfig.json
git commit -m "feat(cc): migrate SS September 2025 data + config"
```

---

## Task 5: Move JC data into `crash-courses/jc-sep-2025/`

**Files:**
- Create: `crash-courses/jc-sep-2025/sessions.json` (from `sept-jc-cc` branch's `public/sessions-jc.json`)
- Create: `crash-courses/jc-sep-2025/sessions.csv`
- Create: `crash-courses/jc-sep-2025/config.ts`
- Delete: `public/sessions-jc.json`, `public/sessions-jc.csv`

- [ ] **Step 1: Pull authoritative JC data from `sept-jc-cc`**

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

Verify the JC form URL and subject keys against `git show sept-jc-cc:src/components/SignupBanner.tsx` and `git show sept-jc-cc:src/app/page.tsx` before committing.

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

## Task 6: Write the config resolver + resolver & integrity tests

**Files:**
- Create: `crash-courses/index.ts`
- Create: `crash-courses/__tests__/resolver.test.ts`
- Create: `crash-courses/__tests__/config-integrity.test.ts`

- [ ] **Step 1: Write the failing resolver test**

Create `crash-courses/__tests__/resolver.test.ts`:

```ts
import { getCrashCourseConfig } from "..";

describe("getCrashCourseConfig", () => {
  const ORIGINAL_SLUG = process.env.NEXT_PUBLIC_CC_SLUG;

  afterEach(() => {
    if (ORIGINAL_SLUG === undefined) {
      delete process.env.NEXT_PUBLIC_CC_SLUG;
    } else {
      process.env.NEXT_PUBLIC_CC_SLUG = ORIGINAL_SLUG;
    }
  });

  it("throws when NEXT_PUBLIC_CC_SLUG is unset", () => {
    delete process.env.NEXT_PUBLIC_CC_SLUG;
    expect(() => getCrashCourseConfig()).toThrow(/NEXT_PUBLIC_CC_SLUG is not set/);
  });

  it("throws with known slugs listed when given an unknown slug", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "does-not-exist";
    expect(() => getCrashCourseConfig()).toThrow(/Unknown crash course slug.*does-not-exist/);
    expect(() => getCrashCourseConfig()).toThrow(/jc-sep-2025/);
    expect(() => getCrashCourseConfig()).toThrow(/ss-sep-2025/);
  });

  it("returns the SS config when slug is ss-sep-2025", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "ss-sep-2025";
    const cfg = getCrashCourseConfig();
    expect(cfg.slug).toBe("ss-sep-2025");
    expect(cfg.metadata.title).toContain("SS");
  });

  it("returns the JC config when slug is jc-sep-2025", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "jc-sep-2025";
    const cfg = getCrashCourseConfig();
    expect(cfg.slug).toBe("jc-sep-2025");
    expect(cfg.metadata.title).toContain("JC");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- crash-courses/__tests__/resolver.test.ts
# Expect: FAIL — cannot import from ".."
```

- [ ] **Step 3: Write the resolver**

Create `crash-courses/index.ts`:

```ts
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

export function getAllRegisteredConfigs(): CrashCourseConfig[] {
  return Object.values(REGISTRY);
}

export type { CrashCourseConfig } from "./types";
```

- [ ] **Step 4: Run resolver tests — now pass**

```bash
npm test -- crash-courses/__tests__/resolver.test.ts
# Expect: PASS (all 4 tests)
```

- [ ] **Step 5: Write the failing config-integrity test**

Create `crash-courses/__tests__/config-integrity.test.ts`:

```ts
import { getAllRegisteredConfigs } from "..";

describe("CrashCourseConfig integrity", () => {
  const configs = getAllRegisteredConfigs();

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: slug matches registry key",
    (slug, cfg) => {
      expect(cfg.slug).toBe(slug);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: every session's displaySubject has a matching entry in subjectColors",
    (_slug, cfg) => {
      const missing = new Set<string>();
      for (const s of cfg.sessions) {
        if (!cfg.subjectColors[s.displaySubject]) missing.add(s.displaySubject);
      }
      expect(Array.from(missing)).toEqual([]);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: dateRange.start is before dateRange.end",
    (_slug, cfg) => {
      expect(new Date(cfg.dateRange.start).getTime()).toBeLessThan(
        new Date(cfg.dateRange.end).getTime()
      );
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: sessions is non-empty",
    (_slug, cfg) => {
      expect(cfg.sessions.length).toBeGreaterThan(0);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: registrationFormUrl contains the campaignField value as SCHEDULE placeholder",
    (_slug, cfg) => {
      // Sanity: the configured form URL should reference the campaign field
      // with "SCHEDULE" so that replaceUrlPlaceholders can swap it.
      expect(cfg.registrationFormUrl).toContain(cfg.campaignField);
      expect(cfg.registrationFormUrl).toContain("SCHEDULE");
    }
  );
});
```

- [ ] **Step 6: Run integrity test — may fail if any session has a displaySubject missing from colors**

```bash
npm test -- crash-courses/__tests__/config-integrity.test.ts
# Expected: PASS if configs are internally consistent. If it fails, the
# error names the missing subject — add it to subjectColors in the config
# for that slug and re-run.
```

- [ ] **Step 7: Commit**

```bash
git add crash-courses/index.ts crash-courses/__tests__/
git commit -m "feat(cc): add slug resolver with build-time guard + tests"
```

---

## Task 7: Refactor `src/types.ts` — drop hardcoded dates

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Remove `START_DATE` / `END_DATE` exports**

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

- [ ] **Step 2: Verify typecheck surfaces downstream consumers**

```bash
npx tsc --noEmit
# Expect: errors in page.tsx, CalendarView.tsx, ListView.tsx for missing
# START_DATE / END_DATE. Fixed in Tasks 8, 9, 13, 14.
```

Don't commit yet.

---

## Task 8: Refactor `src/app/layout.tsx` to consume config metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace hardcoded metadata**

Replace `src/app/layout.tsx` with:

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

- [ ] **Step 2: Missing-slug build fails**

```bash
unset NEXT_PUBLIC_CC_SLUG
npm run build
# Expect: build fails with "NEXT_PUBLIC_CC_SLUG is not set"
```

- [ ] **Step 3: Build succeeds with slug**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
# Expect: success; metadata title "Zenith September SS Crash Course Scheduler"
```

Don't commit yet — `page.tsx` still imports START_DATE/END_DATE.

---

## Task 9: Refactor `src/app/page.tsx` to consume config

**Files:**
- Modify: `src/app/page.tsx`

This is the central refactor. Remove: fetch effect, hardcoded color maps, `level.includes("J")` branching.

- [ ] **Step 1: Rewrite `page.tsx`**

Replace the entire content with:

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

- [ ] **Step 2: Verify build for both slugs**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat(cc): config-drive layout + page + types"
```

---

## Task 10: Refactor banners — config-driven + smoke tests

**Files:**
- Modify: `src/components/SignupBanner.tsx`
- Modify: `src/components/BottomBanner.tsx`
- Create: `src/components/__tests__/BottomBanner.test.tsx`

- [ ] **Step 1: Rewrite `SignupBanner.tsx`**

```tsx
"use client";

import Image from "next/image";
import { getCrashCourseConfig } from "../../crash-courses";

const { signupBanner } = getCrashCourseConfig();

export default function SignupBanner() {
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

- [ ] **Step 3: Write smoke test for BottomBanner (failing first)**

Create `src/components/__tests__/BottomBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import BottomBanner from "../BottomBanner";

beforeAll(() => {
  process.env.NEXT_PUBLIC_CC_SLUG = "ss-sep-2025";
});

describe("BottomBanner", () => {
  it("renders CTA label and href from the resolved config", () => {
    render(<BottomBanner />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("docs.google.com/forms"));
    expect(link.textContent).toMatch(/sign up/i);
  });
});
```

Note: `getCrashCourseConfig()` is called at module-load time of `BottomBanner.tsx`. Setting `NEXT_PUBLIC_CC_SLUG` in `beforeAll` is fine because the test file imports `BottomBanner` lazily — Jest evaluates the `beforeAll` before the `describe` body runs, and the import above is hoisted but the component file resolves `getCrashCourseConfig()` at its own module-init time when the test file first touches it via `render`. If flakiness appears, switch to a dynamic import inside the test.

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- src/components/__tests__/BottomBanner.test.tsx
# Expect: PASS
```

- [ ] **Step 5: Visual spot-check**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

Check banner image, body, CTA on `http://localhost:3000`. Stop. Repeat for `jc-sep-2025`.

- [ ] **Step 6: Commit**

```bash
git add src/components/SignupBanner.tsx src/components/BottomBanner.tsx src/components/__tests__/
git commit -m "feat(cc): config-drive banners + smoke test"
```

---

## Task 11: Port `campaign.ts` utility + unit tests

**Files:**
- Create: `src/utils/campaign.ts`
- Create: `src/utils/__tests__/campaign.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/campaign.test.ts`:

```ts
/**
 * @jest-environment jsdom
 */
import {
  getCampaignParam,
  getPromocodeParam,
  replaceCampaignInUrl,
  replacePromocodeInUrl,
  replaceUrlPlaceholders,
} from "../campaign";

describe("campaign/promocode URL utilities", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  describe("getCampaignParam", () => {
    it("returns SCHEDULE when no campaign param is present", () => {
      expect(getCampaignParam()).toBe("SCHEDULE");
    });

    it("returns the campaign query value when present", () => {
      window.history.pushState({}, "", "/?campaign=EMAIL_AUG");
      expect(getCampaignParam()).toBe("EMAIL_AUG");
    });
  });

  describe("replaceCampaignInUrl", () => {
    it("substitutes SCHEDULE with the campaign value", () => {
      window.history.pushState({}, "", "/?campaign=TIKTOK");
      expect(replaceCampaignInUrl("https://form?entry.1=SCHEDULE")).toBe(
        "https://form?entry.1=TIKTOK"
      );
    });

    it("leaves SCHEDULE unchanged when no campaign param is set", () => {
      expect(replaceCampaignInUrl("https://form?entry.1=SCHEDULE&x=1")).toBe(
        "https://form?entry.1=SCHEDULE&x=1"
      );
    });

    it("replaces every occurrence of SCHEDULE", () => {
      window.history.pushState({}, "", "/?campaign=X");
      expect(replaceCampaignInUrl("SCHEDULE/SCHEDULE?k=SCHEDULE")).toBe("X/X?k=X");
    });
  });

  describe("getPromocodeParam", () => {
    it("returns empty string when no promocode param is present", () => {
      expect(getPromocodeParam()).toBe("");
    });

    it("returns the promocode query value when present", () => {
      window.history.pushState({}, "", "/?promocode=SAVE20");
      expect(getPromocodeParam()).toBe("SAVE20");
    });
  });

  describe("replacePromocodeInUrl", () => {
    it("substitutes PROMOCODE with the promocode value", () => {
      window.history.pushState({}, "", "/?promocode=ABC");
      expect(replacePromocodeInUrl("form?promo=PROMOCODE")).toBe("form?promo=ABC");
    });

    it("replaces PROMOCODE with empty string when param is absent", () => {
      expect(replacePromocodeInUrl("form?promo=PROMOCODE")).toBe("form?promo=");
    });
  });

  describe("replaceUrlPlaceholders", () => {
    it("applies both SCHEDULE and PROMOCODE substitutions", () => {
      window.history.pushState({}, "", "/?campaign=CAM&promocode=PRM");
      expect(replaceUrlPlaceholders("?c=SCHEDULE&p=PROMOCODE")).toBe("?c=CAM&p=PRM");
    });
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- src/utils/__tests__/campaign.test.ts
# Expect: FAIL — module not found
```

- [ ] **Step 3: Write the utility**

Create `src/utils/campaign.ts`:

```ts
/**
 * URL placeholder replacement utilities.
 * - SCHEDULE is replaced with the `?campaign=` URL param (fallback: "SCHEDULE")
 * - PROMOCODE is replaced with the `?promocode=` URL param (fallback: "")
 */

export function getCampaignParam(): string {
  if (typeof window === "undefined") return "SCHEDULE";
  return (
    new URLSearchParams(window.location.search).get("campaign") || "SCHEDULE"
  );
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

export function replaceUrlPlaceholders(url: string): string {
  return replacePromocodeInUrl(replaceCampaignInUrl(url));
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- src/utils/__tests__/campaign.test.ts
# Expect: PASS (all tests green)
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/campaign.ts src/utils/__tests__/
git commit -m "feat(cc): add campaign + promocode URL utilities + tests"
```

---

## Task 12: Extract shared `buildRegistrationUrl` helper + tests

**Files:**
- Create: `src/utils/registration.ts`
- Create: `src/utils/__tests__/registration.test.ts`

This helper is used by both CalendarView (Task 13) and ListView (Task 14). Extracting it as a pure function avoids duplication and gets us tested coverage in one place.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/registration.test.ts`:

```ts
/**
 * @jest-environment jsdom
 */
import { buildRegistrationUrl } from "../registration";

const baseWithQuery =
  "https://docs.google.com/forms/d/e/FORMID/viewform?entry.1157532004=SCHEDULE";
const baseNoQuery = "https://docs.google.com/forms/d/e/FORMID/viewform";

const session = {
  prefill: "[S1 English] Marine Parade | 06 Sep (Sat) | 11:15AM - 01:15PM",
  prefillField: "1016736042",
};

describe("buildRegistrationUrl", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("appends the prefill entry with `&` when the base URL already has a query", () => {
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain("?entry.1157532004=SCHEDULE&entry.1016736042=");
  });

  it("appends the prefill entry with `?` when the base URL has no query", () => {
    const url = buildRegistrationUrl(baseNoQuery, session);
    expect(url.startsWith(`${baseNoQuery}?entry.1016736042=`)).toBe(true);
  });

  it("url-encodes the prefill value", () => {
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain(encodeURIComponent(session.prefill));
    expect(url).not.toContain(session.prefill); // raw (un-encoded) should not leak
  });

  it("substitutes the SCHEDULE placeholder when ?campaign= is present", () => {
    window.history.pushState({}, "", "/?campaign=PROMO_AUG");
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain("entry.1157532004=PROMO_AUG");
    expect(url).not.toContain("=SCHEDULE");
  });

  it("substitutes PROMOCODE when present in the base URL and ?promocode= is set", () => {
    window.history.pushState({}, "", "/?promocode=SAVE20");
    const url = buildRegistrationUrl(
      `${baseWithQuery}&entry.9999=PROMOCODE`,
      session
    );
    expect(url).toContain("entry.9999=SAVE20");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- src/utils/__tests__/registration.test.ts
# Expect: FAIL — module not found
```

- [ ] **Step 3: Write the helper**

Create `src/utils/registration.ts`:

```ts
import { Session } from "@/types";
import { replaceUrlPlaceholders } from "./campaign";

/**
 * Build the prefilled Google Form registration URL for a given session.
 *
 * Composes the base form URL (which may or may not already have a query
 * string) with `entry.<prefillField>=<encoded prefill value>`, then runs
 * the result through `replaceUrlPlaceholders` so that SCHEDULE / PROMOCODE
 * markers are swapped for the current page's `?campaign=` / `?promocode=`
 * URL params.
 */
export function buildRegistrationUrl(
  baseFormUrl: string,
  session: Pick<Session, "prefill" | "prefillField">
): string {
  const joiner = baseFormUrl.includes("?") ? "&" : "?";
  const raw = `${baseFormUrl}${joiner}entry.${session.prefillField}=${encodeURIComponent(session.prefill)}`;
  return replaceUrlPlaceholders(raw);
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- src/utils/__tests__/registration.test.ts
# Expect: PASS (all tests green)
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/registration.ts src/utils/__tests__/registration.test.ts
git commit -m "feat(cc): add buildRegistrationUrl helper + tests"
```

---

## Task 13: Refactor `CalendarView` — config-drive, use shared URL helper

**Files:**
- Modify: `src/components/CalendarView.tsx`

- [ ] **Step 1: Rewrite**

Replace `src/components/CalendarView.tsx` with:

```tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Session } from "../types";
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { getCrashCourseConfig } from "../../crash-courses";
import { buildRegistrationUrl } from "@/utils/registration";

const config = getCrashCourseConfig();

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
                  href={buildRegistrationUrl(
                    config.registrationFormUrl,
                    selectedEvent.extendedProps
                  )}
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

- [ ] **Step 2: Tests + build**

```bash
npm test
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
```

- [ ] **Step 3: Visual spot-check**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

Click a non-full slot → popup opens → click Register → URL opens. Append `?campaign=TEST` to the dev URL and confirm the form URL contains `entry.1157532004=TEST`. Stop.

- [ ] **Step 4: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "feat(cc): config-drive CalendarView + use shared registration helper"
```

---

## Task 14: Refactor `ListView` — config-drive, use shared URL helper, grey-out

**Files:**
- Modify: `src/components/ListView.tsx`

- [ ] **Step 1: Rewrite**

Replace `src/components/ListView.tsx` with:

```tsx
"use client";

import { Session } from "../types";
import DatePicker from "react-datepicker";
import { getCrashCourseConfig } from "../../crash-courses";
import { buildRegistrationUrl } from "@/utils/registration";

const config = getCrashCourseConfig();

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
                  href={buildRegistrationUrl(config.registrationFormUrl, s)}
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

- [ ] **Step 2: Tests + build**

```bash
npm test
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
```

- [ ] **Step 3: Visual spot-check**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run dev
```

Switch to List View. Confirm date picker range matches config, register links use config form URL, full-class cards grey out.

- [ ] **Step 4: Commit**

```bash
git add src/components/ListView.tsx
git commit -m "feat(cc): config-drive ListView + use shared registration helper + grey-out"
```

---

## Task 15: Port filter-collapse UX polish + persistence test

**Files:**
- Modify: `src/components/Filters.tsx`
- Create: `src/components/__tests__/Filters.test.tsx`

- [ ] **Step 1: Write the failing persistence test**

Create `src/components/__tests__/Filters.test.tsx`:

```tsx
import { render, screen, act } from "@testing-library/react";
import userEventDefault from "@testing-library/user-event";
import Filters from "../Filters";

const userEvent = (userEventDefault as unknown as { default?: typeof userEventDefault }).default ?? userEventDefault;

const STORAGE_KEY = "crashCourseFiltersCollapsed";

function renderFilters() {
  return render(
    <Filters
      subjects={["English", "Math"]}
      topics={["[English] Personal Recount"]}
      centres={["Marine Parade"]}
      tutors={[]}
      filters={{ subject: [], topic: [], centre: [], tutor: [] }}
      onFilterChange={() => {}}
    />
  );
}

describe("Filters collapse persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to expanded when no stored state", () => {
    renderFilters();
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    // MultiSelect labels are visible when expanded
    expect(screen.getByText("Subject")).toBeInTheDocument();
  });

  it("persists collapsed state across renders", async () => {
    const user = userEvent.setup();
    const { unmount } = renderFilters();

    const toggle = screen.getByRole("button", { name: /Filters/i });
    await user.click(toggle);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");

    unmount();
    renderFilters();
    // Subject label should now be hidden (section collapsed)
    expect(screen.queryByText("Subject")).toBeNull();
  });
});
```

Install `@testing-library/user-event` if not already present:

```bash
npm install --save-dev @testing-library/user-event@^14
```

- [ ] **Step 2: Run — expect fail (collapse behavior not implemented)**

```bash
npm test -- src/components/__tests__/Filters.test.tsx
# Expect: FAIL — no toggle button, nothing collapses
```

- [ ] **Step 3: Implement collapse + persistence in Filters**

Update imports at the top of `src/components/Filters.tsx`:

```tsx
import { Fragment, useEffect, useState } from "react";
```

Replace the `export default function Filters(...)` block with:

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

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- src/components/__tests__/Filters.test.tsx
# Expect: PASS
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/Filters.tsx src/components/__tests__/Filters.test.tsx
git commit -m "feat(cc): collapsible filters with localStorage persistence + tests"
```

---

## Task 16: Update CSV→JSON script output path

**Files:**
- Modify: `scripts/csv_to_sessions2json.ts`

- [ ] **Step 1: Inspect current script**

```bash
cat scripts/csv_to_sessions2json.ts
```

Identify input/output path constants.

- [ ] **Step 2: Parametrize by slug**

Change the script to accept a slug as the first CLI argument. Read from `crash-courses/<slug>/sessions.csv`, write to `crash-courses/<slug>/sessions.json`. Do not change the row-parsing / mapping logic.

- [ ] **Step 3: Round-trip verification**

```bash
npx ts-node scripts/csv_to_sessions2json.ts ss-sep-2025
git diff crash-courses/ss-sep-2025/sessions.json
# Expect: no diff (or cosmetic only).

npx ts-node scripts/csv_to_sessions2json.ts jc-sep-2025
git diff crash-courses/jc-sep-2025/sessions.json
# Expect: no diff.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/csv_to_sessions2json.ts
git commit -m "chore(scripts): point csv_to_sessions2json at crash-courses/<slug>/"
```

---

## Task 17: Final local verification

**Files:** none (verification only)

- [ ] **Step 1: Full test run**

```bash
npm test
# Expect: all suites PASS. Coverage report optional via `npm run test:coverage`.
```

- [ ] **Step 2: Missing-slug build fails**

```bash
unset NEXT_PUBLIC_CC_SLUG
npm run build 2>&1 | tail -20
# Expect: build fails with "NEXT_PUBLIC_CC_SLUG is not set"
```

- [ ] **Step 3: Unknown-slug build fails**

```bash
NEXT_PUBLIC_CC_SLUG=nonexistent npm run build 2>&1 | tail -20
# Expect: build fails with "Unknown crash course slug"
```

- [ ] **Step 4: SS build succeeds and serves**

```bash
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run start &
sleep 3
curl -s http://localhost:3000 | grep -q "Zenith September SS Crash Course Scheduler" && echo OK || echo FAIL
kill %1 2>/dev/null
```

- [ ] **Step 5: JC build succeeds and serves**

```bash
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run start &
sleep 3
curl -s http://localhost:3000 | grep -q "Zenith September JC Crash Course Scheduler" && echo OK || echo FAIL
kill %1 2>/dev/null
```

- [ ] **Step 6: Lint**

```bash
npm run lint
```

- [ ] **Step 7: Push branch**

```bash
git push -u origin crash-courses
```

---

## Task 18: Deployment rewire (user-executed)

**Files:** none (manual CF API / wrangler operations)

> **Ask the user before running these.** These are production-scoped, shared-systems changes. The assistant must not execute without explicit confirmation per invocation.

- [ ] **Step 1: Export env**

```bash
export CF_API_TOKEN=...
export CF_ACCOUNT_ID=...
export JC_PROJECT_NAME=...
export SS_PROJECT_NAME=...
```

- [ ] **Step 2: Change production branch on JC project**

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$JC_PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"production_branch":"crash-courses"}'
```

- [ ] **Step 3: Set NEXT_PUBLIC_CC_SLUG on JC project**

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$JC_PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deployment_configs":{"production":{"env_vars":{"NEXT_PUBLIC_CC_SLUG":{"value":"jc-sep-2025","type":"plain_text"}}}}}'
```

- [ ] **Step 4: Repeat Steps 2-3 for SS project**

Substitute `$JC_PROJECT_NAME` → `$SS_PROJECT_NAME`, slug → `ss-sep-2025`.

- [ ] **Step 5: Trigger redeploy**

Either push a new commit to `crash-courses`, or:

```bash
NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build
npx wrangler pages deploy out --project-name=$JC_PROJECT_NAME --branch=crash-courses

NEXT_PUBLIC_CC_SLUG=ss-sep-2025 npm run build
npx wrangler pages deploy out --project-name=$SS_PROJECT_NAME --branch=crash-courses
```

The env var must be present **at build time** — Next.js bakes it into the static output.

- [ ] **Step 6: Verify production**

- `crashcourse.jc.zenitheducationstudio.com` → JC colors, JC banner copy, JC form URL.
- `crashcourse.ss.zenitheducationstudio.com` → SS.
- Append `?campaign=TEST` → form URLs contain `entry.1157532004=TEST`.

---

## Task 19: Adding a future crash course (reference runbook)

This task has no steps for this plan — reference only.

**Files:** `crash-courses/<new-slug>/config.ts`, `crash-courses/<new-slug>/sessions.json`

Procedure:
1. `mkdir crash-courses/oct-jc-2025`
2. `cp crash-courses/jc-sep-2025/config.ts crash-courses/oct-jc-2025/config.ts` and edit: slug, metadata, dateRange, subjectColors, banner copy, form URL.
3. Drop the CSV into the folder, then `npx ts-node scripts/csv_to_sessions2json.ts oct-jc-2025`.
4. Register in `crash-courses/index.ts`:
   ```ts
   import octJc2025 from "./oct-jc-2025/config";
   const REGISTRY: Record<string, CrashCourseConfig> = {
     "jc-sep-2025": jcSep2025,
     "ss-sep-2025": ssSep2025,
     "oct-jc-2025": octJc2025,
   };
   ```
5. `npm test` — the config-integrity test suite automatically covers the new config.
6. Create/reuse the Cloudflare Pages project, set `NEXT_PUBLIC_CC_SLUG=oct-jc-2025`, point at `crash-courses` branch.

---

## Self-review notes

- **Spec coverage:**
  - Branch strategy → Task 1
  - Config layout → Tasks 3, 4, 5
  - Config resolver + build-time guard → Task 6
  - Consumer refactor → Tasks 7, 8, 9, 10, 13, 14
  - Improvement port list → Tasks 11 (campaign util), 12 (URL helper), 13 (CalendarView), 14 (ListView grey-out), 15 (filter collapse)
  - Deployment rewire → Task 18
- **Testing coverage:**
  - Jest scaffold → Task 2
  - Resolver unit tests → Task 6
  - Config integrity (auto-covers future CCs) → Task 6
  - Banner smoke test → Task 10
  - Campaign util unit tests → Task 11
  - URL builder unit tests → Task 12
  - Filter persistence test → Task 15
- **Type consistency:** `CrashCourseConfig` shape defined once in Task 3; all later tasks reference exact field names. `buildRegistrationUrl(base, session)` signature is defined in Task 12 and consumed identically in Tasks 13, 14.
- **No placeholders:** every step has concrete commands or full code.
- **TDD discipline:** Tasks 6, 11, 12, 15 write failing tests before implementation; Task 10 writes the smoke test as a follow-up (component already implemented in earlier steps — this is acceptable because the smoke test is a cross-check against the config-driving refactor, not a design driver).

# Crash Courses Consolidation Design

**Date:** 2026-04-22
**Status:** Approved pending implementation
**Author:** JC (with Claude)

## Problem

Two long-lived branches — `sept-jc-cc` and `sept-ss-cc` — deploy the JC and Secondary crash-course scheduling sites (`crashcourse.jc.zenitheducationstudio.com` and `crashcourse.ss.zenitheducationstudio.com`). They diverged from a common ancestor and are now nearly identical: they differ only in the JSON fetch path, one subject key (`"GP"` vs `"General Paper"`), banner copy, form URL, and page metadata.

Meanwhile `regular-lessons` has accumulated many UX and correctness improvements (full-slot grey-out, promocode prefill, register buttons, filter polish, etc.) that have not been ported to either crash-course branch. Porting lands twice, future crash courses (Oct JC, Dec SS, etc.) require another branch fork, and the whole setup is a maintenance hazard.

## Goal

Collapse both crash-course branches into a single `crash-courses` branch, driven by a per-deployment config selected via an environment variable. Adding a future crash course becomes a one-folder PR. All eligible improvements from `regular-lessons` land once and apply to every crash course.

**Non-goals:**
- Changing the `Session` JSON shape.
- Changing the CSV → JSON pipeline (`scripts/csv_to_sessions2json.ts`) beyond its output path.
- Porting `regular-lessons`-only features that don't apply to crash courses (testimonials, API cache, recurring-weekly calendar).

## Architecture

### Branch strategy

- New branch `crash-courses` cut from `regular-lessons` (start from the branch with all the optimisations, strip what doesn't apply, rather than porting forward from crash-course branches).
- `sept-jc-cc` and `sept-ss-cc` are retained as git history but receive no further commits. Future crash courses branch from `crash-courses`.
- Cloudflare Pages projects for both sites are rewired to build from `crash-courses`, differentiated by `NEXT_PUBLIC_CC_SLUG`.

### File layout

```
crash-courses/
  types.ts             # CrashCourseConfig type
  index.ts             # resolves NEXT_PUBLIC_CC_SLUG → config, build-time guard
  jc-sep-2025/
    config.ts          # per-CC config (imports sessions.json)
    sessions.json      # fixed-date sessions (same Session[] shape)
  ss-sep-2025/
    config.ts
    sessions.json
```

### Config shape

```ts
// crash-courses/types.ts
import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type CrashCourseConfig = {
  slug: string;
  metadata: { title: string; description: string };
  dateRange: { start: string; end: string }; // ISO YYYY-MM-DD
  subjectColors: Record<string, SubjectColor>;
  signupBanner: { headline: string; body: string; ctaHref: string };
  bottomBanner: { body: string; ctaHref: string };
  promocodePrefillField?: string; // form field ID for ?promocode= URL-param prefill
  sessions: Session[];
};
```

Per-CC config file pattern:

```ts
// crash-courses/jc-sep-2025/config.ts
import sessions from "./sessions.json";
import type { CrashCourseConfig } from "../types";

const config: CrashCourseConfig = {
  slug: "jc-sep-2025",
  metadata: {
    title: "Zenith September JC Crash Course Scheduler",
    description: "Sign up for Zenith JC Crash Course now!",
  },
  dateRange: { start: "2025-09-01", end: "2025-09-14" },
  subjectColors: { /* JC subject → color map */ },
  signupBanner: { /* ... */ },
  bottomBanner: { /* ... */ },
  promocodePrefillField: "entry.1157532004",
  sessions,
};

export default config;
```

### Config resolver

```ts
// crash-courses/index.ts
import jcSep2025 from "./jc-sep-2025/config";
import ssSep2025 from "./ss-sep-2025/config";
import type { CrashCourseConfig } from "./types";

const REGISTRY: Record<string, CrashCourseConfig> = {
  "jc-sep-2025": jcSep2025,
  "ss-sep-2025": ssSep2025,
};

export function getCrashCourseConfig(): CrashCourseConfig {
  const slug = process.env.NEXT_PUBLIC_CC_SLUG;
  if (!slug) {
    throw new Error(
      "NEXT_PUBLIC_CC_SLUG is not set. Set it in the Cloudflare Pages project env vars."
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
```

The resolver runs at module-import time in `page.tsx` and `layout.tsx`. Missing or typo'd slugs fail the Next.js build rather than silently shipping the wrong data.

## Consumer refactor

### `src/app/layout.tsx`

`metadata` is built from `config.metadata`. No other changes.

### `src/app/page.tsx`

- Remove the `fetch("/sessions-*.json")` effect. Load sessions synchronously from `config.sessions`.
- Remove the hardcoded `jcSubjectToColorMap` and `secSubjectToColorMap`. Replace with a single lookup into `config.subjectColors`.
- Remove the `level.includes("J")` branching — colors are a pure lookup keyed by `displaySubject`.
- Feed filter toggle, register-button behaviour, and popup data from the same config and `Session[]`.

### `src/components/SignupBanner.tsx` and `BottomBanner.tsx`

Accept `headline`, `body`, `ctaHref` as props (or read the config directly). Remove hardcoded form URLs.

### `src/types.ts`

Keep `Session`. Remove `START_DATE`/`END_DATE` constants — `config.dateRange` supplants them.

## Improvement port list

All ported from `regular-lessons`:

| Improvement | Notes |
|---|---|
| Grey-out + disable register link on full classes | `isFull = prefill.length === 0` already exists on CC; extend to register button state. |
| Darker calendar colors when full | Already present on CC branches — no port needed. |
| Promocode URL-param prefill | `?promocode=X` injected into form prefill URL using `config.promocodePrefillField`. |
| Register buttons in calendar popup + list-view rows | Port `CalendarView` popup content and `ListView` row CTA. |
| Filter toggle UIUX (break visual line, collapsed state persisted in localStorage) | Port `Filters.tsx` changes. |
| IP color mapping | Configured per-CC in `config.subjectColors` — naturally supported. |
| Day-order fix for list view | Pure bug fix. |

Not ported:

| Feature | Reason |
|---|---|
| Testimonials carousel + grid | CC sites are transactional, not persuasion-first. |
| localStorage cache of schedule API responses | CC has no API fetch; data is bundled. |
| `WeeklyClassCalendar` / `BottomNav` / `ViewSelector` / `campaign` utils | Belong to the recurring-weekly model, not fixed-date CC. |
| 2026 calendar-year change | `config.dateRange` drives the year for any given CC. |

## CSV → JSON pipeline

`scripts/csv_to_sessions2json.ts` continues to be the source of truth for sessions data. Update its output path to `crash-courses/<slug>/sessions.json`. No schema changes.

## Deployment rewire

For each of the two Cloudflare Pages projects (JC and SS):

### Production branch change (one-time, Cloudflare REST API)

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"production_branch":"crash-courses"}'
```

(wrangler does not expose a dedicated flag for changing an existing Pages project's production branch; dashboard or API are the two paths.)

### Environment variable

```bash
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deployment_configs":{"production":{"env_vars":{"NEXT_PUBLIC_CC_SLUG":{"value":"jc-sep-2025","type":"plain_text"}}}}}'
```

(Use `ss-sep-2025` for the SS project.)

### Manual deploy (optional sanity check)

```bash
npm run build
npx wrangler pages deploy out --project-name=$PROJECT_NAME --branch=crash-courses
```

### Safety net

If `NEXT_PUBLIC_CC_SLUG` is missing or points to an unknown slug, `crash-courses/index.ts` throws at build time. A typo cannot silently ship the wrong data to the wrong subdomain.

## Adding a future crash course

```
crash-courses/
  oct-jc-2025/
    config.ts
    sessions.json
```

Plus: add an entry to `REGISTRY` in `crash-courses/index.ts`, and set the Cloudflare Pages env var for the new project (or repurpose an existing project). No other code changes.

## Risks and mitigations

- **Wrong subdomain gets wrong JSON.** Mitigated by build-time `NEXT_PUBLIC_CC_SLUG` validation.
- **Sessions JSON bloats the JS bundle.** Current files are ~60KB (SS) and ~20KB (JC). Acceptable. If a future CC is much larger, switch to a dynamic `import()` in `getCrashCourseConfig`.
- **JC and SS diverge again on features.** The config boundary is narrow (data + copy + colors). Anything beyond that should be a PR to shared code, not a per-CC override. If a feature genuinely needs per-CC toggling, add a typed flag to `CrashCourseConfig`.
- **Deployment rewire happens outside this repo.** User executes the CF API calls manually; the build-time guard is the safety net if they miss a step.

## Rollout

1. Implement `crash-courses/` scaffolding and config resolver.
2. Port `regular-lessons` improvements onto the new branch.
3. Migrate existing JSON data to `crash-courses/<slug>/sessions.json`.
4. Local verification against both slugs (`NEXT_PUBLIC_CC_SLUG=jc-sep-2025 npm run build` and the SS variant).
5. User rewires Cloudflare Pages projects.
6. Monitor first production deploy of each project.

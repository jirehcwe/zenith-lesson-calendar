# Zenith Lesson Calendar

Next.js 15 (static export) + React 19 + TypeScript + Tailwind. Static schedule/calendar UIs for Zenith tuition lessons.

## Branches

- `main` — base.
- `regular-lessons` — recurring weekly class calendar, deployed to the main scheduling site. Fetches schedules from the `db-schedule-updater` API, caches in localStorage.
- `sept-jc-cc` — JC crash course scheduler, deployed to `crashcourse.jc.zenitheducationstudio.com`. Fixed-date sessions from a local JSON.
- `sept-ss-cc` — Secondary crash course scheduler, deployed to `crashcourse.ss.zenitheducationstudio.com`. Same shape as `sept-jc-cc`, differs only by data + some copy.

**In-flight consolidation:** `sept-jc-cc` and `sept-ss-cc` are being collapsed into a single config-driven `crash-courses` branch. See:
- Spec: `docs/superpowers/specs/2026-04-22-crash-courses-consolidation-design.md`
- Plan: `docs/superpowers/plans/2026-04-22-crash-courses-consolidation.md`

Until the consolidation lands, treat each `sept-*-cc` branch as authoritative for its own site. Do not port features one-off across them — the consolidation is the port.

## Commands

```bash
npm run dev                                    # start Next dev server
npm run build                                  # static export to out/
npm run lint                                   # next lint
npm test                                       # (post-consolidation) jest
npx ts-node scripts/csv_to_sessions2json.ts    # regenerate sessions JSON from CSV
```

On the legacy `sept-*-cc` branches, the dev/build server picks up the hardcoded fetch path in `src/app/page.tsx`. On the consolidated `crash-courses` branch, pass `NEXT_PUBLIC_CC_SLUG=<slug>` at build time (e.g. `NEXT_PUBLIC_CC_SLUG=ss-june-2026 npm run build`); the resolver in `crash-courses/index.ts` scans disk, validates that `crash-courses/<slug>/config.ts` and `sessions.json` both exist, and fails the build loudly if the slug is missing, unknown, or the matching files aren't on disk. Adding a new crash course = drop a new folder under `crash-courses/` with those two files — no registry edits.

A slug can be staged ahead of its source data by setting `preLaunch: true` in `config.ts` and shipping `sessions.json` as `[]`. The config-integrity test waives the "non-empty sessions" assertion for these, so the folder type-checks and bundles while waiting for ops; flip the flag back off once `sessions.csv` lands and `sessions.json` is regenerated. Don't deploy a `preLaunch` slug — gate it at the CF Pages project level until data is in.

## Session data

Crash-course sessions live in `public/sessions-*.json` (per-branch). Shape is `Session[]` from `src/types.ts`. Regenerate from the matching `sessions-*.csv` via `scripts/csv_to_sessions2json.ts`. On regular-lessons, the schedule is fetched from the `db-schedule-updater` API at runtime.

`prefill` being an empty string is the "class full" signal — the calendar greys out the slot and disables the register button.

## Deployment

Cloudflare Pages, one project per site. Build command is `npx @cloudflare/next-on-pages@1`, output dir is `.vercel/output/static`. Production branch is `crash-courses` for all three crash-course sites; each project sets a different `NEXT_PUBLIC_CC_SLUG` env var:
- JC crash course → project `zenith-crash-course-jc`, slug `jc-june-2026`, domain `crashcourse.jc.zenitheducationstudio.com`.
- SS crash course → project `zenith-crash-course-ss`, slug `ss-june-2026`, domain `crashcourse.ss.zenitheducationstudio.com`.
- Primary crash course → project `zenith-crash-course-pri`, slug `pri-june-2026`, domain `crashcourse.pri.zenitheducationstudio.com`.
- Regular lessons → `regular-lessons`.

Production-branch changes and env var updates require the Cloudflare REST API or dashboard — wrangler doesn't expose a flag for either. Ask the user before touching production; never run these commands unattended.

## Conventions

- Keep `Session` JSON shape stable — both the CSV pipeline and every consumer depend on it. Adding a field is safe; renaming is not.
- Google Form registration URLs contain `SCHEDULE` and (post-port) `PROMOCODE` placeholders replaced at click-time from `?campaign=` / `?promocode=` URL params. Never hardcode campaign values.
- The two crash-course branches look ~95% identical by design. When making a fix that applies to both, do it in the consolidation PR, not as two parallel cherry-picks.
- No test framework exists yet on any branch. Jest + `next/jest` + React Testing Library arrive with the consolidation (Task 2 of the plan).

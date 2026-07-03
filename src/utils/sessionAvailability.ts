import type { Session } from "@/types";
import type { CrashCourseConfig } from "../../crash-courses/types";

export type Availability =
  | "open"
  | "ended"
  | "full"
  | "registration-closed";

// Ops policy: registration for a class on day D closes at D-1 18:00 local
// time. So a class on tomorrow is registerable until 17:59 today; from
// 18:00 today onwards, "Registration Closed" is shown. Classes two or
// more days out are unaffected.
export const REGISTRATION_CUTOFF_HOUR = 18;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// session.date strings come straight from the CSV via Date (text) — always
// shaped like "10 Jun" or "06 Jun". Reject anything that doesn't match
// "<day> <month>" so we don't trip Date.parse's permissive year fallback
// (e.g. "not a date 2026" silently parses to Jan 1 2026).
function parseSessionDateAtMidnight(
  rawDate: string,
  year: number
): Date | null {
  if (!/^\s*\d{1,2}\s+[A-Za-z]{3,}\s*$/.test(rawDate)) return null;
  const parsed = Date.parse(`${rawDate.trim()} ${year}`);
  if (isNaN(parsed)) return null;
  const d = new Date(parsed);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Resolve the display state for a session card.
// Precedence (highest → lowest): ended > full > registration-closed > open.
// - ended: session date is today or earlier (date is in the past).
// - full: prefill is empty — the script forces this for sessions whose
//   `Form Controls` column is "Closed - Running" (ops shut signups,
//   usually because the class is full but still happening).
// - registration-closed: session is tomorrow AND current time is past
//   the D-1 cutoff (default 18:00). Anything two or more days out skips
//   this rule.
// - open: registerable.
export function getSessionAvailability(
  session: Pick<Session, "date" | "prefill">,
  config: Pick<CrashCourseConfig, "year">,
  now: Date = new Date()
): Availability {
  const sessionDate = parseSessionDateAtMidnight(session.date, config.year);
  // If we can't parse the date, fall back to the legacy full/open signal
  // so we don't accidentally block a registerable slot on a date glitch.
  if (!sessionDate) {
    return !session.prefill || session.prefill.length === 0 ? "full" : "open";
  }
  const today = startOfDay(now);
  const dayDiff = Math.round(
    (sessionDate.getTime() - today.getTime()) / 86_400_000
  );
  if (dayDiff < 1) return "ended";
  if (!session.prefill || session.prefill.length === 0) return "full";
  if (dayDiff === 1 && now.getHours() >= REGISTRATION_CUTOFF_HOUR) {
    return "registration-closed";
  }
  return "open";
}

export function getAvailabilityLabel(availability: Availability): string {
  switch (availability) {
    case "ended":
      return "Class Ended";
    case "full":
      return "Class Full";
    case "registration-closed":
      return "Registration Closed";
    case "open":
      return "Click to register";
  }
}

export function isRegisterable(availability: Availability): boolean {
  return availability === "open";
}

// "YYYY-MM-DD" → local midnight Date, or null if malformed.
function parseYmdAtMidnight(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

// True once `now` is past dateRange.end (i.e. from the next calendar day) —
// the crash course is fully over.
export function isCourseOver(
  config: Pick<CrashCourseConfig, "dateRange">,
  now: Date = new Date()
): boolean {
  const end = parseYmdAtMidnight(config.dateRange.end);
  if (!end) return false;
  return startOfDay(now).getTime() > end.getTime();
}

export type CourseEndedCta = {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

// Content for the "course ended" calendar overlay + list panel, or null while
// the course is still running or the slug lacks closingBanner/trialRedirect.
// Text is reused from `closingBanner` so the overlay/panel echo the banner.
// `withCampaign` appends `trialRedirect.campaign` to the click-out — the
// calendar overlay passes it; the list panel does not.
export function getCourseEndedCta(
  config: Pick<
    CrashCourseConfig,
    "dateRange" | "closingBanner" | "trialRedirect"
  >,
  now: Date = new Date(),
  opts: { withCampaign?: boolean } = {}
): CourseEndedCta | null {
  if (!isCourseOver(config, now)) return null;
  const cb = config.closingBanner;
  const tr = config.trialRedirect;
  if (!cb || !tr) return null;
  const url = new URL(tr.baseUrl);
  url.searchParams.set("stream", tr.stream);
  if (opts.withCampaign && tr.campaign) {
    url.searchParams.set("campaign", tr.campaign);
  }
  return {
    headline: cb.headline ?? "",
    body: cb.body,
    ctaLabel: cb.ctaLabel,
    ctaHref: url.toString(),
  };
}

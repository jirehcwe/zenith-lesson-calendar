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

/**
 * A pin request is what the URL *asked for*, independent of whether anything
 * matched. Pinned mode is derived from this — NOT from the number of matched
 * slots — so a link whose codes match nothing announces itself as broken
 * instead of silently rendering the ordinary homepage. This deliberately
 * reverses AC 6 of the 2026-06-16 `?classes=` design.
 */
export type PinRequest =
  | { kind: "none" }
  | { kind: "classes"; ids: string[] }
  | { kind: "tutor"; codes: string[] };

/** Slots carry `tutor` always and `classSlotId` optionally. */
type Pinnable = { classSlotId?: string; tutor?: string };

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse `?classes=` / `?tutor=` into a PinRequest. `classes` wins when both are
 * present — arbitrary, but it has to be decided rather than left emergent. A
 * param that is present but yields no usable entries (`?tutor=,`) counts as
 * absent.
 */
export function parsePinRequest(search: string): PinRequest {
  const params = new URLSearchParams(search);

  const ids = parseList(params.get("classes"));
  if (ids.length > 0) return { kind: "classes", ids };

  const codes = parseList(params.get("tutor"));
  if (codes.length > 0) return { kind: "tutor", codes };

  return { kind: "none" };
}

/**
 * Filter `slots` to those the request asks for, preserving input order.
 *
 * Matching is case-insensitive and EXACT — never by prefix or substring. The
 * live schedule contains both `Phoebe` and `Phebe`, and both `Joshua` and
 * `Joshua Teo`; a prefix match would silently show the wrong person's timetable.
 */
export function matchPinnedSlots<T extends Pinnable>(slots: T[], req: PinRequest): T[] {
  if (req.kind === "none") return [];

  const wanted = new Set(
    (req.kind === "classes" ? req.ids : req.codes).map((s) => s.toLowerCase()),
  );
  const field = req.kind === "classes" ? "classSlotId" : "tutor";

  return slots.filter((s) => {
    const value = s[field];
    return value != null && wanted.has(value.toLowerCase());
  });
}

/** "A" · "A and B" · "A, B and C" */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Copy for the pinned header. `matched` is the slots actually being rendered,
 * so tutor names come out in the data's canonical casing rather than however
 * the link happened to spell them, and unmatched codes are never named.
 */
export function describePin(req: PinRequest, matched: Pinnable[]): string {
  // "No request at all" and "a request that matched nothing" are different
  // states, and only the second one is a broken link. This check has to come
  // BEFORE the empty-match guard or the two collapse together: an unpinned
  // homepage would accuse itself of being a dead link.
  if (req.kind === "none") return "";

  if (matched.length === 0) return "We couldn't find any classes for this link.";

  if (req.kind === "tutor") {
    const names = [...new Set(matched.map((s) => s.tutor).filter((t): t is string => t != null))];
    if (names.length === 1) return `You're viewing ${names[0]}'s classes`;
    // Only promise "taught by X" when there is an X to name. Slots carrying no
    // tutor at all fall through to the count below rather than rendering
    // "taught by " with a dangling preposition. `matched` is caller-supplied
    // and nothing enforces that it came from matchPinnedSlots.
    if (names.length > 1) return `You're viewing classes taught by ${joinNames(names)}`;
  }

  return `You're viewing ${matched.length} selected ${matched.length === 1 ? "class" : "classes"}`;
}

/**
 * The whole copy table for the pinned banner, so the page renders one call
 * instead of a ternary. Three states, and they are NOT interchangeable:
 *
 *  - `loadFailed` — the fetch actually threw. The system failed and retrying
 *    can genuinely help, so say so.
 *  - `scheduleEmpty` — a successful response carrying zero rows. Nothing
 *    failed; telling a parent to "try again" is both a lie and useless advice.
 *    Reachable every year: the request pins year=<current>, so from 1 January
 *    until the new year's schedule is published EVERY pin link lands here.
 *  - otherwise — describePin's ordinary copy, including its dead-link case.
 *
 * `loadFailed` is checked first because a failed fetch also leaves the schedule
 * empty, so the states overlap and the more specific cause has to win.
 */
export function pinnedBannerMessage(
  req: PinRequest,
  matched: Pinnable[],
  { loadFailed, scheduleEmpty }: { loadFailed: boolean; scheduleEmpty: boolean },
): string {
  if (loadFailed) return "We couldn't load the schedule. Please try again.";
  if (scheduleEmpty) return "The schedule isn't published yet. Please check back soon.";
  return describePin(req, matched);
}

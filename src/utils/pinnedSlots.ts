/**
 * A pin request is what the URL *asked for*, independent of whether anything
 * matched. Pinned mode is derived from this — NOT from the number of matched
 * slots — so a link whose codes match nothing announces itself as broken
 * instead of silently rendering the ordinary homepage. This deliberately
 * reverses AC 6 of the 2026-06-16 `?classes=` design.
 *
 * The `ids`/`codes` lists are `readonly` because nothing here mutates them —
 * they are only read and iterated. That makes the type strictly more permissive
 * for callers (a mutable `string[]` is assignable to `readonly string[]`, but
 * not the reverse), so `as const` fixtures and frozen literals are accepted too.
 */
export type PinRequest =
  | { kind: "none" }
  | { kind: "classes"; ids: readonly string[] }
  | { kind: "tutor"; codes: readonly string[] };

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
 * The two states that are about the SCHEDULE rather than about a link, so both
 * callers — pinned and unpinned — read the same strings from one place.
 *
 * Factored out of pinnedBannerMessage (2026-07-30) because it was only ever
 * called from behind `isPinned`, which made both messages unreachable for the
 * ordinary majority of visitors: a failed or empty fetch gave them the hero,
 * the filter bar and no message at all, then "Select a stream to see classes"
 * over a calendar that can never fill. Silence would have been bad enough; the
 * prompt actively points at filters that cannot help, so the reasonable
 * conclusion is that the centre runs no classes.
 *
 *  - `loadFailed` — the fetch actually threw (a rejection, a CORS failure, or
 *    the 10s abort, which reaches the same `.catch`). The system failed and
 *    retrying can genuinely help, so say so.
 *  - `scheduleEmpty` — a successful response carrying zero rows. Nothing
 *    failed; telling a parent to "try again" is both a lie and useless advice.
 *    Reachable every year: the request pins year=<current>, so from 1 January
 *    until the new year's schedule is published EVERY visitor lands here.
 *  - `null` — nothing to say. This is the return that keeps the notice off the
 *    ordinary healthy page, so it must stay the default rather than a case.
 *
 * `loadFailed` is checked first because a failed fetch also leaves the schedule
 * empty, so the states overlap and the more specific cause has to win.
 *
 * `hasContent` is what stops the failure copy being printed over a page full of
 * classes: page.tsx falls back to a cached schedule when a PINNED fetch fails,
 * so `loadFailed` does not imply an empty screen. When there IS content the
 * caller owns the wording (see pinnedBannerMessage's saved-copy suffix), and
 * `null` hands that decision back rather than shouting over it.
 */
export function scheduleNoticeMessage({
  loadFailed,
  scheduleEmpty,
  hasContent,
}: {
  loadFailed: boolean;
  scheduleEmpty: boolean;
  hasContent: boolean;
}): string | null {
  if (loadFailed && !hasContent) return "We couldn't load the schedule. Please try again.";
  if (scheduleEmpty) return "The schedule isn't published yet. Please check back soon.";
  return null;
}

/**
 * The whole copy table for the pinned banner, so the page renders one call
 * instead of a ternary. Four states, and they are NOT interchangeable:
 *
 *  - `loadFailed` — the fetch actually threw AND left nothing to show for this
 *    pin. The system failed and retrying can genuinely help, so say so (the
 *    copy itself now lives in scheduleNoticeMessage, shared with the unpinned
 *    notice, so the two can never drift apart). The second half is
 *    load-bearing: page.tsx falls back to a cached schedule when
 *    a PINNED fetch fails, so `loadFailed` no longer implies an empty screen.
 *    When that fallback produced the classes the link asked for, the visitor
 *    has something to look at, and a bare "we couldn't load the schedule" over
 *    a page full of classes is simply false — see the next state for what they
 *    get instead.
 *  - `servedFromCacheFallback` — those rows came out of localStorage after the
 *    failed fetch, so they are a SNAPSHOT, not the schedule. The ordinary copy
 *    asserts completeness the page cannot back up: `?classes=A,B` renders only
 *    the cached A as "1 selected class", and a tutor pin omits classes added
 *    since while still claiming to be that tutor's classes. So the ordinary
 *    description is kept — it is the most accurate summary of what is on
 *    screen — and marked as a saved copy.
 *
 *    Applied uniformly to both pin kinds, deliberately. The tempting
 *    refinement — "every requested id matched, so this must be complete" — is
 *    wrong: a class present in the cache can still have had its time, venue or
 *    tutor changed since it was cached. Staleness is a property of the payload,
 *    not of the match count, so there is no fallback render this warning is
 *    untrue of.
 *  - `scheduleEmpty` — a successful response carrying zero rows. Nothing
 *    failed; telling a parent to "try again" is both a lie and useless advice.
 *    Reachable every year: the request pins year=<current>, so from 1 January
 *    until the new year's schedule is published EVERY pin link lands here.
 *  - otherwise — describePin's ordinary copy, including its dead-link case.
 *
 * `loadFailed` is checked first because a failed fetch also leaves the schedule
 * empty, so the states overlap and the more specific cause has to win.
 *
 * The one combination deliberately NOT relaxed: failed fetch + nothing matched
 * keeps the failure copy and must never fall through to "We couldn't find any
 * classes for this link." A miss under a failed fetch cannot tell a dead link
 * from a stale cache, and guessing "dead" is exactly the lie this banner exists
 * to avoid.
 */
export function pinnedBannerMessage(
  req: PinRequest,
  matched: Pinnable[],
  {
    loadFailed,
    scheduleEmpty,
    servedFromCacheFallback,
  }: { loadFailed: boolean; scheduleEmpty: boolean; servedFromCacheFallback: boolean },
): string {
  // Both schedule-level states, in their established order, from the one place
  // that owns those two strings. `hasContent` is the pinned reading of "there is
  // something on screen": the pinned views render `matched`, not the whole
  // schedule, so a fallback that produced this link's classes counts as content
  // even though the fetch failed.
  const notice = scheduleNoticeMessage({
    loadFailed,
    scheduleEmpty,
    hasContent: matched.length > 0,
  });
  if (notice) return notice;

  const description = describePin(req, matched);
  // The `matched.length` guard keeps the suffix off describePin's dead-link
  // verdict. In page.tsx that pairing is already unreachable (a fallback render
  // with no matches is caught by the failure guard above), but the decoration
  // must never be able to lend a stale cache the authority to call a link dead:
  // "We couldn't find any classes for this link — a saved copy" would be the
  // round-A bug wearing the round-C warning as cover.
  if (servedFromCacheFallback && matched.length > 0) {
    return `${description} — a saved copy, which may be out of date.`;
  }
  return description;
}

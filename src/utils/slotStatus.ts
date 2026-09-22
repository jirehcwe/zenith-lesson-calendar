import type { WeeklyClassSlot } from "@/components/WeeklyClassCalendar";

// Check if a slot is full based on [FULL] prefix in the title
export function isSlotFull(slot: WeeklyClassSlot): boolean {
  return slot.title.startsWith("[FULL]");
}

// Waitlist is a separate, weaker signal than [FULL] and must not be conflated
// with it. Both are markers that ops put in the class label (Master Sheet
// (2026), column BX): a full class starts with `[FULL]`, and a waitlisted class
// ends with `*(Waitlist Only)*`. A waitlisted class is still open on the Google
// Form, so this is display-only — it must NOT gate the trial or registration
// CTAs the way isSlotFull() does.
//
// Matched as a loose case-insensitive substring rather than the exact
// `*(Waitlist Only)*` string: the marker is hand-typed by ops, so the wording
// and the asterisk wrapper can drift. This mirrors how the telebot side
// already sniffs for `[full]`.
export function isSlotWaitlist(slot: WeeklyClassSlot): boolean {
  return slot.title.toLowerCase().includes("waitlist");
}

// Ops can close the trial form or the registration form for one class (Master
// Sheet (2026) columns BU and BY), and the feed sends that as trialOpen /
// registrationOpen. A missing flag means open, so feeds and cached payloads
// from before the flags keep their buttons. A [FULL] class takes no sign-ups,
// whatever its flags say.
export function canBookTrial(slot: WeeklyClassSlot): boolean {
  return !isSlotFull(slot) && slot.trialOpen !== false;
}

export function canRegister(slot: WeeklyClassSlot): boolean {
  return !isSlotFull(slot) && slot.registrationOpen !== false;
}

// Both sign-up forms closed on a class that is not [FULL]. The calendar treats
// it like a full class — greyed out, labelled "closed" — and does not open its
// popup. A [FULL] class keeps its full label, whatever its flags say.
export function isSlotClosed(slot: WeeklyClassSlot): boolean {
  return !isSlotFull(slot) && slot.trialOpen === false && slot.registrationOpen === false;
}

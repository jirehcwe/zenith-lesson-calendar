/**
 * Parse the `classes` query param into a list of requested class codes.
 * Splits on comma, trims each, drops empties. Returns [] when absent/empty.
 */
export function parseClassesParam(search: string): string[] {
  const raw = new URLSearchParams(search).get("classes");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Filter `slots` down to those whose `classSlotId` is in `pinnedIds`
 * (case-insensitive). Returns [] when no ids are requested. Preserves the
 * order of `slots`. Slots without a classSlotId never match.
 */
export function matchPinnedSlots<T extends { classSlotId?: string }>(
  slots: T[],
  pinnedIds: string[],
): T[] {
  if (pinnedIds.length === 0) return [];
  const wanted = new Set(pinnedIds.map((id) => id.toLowerCase()));
  return slots.filter((s) => s.classSlotId != null && wanted.has(s.classSlotId.toLowerCase()));
}

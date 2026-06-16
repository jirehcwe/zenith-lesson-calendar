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

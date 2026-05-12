export function normalizeDate(raw: string): string | null {
  const parsed = Date.parse(`${raw} 2025`);
  if (isNaN(parsed)) return null;
  const d = new Date(parsed);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

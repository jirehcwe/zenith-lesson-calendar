// Subject color — single source of truth. Each color is defined ONCE as a named
// swatch; block colors and the legend both derive from these swatches so they
// cannot drift. Colors are synced to the ops "2026 Schedule" sheet; `tint` is the
// exact ops cell fill, `color` a darkened shade for legible text/border accents.
// Exceptions kept for on-screen legibility: JC Chemistry (#FFF176) and JC Math
// (#8AE8EF) tints are softened/deepened from the ops fills — do not re-sync.

export type Swatch = { label: string; color: string; tint: string };
type CategorySwatch = Swatch & { subjects: readonly string[] };

export const FULL_SWATCH: Swatch = { label: "Full", color: "#64748B", tint: "#E5E7EB" };

export const JC = {
  math:      { label: "Math",      color: "#00757B", tint: "#8AE8EF", subjects: ["Mathematics"] },
  physics:   { label: "Physics",   color: "#650000", tint: "#FF6969", subjects: ["Physics"] },
  chemistry: { label: "Chemistry", color: "#717100", tint: "#FFF176", subjects: ["Chemistry"] },
  biology:   { label: "Biology",   color: "#133586", tint: "#95B0F0", subjects: ["Biology"] },
  gp:        { label: "GP",        color: "#654B01", tint: "#FBBC04", subjects: ["General Paper"] },
  econ:      { label: "Econ",      color: "#007209", tint: "#7BFF85", subjects: ["Economics"] },
} satisfies Record<string, CategorySwatch>;

export const SEC = {
  math:       { label: "Math",         color: "#1F4F7A", tint: "#CFE2F3", subjects: ["Mathematics", "E Math"] },
  aMath:      { label: "A Math",       color: "#1F4F7A", tint: "#CFE2F3", subjects: ["A Math"] },
  physics:    { label: "Physics",      color: "#44132D", tint: "#C27BA0", subjects: ["Pure Physics", "Combined Physics", "Physics"] },
  chemistry:  { label: "Chemistry",    color: "#7E1B1B", tint: "#F4CCCC", subjects: ["Chemistry", "Pure Chemistry", "Combined Chemistry"] },
  biology:    { label: "Biology",      color: "#346F20", tint: "#D9EAD3", subjects: ["Pure Biology", "Combined Biology"] },
  science:    { label: "Science",      color: "#990000", tint: "#FFC2C2", subjects: ["Science"] },
  english:    { label: "English",      color: "#4F1C12", tint: "#DD7E6B", subjects: ["English"] },
  history:    { label: "History",      color: "#6C5900", tint: "#FFD504", subjects: ["Pure History", "Combined History"] },
  literature: { label: "Literature",   color: "#567300", tint: "#DCFF74", subjects: ["Pure Literature", "Combined Literature"] },
  // Geography is not offered in 2026; kept white until ops assigns a color.
  geography:  { label: "Geography",    color: "#64748B", tint: "#FFFFFF", subjects: ["Pure Geography", "Combined Geography"] },
  socStudies: { label: "Soc. Studies", color: "#7E0099", tint: "#F0ABFF", subjects: ["Social Studies"] },
} satisfies Record<string, CategorySwatch>;

export const PRIMARY = {
  english: { label: "English", color: "#1E4E7B", tint: "#9FC5E8", subjects: ["English"] },
  math:    { label: "Math",    color: "#713D07", tint: "#F6B26B", subjects: ["Mathematics"] },
  science: { label: "Science", color: "#2F5E1B", tint: "#B6D7A8", subjects: ["Science"] },
} satisfies Record<string, CategorySwatch>;

// Curated single-swatch-per-subject overview, shown when no stream is selected.
// Secondary colors for shared subjects + JC colors for GP/Econ. Each entry is a
// reference to an existing category swatch — no independent hexes.
export const OVERVIEW: readonly CategorySwatch[] = [
  SEC.math, SEC.aMath, SEC.physics, SEC.chemistry, SEC.biology, SEC.english,
  JC.gp, JC.econ, SEC.history, SEC.literature, SEC.geography, SEC.socStudies,
];

// Built once: full subject name → swatch, per category.
function indexBySubject(palette: Record<string, CategorySwatch>): Record<string, Swatch> {
  const idx: Record<string, Swatch> = {};
  for (const s of Object.values(palette)) {
    for (const subject of s.subjects) idx[subject] = { label: s.label, color: s.color, tint: s.tint };
  }
  return idx;
}
const JC_INDEX = indexBySubject(JC);
const SEC_INDEX = indexBySubject(SEC);
const PRIMARY_INDEX = indexBySubject(PRIMARY);

// The palette a block is colored from, inferred from the level's first letter
// (J/S/P) — the single color axis. Returns null for unknown levels.
function indexForLevel(level: string): Record<string, Swatch> | null {
  if (level.includes("J")) return JC_INDEX;
  if (level.includes("S")) return SEC_INDEX;
  if (level.includes("P")) return PRIMARY_INDEX;
  return null;
}

function paletteToItems(palette: Record<string, CategorySwatch>): Swatch[] {
  return Object.values(palette).map((s) => ({ label: s.label, color: s.color, tint: s.tint }));
}

// IP vs Express is differentiated by the slot's `stream` field, not by color, so
// "IP Mathematics" normalizes to "Mathematics" and reuses that swatch.
export function subjectToColor(level: string, subject: string): Swatch {
  const normalised = subject.startsWith("IP ") ? subject.slice(3) : subject;
  const idx = indexForLevel(level);
  return (idx && idx[normalised]) || FULL_SWATCH;
}

export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).color;
}

export function getLegendItemsForStream(stream: string | null): Swatch[] {
  if (stream === "JC") return [...paletteToItems(JC), FULL_SWATCH];
  // Only reached when no slots are rendered — once slots exist the legend is
  // derived per-slot from `level`.
  if (stream?.startsWith("Secondary") || stream === "AllSec") {
    return [...paletteToItems(SEC), FULL_SWATCH];
  }
  if (stream === "Primary") return [...paletteToItems(PRIMARY), FULL_SWATCH];
  return [...OVERVIEW.map((s) => ({ label: s.label, color: s.color, tint: s.tint })), FULL_SWATCH];
}

export function legendItemsForLevel(level: string): Swatch[] {
  if (level.includes("J")) return [...paletteToItems(JC), FULL_SWATCH];
  if (level.includes("S")) return [...paletteToItems(SEC), FULL_SWATCH];
  if (level.includes("P")) return [...paletteToItems(PRIMARY), FULL_SWATCH];
  return getLegendItemsForStream(null);
}

// Master ordering across all stream palettes so a legend mixing streams sorts
// deterministically. Every resolved swatch color is present here.
export const LEGEND_ORDER: string[] = [
  ...Object.values(JC), ...Object.values(SEC), ...Object.values(PRIMARY),
].map((s) => s.color);

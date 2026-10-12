// The school track from the master sheet ("IP Track Name"), shown as
// "Syllabus". Examples: "RGS Aligned", "TJC + Dunman High + Cedar Girls
// Aligned", "All Schools". "NA" or no value means the class has none.

type Track = string | null | undefined;

const fold = (text: string) => text.trim().toLowerCase();

function clean(track: Track): string | null {
  const text = (track ?? "").trim();
  if (text === "" || /^n\/?a$/i.test(text)) return null;
  return text;
}

function isAllSchools(track: Track): boolean {
  return fold(clean(track) ?? "") === "all schools";
}

// The text on a slot, or null for no label.
export function syllabusLabel(track: Track): string | null {
  return clean(track);
}

// The single schools that a track names. All Schools names none.
export function syllabusSchools(track: Track): string[] {
  const text = clean(track);
  if (text === null || isAllSchools(text)) return [];
  return text
    .replace(/(\s+aligned)+\s*$/i, "")
    .split("+")
    .map((school) => school.trim())
    .filter((school) => school !== "");
}

// No pick matches everything. An All Schools class matches any pick.
export function matchesSyllabus(track: Track, picks: string[]): boolean {
  if (picks.length === 0) return true;
  if (isAllSchools(track)) return true;
  const schools = syllabusSchools(track).map(fold);
  return picks.some((pick) => schools.includes(fold(pick)));
}

// The filter options for a set of slots: each school once, sorted.
export function syllabusOptions(tracks: Track[]): string[] {
  const byFolded = new Map<string, string>();
  for (const track of tracks) {
    for (const school of syllabusSchools(track)) {
      if (!byFolded.has(fold(school))) byFolded.set(fold(school), school);
    }
  }
  return [...byFolded.values()].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require("csv-parse/sync");

function addHours(time: string, hours: number): string {
  const [hourMin, ampm] = time.split(" ");
  const [hourStr, minuteStr] = hourMin.split(":");
  let hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  hour += hours;
  if (hour >= 24) hour -= 24;
  const newAmpm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${newAmpm}`;
}

const slug = process.argv[2];
if (!slug) {
  console.error(
    "Usage: npx ts-node scripts/csv_to_sessions2json.ts <slug>\n" +
      "Example: npx ts-node scripts/csv_to_sessions2json.ts ss-june-2026"
  );
  process.exit(1);
}

const slugDir = path.join(__dirname, "..", "crash-courses", slug);
if (!fs.existsSync(slugDir)) {
  console.error(`Directory not found: crash-courses/${slug}/`);
  process.exit(1);
}

const csvPath = path.join(slugDir, "sessions.csv");
const mappingPath = path.join(slugDir, "form-mapping.json");
const outPath = path.join(slugDir, "sessions.json");

if (!fs.existsSync(csvPath)) {
  console.error(`Input CSV not found: crash-courses/${slug}/sessions.csv`);
  process.exit(1);
}
if (!fs.existsSync(mappingPath)) {
  console.error(
    `Form mapping not found: crash-courses/${slug}/form-mapping.json\n` +
      `Expected shape: { "durationHours": number, "prefillFields": { [displaySubject]: entryId } }`
  );
  process.exit(1);
}

type FormMapping = {
  durationHours: number;
  prefillFields: Record<string, string>;
};

const mapping: FormMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
const { durationHours, prefillFields } = mapping;

if (typeof durationHours !== "number" || !Number.isFinite(durationHours)) {
  console.error(
    `Invalid durationHours in crash-courses/${slug}/form-mapping.json (expected number).`
  );
  process.exit(1);
}
if (!prefillFields || typeof prefillFields !== "object") {
  console.error(
    `Invalid prefillFields in crash-courses/${slug}/form-mapping.json (expected { [displaySubject]: entryId }).`
  );
  process.exit(1);
}

function lookupPrefillField(displaySubject: string): string {
  const field = prefillFields[displaySubject];
  if (field === undefined) {
    throw new Error(
      `No form entry for displaySubject "${displaySubject}" in crash-courses/${slug}/form-mapping.json. ` +
        `Add it under "prefillFields".`
    );
  }
  return field;
}

type CsvRow = Record<string, string>;

const csvContent = fs.readFileSync(csvPath, "utf8");
const records = parse(csvContent, {
  // Source sheets repeat several header names (Subject, Tutor, Centre, Level)
  // because the helper columns at AF–AM duplicate them. csv-parse's default
  // collision behaviour is "last-wins", which would mask the always-populated
  // first-appearance columns (D/E/G) behind the formula-driven dup columns
  // (AH/AL/AK) that ops doesn't reliably drag down.
  // Suffix duplicates so we can address both: e.g. row["Subject"] = col D,
  // row["Subject__2"] = col AH. Headers are trimmed for whitespace too.
  columns: (headers: string[]) => {
    const seen = new Map<string, number>();
    return headers.map((h) => {
      const t = h.trim();
      const n = (seen.get(t) ?? 0) + 1;
      seen.set(t, n);
      return n === 1 ? t : `${t}__${n}`;
    });
  },
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
}) as CsvRow[];

// Source sheets contain template/summary rows with no Subject(Display) or
// with "#N/A" placeholders — skip those silently. Any row that HAS a
// display subject but isn't in the mapping will still throw loudly below.
const validRows = records.filter((row) => {
  const d = row["Subject(Display)"];
  return d && d !== "#N/A";
});
const skipped = records.length - validRows.length;

// Tutor + Centre come from D/E/G (first appearance, always populated by ops).
// Subject is the asymmetric one: col D holds descriptive groupings ("JC -
// Econs", "SS - P Lit") while col AH holds the short codes the rest of the
// pipeline indexes by ("ECON", "SLit(Pure)"). Prefer the dup column; when
// it's empty (formula not pulled down), reverse-lookup the short code from
// other rows in the same CSV that share displaySubject.
const dsToSubject: Record<string, string> = {};
for (const r of validRows) {
  if (r["Subject__2"] && !dsToSubject[r["Subject(Display)"]]) {
    dsToSubject[r["Subject(Display)"]] = r["Subject__2"];
  }
}
let subjectFallbacks = 0;
const subjectMisses = new Set<string>();

const result = validRows.map((row: CsvRow) => {
  const displaySubject = row["Subject(Display)"];
  const prefillField = lookupPrefillField(displaySubject);
  const startTime = row["Start Time"]?.replace(/:(\d{2})\s/, " ");

  let subject = row["Subject__2"];
  if (!subject) {
    subject = dsToSubject[displaySubject] ?? "";
    if (subject) subjectFallbacks++;
    else subjectMisses.add(displaySubject);
  }

  return {
    purpose: row["Purpose"],
    subject,
    level: row["Level"],
    topic: row["Topic"],
    tutor: row["Tutor"],
    centre: row["Centre"],
    // SS sheets historically misspelled as "Classeroom"; fall back just in case.
    classroom: row["Classroom"] ?? row["Classeroom"],
    capacity: row["Capacity"],
    date: row["Date (text)"]?.replace(/\s*\(.*\)/, ""),
    startTime,
    endTime: addHours(startTime, durationHours),
    prefill: row["Form Option to Display"],
    prefillField,
    displaySubject,
  };
});

if (subjectFallbacks) {
  console.log(`Subject reverse-look-up filled ${subjectFallbacks} rows.`);
}
if (subjectMisses.size) {
  console.warn(
    `WARN: no subject code resolvable for ${subjectMisses.size} displaySubject(s) ` +
      `(no other row in this CSV has the AH dup column populated): ` +
      [...subjectMisses].join(", ") +
      ` — those sessions will have subject="" in the output.`
  );
}

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(
  `crash-courses/${slug}/sessions.json generated with ${result.length} sessions ` +
    `(duration ${durationHours}h, skipped ${skipped} blank/placeholder rows).`
);

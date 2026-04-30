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
      `Expected shape: { "durationHours": number, "subjectCodes": { [displaySubject]: shortCode }, "prefillFields": { [displaySubject]: entryId } }`
  );
  process.exit(1);
}

type FormMapping = {
  durationHours: number;
  subjectCodes: Record<string, string>;
  prefillFields: Record<string, string>;
};

const mapping: FormMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
const { durationHours, subjectCodes, prefillFields } = mapping;

if (typeof durationHours !== "number" || !Number.isFinite(durationHours)) {
  console.error(
    `Invalid durationHours in crash-courses/${slug}/form-mapping.json (expected number).`
  );
  process.exit(1);
}
if (!subjectCodes || typeof subjectCodes !== "object") {
  console.error(
    `Invalid subjectCodes in crash-courses/${slug}/form-mapping.json (expected { [displaySubject]: shortCode }).`
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

function lookupSubjectCode(displaySubject: string): string {
  const code = subjectCodes[displaySubject];
  if (code === undefined) {
    throw new Error(
      `No subject code for displaySubject "${displaySubject}" in crash-courses/${slug}/form-mapping.json. ` +
        `Add it under "subjectCodes".`
    );
  }
  return code;
}

type CsvRow = Record<string, string>;

const csvContent = fs.readFileSync(csvPath, "utf8");
const records = parse(csvContent, {
  // Source sheets repeat header names (Subject, Tutor, Centre, Level) at the
  // helper columns AF–AM. csv-parse's default collision behaviour is
  // "last-wins", which would mask the always-populated first-appearance
  // columns (D/E/G) behind the formula-driven dup columns ops doesn't
  // reliably drag down. Suffix duplicates so the first appearance stays at
  // the unsuffixed key — that's the one we always read.
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

// Source sheets contain template/summary/waitlist rows that should not be
// treated as real sessions. Rules to skip a row:
//   - Subject(Display) empty or "#N/A" (JC/SS template rows).
//   - Schedule Codes (col A — header is "Schedule Codes" in JC/SS,
//     "Scheduling code" in Pri) empty (Pri waitlist placeholders, which DO
//     have Subject(Display) populated but no real schedule).
// Any surviving row whose displaySubject isn't in the mapping still throws.
const validRows = records.filter((row) => {
  const d = row["Subject(Display)"];
  if (!d || d === "#N/A") return false;
  const code = row["Schedule Codes"] ?? row["Scheduling code"];
  if (!code || !code.trim()) return false;
  return true;
});
const skipped = records.length - validRows.length;

// Subject (short code) is derived from displaySubject via subjectCodes in
// form-mapping.json — never from the AH dup column, since ops doesn't always
// drag the helper-column formulas down to new rows. Tutor + Centre still
// come from D/E/G (first appearance), which ops fills manually.
const result = validRows.map((row: CsvRow) => {
  const displaySubject = row["Subject(Display)"];
  const prefillField = lookupPrefillField(displaySubject);
  const subject = lookupSubjectCode(displaySubject);
  const startTime = row["Start Time"]?.replace(/:(\d{2})\s/, " ");

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

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(
  `crash-courses/${slug}/sessions.json generated with ${result.length} sessions ` +
    `(duration ${durationHours}h, skipped ${skipped} blank/placeholder rows).`
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require("csv-parse/sync");

// Class times are sourced from the "Timeslot (+Nhr)" column, not "Start Time".
// Historically those two have drifted (Start Time has been set 30 min earlier
// than the actual class on a chunk of rows), and Timeslot is also what
// populates the form prefill string customers see — so reading from Timeslot
// keeps the calendar block and the registration form in sync.
function normalizeTime(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (!m) throw new Error(`Cannot parse time "${raw}"`);
  return `${Number(m[1])}:${m[2]} ${m[3].toUpperCase()}`;
}

function parseTimeslot(raw: string): { startTime: string; endTime: string } {
  const parts = raw.split(/\s*[-–]\s*/);
  if (parts.length !== 2)
    throw new Error(
      `Cannot parse timeslot "${raw}" (expected "HH:MMam - HH:MMpm").`
    );
  return {
    startTime: normalizeTime(parts[0]),
    endTime: normalizeTime(parts[1]),
  };
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
const mockCsvPath = path.join(slugDir, "mock-sessions.csv");
const mappingPath = path.join(slugDir, "form-mapping.json");
const outPath = path.join(slugDir, "sessions.json");

if (!fs.existsSync(csvPath)) {
  console.error(`Input CSV not found: crash-courses/${slug}/sessions.csv`);
  process.exit(1);
}
if (!fs.existsSync(mappingPath)) {
  console.error(
    `Form mapping not found: crash-courses/${slug}/form-mapping.json\n` +
      `Expected shape: { "subjectCodes": { [displaySubject]: shortCode }, "prefillFields": { [displaySubject]: entryId } }`
  );
  process.exit(1);
}

type FormMapping = {
  subjectCodes: Record<string, string>;
  prefillFields: Record<string, string>;
};

const mapping: FormMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
const { subjectCodes, prefillFields } = mapping;

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

let capturedHeaders: string[] = [];

function parseCsv(filePath: string): CsvRow[] {
  const csvContent = fs.readFileSync(filePath, "utf8");
  return parse(csvContent, {
    // Source sheets repeat header names (Subject, Tutor, Centre, Level) at the
    // helper columns AF–AM. csv-parse's default collision behaviour is
    // "last-wins", which would mask the always-populated first-appearance
    // columns (D/E/G) behind the formula-driven dup columns ops doesn't
    // reliably drag down. Suffix duplicates so the first appearance stays at
    // the unsuffixed key — that's the one we always read.
    columns: (headers: string[]) => {
      const seen = new Map<string, number>();
      const renamed = headers.map((h) => {
        const t = h.trim();
        const n = (seen.get(t) ?? 0) + 1;
        seen.set(t, n);
        return n === 1 ? t : `${t}__${n}`;
      });
      // Both CSVs share the same column shape, so capturing from the last
      // parsed file is fine — we only use this to resolve the "Timeslot
      // (+Nhr)" column name, which is identical across them.
      capturedHeaders = renamed;
      return renamed;
    },
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as CsvRow[];
}

const records = parseCsv(csvPath);
// Optional per-slug mock-exam CSV. Same column shape as sessions.csv; rows
// are tagged via the "Purpose" column (e.g. "Pri Mock Exam") and surface in
// the UI as a separate type via the config's mockExam block.
const mockRecords = fs.existsSync(mockCsvPath) ? parseCsv(mockCsvPath) : [];
const allRecords = records.concat(mockRecords);

// Per-sheet the timeslot column is "Timeslot (+3hr)" (JC) or "Timeslot (+2hr)"
// (SS, Pri). Resolve by prefix so each new course doesn't have to hardcode it.
const timeslotKey = capturedHeaders.find((k) => /^Timeslot\b/i.test(k));
if (!timeslotKey) {
  console.error(
    `No "Timeslot (+Nhr)" column found in crash-courses/${slug}/sessions.csv. ` +
      `That column is the source-of-truth for class start/end times.`
  );
  process.exit(1);
}

// Source sheets contain template/summary/waitlist/closed rows that should
// not be treated as real sessions. Rules to skip a row:
//   - Subject(Display) empty or "#N/A" (JC/SS template rows).
//   - Schedule Codes (col A — header is "Schedule Codes" in JC/SS,
//     "Scheduling code" in Pri) empty (Pri waitlist placeholders, which DO
//     have Subject(Display) populated but no real schedule).
//   - Form Controls starting with "Closed" (e.g. "Closed - Not running") —
//     ops manually closes a class by flipping this dropdown; we drop the
//     row entirely so it doesn't render on the calendar at all (note: an
//     empty prefill is a separate "class full" signal that greys out the
//     slot, which we still want to support).
// Any surviving row whose displaySubject isn't in the mapping still throws.
const validRows = allRecords.filter((row) => {
  const d = row["Subject(Display)"];
  if (!d || d === "#N/A") return false;
  const code = row["Schedule Codes"] ?? row["Scheduling code"];
  if (!code || !code.trim()) return false;
  const formControls = (row["Form Controls"] ?? "").trim();
  if (/^closed\b/i.test(formControls)) return false;
  return true;
});
const skipped = allRecords.length - validRows.length;

// Subject (short code) is derived from displaySubject via subjectCodes in
// form-mapping.json — never from the AH dup column, since ops doesn't always
// drag the helper-column formulas down to new rows. Tutor + Centre still
// come from D/E/G (first appearance), which ops fills manually.
const result = validRows.map((row: CsvRow) => {
  const displaySubject = row["Subject(Display)"];
  const prefillField = lookupPrefillField(displaySubject);
  const subject = lookupSubjectCode(displaySubject);
  const { startTime, endTime } = parseTimeslot(row[timeslotKey]);

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
    endTime,
    prefill: row["Form Option to Display"],
    prefillField,
    displaySubject,
  };
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

const mockCount = result.filter((r) => /mock\s*exam/i.test(r.purpose ?? "")).length;
console.log(
  `crash-courses/${slug}/sessions.json generated with ${result.length} sessions ` +
    `(${mockCount} mock-exam, ${result.length - mockCount} regular; ` +
    `times from "${timeslotKey}", skipped ${skipped} blank/placeholder rows).`
);

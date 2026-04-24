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
  // Trim header names — the SS source sheet used to export with trailing
  // whitespace in column names, which would break row[...] lookups.
  columns: (headers: string[]) => headers.map((h) => h.trim()),
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

const result = validRows.map((row: CsvRow) => {
  const displaySubject = row["Subject(Display)"];
  const prefillField = lookupPrefillField(displaySubject);
  const startTime = row["Start Time"]?.replace(/:(\d{2})\s/, " ");

  return {
    purpose: row["Purpose"],
    subject: row["Subject"],
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

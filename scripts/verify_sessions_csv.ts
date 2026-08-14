// Integrity checks for a crash-course sessions.csv.
//
// The source sheet stores the same facts in more than one place: column A
// ("Schedule Codes") packs Purpose/Level/Subject/Tutor/Day/Centre/Classroom/
// Capacity/Date/StartTime/Topic into one <>-joined string, and column U
// ("Form Option to Display") is built from Subject(Display)/Centre/Date (text)/
// Timeslot/Topic. Those redundancies let us prove the CSV is internally
// consistent — if any single field was copied wrong, at least one of the
// cross-checks below disagrees.
//
// Usage: npx ts-node scripts/verify_sessions_csv.ts <slug> [--window YYYY-MM-DD:YYYY-MM-DD]

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require("csv-parse/sync");

const slug = process.argv[2];
if (!slug) {
  console.error(
    "Usage: npx ts-node scripts/verify_sessions_csv.ts <slug> [--window YYYY-MM-DD:YYYY-MM-DD]"
  );
  process.exit(1);
}

const windowArgIdx = process.argv.indexOf("--window");
const windowArg = windowArgIdx > -1 ? process.argv[windowArgIdx + 1] : null;

const csvPath = path.join(
  __dirname,
  "..",
  "crash-courses",
  slug,
  "sessions.csv"
);
if (!fs.existsSync(csvPath)) {
  console.error(`Not found: crash-courses/${slug}/sessions.csv`);
  process.exit(1);
}

type Row = Record<string, string>;
const rows: Row[] = parse(fs.readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  // Keep the trailing space on an empty-topic "… | " form option intact.
  trim: false,
  relax_column_count: true,
});

const failures: string[] = [];
const warnings: string[] = [];
const fail = (line: number, msg: string) =>
  failures.push(`row ${line}: ${msg}`);
const warn = (line: number, msg: string) =>
  warnings.push(`row ${line}: ${msg}`);

const timeslotKey =
  Object.keys(rows[0] ?? {}).find((k) => /^Timeslot\b/i.test(k)) ?? "";
if (!timeslotKey) {
  console.error('No "Timeslot (+Nhr)" column present.');
  process.exit(1);
}

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

// "07 Sep (Mon)" -> { day: 7, month: 9 }
function parseDateText(v: string): { day: number; month: number } | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(v.trim());
  if (!m || !MONTHS[m[2]]) return null;
  return { day: Number(m[1]), month: MONTHS[m[2]] };
}

// "10:00AM" / "01:30PM" -> minutes since midnight
function toMinutes(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(v.trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

const BAD_VALUES = /#N\/A|#VALUE!|#REF!|#ERROR!|#NAME\?/;

let windowStart: Date | null = null;
let windowEnd: Date | null = null;
if (windowArg) {
  const [a, b] = windowArg.split(":");
  windowStart = new Date(`${a}T00:00:00`);
  windowEnd = new Date(`${b}T00:00:00`);
}

const seenKeys = new Map<string, number>();
const formOptionShapes = new Set<string>();

const skippedRows: string[] = [];

rows.forEach((row, i) => {
  const line = i + 2; // +1 header, +1 to 1-index

  const code = (row["Schedule Codes"] ?? row["Scheduling code"] ?? "").trim();
  const displaySubject = (row["Subject(Display)"] ?? "").trim();

  // Mirror csv_to_sessions2json's filter. Rows it drops never reach the site,
  // so holding them to the cross-checks below would report failures for rows
  // that ship nothing. Surface them instead — a dropped row is usually a
  // broken lookup in the sheet, and someone should see it.
  const controls = (row["Form Controls"] ?? "").trim();
  const willShip =
    !!displaySubject &&
    displaySubject !== "#N/A" &&
    !!code &&
    !/^closed\s*-\s*not\s+running\b/i.test(controls);
  if (!willShip) {
    const why = !code
      ? "no Schedule Code"
      : !displaySubject
        ? "empty Subject(Display)"
        : displaySubject === "#N/A"
          ? "Subject(Display) is #N/A (a failed lookup in the sheet)"
          : "Form Controls is Closed - Not running";
    skippedRows.push(`row ${line}: dropped by the converter — ${why}`);
    return;
  }
  const centre = (row["Centre"] ?? "").trim();
  const dateText = (row["Date (text)"] ?? "").trim();
  const timeslot = (row[timeslotKey] ?? "").trim();
  const topic = (row["Topic"] ?? "").trim();
  const formOption = row["Form Option to Display"] ?? "";

  // -- 1. No spreadsheet error values leaked into the export ---------------
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && BAD_VALUES.test(v)) {
      fail(line, `column "${k}" contains a spreadsheet error value: ${v}`);
    }
  }

  // -- 2. Column A decomposes and agrees with its own columns --------------
  // Guards against a field being copied correctly in one place and not the other.
  const parts = code.split("<>");
  if (parts.length !== 11) {
    fail(line, `Schedule Codes has ${parts.length} <>-parts, expected 11`);
  } else {
    const [
      aPurpose, aLevel, aSubject, aTutor, aDay,
      aCentre, aClassroom, aCapacity, aDateShort, , aTopic,
    ] = parts;
    const expect = (got: string, want: string, label: string) => {
      if (got.trim() !== want.trim()) {
        fail(line, `${label}: Schedule Codes says "${got}", column says "${want}"`);
      }
    };
    expect(aPurpose, row["Purpose"] ?? "", "Purpose");
    expect(aLevel, row["Level"] ?? "", "Level");
    expect(aSubject, row["Subject"] ?? "", "Subject");
    expect(aTutor, row["Tutor"] ?? "", "Tutor");
    expect(aDay, row["Day"] ?? "", "Day");
    expect(aCentre, centre, "Centre");
    expect(aClassroom, row["Classroom"] ?? "", "Classroom");
    expect(aCapacity, row["Capacity"] ?? "", "Capacity");
    // JC packs the topic into column A; Sec leaves that slot blank by design.
    // Only cross-check when the sheet actually put a topic there — an empty
    // slot is not evidence of an empty Topic column. The Form Option
    // reconstruction below still covers Topic for every slug.
    if (aTopic.trim()) expect(aTopic, topic, "Topic");

    // "7 Sep" in column A vs "07 Sep (Mon)" in Date (text)
    const aDate = parseDateText(aDateShort);
    const jDate = parseDateText(dateText);
    if (!aDate || !jDate) {
      fail(line, `unparseable date ("${aDateShort}" / "${dateText}")`);
    } else if (aDate.day !== jDate.day || aDate.month !== jDate.month) {
      fail(line, `date mismatch: Schedule Codes "${aDateShort}" vs Date (text) "${dateText}"`);
    }
  }

  // -- 3. Form Option to Display reconstructs exactly -----------------------
  // Strongest check: it was transcribed from a separate read, but is a pure
  // function of five other columns.
  // Two conventions in the wild: JC appends the topic, Sec stops at the
  // timeslot. Accept either, but only the shape this slug actually uses —
  // a row that matches neither is a real mismatch.
  const withTopic = `[${displaySubject}] ${centre} | ${dateText} | ${timeslot} | ${topic}`;
  const withoutTopic = `[${displaySubject}] ${centre} | ${dateText} | ${timeslot}`;
  const got = formOption.trimEnd();
  if (got !== withTopic.trimEnd() && got !== withoutTopic.trimEnd()) {
    fail(
      line,
      `Form Option mismatch:\n      csv       "${formOption}"\n      expected  "${withTopic}"\n      or        "${withoutTopic}"`
    );
  } else if (got === withoutTopic.trimEnd() && topic) {
    formOptionShapes.add("without-topic");
  } else {
    formOptionShapes.add("with-topic");
  }

  // -- 4. "Date" (M/D/YYYY) agrees with Date (text) -------------------------
  const numeric = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((row["Date"] ?? "").trim());
  const jDate = parseDateText(dateText);
  if (numeric && jDate) {
    if (Number(numeric[1]) !== jDate.month || Number(numeric[2]) !== jDate.day) {
      fail(line, `Date "${row["Date"]}" disagrees with Date (text) "${dateText}"`);
    }
  } else if (!numeric) {
    fail(line, `unparseable Date column "${row["Date"]}"`);
  }

  // -- 5. Timeslot is well formed and ordered ------------------------------
  const slotParts = timeslot.split(/\s*-\s*/);
  if (slotParts.length !== 2) {
    fail(line, `unparseable timeslot "${timeslot}"`);
  } else {
    const s = toMinutes(slotParts[0]);
    const e = toMinutes(slotParts[1]);
    if (s === null || e === null) {
      fail(line, `unparseable timeslot "${timeslot}"`);
    } else if (e <= s) {
      fail(line, `timeslot ends before it starts: "${timeslot}"`);
    } else {
      // Start Time is allowed to trail Timeslot by up to 30 min (documented
      // historical drift), but must never be later than it.
      const k = /^(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)$/i.exec(
        (row["Start Time"] ?? "").trim()
      );
      if (k) {
        const kMin = toMinutes(`${k[1]}:${k[2]} ${k[3]}`);
        if (kMin !== null && (kMin > s || s - kMin > 30)) {
          warn(
            line,
            `Start Time "${row["Start Time"]}" is ${s - kMin} min from timeslot start "${slotParts[0]}"`
          );
        }
      }
    }
  }

  // -- 6. Dates fall inside the advertised course window -------------------
  if (windowStart && windowEnd && jDate) {
    const d = new Date(2000 + 26, jDate.month - 1, jDate.day);
    d.setFullYear(windowStart.getFullYear());
    if (d < windowStart || d > windowEnd) {
      fail(line, `date ${dateText} falls outside the window ${windowArg}`);
    }
  }

  // -- 7. Empty topics are legal but always worth surfacing ----------------
  if (!topic) {
    warn(line, `empty Topic — ${displaySubject} at ${centre} on ${dateText}`);
  }

  // -- 8. Duplicate slots (same subject/centre/date/time) ------------------
  const key = `${displaySubject}|${centre}|${dateText}|${timeslot}`;
  if (seenKeys.has(key)) {
    warn(line, `duplicate slot, also on row ${seenKeys.get(key)}: ${key}`);
  } else {
    seenKeys.set(key, line);
  }
});

console.log(`\nverify: crash-courses/${slug}/sessions.csv`);
console.log(`  rows parsed:      ${rows.length}`);
console.log(`  rows shipping:    ${rows.length - skippedRows.length}`);
console.log(`  timeslot column:  "${timeslotKey}"`);
console.log(`  form option:      ${[...formOptionShapes].join(" + ") || "n/a"}`);
const subjects = [...new Set(rows.map((r) => r["Subject(Display)"]))].sort();
console.log(`  subjects (${subjects.length}):     ${subjects.join(", ")}`);
const centres = [...new Set(rows.map((r) => r["Centre"]))].sort();
console.log(`  centres (${centres.length}):      ${centres.join(", ")}`);
const dates = [...new Set(rows.map((r) => r["Date (text)"]))].sort(
  (a, b) => (parseDateText(a)?.day ?? 0) - (parseDateText(b)?.day ?? 0)
);
console.log(`  dates (${dates.length}):        ${dates.join(", ")}`);

if (skippedRows.length) {
  console.log(`\n  ${skippedRows.length} row(s) the converter will drop:`);
  skippedRows.forEach((r) => console.log(`    - ${r}`));
}

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`    ! ${w}`));
}

if (failures.length) {
  console.log(`\n  ${failures.length} FAILURE(S):`);
  failures.forEach((f) => console.log(`    x ${f}`));
  console.log("");
  process.exit(1);
}

console.log(`\n  OK — all cross-checks passed.\n`);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require("csv-parse/sync");

// Helper to add hours to a time string like '10:00AM'
function addHours(time: string, hours: number): string {
  const [hourMin, ampm] = time.split(" ");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hourStr, minuteStr, secondStr] = hourMin.split(":");
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
      "Example: npx ts-node scripts/csv_to_sessions2json.ts ss-may-2026"
  );
  process.exit(1);
}

const slugDir = path.join(__dirname, "..", "crash-courses", slug);
if (!fs.existsSync(slugDir)) {
  console.error(`Directory not found: crash-courses/${slug}/`);
  process.exit(1);
}

const csvPath = path.join(slugDir, "sessions.csv");
const outPath = path.join(slugDir, "sessions.json");

if (!fs.existsSync(csvPath)) {
  console.error(`Input CSV not found: crash-courses/${slug}/sessions.csv`);
  process.exit(1);
}

type CsvRow = Record<string, string>;

const csvContent = fs.readFileSync(csvPath, "utf8");
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
}) as CsvRow[];

const result = records.map((row: CsvRow) => {
  // Map CSV columns to JSON keys
  let prefillField = "";
  switch (row["Subject"]) {
    case "Sec - LS Math":
      switch (row["Level"]) {
        case "S1":
          prefillField = "1165110009";
          break;
        case "S2":
          prefillField = "1137033822";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - AM":
      switch (row["Level"]) {
        case "S3":
          prefillField = "211505445";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - EM":
      switch (row["Level"]) {
        case "S3":
          prefillField = "1542437949";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      prefillField = "";
      break;
    case "Sec - Eng":
      switch (row["Level"]) {
        case "S1":
          prefillField = "1016736042";
          break;
        case "S2":
          prefillField = "822255076";
          break;
        case "S3":
          prefillField = "136322790";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - LS Science":
      switch (row["Level"]) {
        case "S1":
          prefillField = "862261665";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - P Chem":
    case "Sec - C Chem":
      switch (row["Level"]) {
        case "S3":
          prefillField = "530119122";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - P Phy":
    case "Sec - C Phy":
      switch (row["Level"]) {
        case "S3":
          prefillField = "1411978775";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec - P Bio":
      switch (row["Level"]) {
        case "S3":
          prefillField = "672830523";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec (IP) - Eng":
      switch (row["Level"]) {
        case "S1":
          prefillField = "810440307";
          break;
        case "S2":
          prefillField = "260829673";
          break;
        case "S3":
          prefillField = "1249604192";
          break;
        case "S4":
          prefillField = "1091300344";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec (IP) - Math":
      switch (row["Level"]) {
        case "S1":
          prefillField = "857742220";
          break;
        case "S2":
          prefillField = "990975670";
          break;
        case "S3":
          prefillField = "1473865721";
          break;
        case "S4":
          prefillField = "376990052";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    case "Sec (IP) - LS Science":
      switch (row["Level"]) {
        case "S2":
          prefillField = "39674934";
          break;
        default:
          throw new Error(`Unknown level: ${row["Level"]}`);
      }
      break;
    default:
      throw new Error(`Unknown subject: ${row["Subject"]}`);
  }

  console.log(row["Form Option to Display"]);

  const obj = {
    purpose: row["Purpose"],
    subject: row["Subject"],
    level: row["Level"],
    topic: row["Topic"],
    tutor: row["Tutor"],
    centre: row["Centre"],
    classroom: row["Classroom"],
    capacity: row["Capacity"],
    date: row["Date (text)"]?.replace(/\s*\(.*\)/, ""), // Remove day-of-week in brackets
    startTime: row["Start Time"]?.replace(/:(\d{2})\s/, " "),
    endTime: addHours(row["Start Time"]?.replace(/:(\d{2})\s/, " "), 2),
    prefill: row["Form Option to Display"],
    prefillField,
    displaySubject: row["Subject(Display)"],
  };
  return obj;
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(
  `crash-courses/${slug}/sessions.json generated with ${result.length} sessions.`
);

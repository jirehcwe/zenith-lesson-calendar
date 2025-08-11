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

const csvPath = path.join(__dirname, "..", "public", "sessions-jc.csv");
const outPath = path.join(__dirname, "..", "public", "sessions-jc.json");

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
    // case "JC - Math":
    //   prefillField = "822255076";
    //   break;
    // case "JC - Econs":
    //   prefillField = "1016736042";
    //   break;
    case "JC - Bio":
      prefillField = "1188715475";
      break;
    case "JC - Chem":
      prefillField = "1143667470";
      break;
    case "JC - Phy":
      prefillField = "299425437";
      break;
    case "JC - GP":
      prefillField = "136322790";
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
    endTime: addHours(row["Start Time"]?.replace(/:(\d{2})\s/, " "), 3),
    prefill: row["Form Option to Display"],
    prefillField,
  };
  return obj;
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`sessions.json generated with ${result.length} sessions.`);

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Helper to add 3 hours to a time string like '10:00 AM'
function add3Hours(time: string): string {
  const [hourMin, ampm] = time.split(" ");

  // eslint-disable-next-line prefer-const
  let [hour, min] = hourMin.split(":").map(Number);
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  hour += 3;
  if (hour >= 24) hour -= 24;
  const newAmpm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${min.toString().padStart(2, "0")} ${newAmpm}`;
}

const csvPath = path.join(__dirname, "public", "sessions2.csv");
const outPath = path.join(__dirname, "public", "sessions2.json");

const csvContent = fs.readFileSync(csvPath, "utf8");
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = records.map((row: any) => {
  // Map CSV columns to JSON keys
  let prefillField = "";
  switch (row["Subject"]) {
    case "Math":
      prefillField = "822255076";
      break;
    case "Econs":
      prefillField = "1016736042";
      break;
    case "Biology":
      prefillField = "1188715475";
      break;
    case "Chemistry":
      prefillField = "1143667470";
      break;
    case "Physics":
      prefillField = "299425437";
      break;
    case "GP":
      prefillField = "136322790";
      break;
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
    endTime: add3Hours(row["Start Time"]?.replace(/:(\d{2})\s/, " ")),
    prefill: row["Form Option to Display"],
    prefillField,
  };
  return obj;
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`sessions2.json generated with ${result.length} sessions.`);

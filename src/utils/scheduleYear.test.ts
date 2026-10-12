import { SCHEDULE_YEAR, showJcNextYearNote, slotYear } from "./scheduleYear";

describe("slotYear", () => {
  it("reads the year prefix of a class slot id", () => {
    expect(slotYear("2026-Class0001")).toBe(2026);
    expect(slotYear("2027-Class0930")).toBe(2027);
  });

  it("returns null when there is no year prefix", () => {
    expect(slotYear(undefined)).toBeNull();
    expect(slotYear("")).toBeNull();
    expect(slotYear("Class0001")).toBeNull();
  });
});

describe("showJcNextYearNote", () => {
  const jc2026 = { level: "J2", classSlotId: "2026-Class0001" };
  const jc2027 = { level: "J2", classSlotId: "2027-Class0001" };
  const sec2026 = { level: "S4", classSlotId: "2026-Class0002" };

  it("shows when the JC stream is picked and JC still shows last year's slots", () => {
    expect(SCHEDULE_YEAR).toBe(2027);
    expect(showJcNextYearNote("JC", [jc2026, sec2026])).toBe(true);
  });

  it("hides once JC shows this schedule year's slots", () => {
    expect(showJcNextYearNote("JC", [jc2027])).toBe(false);
  });

  it("hides for every other stream, and for no stream", () => {
    for (const stream of ["Secondary Exp", "Secondary IP", "Primary", "AllSec", null]) {
      expect(showJcNextYearNote(stream, [jc2026, sec2026])).toBe(false);
    }
  });

  it("hides when there are no JC slots, and ignores a non-JC old slot", () => {
    expect(showJcNextYearNote("JC", [])).toBe(false);
    expect(showJcNextYearNote("JC", [sec2026])).toBe(false);
  });
});

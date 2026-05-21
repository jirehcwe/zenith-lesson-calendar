import { isSlotFull, getSubjectColor, getLegendItemsForStream, WeeklyClassSlot } from "./WeeklyClassCalendar";

jest.mock("@fullcalendar/react", () => ({ __esModule: true, default: () => null }));
jest.mock("@fullcalendar/timegrid", () => ({}));
jest.mock("@fullcalendar/scrollgrid", () => ({}));
jest.mock("@/utils/campaign", () => ({
  replaceCampaignInUrl: (url: string) => url,
  replacePromocodeInUrl: (url: string) => url,
}));
jest.mock("@/utils/prefillRegistration", () => ({
  getFallbackRegistrationLinkByLevel: () => "https://example.com/fallback",
}));

const makeSlot = (overrides: Partial<WeeklyClassSlot> = {}): WeeklyClassSlot => ({
  title: "Sec 3 Math",
  day: 1,
  startTime: "10:00",
  endTime: "12:00",
  subjects: ["Mathematics"],
  tutor: "",
  centre: "Kovan",
  stream: "Secondary",
  level: "Sec 3",
  prefillTrialLink: "",
  ...overrides,
});

const FALLBACK_COLOR = "#64748B";

describe("isSlotFull", () => {
  it("returns true when title starts with [FULL]", () => {
    expect(isSlotFull(makeSlot({ title: "[FULL] Sec 3 Math" }))).toBe(true);
  });

  it("returns false for an available slot", () => {
    expect(isSlotFull(makeSlot({ title: "Sec 3 Math" }))).toBe(false);
  });

  it("returns false when [FULL] appears mid-title but not as a prefix", () => {
    expect(isSlotFull(makeSlot({ title: "Sec 3 [FULL] Math" }))).toBe(false);
  });
});

describe("getSubjectColor", () => {
  it("returns correct color for JC subjects", () => {
    expect(getSubjectColor("Mathematics", "J2")).toBe("#B45309");
    expect(getSubjectColor("General Paper", "J1")).toBe("#9A3412");
    expect(getSubjectColor("Chemistry", "J2")).toBe("#15803D");
    expect(getSubjectColor("Economics", "J2")).toBe("#4338CA");
  });

  it("returns correct color for Secondary subjects", () => {
    expect(getSubjectColor("A Math", "Sec 4")).toBe("#1E40AF");
    expect(getSubjectColor("E Math", "Sec 3")).toBe("#B45309");
    expect(getSubjectColor("Physics", "Sec 4")).toBe("#BE123C");
    expect(getSubjectColor("English", "Sec 2")).toBe("#0369A1");
  });

  it("returns correct color for Primary subjects", () => {
    expect(getSubjectColor("Mathematics", "P6")).toBe("#B45309");
    expect(getSubjectColor("English", "P5")).toBe("#0369A1");
    expect(getSubjectColor("Science", "P4")).toBe("#BE123C");
  });

  it("strips the IP prefix before color lookup", () => {
    expect(getSubjectColor("IP Mathematics", "Sec 3")).toBe("#B45309");
    expect(getSubjectColor("IP Chemistry", "Sec 4")).toBe("#15803D");
  });

  it("returns fallback color for an unknown subject in a known level", () => {
    expect(getSubjectColor("Art", "Sec 3")).toBe(FALLBACK_COLOR);
    expect(getSubjectColor("Drama", "J2")).toBe(FALLBACK_COLOR);
  });

  it("returns fallback color when the level does not match any stream", () => {
    expect(getSubjectColor("Mathematics", "Unknown")).toBe(FALLBACK_COLOR);
  });
});

describe("getLegendItemsForStream", () => {
  it("returns only JC subjects for JC stream", () => {
    const items = getLegendItemsForStream("JC");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Math", "Physics", "Chemistry", "Biology", "GP", "Econ", "Full"])
    );
    expect(labels).not.toContain("A Math");
    expect(labels).not.toContain("History");
    expect(labels).not.toContain("Science");
  });

  it("returns Secondary subjects for Secondary (Express)", () => {
    const items = getLegendItemsForStream("Secondary (Express)");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Math", "A Math", "Physics", "Chemistry", "Biology",
        "English", "History", "Literature", "Geography", "Soc. Studies", "Full",
      ])
    );
    expect(labels).not.toContain("GP");
    expect(labels).not.toContain("Econ");
    expect(labels).not.toContain("Science");
  });

  it("returns the same Secondary items for Secondary (IP)", () => {
    const express = getLegendItemsForStream("Secondary (Express)").map((i) => i.label);
    const ip = getLegendItemsForStream("Secondary (IP)").map((i) => i.label);
    expect(ip).toEqual(express);
  });

  it("returns Primary subjects for Primary stream", () => {
    const items = getLegendItemsForStream("Primary");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(["English", "Math", "Science", "Full"])
    );
    expect(labels).not.toContain("A Math");
    expect(labels).not.toContain("GP");
    expect(labels).not.toContain("Physics");
  });

  it("returns all items when stream is null", () => {
    const items = getLegendItemsForStream(null);
    const labels = items.map((i) => i.label);
    expect(labels).toContain("GP");
    expect(labels).toContain("A Math");
    expect(labels).toContain("Econ");
    expect(labels).toContain("History");
    expect(items.length).toBeGreaterThan(10);
  });
});

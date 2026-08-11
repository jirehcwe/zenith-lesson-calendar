import {
  isSlotFull,
  isSlotWaitlist,
  getSubjectColor,
  getLegendItemsForStream,
  computeLegendItems,
  WeeklyClassSlot,
} from "./WeeklyClassCalendar";

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

describe("isSlotWaitlist", () => {
  // Verbatim from the live schedule feed (2026-Class0439) — ops appends the
  // marker via the FormOptions "Custom (Remarks)" free-text field.
  const LIVE_TITLE =
    "(EXP) Bishan | Sat 11.15AM - 1.15PM | Katherine (S1 Science 2026) *(Waitlist Only)*";

  it("returns true for the live *(Waitlist Only)* suffix", () => {
    expect(isSlotWaitlist(makeSlot({ title: LIVE_TITLE }))).toBe(true);
  });

  it("returns false for an ordinary slot", () => {
    expect(isSlotWaitlist(makeSlot({ title: "Sec 3 Math" }))).toBe(false);
  });

  it("matches case-insensitively and without the asterisk wrapper, since ops hand-types the remark", () => {
    expect(isSlotWaitlist(makeSlot({ title: "Sec 3 Math (WAITLIST ONLY)" }))).toBe(true);
    expect(isSlotWaitlist(makeSlot({ title: "Sec 3 Math - waitlist" }))).toBe(true);
  });

  // Waitlist and full are independent signals: the live waitlisted class carries
  // no [FULL] prefix and is still open on the Google Form. Conflating them would
  // wrongly disable the trial/registration CTAs.
  it("does not imply the slot is full", () => {
    expect(isSlotFull(makeSlot({ title: LIVE_TITLE }))).toBe(false);
  });

  it("is independent of the [FULL] prefix when both are present", () => {
    const both = makeSlot({ title: "[FULL] Sec 3 Math *(Waitlist Only)*" });
    expect(isSlotFull(both)).toBe(true);
    expect(isSlotWaitlist(both)).toBe(true);
  });
});

describe("getSubjectColor", () => {
  it("returns correct color for JC subjects", () => {
    expect(getSubjectColor("Mathematics", "J2")).toBe("#00757B");
    expect(getSubjectColor("General Paper", "J1")).toBe("#654B01");
    expect(getSubjectColor("Chemistry", "J2")).toBe("#717100");
    expect(getSubjectColor("Economics", "J2")).toBe("#007209");
  });

  it("returns correct color for Secondary subjects", () => {
    expect(getSubjectColor("A Math", "Sec 4")).toBe("#1F4F7A");
    expect(getSubjectColor("E Math", "Sec 3")).toBe("#1F4F7A");
    expect(getSubjectColor("Physics", "Sec 4")).toBe("#44132D");
    expect(getSubjectColor("English", "Sec 2")).toBe("#4F1C12");
  });

  it("returns correct color for Primary subjects", () => {
    expect(getSubjectColor("Mathematics", "P6")).toBe("#713D07");
    expect(getSubjectColor("English", "P5")).toBe("#1E4E7B");
    expect(getSubjectColor("Science", "P4")).toBe("#2F5E1B");
  });

  it("strips the IP prefix before color lookup", () => {
    expect(getSubjectColor("IP Mathematics", "Sec 3")).toBe("#1F4F7A");
    expect(getSubjectColor("IP Chemistry", "Sec 4")).toBe("#7E1B1B");
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

  it("returns Secondary subjects for Secondary Exp", () => {
    const items = getLegendItemsForStream("Secondary Exp");
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Math", "A Math", "Physics", "Chemistry", "Biology", "Science",
        "English", "History", "Literature", "Geography", "Soc. Studies", "Full",
      ])
    );
    expect(labels).not.toContain("GP");
    expect(labels).not.toContain("Econ");
  });

  it("returns the same Secondary items for Secondary IP", () => {
    const express = getLegendItemsForStream("Secondary Exp").map((i) => i.label);
    const ip = getLegendItemsForStream("Secondary IP").map((i) => i.label);
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

describe("computeLegendItems", () => {
  const jcSlots: WeeklyClassSlot[] = [
    { subject: "Mathematics", label: "J1 Math" },
    { subject: "Physics", label: "J1 Physics" },
    { subject: "Chemistry", label: "J1 Chemistry" },
    { subject: "Biology", label: "J1 Biology" },
    { subject: "General Paper", label: "J1 GP" },
    { subject: "Economics", label: "J1 Econ" },
  ].map(({ subject, label }) =>
    makeSlot({ level: "J1", stream: "JC", subjects: [subject], title: label })
  );

  it("shows every JC subject when a JC level is filtered but no stream is selected", () => {
    // Reproduces the reported bug: level=J1, stream=null. The blocks are JC
    // colors, so the legend must resolve JC labels — not collapse to the two
    // subjects (GP, Econ) that happen to share a hex with the combined palette.
    const labels = computeLegendItems(jcSlots, null).map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Math", "Physics", "Chemistry", "Biology", "GP", "Econ"])
    );
  });

  it("resolves the same JC legend whether or not the JC stream is selected", () => {
    const withStream = computeLegendItems(jcSlots, "JC")
      .map((i) => i.label)
      .sort();
    const withoutStream = computeLegendItems(jcSlots, null)
      .map((i) => i.label)
      .sort();
    expect(withoutStream).toEqual(withStream);
  });

  it("appends a single Full swatch last when any slot is full", () => {
    const slots = [
      ...jcSlots,
      makeSlot({ level: "J1", stream: "JC", subjects: ["Mathematics"], title: "[FULL] J1 Math" }),
    ];
    const labels = computeLegendItems(slots, null).map((i) => i.label);
    expect(labels[labels.length - 1]).toBe("Full");
    expect(labels.filter((l) => l === "Full")).toHaveLength(1);
  });

  it("shows the selected stream's full palette when there are no slots", () => {
    expect(computeLegendItems([], "Primary")).toEqual(getLegendItemsForStream("Primary"));
  });
});

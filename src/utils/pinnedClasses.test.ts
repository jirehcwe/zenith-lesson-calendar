import { parseClassesParam, matchPinnedSlots } from "./pinnedClasses";

describe("parseClassesParam", () => {
  it("returns [] when classes param is absent", () => {
    expect(parseClassesParam("?view=list")).toEqual([]);
  });

  it("returns [] for an empty string search", () => {
    expect(parseClassesParam("")).toEqual([]);
  });

  it("returns [] when classes is present but empty", () => {
    expect(parseClassesParam("?classes=")).toEqual([]);
  });

  it("splits a comma-separated list", () => {
    expect(parseClassesParam("?classes=2026-Class0001,2026-Class0002")).toEqual([
      "2026-Class0001",
      "2026-Class0002",
    ]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parseClassesParam("?classes=2026-Class0001 , ,2026-Class0002,")).toEqual([
      "2026-Class0001",
      "2026-Class0002",
    ]);
  });
});

const slot = (classSlotId: string) => ({ classSlotId, title: classSlotId });

describe("matchPinnedSlots", () => {
  const slots = [slot("2026-Class0001"), slot("2026-Class0002"), slot("2026-Class0003")];

  it("returns [] when no ids requested", () => {
    expect(matchPinnedSlots(slots, [])).toEqual([]);
  });

  it("returns only the slots whose classSlotId is requested", () => {
    const result = matchPinnedSlots(slots, ["2026-Class0001", "2026-Class0003"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches case-insensitively", () => {
    const result = matchPinnedSlots(slots, ["2026-class0002"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0002"]);
  });

  it("drops unknown ids, keeping only known matches", () => {
    const result = matchPinnedSlots(slots, ["2026-Class0001", "DOES-NOT-EXIST"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001"]);
  });

  it("returns [] when none of the ids match", () => {
    expect(matchPinnedSlots(slots, ["NOPE"])).toEqual([]);
  });

  it("ignores slots without a classSlotId", () => {
    const mixed = [{ title: "no id" } as { classSlotId?: string; title: string }, slot("2026-Class0001")];
    const result = matchPinnedSlots(mixed, ["2026-Class0001"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001"]);
  });
});

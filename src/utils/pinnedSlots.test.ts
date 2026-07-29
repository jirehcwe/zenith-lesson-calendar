import {
  parsePinRequest,
  matchPinnedSlots,
  describePin,
  pinnedBannerMessage,
} from "./pinnedSlots";

describe("parsePinRequest", () => {
  it("returns kind 'none' when neither param is present", () => {
    expect(parsePinRequest("?view=list")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' for an empty search string", () => {
    expect(parsePinRequest("")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' when classes is present but empty", () => {
    expect(parsePinRequest("?classes=")).toEqual({ kind: "none" });
  });

  it("returns kind 'none' when tutor is present but yields no entries", () => {
    expect(parsePinRequest("?tutor= , ,")).toEqual({ kind: "none" });
  });

  it("parses a classes list", () => {
    expect(parsePinRequest("?classes=2026-Class0001,2026-Class0002")).toEqual({
      kind: "classes",
      ids: ["2026-Class0001", "2026-Class0002"],
    });
  });

  it("parses a tutor list", () => {
    expect(parsePinRequest("?tutor=Alicia,DJ")).toEqual({
      kind: "tutor",
      codes: ["Alicia", "DJ"],
    });
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parsePinRequest("?tutor=Alicia , ,DJ,")).toEqual({
      kind: "tutor",
      codes: ["Alicia", "DJ"],
    });
  });

  it("decodes an encoded multi-word tutor code", () => {
    expect(parsePinRequest("?tutor=Dr.%20Han%20Wei")).toEqual({
      kind: "tutor",
      codes: ["Dr. Han Wei"],
    });
  });

  it("lets classes win when both params are present", () => {
    expect(parsePinRequest("?classes=2026-Class0001&tutor=Alicia")).toEqual({
      kind: "classes",
      ids: ["2026-Class0001"],
    });
  });

  it("falls through to tutor when classes is present but empty", () => {
    expect(parsePinRequest("?classes=&tutor=Alicia")).toEqual({
      kind: "tutor",
      codes: ["Alicia"],
    });
  });

  it("falls through to tutor when classes holds only separators", () => {
    expect(parsePinRequest("?classes=, ,&tutor=Alicia")).toEqual({
      kind: "tutor",
      codes: ["Alicia"],
    });
  });
});

const slot = (classSlotId: string, tutor: string) => ({ classSlotId, tutor });

describe("matchPinnedSlots", () => {
  // Joshua/Joshua Teo and Phoebe/Phebe are real, distinct tutors in the live
  // schedule. Both near-miss pairs live in the fixture so the exact-match guard
  // is tested against the actual hazard, not an invented lookalike.
  const slots = [
    slot("2026-Class0001", "Alicia"),
    slot("2026-Class0002", "DJ"),
    slot("2026-Class0003", "Alicia"),
    slot("2026-Class0004", "Joshua Teo"),
    slot("2026-Class0005", "Joshua"),
    slot("2026-Class0006", "Phoebe"),
    slot("2026-Class0007", "Phebe"),
  ];

  it("returns [] for kind 'none'", () => {
    expect(matchPinnedSlots(slots, { kind: "none" })).toEqual([]);
  });

  it("matches classes by classSlotId, preserving input order", () => {
    const result = matchPinnedSlots(slots, {
      kind: "classes",
      ids: ["2026-Class0003", "2026-Class0001"],
    });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches classes case-insensitively", () => {
    const result = matchPinnedSlots(slots, { kind: "classes", ids: ["2026-class0002"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0002"]);
  });

  it("matches every slot for a tutor", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches the union for several tutors", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia", "DJ"] });
    expect(result.map((s) => s.classSlotId)).toEqual([
      "2026-Class0001",
      "2026-Class0002",
      "2026-Class0003",
    ]);
  });

  it("matches tutors case-insensitively", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["alicia"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("matches tutor codes exactly, never by prefix", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Joshua"] });
    expect(result.map((s) => s.tutor)).toEqual(["Joshua"]);
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0005"]);
  });

  it("does not match Phebe against Phoebe, or the reverse", () => {
    const phebe = matchPinnedSlots(slots, { kind: "tutor", codes: ["Phebe"] });
    expect(phebe.map((s) => s.tutor)).toEqual(["Phebe"]);
    expect(phebe.map((s) => s.classSlotId)).toEqual(["2026-Class0007"]);

    const phoebe = matchPinnedSlots(slots, { kind: "tutor", codes: ["Phoebe"] });
    expect(phoebe.map((s) => s.tutor)).toEqual(["Phoebe"]);
    expect(phoebe.map((s) => s.classSlotId)).toEqual(["2026-Class0006"]);
  });

  it("drops unknown entries, keeping known matches", () => {
    const result = matchPinnedSlots(slots, { kind: "tutor", codes: ["Alicia", "NOBODY"] });
    expect(result.map((s) => s.classSlotId)).toEqual(["2026-Class0001", "2026-Class0003"]);
  });

  it("returns [] when nothing matches", () => {
    expect(matchPinnedSlots(slots, { kind: "tutor", codes: ["Phebee"] })).toEqual([]);
  });

  it("ignores slots missing the matched field", () => {
    const mixed = [{ tutor: "Alicia" }, slot("2026-Class0001", "Alicia")];
    const result = matchPinnedSlots(mixed, { kind: "classes", ids: ["2026-Class0001"] });
    expect(result).toHaveLength(1);
  });
});

describe("describePin", () => {
  const matched = (...tutors: string[]) => tutors.map((tutor) => ({ tutor }));

  it("says nothing at all for kind 'none'", () => {
    expect(describePin({ kind: "none" }, [])).toBe("");
  });

  it("says nothing for kind 'none' even when slots are present", () => {
    // The unpinned homepage renders every slot. That is not a pin, so it gets
    // no banner — and it is emphatically not a broken link.
    expect(describePin({ kind: "none" }, matched("Alicia", "DJ"))).toBe("");
  });

  it("reports a dead link when nothing matched", () => {
    expect(describePin({ kind: "tutor", codes: ["Phebee"] }, [])).toBe(
      "We couldn't find any classes for this link.",
    );
  });

  it("reports a dead classes link when nothing matched", () => {
    expect(describePin({ kind: "classes", ids: ["NOPE"] }, [])).toBe(
      "We couldn't find any classes for this link.",
    );
  });

  it("names a single tutor", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia"] }, matched("Alicia", "Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("uses the canonical casing from the data, not the URL", () => {
    expect(describePin({ kind: "tutor", codes: ["alicia"] }, matched("Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("joins two tutors with 'and'", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia", "DJ"] }, matched("Alicia", "DJ"))).toBe(
      "You're viewing classes taught by Alicia and DJ",
    );
  });

  it("joins three tutors with commas and a final 'and'", () => {
    const result = describePin(
      { kind: "tutor", codes: ["Alicia", "DJ", "Gwen"] },
      matched("Alicia", "DJ", "Gwen"),
    );
    expect(result).toBe("You're viewing classes taught by Alicia, DJ and Gwen");
  });

  it("names only tutors that actually matched", () => {
    expect(describePin({ kind: "tutor", codes: ["Alicia", "NOBODY"] }, matched("Alicia"))).toBe(
      "You're viewing Alicia's classes",
    );
  });

  it("never emits a dangling 'taught by' when no slot carries a tutor", () => {
    // `matched` is caller-supplied; nothing forces it to have come from
    // matchPinnedSlots, so a tutor pin can be handed slots with no tutor field.
    const result = describePin({ kind: "tutor", codes: ["X"] }, [{ classSlotId: "a" }]);
    expect(result).toBe("You're viewing 1 selected class");
    expect(result).not.toMatch(/taught by\s*$/);
  });

  it("counts classes for a classes pin", () => {
    expect(describePin({ kind: "classes", ids: ["a", "b"] }, matched("X", "Y"))).toBe(
      "You're viewing 2 selected classes",
    );
  });

  it("uses the singular for a single class", () => {
    expect(describePin({ kind: "classes", ids: ["a"] }, matched("X"))).toBe(
      "You're viewing 1 selected class",
    );
  });
});

describe("pinnedBannerMessage", () => {
  const req = { kind: "tutor", codes: ["Alicia"] } as const;
  const matched = [{ tutor: "Alicia" }];
  const ok = { loadFailed: false, scheduleEmpty: false };

  it("blames the system only when the fetch actually failed", () => {
    expect(pinnedBannerMessage(req, [], { loadFailed: true, scheduleEmpty: true })).toBe(
      "We couldn't load the schedule. Please try again.",
    );
  });

  it("says the schedule isn't out yet when it loaded but is empty", () => {
    // A 200 carrying zero rows is not a failure, so "try again" would be both
    // untrue and useless: retrying cannot publish next year's schedule.
    expect(pinnedBannerMessage(req, [], { loadFailed: false, scheduleEmpty: true })).toBe(
      "The schedule isn't published yet. Please check back soon.",
    );
  });

  it("falls through to describePin once a schedule is present", () => {
    expect(pinnedBannerMessage(req, matched, ok)).toBe("You're viewing Alicia's classes");
  });

  it("still reports a dead link against a populated schedule", () => {
    // The empty argument here is the MATCH list, not the schedule: the schedule
    // arrived and simply does not contain this tutor. That is the one case that
    // should blame the link.
    expect(pinnedBannerMessage({ kind: "tutor", codes: ["Nobody"] }, [], ok)).toBe(
      "We couldn't find any classes for this link.",
    );
  });

  it("prefers the failure message over the empty one when both are set", () => {
    // They always overlap — a failed fetch also leaves weeklyClassData empty —
    // so the order of the two guards is load-bearing, not incidental.
    expect(pinnedBannerMessage(req, matched, { loadFailed: true, scheduleEmpty: true })).toBe(
      "We couldn't load the schedule. Please try again.",
    );
  });
});

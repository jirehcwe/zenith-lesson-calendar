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
  const ok = { loadFailed: false, scheduleEmpty: false, servedFromCacheFallback: false };
  // The failed-fetch-served-from-cache state, named once. Every field matters:
  // the fetch threw, the cache answered, and the rows it produced are why
  // scheduleEmpty is false.
  const fromCache = { loadFailed: true, scheduleEmpty: false, servedFromCacheFallback: true };

  it("blames the system only when the fetch actually failed", () => {
    expect(
      pinnedBannerMessage(req, [], {
        loadFailed: true,
        scheduleEmpty: true,
        servedFromCacheFallback: false,
      }),
    ).toBe("We couldn't load the schedule. Please try again.");
  });

  it("says the schedule isn't out yet when it loaded but is empty", () => {
    // A 200 carrying zero rows is not a failure, so "try again" would be both
    // untrue and useless: retrying cannot publish next year's schedule.
    expect(
      pinnedBannerMessage(req, [], {
        loadFailed: false,
        scheduleEmpty: true,
        servedFromCacheFallback: false,
      }),
    ).toBe("The schedule isn't published yet. Please check back soon.");
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
    //
    // The match list here used to be non-empty, which was an IMPOSSIBLE input
    // (a match cannot come out of an empty schedule) and is now a meaningful
    // one: it is the cache-fallback state, and it deliberately no longer
    // returns this message. Passing `[]` states the case this test is actually
    // about — the ordering of the two failure guards — instead of a
    // contradiction that happened to reach the first one.
    expect(
      pinnedBannerMessage(req, [], {
        loadFailed: true,
        scheduleEmpty: true,
        servedFromCacheFallback: false,
      }),
    ).toBe("We couldn't load the schedule. Please try again.");
  });

  it("marks a fallback-served tutor pin as a saved copy", () => {
    // Supersedes an earlier assertion that this exact state got the ORDINARY
    // copy. It reads as a live claim about a tutor's timetable while silently
    // omitting anything published since the cache was written, so the visitor
    // is told these are Alicia's classes when they are only the ones Alicia had
    // when the browser last saw a working API.
    expect(pinnedBannerMessage(req, matched, fromCache)).toBe(
      "You're viewing Alicia's classes — a saved copy, which may be out of date.",
    );
  });

  it("marks a fallback-served multi-tutor pin as a saved copy", () => {
    expect(
      pinnedBannerMessage(
        { kind: "tutor", codes: ["Alicia", "DJ"] },
        [{ tutor: "Alicia" }, { tutor: "DJ" }],
        fromCache,
      ),
    ).toBe("You're viewing classes taught by Alicia and DJ — a saved copy, which may be out of date.");
  });

  it("marks a fallback-served classes pin as a saved copy", () => {
    // Uniform across both pin kinds, and deliberately NOT conditioned on
    // whether every requested id matched: a class the cache does hold can still
    // have moved to another time, venue or tutor since, so "all ids present"
    // proves nothing about the payload being current.
    expect(
      pinnedBannerMessage(
        { kind: "classes", ids: ["a", "b"] },
        [{ classSlotId: "a" }, { classSlotId: "b" }],
        fromCache,
      ),
    ).toBe("You're viewing 2 selected classes — a saved copy, which may be out of date.");
  });

  it("hedges a PARTIAL classes fallback rather than counting it as the whole link", () => {
    // The concrete misinformation: ?classes=a,b against a cache that predates b.
    // Unqualified, "1 selected class" is a true statement about the cache and a
    // false one about the link — the visitor is told their two-class link holds
    // one class, with nothing on screen to suggest otherwise.
    const result = pinnedBannerMessage(
      { kind: "classes", ids: ["a", "b"] },
      [{ classSlotId: "a" }],
      fromCache,
    );
    expect(result).toBe("You're viewing 1 selected class — a saved copy, which may be out of date.");
    expect(result).not.toBe("You're viewing 1 selected class");
  });

  it("leaves a successful fetch unhedged", () => {
    // The saved-copy wording has to stay off the healthy path, or it becomes
    // background noise on every pinned visit and stops meaning anything on the
    // one visit where it is true.
    const result = pinnedBannerMessage(req, matched, ok);
    expect(result).toBe("You're viewing Alicia's classes");
    expect(result).not.toMatch(/saved copy/);
  });

  it("does not downgrade a failed fetch to a dead link when the fallback missed", () => {
    // The other half of the fallback: the cache had a schedule (so
    // scheduleEmpty is false) but not this tutor's classes. That is NOT enough
    // to call the link dead — the cache may simply predate it — so the failure
    // copy has to survive a populated-but-unmatched schedule, which is the one
    // shape that otherwise reaches describePin's dead-link case.
    //
    // Note the fallback DID serve here (it returned a schedule, just not a
    // matching one), so this also pins the saved-copy suffix away from the
    // dead-link verdict: a stale cache never gets to call a link broken, hedged
    // or otherwise.
    const result = pinnedBannerMessage(req, [], fromCache);
    expect(result).toBe("We couldn't load the schedule. Please try again.");
    expect(result).not.toMatch(/saved copy/);
    expect(result).not.toMatch(/couldn't find any classes for this link/);
  });
});

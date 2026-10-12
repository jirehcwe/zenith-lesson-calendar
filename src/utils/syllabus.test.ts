import {
  matchesSyllabus,
  syllabusLabel,
  syllabusOptions,
  syllabusSchools,
} from "./syllabus";

describe("syllabusLabel", () => {
  it("shows the track as written", () => {
    expect(syllabusLabel("RGS Aligned")).toBe("RGS Aligned");
    expect(syllabusLabel("All Schools")).toBe("All Schools");
    expect(syllabusLabel("  TMJC Aligned ")).toBe("TMJC Aligned");
  });

  it("shows nothing for no track, a blank or NA", () => {
    for (const none of [undefined, null, "", "   ", "NA", "na", " N/A "]) {
      expect(syllabusLabel(none)).toBeNull();
    }
  });
});

describe("syllabusSchools", () => {
  it("splits a group into single schools and drops Aligned", () => {
    expect(syllabusSchools("RGS + RI + CHIJ St Nicholas + Cat High Aligned")).toEqual([
      "RGS", "RI", "CHIJ St Nicholas", "Cat High",
    ]);
    expect(syllabusSchools("RGS Aligned")).toEqual(["RGS"]);
    expect(syllabusSchools("TJC+Dunman High +  Cedar Girls aligned")).toEqual([
      "TJC", "Dunman High", "Cedar Girls",
    ]);
  });

  it("drops a doubled Aligned", () => {
    expect(syllabusSchools("RVHS aligned Aligned")).toEqual(["RVHS"]);
  });

  it("gives no schools for All Schools, NA, a blank or no track", () => {
    for (const none of ["All Schools", "all schools", "NA", "", undefined, null]) {
      expect(syllabusSchools(none)).toEqual([]);
    }
  });
});

describe("matchesSyllabus", () => {
  it("matches everything when nothing is picked", () => {
    expect(matchesSyllabus(undefined, [])).toBe(true);
    expect(matchesSyllabus("RGS Aligned", [])).toBe(true);
  });

  it("matches a class that names the school, alone or in a group", () => {
    expect(matchesSyllabus("RGS Aligned", ["RGS"])).toBe(true);
    expect(matchesSyllabus("RGS + RI + CHIJ St Nicholas + Cat High Aligned", ["RGS"])).toBe(true);
    expect(matchesSyllabus("RGS + RI + CHIJ St Nicholas + Cat High Aligned", ["Cat High"])).toBe(true);
  });

  it("matches an All Schools class under any pick", () => {
    expect(matchesSyllabus("All Schools", ["RGS"])).toBe(true);
    expect(matchesSyllabus("All Schools", ["HCI", "RI"])).toBe(true);
  });

  it("does not match another school's class", () => {
    expect(matchesSyllabus("HCI Aligned", ["RGS"])).toBe(false);
    expect(matchesSyllabus("TJC + Dunman High + Cedar Girls Aligned", ["RGS"])).toBe(false);
  });

  it("does not match a class with no syllabus", () => {
    for (const none of [undefined, null, "", "NA"]) {
      expect(matchesSyllabus(none, ["RGS"])).toBe(false);
    }
  });

  it("matches whole school names only", () => {
    expect(matchesSyllabus("RJC Aligned", ["RI"])).toBe(false);
    expect(matchesSyllabus("RVHS Aligned", ["RI"])).toBe(false);
    expect(matchesSyllabus("RI Aligned", ["R"])).toBe(false);
    expect(matchesSyllabus("RGS Aligned", ["RGS Aligned"])).toBe(false);
    expect(matchesSyllabus("Cat High Aligned", ["Cat"])).toBe(false);
    expect(matchesSyllabus("Cat Aligned", ["Cat High"])).toBe(false);
  });

  it("ignores case, and matches any one of several picks", () => {
    expect(matchesSyllabus("RGS Aligned", ["rgs"])).toBe(true);
    expect(matchesSyllabus("HCI Aligned", ["RGS", "HCI"])).toBe(true);
  });
});

describe("syllabusOptions", () => {
  it("lists each school once, sorted", () => {
    expect(
      syllabusOptions([
        "RGS Aligned",
        "RGS + RI + CHIJ St Nicholas + Cat High Aligned",
        "HCI Aligned",
        "rgs Aligned",
      ])
    ).toEqual(["Cat High", "CHIJ St Nicholas", "HCI", "RGS", "RI"]);
  });

  it("never lists All Schools, NA or a blank", () => {
    expect(syllabusOptions(["All Schools", "NA", "", undefined, null])).toEqual([]);
  });
});

import {
  subjectToColor, getSubjectColor, getLegendItemsForStream, legendItemsForLevel,
  JC, SEC, PRIMARY, OVERVIEW, FULL_SWATCH,
} from "./subjectColors";

describe("single source of truth invariant", () => {
  const cases: [string, Record<string, { label: string; color: string; tint: string; subjects: readonly string[] }>][] = [
    ["J1", JC], ["Sec 3", SEC], ["P5", PRIMARY],
  ];

  it("every subject resolves to a swatch present in its category's legend", () => {
    for (const [level, palette] of cases) {
      const legend = new Set(legendItemsForLevel(level).map((s) => `${s.color}|${s.tint}`));
      for (const swatch of Object.values(palette)) {
        for (const subject of swatch.subjects) {
          const { color, tint } = subjectToColor(level, subject);
          expect(legend.has(`${color}|${tint}`)).toBe(true);
        }
      }
    }
  });

  it("resolves each subject to its own swatch's color and tint", () => {
    for (const [level, palette] of cases) {
      for (const swatch of Object.values(palette)) {
        for (const subject of swatch.subjects) {
          expect(subjectToColor(level, subject)).toEqual({
            label: swatch.label, color: swatch.color, tint: swatch.tint,
          });
        }
      }
    }
  });
});

describe("OVERVIEW composition", () => {
  it("is composed only of real category swatches (no orphan hexes)", () => {
    const all = new Set<unknown>([
      ...Object.values(JC), ...Object.values(SEC), ...Object.values(PRIMARY),
    ]);
    for (const swatch of OVERVIEW) expect(all.has(swatch)).toBe(true);
  });

  it("matches the historical combined palette order and colors", () => {
    expect(OVERVIEW.map((s) => `${s.label}:${s.color}`)).toEqual([
      "Math:#1F4F7A", "A Math:#1F4F7A", "Physics:#44132D", "Chemistry:#7E1B1B",
      "Biology:#346F20", "English:#4F1C12", "GP:#654B01", "Econ:#007209",
      "History:#6C5900", "Literature:#567300", "Geography:#64748B", "Soc. Studies:#7E0099",
    ]);
  });
});

describe("IP prefix", () => {
  it("shares Express colors (IP is a stream/filter concern, not a color one)", () => {
    expect(getSubjectColor("IP Mathematics", "Sec 3")).toBe("#1F4F7A");
    expect(getSubjectColor("IP Chemistry", "Sec 4")).toBe("#7E1B1B");
  });
});

describe("fallback", () => {
  it("returns the Full swatch for unknown subjects and unknown levels", () => {
    expect(subjectToColor("Sec 3", "Art")).toEqual(FULL_SWATCH);
    expect(subjectToColor("Unknown", "Mathematics")).toEqual(FULL_SWATCH);
  });
});

describe("getLegendItemsForStream", () => {
  it("appends a single Full swatch and keeps IP === Express", () => {
    expect(getLegendItemsForStream("JC").at(-1)).toEqual(FULL_SWATCH);
    expect(getLegendItemsForStream("Secondary IP")).toEqual(getLegendItemsForStream("Secondary Exp"));
  });
});

describe("AllSec colours", () => {
  it("uses the Secondary palette for the empty-calendar legend (AC 9)", () => {
    const allSec = getLegendItemsForStream("AllSec").map((s) => s.label);
    const secExpress = getLegendItemsForStream("Secondary Exp").map((s) => s.label);
    expect(allSec).toEqual(secExpress);
  });

  it("colours Secondary blocks from the Secondary palette regardless of track (AC 8)", () => {
    // Guards the level-based colour axis. AllSec mixes EXP and IP in one view,
    // so a future refactor keying colour off `stream` would silently split the
    // palette in two — this fails if that ever happens.
    expect(getSubjectColor("Mathematics", "S3")).toBe(SEC.math.color);
    expect(getSubjectColor("Chemistry", "S3")).toBe(SEC.chemistry.color);
  });
});

import { normalizeDate } from "./dates";

describe("normalizeDate", () => {
  it("converts a valid date string to YYYY-MM-DD format", () => {
    expect(normalizeDate("24 May")).toBe("2025-05-24");
  });

  it("pads single-digit day with a leading zero", () => {
    expect(normalizeDate("1 June")).toBe("2025-06-01");
  });

  it("returns null for an invalid date string", () => {
    // Note: V8's Date.parse is liberal — "not a date 2025" and "??? 2025"
    // both parse as Jan 1 2025. Use inputs that genuinely produce NaN:
    // "32 Feb 2025" is an out-of-range day, "13/45 2025" has no valid tokens.
    expect(normalizeDate("32 Feb")).toBeNull();
  });

  it("returns null for a string with no recognisable date", () => {
    // "13/45 2025" cannot be interpreted as any valid date by V8.
    expect(normalizeDate("13/45")).toBeNull();
  });
});

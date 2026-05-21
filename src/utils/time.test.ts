import { to12hr } from "./time";

describe("to12hr", () => {
  it("converts morning hours to AM", () => {
    expect(to12hr("09:00")).toBe("9:00 AM");
    expect(to12hr("10:30")).toBe("10:30 AM");
    expect(to12hr("11:45")).toBe("11:45 AM");
  });

  it("converts noon to 12:00 PM", () => {
    expect(to12hr("12:00")).toBe("12:00 PM");
  });

  it("converts afternoon hours to PM", () => {
    expect(to12hr("13:00")).toBe("1:00 PM");
    expect(to12hr("14:30")).toBe("2:30 PM");
    expect(to12hr("21:00")).toBe("9:00 PM");
  });

  it("converts midnight to 12:00 AM", () => {
    expect(to12hr("00:00")).toBe("12:00 AM");
  });

  it("pads single-digit minutes to two digits", () => {
    expect(to12hr("09:05")).toBe("9:05 AM");
    expect(to12hr("14:01")).toBe("2:01 PM");
  });
});

import { getCrashCourseConfig } from "..";

describe("getCrashCourseConfig", () => {
  const ORIGINAL_SLUG = process.env.NEXT_PUBLIC_CC_SLUG;

  afterEach(() => {
    if (ORIGINAL_SLUG === undefined) {
      delete process.env.NEXT_PUBLIC_CC_SLUG;
    } else {
      process.env.NEXT_PUBLIC_CC_SLUG = ORIGINAL_SLUG;
    }
  });

  it("throws when NEXT_PUBLIC_CC_SLUG is unset", () => {
    delete process.env.NEXT_PUBLIC_CC_SLUG;
    expect(() => getCrashCourseConfig()).toThrow(/NEXT_PUBLIC_CC_SLUG is not set/);
  });

  it("throws with known slugs listed when given an unknown slug", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "does-not-exist";
    expect(() => getCrashCourseConfig()).toThrow(/Unknown crash course slug.*does-not-exist/);
    expect(() => getCrashCourseConfig()).toThrow(/jc-sep-2025/);
    expect(() => getCrashCourseConfig()).toThrow(/ss-sep-2025/);
  });

  it("returns the SS config when slug is ss-sep-2025", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "ss-sep-2025";
    const cfg = getCrashCourseConfig();
    expect(cfg.slug).toBe("ss-sep-2025");
    expect(cfg.metadata.title).toContain("SS");
  });

  it("returns the JC config when slug is jc-sep-2025", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "jc-sep-2025";
    const cfg = getCrashCourseConfig();
    expect(cfg.slug).toBe("jc-sep-2025");
    expect(cfg.metadata.title).toContain("JC");
  });
});

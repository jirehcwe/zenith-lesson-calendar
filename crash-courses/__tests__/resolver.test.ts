import { getCrashCourseConfig, listAvailableSlugs } from "..";

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

  it("throws with available slugs listed when given a slug with no matching folder", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "does-not-exist";
    expect(() => getCrashCourseConfig()).toThrow(
      /Crash course config not found.*does-not-exist/
    );
    expect(() => getCrashCourseConfig()).toThrow(/Available slugs/);
  });

  it("loads the config for each discovered slug", () => {
    const slugs = listAvailableSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      process.env.NEXT_PUBLIC_CC_SLUG = slug;
      const cfg = getCrashCourseConfig();
      expect(cfg.slug).toBe(slug);
    }
  });
});

describe("listAvailableSlugs", () => {
  it("returns an alphabetically-sorted, de-duplicated array", () => {
    const slugs = listAvailableSlugs();
    const sorted = [...slugs].sort();
    expect(slugs).toEqual(sorted);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("only includes folders with both config.ts and sessions.json", () => {
    // Every discovered slug must be resolvable via getCrashCourseConfig.
    // This indirectly validates that listAvailableSlugs gates on both files.
    for (const slug of listAvailableSlugs()) {
      process.env.NEXT_PUBLIC_CC_SLUG = slug;
      expect(() => getCrashCourseConfig()).not.toThrow();
    }
  });
});

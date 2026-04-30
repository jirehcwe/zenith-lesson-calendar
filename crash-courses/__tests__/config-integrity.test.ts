import { getAllRegisteredConfigs } from "..";

describe("CrashCourseConfig integrity", () => {
  const configs = getAllRegisteredConfigs();

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: slug matches registry key",
    (slug, cfg) => {
      expect(cfg.slug).toBe(slug);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: every session's displaySubject has a matching entry in subjectColors",
    (_slug, cfg) => {
      const missing = new Set<string>();
      for (const s of cfg.sessions) {
        if (!cfg.subjectColors[s.displaySubject]) missing.add(s.displaySubject);
      }
      expect(Array.from(missing)).toEqual([]);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: dateRange.start is before dateRange.end",
    (_slug, cfg) => {
      expect(new Date(cfg.dateRange.start).getTime()).toBeLessThan(
        new Date(cfg.dateRange.end).getTime()
      );
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: sessions is non-empty (unless preLaunch)",
    (_slug, cfg) => {
      if (cfg.preLaunch) return;
      expect(cfg.sessions.length).toBeGreaterThan(0);
    }
  );

  it.each(configs.map((c) => [c.slug, c] as const))(
    "%s: registrationFormUrl contains the campaignField value and a SCHEDULE placeholder",
    (_slug, cfg) => {
      expect(cfg.registrationFormUrl).toContain(cfg.campaignField);
      expect(cfg.registrationFormUrl).toContain("SCHEDULE");
    }
  );
});

import { GA_MEASUREMENT_ID, shouldLoadAnalytics } from "./analytics";

describe("shouldLoadAnalytics", () => {
  it("loads on both production aliases of the schedule site", () => {
    expect(shouldLoadAnalytics("schedule.zenitheducationstudio.com")).toBe(true);
    expect(shouldLoadAnalytics("www.schedule.zenitheducationstudio.com")).toBe(true);
  });

  it("stays off everywhere the branch could still carry the tag", () => {
    // Cloudflare serves the production build on these too, and pushes to
    // `regular-lessons` create preview deploys. None of them are the real site.
    const offHosts = [
      "zenith-lesson-calendar.pages.dev",
      "8d1b599b.zenith-lesson-calendar.pages.dev",
      "regular-lessons-staging.zenith-lesson-calendar.pages.dev",
      "localhost",
      "127.0.0.1",
    ];
    for (const host of offHosts) {
      expect(shouldLoadAnalytics(host)).toBe(false);
    }
  });

  it("stays off on the main site and the crash-course sites", () => {
    // Those already run their own tags through the GTM container; double-tagging
    // them from here would double-count the same pageview.
    expect(shouldLoadAnalytics("www.zenitheducationstudio.com")).toBe(false);
    expect(shouldLoadAnalytics("crashcourse.jc.zenitheducationstudio.com")).toBe(false);
  });

  it("rejects lookalike hosts that merely start with the real one", () => {
    expect(
      shouldLoadAnalytics("schedule.zenitheducationstudio.com.example.com")
    ).toBe(false);
    expect(shouldLoadAnalytics("notschedule.zenitheducationstudio.com")).toBe(false);
  });

  it("normalises the casing and padding browsers can hand us", () => {
    expect(shouldLoadAnalytics("SCHEDULE.ZenithEducationStudio.com")).toBe(true);
    expect(shouldLoadAnalytics("  schedule.zenitheducationstudio.com  ")).toBe(true);
  });

  it("exports the GA4 property the schedule site reports to", () => {
    // Guards the G-CFR492YL4N -> G-GX27V89PJK correction from silently regressing.
    expect(GA_MEASUREMENT_ID).toBe("G-GX27V89PJK");
  });
});

import {
  GTM_SITES,
  gtmContainerFor,
  gtmContainerForSlug,
  platformFromSlug,
} from "../analytics";

const PRI = "crashcourse.pri.zenitheducationstudio.com";

describe("platformFromSlug", () => {
  it("reads the platform from the slug prefix", () => {
    expect(platformFromSlug("pri-sep-2026")).toBe("pri");
    expect(platformFromSlug("ss-sep-2026")).toBe("ss");
    expect(platformFromSlug("jc-june-2026")).toBe("jc");
  });

  it("returns null for a missing or unknown prefix", () => {
    expect(platformFromSlug(undefined)).toBeNull();
    expect(platformFromSlug("")).toBeNull();
    expect(platformFromSlug("sec-sep-2026")).toBeNull();
  });
});

describe("gtmContainerFor", () => {
  it("loads the Primary container on both Primary hostnames", () => {
    expect(gtmContainerFor("pri-sep-2026", PRI)).toBe("GTM-W9TJKN3L");
    expect(gtmContainerFor("pri-sep-2026", `www.${PRI}`)).toBe("GTM-W9TJKN3L");
  });

  it("follows the platform, not the course edition", () => {
    // A future edition must pick up the site's container with no code change.
    expect(gtmContainerFor("pri-dec-2026", PRI)).toBe("GTM-W9TJKN3L");
  });

  it("loads nothing on preview deploys and local dev", () => {
    for (const host of [
      "zenith-crash-course-pri.pages.dev",
      "crash-courses-staging.zenith-crash-course-pri.pages.dev",
      "localhost",
    ]) {
      expect(gtmContainerFor("pri-sep-2026", host)).toBeNull();
    }
  });

  it("will not load the Primary container on another site's hostname", () => {
    // Guards a mis-set NEXT_PUBLIC_CC_SLUG: a Primary build served on the
    // JC domain must not report Primary traffic from there.
    expect(
      gtmContainerFor("pri-sep-2026", "www.crashcourse.jc.zenitheducationstudio.com")
    ).toBeNull();
    expect(gtmContainerFor("pri-sep-2026", "schedule.zenitheducationstudio.com")).toBeNull();
  });

  it("rejects lookalike hosts", () => {
    expect(gtmContainerFor("pri-sep-2026", `${PRI}.example.com`)).toBeNull();
    expect(gtmContainerFor("pri-sep-2026", `not${PRI}`)).toBeNull();
  });

  it("normalises casing and padding", () => {
    expect(gtmContainerFor("pri-sep-2026", `  ${PRI.toUpperCase()}  `)).toBe(
      "GTM-W9TJKN3L"
    );
  });

  it("loads nothing for platforms that have no container yet", () => {
    expect(
      gtmContainerFor("jc-sep-2026", "www.crashcourse.jc.zenitheducationstudio.com")
    ).toBeNull();
    expect(
      gtmContainerFor("ss-sep-2026", "www.crashcourse.ss.zenitheducationstudio.com")
    ).toBeNull();
  });
});

describe("gtmContainerForSlug", () => {
  it("returns the build's container without looking at the hostname", () => {
    expect(gtmContainerForSlug("pri-sep-2026")).toBe("GTM-W9TJKN3L");
    expect(gtmContainerForSlug("jc-sep-2026")).toBeNull();
    expect(gtmContainerForSlug(undefined)).toBeNull();
  });
});

describe("GTM_SITES", () => {
  it("pins the Primary container ID", () => {
    expect(GTM_SITES.pri?.containerId).toBe("GTM-W9TJKN3L");
  });
});

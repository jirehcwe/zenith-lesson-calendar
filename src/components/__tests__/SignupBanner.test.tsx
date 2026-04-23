/**
 * SignupBanner tests.
 *
 * SignupBanner reads config.hero at render time via getCrashCourseConfig().
 * We mock that resolver and next/image so the component renders without a
 * Next.js context or a NEXT_PUBLIC_CC_SLUG env var.
 *
 * Note on collapse: SignupBanner has a collapse toggle that only affects the
 * mobile (`lg:hidden`) layout. The desktop (`hidden lg:flex`) layout is always
 * in the DOM regardless of collapse state, so "blurb absent when collapsed"
 * cannot be asserted in jsdom (no CSS viewport queries). We instead assert on
 * the toggle button's label, which switches between Expand/Collapse based on
 * state.
 */

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />,
}));

jest.mock("../../../crash-courses", () => ({
  getCrashCourseConfig: () => ({
    slug: "ss-may-2026",
    hero: {
      title: "May 2026 SS Crash Course",
      tagline: "Flexible scheduling • Expert tutors • Proven results",
      blurbHeadline: "Plan Your Crash Course Schedule",
      blurbBody:
        "Register for the Secondary crash course slots you want to attend.",
      stats: "Trusted by over 20,000 students since 2019",
      heroImageSrc: "/zenith-banner.webp",
      heroImageAlt: "Zenith Education",
    },
  }),
}));

import { render, screen } from "@testing-library/react";
import React from "react";
import SignupBanner from "../SignupBanner";

describe("SignupBanner content from config.hero", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the hero title", () => {
    render(<SignupBanner />);
    const titles = screen.getAllByText(/May 2026 SS Crash Course/i);
    expect(titles.length).toBeGreaterThan(0);
  });

  it("renders the hero image with configured src/alt", () => {
    render(<SignupBanner />);
    const imgs = screen.getAllByAltText("Zenith Education");
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].getAttribute("src")).toContain("zenith-banner");
  });

  it("renders the tagline", () => {
    render(<SignupBanner />);
    const taglines = screen.getAllByText(/Flexible scheduling/i);
    expect(taglines.length).toBeGreaterThan(0);
  });

  it("renders the stats line", () => {
    render(<SignupBanner />);
    const stats = screen.getAllByText(/Trusted by over 20,000/i);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("renders the blurb headline and body", () => {
    render(<SignupBanner />);
    const headlines = screen.getAllByText(/Plan Your Crash Course Schedule/i);
    expect(headlines.length).toBeGreaterThan(0);
    const bodies = screen.getAllByText(
      /Register for the Secondary crash course slots/i
    );
    expect(bodies.length).toBeGreaterThan(0);
  });
});

describe("SignupBanner mobile collapse toggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts collapsed by default and exposes an Expand button", () => {
    render(<SignupBanner />);
    expect(
      screen.getByRole("button", { name: /expand banner/i })
    ).toBeInTheDocument();
  });

  it("mounts expanded when localStorage says so, exposes a Collapse button", () => {
    localStorage.setItem("signupBannerCollapsed", "false");
    render(<SignupBanner />);
    expect(
      screen.getByRole("button", { name: /collapse banner/i })
    ).toBeInTheDocument();
  });
});

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
    slug: "ss-june-2026",
    // The course window matters now: SignupBanner swaps the blurb once the
    // course is over. Tests that care pass an explicit `now`, so they stay
    // deterministic whatever the real date is.
    dateRange: { start: "2026-05-30", end: "2026-06-30" },
    hero: {
      title: "May 2026 SS Crash Course",
      tagline: "Flexible scheduling • Expert tutors • Proven results",
      blurbHeadline: "Plan Your Crash Course Schedule",
      blurbBody:
        "Register for the Secondary crash course slots you want to attend.",
      blurbBodyEnded:
        "The Secondary crash course has finished. The schedule below is kept for reference.",
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

  it("renders the blurb headline and body while the course runs", () => {
    // Mid-course: 10 Jun sits inside the mocked 30 May–30 Jun window.
    render(<SignupBanner now={new Date(2026, 5, 10)} />);
    const headlines = screen.getAllByText(/Plan Your Crash Course Schedule/i);
    expect(headlines.length).toBeGreaterThan(0);
    const bodies = screen.getAllByText(
      /Register for the Secondary crash course slots/i
    );
    expect(bodies.length).toBeGreaterThan(0);
    expect(screen.queryByText(/kept for reference/i)).toBeNull();
  });

  // A retired slug used to keep announcing "Register for…" directly beneath a
  // closing banner saying the course had ended. The blurb now swaps instead.
  it("keeps the running blurb on the final day itself", () => {
    render(<SignupBanner now={new Date(2026, 5, 30, 23, 0, 0)} />);
    expect(
      screen.getAllByText(/Register for the Secondary crash course slots/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/kept for reference/i)).toBeNull();
  });

  it("swaps to the ended blurb the day after the course finishes", () => {
    render(<SignupBanner now={new Date(2026, 6, 1, 9, 0, 0)} />);
    expect(
      screen.getAllByText(/The Secondary crash course has finished/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Register for the Secondary crash course slots/i)
    ).toBeNull();
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

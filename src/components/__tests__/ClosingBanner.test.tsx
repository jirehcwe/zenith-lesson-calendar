import { render, screen } from "@testing-library/react";
import React from "react";

// ClosingBanner reads the resolved config at module load, so each slug needs
// a fresh module instance — mirror the BottomBanner test's isolateModules pattern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadForSlug(slug: string): React.ComponentType<any> {
  process.env.NEXT_PUBLIC_CC_SLUG = slug;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ClosingBanner: React.ComponentType<any>;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ClosingBanner = require("../ClosingBanner").default;
  });
  // @ts-expect-error ClosingBanner is assigned inside isolateModules above
  return ClosingBanner;
}

// Each slug announces its own September window. The dates come from ops, so
// pin them here — a silent drift in one config is a wrong date on a live site.
const ANNOUNCEMENTS = [
  {
    slug: "jc-june-2026",
    dates: "5–13 September 2026",
    href: "https://schedule.zenitheducationstudio.com/?stream=JC",
  },
  {
    slug: "ss-june-2026",
    dates: "5–13 September 2026",
    href: "https://schedule.zenitheducationstudio.com/?stream=Secondary+(Express)",
  },
  {
    slug: "pri-june-2026",
    dates: "4–14 September 2026",
    href: "https://schedule.zenitheducationstudio.com/?stream=Primary",
  },
] as const;

describe("ClosingBanner", () => {
  it.each(ANNOUNCEMENTS)(
    "announces the upcoming $dates course + trial-site CTA for $slug",
    ({ slug, dates, href }) => {
      const ClosingBanner = loadForSlug(slug);
      render(<ClosingBanner />);
      expect(
        screen.getByText(new RegExp(`Upcoming:.*${dates}`))
      ).toBeInTheDocument();
      expect(screen.getByText(/registration opens soon/i)).toBeInTheDocument();
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", href);
      expect(link.textContent).toMatch(/trial/i);
    }
  );

  it("renders nothing when the resolved config has no closingBanner", () => {
    // All real slugs now define closingBanner, so mock a config without one.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ClosingBanner: React.ComponentType<any>;
    jest.isolateModules(() => {
      jest.doMock("../../../crash-courses", () => ({
        getCrashCourseConfig: () => ({}),
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ClosingBanner = require("../ClosingBanner").default;
    });
    // @ts-expect-error ClosingBanner is assigned inside isolateModules above
    const { container } = render(<ClosingBanner />);
    expect(container).toBeEmptyDOMElement();
    jest.dontMock("../../../crash-courses");
  });
});

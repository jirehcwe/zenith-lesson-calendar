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

  // The September slugs carry their retirement copy ahead of time, so the
  // strip must stay hidden until the course is actually over. If it leaked
  // early it would push students to regular classes while they could still
  // register for the crash course — the opposite of what it is for.
  const SEPT_SLUGS = [
    { slug: "jc-sep-2026", stream: "JC", name: "JC", end: "2026-09-13" },
    {
      slug: "ss-sep-2026",
      stream: "Secondary+(Express)",
      name: "Secondary",
      end: "2026-09-13",
    },
    { slug: "pri-sep-2026", stream: "Primary", name: "Primary", end: "2026-09-15" },
  ] as const;

  it.each(SEPT_SLUGS)(
    "renders nothing for $slug while the course is still running",
    ({ slug }) => {
      const ClosingBanner = loadForSlug(slug);
      // Mid-course: 10 Sep is inside every September window.
      const { container } = render(
        <ClosingBanner now={new Date(2026, 8, 10, 12, 0, 0)} />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );

  it.each(SEPT_SLUGS)(
    "renders nothing for $slug on the final day itself",
    ({ slug, end }) => {
      const ClosingBanner = loadForSlug(slug);
      const [y, m, d] = end.split("-").map(Number);
      const { container } = render(
        <ClosingBanner now={new Date(y, m - 1, d, 23, 0, 0)} />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );

  it.each(SEPT_SLUGS)(
    "renders the retirement strip for $slug the day after it ends, tagged POSTSEPCC",
    ({ slug, stream, name, end }) => {
      const ClosingBanner = loadForSlug(slug);
      const [y, m, d] = end.split("-").map(Number);
      render(<ClosingBanner now={new Date(y, m - 1, d + 1, 9, 0, 0)} />);
      expect(
        screen.getByText(`The September ${name} Crash Course has ended`)
      ).toBeInTheDocument();
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `https://schedule.zenitheducationstudio.com/?stream=${stream}&campaign=POSTSEPCC`
      );
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

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

describe("ClosingBanner", () => {
  it("renders the ended notice + trial-site CTA for jc-june-2026", () => {
    const ClosingBanner = loadForSlug("jc-june-2026");
    render(<ClosingBanner />);
    expect(screen.getByText(/has ended/i)).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://schedule.zenitheducationstudio.com/?stream=JC"
    );
    expect(link.textContent).toMatch(/trial/i);
  });

  it("renders nothing for a slug without a closingBanner (ss-june-2026)", () => {
    const ClosingBanner = loadForSlug("ss-june-2026");
    const { container } = render(<ClosingBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});

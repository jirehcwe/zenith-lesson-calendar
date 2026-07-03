import { render, screen } from "@testing-library/react";
import React from "react";

describe("BottomBanner", () => {
  it("renders CTA label and href from the resolved config", () => {
    process.env.NEXT_PUBLIC_CC_SLUG = "ss-june-2026";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let BottomBanner: React.ComponentType<any>;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      BottomBanner = require("../BottomBanner").default;
    });
    // @ts-expect-error BottomBanner is assigned inside isolateModules above
    render(<BottomBanner />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("schedule.zenitheducationstudio.com")
    );
    expect(link.textContent).toMatch(/trial/i);
  });
});

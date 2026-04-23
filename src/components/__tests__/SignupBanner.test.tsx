/**
 * SignupBanner tests.
 *
 * getCrashCourseConfig() is called at module-top-level in SignupBanner.tsx.
 * We mock the crash-courses module at the file level with jest.mock so that
 * the config is available without the env var and without isolateModules.
 * next/image is also mocked to avoid needing a Next.js context in jsdom.
 */

// Mocks must be declared before any imports that load the component.

// Mock next/image so it renders as a plain <img> without needing Next.js context.
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} {...rest} />,
}));

// Provide a hardcoded SS config so NEXT_PUBLIC_CC_SLUG need not be set at load time.
jest.mock("../../../crash-courses", () => ({
  getCrashCourseConfig: () => ({
    slug: "ss-may-2026",
    signupBanner: {
      imageSrc: "/zenith_banner.jpg",
      imageAlt: "Zenith Banner",
      body:
        "This website will help you plan out the crash course slots you wish to attend\n\n" +
        "Ready to lock in for your exams?",
      ctaLabel: "Click here to sign up!",
      ctaHref:
        "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=pp_url&entry.1157532004=SCHEDULE",
    },
  }),
}));

import { render, screen } from "@testing-library/react";
import React from "react";
import SignupBanner from "../SignupBanner";

describe("SignupBanner", () => {
  it("renders an img with the config imageSrc and imageAlt", () => {
    render(<SignupBanner />);
    const img = screen.getByAltText("Zenith Banner");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("zenith_banner");
  });

  it("renders a CTA link with the config ctaHref", () => {
    render(<SignupBanner />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=pp_url&entry.1157532004=SCHEDULE"
    );
  });

  it("renders the CTA link with the config ctaLabel text", () => {
    render(<SignupBanner />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(/click here to sign up/i);
  });

  it("renders body text from the SS banner", () => {
    render(<SignupBanner />);
    expect(
      screen.getByText(/plan out the crash course slots/i)
    ).toBeInTheDocument();
  });
});

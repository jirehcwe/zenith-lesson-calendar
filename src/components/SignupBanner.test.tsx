import { render, screen } from "@testing-library/react";
import SignupBanner from "./SignupBanner";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

describe("SignupBanner", () => {
  it("renders without crashing", () => {
    render(<SignupBanner />);
  });

  it("renders a signup link", () => {
    render(<SignupBanner />);
    expect(
      screen.getByRole("link", { name: /Click here to sign up/i })
    ).toBeInTheDocument();
  });

  it("signup link opens in a new tab", () => {
    render(<SignupBanner />);
    const link = screen.getByRole("link", { name: /Click here to sign up/i });
    expect(link).toHaveAttribute("target", "_blank");
  });
});
